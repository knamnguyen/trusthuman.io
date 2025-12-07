import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, Page, WebWorker } from "puppeteer-core";
import { Hyperbrowser } from "@hyperbrowser/sdk";
import puppeteer from "puppeteer";
import { connect, TargetType } from "puppeteer-core";
import { ulid } from "ulidx";
import { z } from "zod";

import type { PrismaClient } from "@sassy/db";
import type { StartAutoCommentingParams } from "@sassy/validators";
import { db } from "@sassy/db";

import type { Logger } from "./commons";
import { env } from "./env";
import { jwtFactory } from "./jwt";

export const hyperbrowser = new Hyperbrowser({
  apiKey: env.HYPERBROWSER_API_KEY,
});

export type CreateHyperbrowserSessionParams = NonNullable<
  Parameters<Hyperbrowser["sessions"]["create"]>[0]
>;

export type ProxyLocation = NonNullable<
  CreateHyperbrowserSessionParams["proxyCountry"]
>;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.env.JWT_SECRET === undefined) {
  throw new Error("JWT_SECRET is not defined");
}

// this token should be attached in headers of every trpc request when browserbase mode is used
// this allows browserbase session to assume as userId
export const assumedAccountJwt = jwtFactory(
  z.object({
    accountId: z.string(),
  }),
  86_400_000, // put a day
  process.env.JWT_SECRET,
);

export interface BrowserFunctions {
  startAutoCommenting: (params: StartAutoCommentingParams) => Promise<void>;
  stopAutoCommenting: () => Promise<void>;
}

export type BrowserBackendChannelMessage =
  | {
      action: "ping";
    }
  | {
      action: "stopAutoCommenting";
    }
  | {
      action: "sendStatusUpdate";
    }
  | {
      action: "autoCommentingCompleted";
      payload: {
        autoCommentRunId: string;
        success: boolean;
        error?: string;
      };
    }
  | {
      action: "ready";
    };

export interface BrowserSessionParams {
  location: ProxyLocation;
  staticIpId?: string;
  browserProfileId: string;
  liveviewViewOnlyMode?: boolean;
  onBrowserMessage?: (
    this: BrowserSession,
    data: BrowserBackendChannelMessage,
  ) => unknown;
}

// TODO: store instance in postgres and then shut down on restart (should technically gracefully update statuses, so if running without an instance in the registry, means it should be shut down)
export class BrowserSession {
  // accountId should be equal to id for now
  public id: string;
  public sessionId!: string;
  public browser!: Browser;
  public liveUrl!: string;
  public pages!: {
    linkedin: Page;
    engagekitExtension: Page;
  };
  private engagekitBuildExtensionId = "ofpificfhbopdfmlcmnmhhhmdbepgfbh";
  public pageInView: "linkedin" | "engagekitExtension" = "linkedin";
  private controller = new AbortController();
  public signal = this.controller.signal;
  private readyResolver = Promise.withResolvers<void>();
  public ready = this.readyResolver.promise;
  public lastHeartbeatAt = Date.now();
  private LATEST_HEARTBEAT_THRESHOLD_MS = 15_000;
  private destroying = false;
  private onBrowserMessageCallbacks = new Set<
    (data: BrowserBackendChannelMessage) => unknown
  >();
  private onDestroyCallbacks = new Set<() => unknown>();

  private extensionWorker: WebWorker | null = null;
  constructor(
    private readonly db: PrismaClient,
    public readonly accountId: string,
    private readonly opts: BrowserSessionParams,
    private readonly logger: Logger = console,
  ) {
    this.id = accountId;
    void this.init();
  }

  private async createSession(params: CreateHyperbrowserSessionParams) {
    if (process.env.NODE_ENV === "production") {
      const session = await hyperbrowser.sessions.create(params);
      const browser = await connect({
        browserWSEndpoint: session.wsEndpoint,
        defaultViewport: null,
      });

      if (session.liveUrl === undefined) {
        // docs say that liveUrl is always defined but not sure why its undefined here
        // so just throw error for now
        throw new Error("liveUrl is undefined");
      }

      return {
        session: {
          id: session.id,
          liveUrl: session.liveUrl,
        },
        browser,
      };
    }

    const filepath = path.join(
      __dirname,
      "../../../../apps/chrome-extension/dist_hyperbrowser",
    );
    console.info({ filepath });

    const browser = (await puppeteer.launch({
      defaultViewport: null,
      headless: false,
      pipe: true,
      userDataDir: path.join(process.cwd(), ".puppeteer", "user_data"),
      enableExtensions: [filepath],
    })) as unknown as Browser;

    return {
      session: {
        id: "mock",
        liveUrl: "http://localhost/mock-live-view",
      },
      browser,
    };
  }

