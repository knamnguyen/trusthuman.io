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

declare const window: Window & {
  _sendMessageToPuppeteerBackend: (data: BrowserBackendChannelMessage) => void;
  _retry<TOutput>(
    fn: () => TOutput,
    opts?: {
      timeout?: number;
      interval?: number;
    },
  ): Promise<
    | {
        ok: true;
        data: TOutput;
      }
    | {
        ok: false;
        error: Error;
      }
  >;
};

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
  private pageLoadedResolver = Promise.withResolvers<void>();
  public ready: Promise<BrowserSession>;
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
    private readonly registry: BrowserSessionRegistry,
    public readonly accountId: string,
    private readonly opts: BrowserSessionParams,
    private readonly logger: Logger = console,
  ) {
    this.id = accountId;
    this.ready = this.init();
    this.registry.register(this);
    this.onDestroy(async () => {
      await this.db.browserInstance.update({
        where: {
          id: this.id,
        },
        data: {
          status: "STOPPED",
        },
      });
    });
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

    const accountJwt = await assumedAccountJwt.encode({
      accountId: this.id,
    });

    this.controller = new AbortController();

    let engagekitExtensionId = null;

    if (process.env.NODE_ENV !== "test") {
      // technically wont throw bcs we have at least one extension deployed
      const engagekitExtension =
        await this.db.extensionDeploymentMeta.findFirstOrThrow({
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
          },
        });

      engagekitExtensionId = engagekitExtension.id;
    }

    const instance = await this.createSession({
      useProxy: true,
      useStealth: true,
      viewOnlyLiveView: this.opts.liveviewViewOnlyMode ?? false,
      solveCaptchas: true,
      // safe to just fallback to mock here because findFirstOrThrow will throw if no extension found in production
      extensionIds: [engagekitExtensionId ?? "mock"],
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

    await this.pageLoadedResolver.promise;

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
    this.controller.abort();

    await Promise.all([
      this.browser.close(),
      process.env.NODE_ENV === "production"
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
    await Promise.all(callbacks);
  }

  public setupHeartbeat() {
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

    const pingCheck = () => {
      if (
        Date.now() - this.lastHeartbeatAt >
        this.LATEST_HEARTBEAT_THRESHOLD_MS
      ) {
        this.logger.warn(
          `No ping received from browser session ${this.id} in the last ${this.LATEST_HEARTBEAT_THRESHOLD_MS} ms, destroying session`,
        );

        if (timeoutId !== undefined) {
          clearTimeout(timeoutId);
        }

        void this.destroy().catch((err) => {
          this.logger.error(
            `Error destroying browser session ${this.id}: ${err}`,
          );
        });
        return;
      }

      timeoutId = setTimeout(pingCheck, 5000);
    };

    pingCheck();

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
          this.pageLoadedResolver.resolve();
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
        window._sendMessageToPuppeteerBackend({
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

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
        window._sendMessageToPuppeteerBackend(event.data.payload);
      });

      window._retry = async <TOutput>(
        fn: () => TOutput,
        opts?: {
          timeout?: number;
          interval?: number;
          retryOn?: (output: TOutput) => boolean;
        },
      ) => {
        const { timeout = 10000, interval = 200 } = opts ?? {};
        const start = Date.now();
        while (Date.now() - start < timeout) {
          try {
            const result = await Promise.resolve(fn());

            return {
              ok: true,
              data: result,
            };
          } catch {
            await new Promise((resolve) => setTimeout(resolve, interval));
            // ignore
          }
        }

        return {
          ok: false,
          error: new Error("timeout"),
        };
      };
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
          window.postMessage({
            source: "engagekit_page_to_contentscript",
            payload: {
              action: "setAssumedUserToken",
              token: assumedUserToken,
            },
          });

          window.postMessage({
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
              this.db.autoCommentRun.update({
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
      window.postMessage({
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

  async commentOnPost(postUrn: string, comment: string, now = new Date()) {
    await this.ready;

    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    const numCommentedToday = await this.db.userComment.count({
      where: {
        accountId: this.accountId,
        commentedAt: {
          not: null,
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // TODO: refactor this daily comment limit to be shared as a global constant
    if (numCommentedToday >= 100) {
      return {
        status: "error",
        reason: "Daily comment limit reached",
      } as const;
    }

    await this.pages.linkedin.evaluate((postUrn) => {
      // use window.history.pushstate for client side spa navigation
      window.history.pushState({}, "", `/feed/update/${postUrn}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, postUrn);

    return await this.pages.linkedin.evaluate(async (comment) => {
      const postContainer = await window._retry(() => {
        const element = document.querySelector("div.feed-shared-update-v2");
        if (element === null) {
          throw new Error("Post container not found, throwing for retry");
        }

        return element as HTMLDivElement;
      });

      if (postContainer.ok === false) {
        return {
          status: "error",
          reason: "Post container not found",
        } as const;
      }

      const commentButton = postContainer.data.querySelector(
        'button[aria-label="Comment"]',
      ) as HTMLButtonElement | null;

      if (commentButton === null) {
        return {
          status: "error",
          reason: "Comment button not found",
        } as const;
      }

      commentButton.click();

      async function getEditableField() {
        const commentEditor = await window._retry(() => {
          const element = document.querySelector(
            ".comments-comment-box-comment__text-editor",
          );
          if (element === null) {
            throw new Error("Comment editor not found, throwing for retry");
          }

          return element as HTMLDivElement;
        });

        if (!commentEditor.ok) {
          return null;
        }

        const result = await window._retry(() => {
          const editable = commentEditor.data.querySelector(
            "[contenteditable='true']",
          );
          if (editable === null) {
            throw new Error("Editable field not found, throwing for retry");
          }

          return editable as HTMLDivElement;
        });

        if (!result.ok) {
          return null;
        }

        return result.data;
      }

      const editableField = await getEditableField();
      if (editableField === null) {
        return {
          status: "error",
          reason: "Editable field not found",
        } as const;
      }

      editableField.focus();
      editableField.click();
      editableField.innerHTML = "";

      // Input the comment text
      const lines = comment.split("\n");
      lines.forEach((lineText) => {
        const p = document.createElement("p");
        if (lineText === "") {
          p.appendChild(document.createElement("br"));
        } else {
          p.textContent = lineText;
        }
        editableField.appendChild(p);
      });

      // Set cursor position and trigger input event
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        if (editableField.lastChild) {
          range.setStartAfter(editableField.lastChild);
        } else {
          range.selectNodeContents(editableField);
        }
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      editableField.focus();

      const inputEvent = new Event("input", {
        bubbles: true,
        cancelable: true,
      });
      editableField.dispatchEvent(inputEvent);

      const submitButton = await window._retry(() => {
        const button = document.querySelector(
          ".comments-comment-box__submit-button--cr",
        ) as HTMLButtonElement | null;

        if (button === null) {
          throw new Error("Submit button not found, throwing for retry");
        }

        if (button.disabled) {
          throw new Error("Submit button is disabled, throwing for retry");
        }

        return button;
      });

      if (!submitButton.ok) {
        return {
          status: "error",
          reason: "Submit button not found or disabled",
        } as const;
      }

      async function getFirstCommentUrn() {
        const result = await window._retry(() => {
          const commentsContainer = document.querySelector(
            ".scaffold-finite-scroll__content",
          ) as HTMLDivElement | null;

          if (commentsContainer === null) {
            return null;
          }

          const firstComment = commentsContainer.querySelector(
            "article",
          ) as HTMLElement | null;

          if (firstComment === null) {
            throw new Error("First comment not found, throwing for retry");
          }

          return firstComment.getAttribute("data-id");
        });

        return result.ok ? result.data : null;
      }

      const firstCommentUrnBeforePosting = await getFirstCommentUrn();

      submitButton.data.click();

      const commentPosted = await window._retry(
        async () => {
          // get first comment urn again, and compare with firstCommentUrnBeforePosting
          const urn = await getFirstCommentUrn();
          if (urn === null || urn === firstCommentUrnBeforePosting) {
            throw new Error("Comment not posted yet, throwing for retry");
          }

          return true;
        },
        {
          timeout: 50_000,
          interval: 500,
        },
      );

      if (!commentPosted.ok) {
        return {
          status: "error",
          reason: "Comment not posted within timeout",
        } as const;
      }

      return {
        status: "success",
      } as const;
    }, comment);
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
  private readonly registry = new Map<string, BrowserSession>();

  get(id: string) {
    return this.registry.get(id);
  }

  register(session: BrowserSession) {
    if (this.has(session.id)) {
      throw new Error(
        `Browser session with id ${session.id} is already registered`,
      );
    }
    this.registry.set(session.id, session);
  }

  has(id: string) {
    return this.registry.has(id);
  }

  async destroy(id: string) {
    const session = this.registry.get(id);
    if (session === undefined) {
      return;
    }

    await session.destroy();
    this.registry.delete(id);
  }

  async destroyAll() {
    const entries = Array.from(this.registry.entries());
    await Promise.all(entries.map(([id]) => this.destroy(id)));
  }
}

export const browserRegistry = new BrowserSessionRegistry();
