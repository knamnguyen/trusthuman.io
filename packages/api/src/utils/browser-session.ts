import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, Page, WebWorker } from "puppeteer-core";
import { Hyperbrowser } from "@hyperbrowser/sdk";
import puppeteer from "puppeteer";
import { connect, TargetType } from "puppeteer-core";
import { z } from "zod";

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
  startAutoCommenting: (params: {
    autoCommentRunId: string;
    scrollDuration: number;
    commentDelay: number;
    maxPosts: number;
    styleGuide: string;
    duplicateWindow: number;
    commentAsCompanyEnabled?: boolean;
    timeFilterEnabled?: boolean;
    minPostAge?: number;
    manualApproveEnabled?: boolean;
    authenticityBoostEnabled?: boolean;
    commentProfileName?: string;
    languageAwareEnabled?: boolean;
    skipCompanyPagesEnabled?: boolean;
    skipPromotedPostsEnabled?: boolean;
    skipFriendsActivitiesEnabled?: boolean;
    blacklistEnabled?: boolean;
    blacklistAuthors?: string[];
  }) => Promise<void>;
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
  accountId: string;
  location: ProxyLocation;
  staticIpId?: string;
  engagekitExtensionId: string;
  browserProfileId: string;
  liveviewViewOnlyMode?: boolean;
  onBrowserMessage?: (
    this: BrowserSession,
    data: BrowserBackendChannelMessage,
  ) => unknown;
}

export class BrowserSession {
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
  public lastPingAt = Date.now();
  private LATEST_HEARTBEAT_THRESHOLD_MS = 15_000;
  private destroying = false;
  private browserMessageCallbacks = new Set<
    (data: BrowserBackendChannelMessage) => unknown
  >();

  private extensionWorker: WebWorker | null = null;
  constructor(
    private readonly registry: BrowserSessionRegistry,
    private readonly opts: BrowserSessionParams,
    private readonly logger: Logger = console,
  ) {
    this.id = opts.accountId;
  }

  static async getOrCreate(
    registry: BrowserSessionRegistry,
    opts: BrowserSessionParams,
    logger: Logger = console,
  ) {
    return await registry.register(new BrowserSession(registry, opts, logger));
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
    const accountJwt = await assumedAccountJwt.encode({
      accountId: this.opts.accountId,
    });

    this.controller = new AbortController();

    const instance = await this.createSession({
      useProxy: true,
      useStealth: true,
      viewOnlyLiveView: this.opts.liveviewViewOnlyMode ?? false,
      solveCaptchas: true,
      extensionIds: [this.opts.engagekitExtensionId],
      proxyCountry: this.opts.location,
      profile: {
        id: this.opts.browserProfileId,
        persistChanges: true,
      },
      staticIpId: this.opts.staticIpId,
    });

    if (this.opts.onBrowserMessage !== undefined) {
      this.browserMessageCallbacks.add(this.opts.onBrowserMessage.bind(this));
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

    return this;
  }

  public async destroy() {
    if (this.destroying) {
      return;
    }
    this.destroying = true;
    await this.registry.destroy(this.id);
    this.controller.abort();
  }

  public setupHeartbeat() {
    const interval = setInterval(() => {
      if (Date.now() - this.lastPingAt > this.LATEST_HEARTBEAT_THRESHOLD_MS) {
        this.logger.warn(
          `No ping received from browser session ${this.id} in the last ${this.LATEST_HEARTBEAT_THRESHOLD_MS} seconds, destroying session`,
        );
        clearInterval(interval);
        void this.destroy().catch((err) => {
          this.logger.error(
            `Error destroying browser session ${this.id}: ${err}`,
          );
        });
      }
    }, 5_000);
  }

  public onBrowserMessage(
    messageCallback: (data: BrowserBackendChannelMessage) => unknown,
  ) {
    this.browserMessageCallbacks.add(messageCallback);

    return () => {
      this.browserMessageCallbacks.delete(messageCallback);
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

      for (const cb of this.browserMessageCallbacks) {
        cb(message);
      }
    };

    // expose _sendMessageToPuppeteerBackend to the page
    await page.exposeFunction(
      "_sendMessageToPuppeteerBackend",
      (data: BrowserBackendChannelMessage) => {
        onBrowserMessage(data);

        switch (data.action) {
          case "ping": {
            this.lastPingAt = Date.now();
            break;
          }
        }
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

  // TODO: add error handling in general to destroy when any errors are caught
  async startAutoCommenting(params: {
    autoCommentRunId: string;
    scrollDuration: number;
    commentDelay: number;
    maxPosts: number;
    styleGuide: string;
    duplicateWindow: number;
    commentAsCompanyEnabled?: boolean;
    timeFilterEnabled?: boolean;
    minPostAge?: number;
    manualApproveEnabled?: boolean;
    authenticityBoostEnabled?: boolean;
    commentProfileName?: string;
    languageAwareEnabled?: boolean;
    skipCompanyPagesEnabled?: boolean;
    skipPromotedPostsEnabled?: boolean;
    skipFriendsActivitiesEnabled?: boolean;
    blacklistEnabled?: boolean;
    blacklistAuthors?: string[];
  }) {
    await this.bringToFront("linkedin");
    await this.ready;

    const assumedUserToken = await assumedAccountJwt.encode({
      accountId: this.opts.accountId,
    });

    console.info("running start autocomementing");
    const result = await this.pages.linkedin.evaluate(
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
    console.info("ran start autocomementing");

    return {
      status: "success",
      output: result,
    } as const;
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
}

export class BrowserSessionRegistry {
  private readonly registry = new Map<string, BrowserSession>();

  get(id: string) {
    return this.registry.get(id);
  }

  async register(session: BrowserSession) {
    const existing = this.get(session.id);
    if (existing !== undefined) {
      const status = await hyperbrowser.sessions.get(existing.sessionId);
      if (status.status === "active") {
        return {
          status: "existing",
          instance: existing,
        } as const;
      }

      // if existing session exists but status is not active, we destroy it and create it again below
      await this.destroy(session.id);
    }

    const browserSession = await session.init();

    this.registry.set(session.id, browserSession);

    return {
      status: "new",
      instance: browserSession,
    } as const;
  }

  has(id: string) {
    return this.registry.has(id);
  }

  async destroy(accountId: string) {
    const entry = this.registry.get(accountId);
    if (entry === undefined) {
      return;
    }
    await Promise.all([
      entry.browser.close(),
      hyperbrowser.sessions.stop(entry.sessionId),
    ]);
    this.registry.delete(accountId);
  }

  async destroyAll() {
    const entries = Array.from(this.registry.entries());
    await Promise.all(
      entries
        .filter(([_, entry]) => entry.sessionId !== "mock")
        .map(async ([id, entry]) => {
          await entry.browser.close();
          await hyperbrowser.sessions.stop(id);
          this.registry.delete(id);
        }),
    );
  }
}

export const browserRegistry = new BrowserSessionRegistry();