  async init(): Promise<BrowserSession> {
    const instanceId = ulid();

    await this.db.browserInstance.upsert({
      where: {
        hyperbrowserSessionId: this.sessionId,
      },
      create: {
        id: instanceId,
        accountId: this.accountId,
        hyperbrowserSessionId: this.sessionId,
        status: "INITIALIZING",
      },
      update: {
        status: "INITIALIZING",
      },
    });

    const accountJwt = await assumedAccountJwt.encode({
      accountId: this.id,
    });

    this.controller = new AbortController();

    // technically wont throw bcs we have at least one extension deployed
    const { id: engagekitExtensionId } =
      await this.db.extensionDeploymentMeta.findFirstOrThrow({
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
        },
      });

    const instance = await this.createSession({
      useProxy: true,
      useStealth: true,
      viewOnlyLiveView: this.opts.liveviewViewOnlyMode ?? false,
      solveCaptchas: true,
      extensionIds: [engagekitExtensionId],
      proxyCountry: this.opts.location,
      profile: {
        id: this.opts.browserProfileId,
        persistChanges: true,
      },
      staticIpId: this.opts.staticIpId,
    });

    if (this.opts.onBrowserMessage !== undefined) {
      this.onBrowserMessageCallbacks.add(this.opts.onBrowserMessage.bind(this));
    }

    this.liveUrl = instance.session.liveUrl;

    this.sessionId = instance.session.id;

    this.browser = instance.browser;

    const engagekitExtensionPagePromise = this.browser
      .newPage()
      .then(async (page) => {
        // technically we should use the getExtensionId + manifest.dev.json key to get the extension id but screw it
        // const extensionId = await getExtensionId(
        //   path.join(
        //     __dirname,
        //     "../../../../apps/chrome-extension/manifest.dev.json",
        //   ),
        // );
        // // but somehow this is getting the wrong id, maybe manifest.dev.json's key is wrong idk
        // console.info({ extensionId });
        await page.goto(
          `chrome-extension://${this.engagekitBuildExtensionId}/src/pages/popup/index.html?userJwt=${accountJwt}`,
          {
            waitUntil: "networkidle0",
          },
        );

        return page;
      });

    const linkedinPagePromise = this.browser.newPage().then(async (page) => {
      await this.setupBackendChannel(page);
      await page.goto("https://www.linkedin.com", {
        timeout: 0,
      });

      return page;
    });

    const [linkedin, engagekitExtension] = await Promise.all([
      linkedinPagePromise,
      engagekitExtensionPagePromise,
    ]);

    await linkedin.bringToFront();

    this.pages = {
      linkedin,
      engagekitExtension,
    };

    await this.bringToFront("linkedin");

    await this.db.browserInstance.update({
      where: {
        id: instanceId,
      },
      data: {
        status: "RUNNING",
      },
    });

    return this;
  }

  public static async isInstanceRunning(db: PrismaClient, id: string) {
    const session = await db.browserInstance.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return session === null || session.status === "RUNNING";
  }

  public onDestroy(callback: () => unknown) {
    this.onDestroyCallbacks.add(callback);

    return () => {
      this.onDestroyCallbacks.delete(callback);
    };
  }

  public async destroy() {
    if (this.destroying) {
      return;
    }
    this.destroying = true;

    await Promise.all([
      this.browser.close(),
      this.sessionId === "mock"
        ? hyperbrowser.sessions.stop(this.sessionId)
        : null,
    ]);

    const callbacks: Promise<unknown>[] = [];
    for (const cb of this.onDestroyCallbacks) {
      try {
        callbacks.push(Promise.resolve(cb()));
      } catch (err) {
        this.logger.error(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          `Error in onDestroy callback for browser session ${this.id}: ${err as any}`,
        );
      }
    }
    this.controller.abort();
    await Promise.all(callbacks);
  }

  public setupHeartbeat() {
    const interval = setInterval(() => {
      if (
        Date.now() - this.lastHeartbeatAt >
        this.LATEST_HEARTBEAT_THRESHOLD_MS
      ) {
        this.logger.warn(
          `No ping received from browser session ${this.id} in the last ${this.LATEST_HEARTBEAT_THRESHOLD_MS} ms, destroying session`,
        );
        clearInterval(interval);
        void this.destroy().catch((err) => {
          this.logger.error(
            `Error destroying browser session ${this.id}: ${err}`,
          );
        });
      }
    }, 5_000);

    this.onBrowserMessage((message) => {
      if (message.action !== "ping") {
        return;
      }

      this.lastHeartbeatAt = Date.now();
    });
  }

  public onBrowserMessage(
    messageCallback: (
      this: BrowserSession,
      data: BrowserBackendChannelMessage,
    ) => unknown,
  ) {
    this.onBrowserMessageCallbacks.add(messageCallback);

    return () => {
      this.onBrowserMessageCallbacks.delete(messageCallback);
    };
  }

  private async setupBackendChannel(page: Page) {
    const onBrowserMessage = (message: BrowserBackendChannelMessage) => {
      switch (message.action) {
        case "ready": {
          this.readyResolver.resolve();
          break;
        }
      }

      for (const cb of this.onBrowserMessageCallbacks) {
        cb(message);
      }
    };

    // expose _sendMessageToPuppeteerBackend to the page
    await page.exposeFunction(
      "_sendMessageToPuppeteerBackend",
      (data: BrowserBackendChannelMessage) => {
        onBrowserMessage(data);
      },
    );

    // listen to messages from contentscript and then call the exposed function
    await page.evaluateOnNewDocument(() => {
      function ping() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (window as any)._sendMessageToPuppeteerBackend({
          action: "ping",
        });
        setTimeout(() => {
          ping();
        }, 5000);
      }

      ping();

      window.addEventListener("message", (event) => {
        if (event.source !== window) return;
        if (
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          event.data?.source !== "engagekit_sendMessageToPuppeteerBackend"
        ) {
          return;
        }

        // check if payload is empty
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (!event.data?.payload) {
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
        (window as any)._sendMessageToPuppeteerBackend(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          event.data.payload,
        );
      });
    });
  }

  async bringToFront(page: "linkedin" | "engagekitExtension") {
    if (page === this.pageInView) {
      return;
    }
    this.pageInView = page;
    await this.pages[page].bringToFront();
  }

  async waitForSigninSuccess(signal: AbortSignal) {
    // just keep polling until we hit the feed page or an error
    // if we hit the feed page, means signin has succeeded
    // 5 minute timeout
    const time = Date.now();
    while (time + 5 * 60 * 1000 > Date.now() || signal.aborted === false) {
      try {
        const url = this.pages.linkedin.url();
        console.info("Polling LinkedIn URL:", url);
        if (url.includes("linkedin.com/feed")) {
          return true;
        }

        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(resolve, 2000);
          signal.addEventListener("abort", () => {
            clearTimeout(timeoutId);
            reject(new Error("Aborted"));
          });
        });
      } catch (err) {
        console.error("Error polling LinkedIn URL:", err);
        return false;
      }
    }

    throw new Error("Timeout waiting for signin success");
  }

  async getExtensionWorker() {
    if (this.extensionWorker !== null) {
      return this.extensionWorker;
    }

    const target = await this.browser.waitForTarget((target) => {
      if (target.type() !== TargetType.SERVICE_WORKER) {
        return false;
      }
      const url = target.url();
      console.info(
        url,
        url.includes(this.engagekitBuildExtensionId) &&
          url.includes("service-worker-loader.js"),
      );
      return (
        url.includes(this.engagekitBuildExtensionId) &&
        url.includes("service-worker-loader.js")
      );
    });

    let attempts = 0;

    // we need to retry here because sometimes the worker is not ready
    // there is no straightforward method to wait for worker
    // so we just retry in 2000ms untill max_attempts is reached
    while (true) {
      try {
        this.extensionWorker = await target.worker();

        return this.extensionWorker;
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.logger.info(`extension worker met error: ${err as any}, retrying`);
        attempts++;

        if (attempts > 5) {
          return null;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  async startAutoCommenting(params: StartAutoCommentingParams) {
    await this.bringToFront("linkedin");
    await this.ready;

    const assumedUserToken = await assumedAccountJwt.encode({
      accountId: this.accountId,
    });

    // can return an async iterator in the future to stream updates back to caller
    // for now just return a completed promise
    const resolver = Promise.withResolvers<void>();

    try {
      await this.pages.linkedin.evaluate(
        (params, assumedUserToken) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .postMessage({
              source: "engagekit_page_to_contentscript",
              payload: {
                action: "setAssumedUserToken",
                token: assumedUserToken,
              },
            });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .postMessage({
              source: "engagekit_page_to_contentscript",
              payload: {
                action: "startNewCommentingFlow",
                params,
              },
            });
        },
        params,
        assumedUserToken,
      );

      this.onBrowserMessage(async function (data) {
        switch (data.action) {
          case "stopAutoCommenting": {
            await this.destroy();
            resolver.resolve();
            break;
          }
          case "autoCommentingCompleted": {
            await Promise.all([
              this.destroy(),
              db.autoCommentRun.update({
                where: { id: data.payload.autoCommentRunId },
                data: {
                  status: data.payload.success ? "completed" : "errored",
                  error: data.payload.error,
                  endedAt: new Date(),
                },
              }),
            ]);
            resolver.resolve();
          }
        }
      });

      await resolver.promise;

      return {
        status: "completed",
      } as const;
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.logger.error(error);
      await this.destroy();
      return {
        status: "errored",
        error,
      } as const;
    }
  }

  async stopAutoCommenting() {
    const result = await this.pages.linkedin.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .postMessage({
          source: "engagekit_page_to_contentscript",
          payload: {
            action: "stopAutoCommenting",
          },
        });
    });

    return {
      status: "success",
      output: result,
    } as const;
  }

  async commentOnPost(postUrn: string, comment: string) {
    // TODO: comment on post logic
    if (1) {
      return {
        status: "error",
      } as const;
    }

    return {
      status: "success",
    } as const;
  }

  static async isAnySessionRunning(db: PrismaClient, accountId: string) {
    const instance = await db.browserInstance.findFirst({
      where: {
        accountId,
        status: "RUNNING",
      },
      select: {
        id: true,
      },
    });

    return instance !== null;
  }
}

export class BrowserSessionRegistry {
  constructor(private readonly db: PrismaClient) {}

  private readonly registry = new Map<string, BrowserSession>();

  async sync() {
    // check for remote db if any running or initializing sessions
    // these sessions are hung sessions that were not cleaned up properly
    // we need to destroy them locally (if they exist)
    // and set the state to STOPPED in the remote db
    while (true) {
      const browserInstances = await this.db.browserInstance.findMany({
        where: {
          OR: [
            {
              status: "RUNNING",
            },
            {
              status: "INITIALIZING",
            },
          ],
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const promises: Promise<any>[] = [];
      for (const instance of browserInstances) {
        if (!this.registry.has(instance.id)) {
          // stop hyperbrowser session deliberately
          // bcs this.destroy(instance.id) will skip stopping hyperbrowser session
          // if if does not exist in the registry
          promises.push(
            this.stopHyperbrowserSession(instance.hyperbrowserSessionId),
          );
          promises.push(this.destroy(instance.id));
          promises.push(
            this.db.browserInstance.update({
              where: {
                id: instance.id,
              },
              data: {
                status: "STOPPED",
              },
            }),
          );
        }
      }

      await Promise.all(promises);
    }
  }

  get(id: string) {
    return this.registry.get(id);
  }

  private async getOrRegister(session: BrowserSession) {
    const existing = this.get(session.id);
    if (existing !== undefined) {
      const status = await hyperbrowser.sessions.get(existing.sessionId);
      if (status.status === "active") {
        return {
          status: "existing",
          instance: existing,
        } as const;
      }

      // if existing session exists but status is not active
      // we destroy it and create it again below
      await this.destroy(session.id);
    }

    const browserSession = await session.init();

    this.registry.set(session.id, browserSession);

    return {
      status: "new",
      instance: browserSession,
    } as const;
  }

  async register(session: BrowserSession) {
    const existing = await this.getOrRegister(session);

    existing.instance.onDestroy(() => {
      this.registry.delete(session.id);
    });

    return existing;
  }

  has(id: string) {
    return this.registry.has(id);
  }

  private async stopHyperbrowserSession(sessionId: string) {
    if (sessionId === "mock") {
      return;
    }
    await hyperbrowser.sessions.stop(sessionId);
  }

  async destroy(accountId: string) {
    const entry = this.registry.get(accountId);
    if (entry === undefined) {
      return;
    }
    await entry.destroy();
    this.registry.delete(accountId);
  }

  async destroyAll() {
    const entries = Array.from(this.registry.entries());
    await Promise.all(
      entries
        .filter(([_, entry]) => entry.sessionId !== "mock")
        .map(([id]) => this.destroy(id)),
    );
  }
}

export const browserRegistry = new BrowserSessionRegistry(db);
