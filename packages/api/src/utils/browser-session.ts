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
    userId: z.string(),
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

  engagekitInternals: {
    retry<TOutput>(
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
    extractPostCaption: (postContainer: Element) => string | null;
    extractTextWithLineBreaks: (element: HTMLElement) => string;
    extractPostData(container: HTMLElement): Post | null;
    extractPostTime(container: HTMLElement): Date;
    extractPostAuthorInfo(container: HTMLElement): AuthorInfo;
    getPostCaptionPreview(fullCaption: string, maxLines: number): string;
    findPosts(opts: { skipPostUrns: Set<string>; limit: number }): Post[];
  };
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
    public readonly userId: string,
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
      userId: this.userId,
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
      await this.setup(page);
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

  private async setup(page: Page) {
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
    });

    await injectEngagekitInternals(this.pages.linkedin);
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
      userId: this.userId,
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

    const numCommentedToday = await this.db.comment.count({
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
      const postContainer = await window.engagekitInternals.retry(() => {
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
        const commentEditor = await window.engagekitInternals.retry(() => {
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

        const result = await window.engagekitInternals.retry(() => {
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

      const submitButton = await window.engagekitInternals.retry(() => {
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
        const result = await window.engagekitInternals.retry(() => {
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

      const commentPosted = await window.engagekitInternals.retry(
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

  private async *getFeedPostsBatch({
    batchSize,
    targetLimit,
  }: {
    batchSize: number;
    targetLimit: number;
  }) {
    await this.ready;

    let fetched = 0;
    const addedUrns = new Set<string>();

    while (true) {
      const posts = await this.pages.linkedin.evaluate(
        (skipPostUrns, limit) =>
          window.engagekitInternals.findPosts({
            skipPostUrns,
            limit,
          }),
        addedUrns,
        batchSize,
      );

      yield posts;

      fetched += posts.length;

      for (const post of posts) {
        addedUrns.add(post.urn);
      }

      if (fetched >= targetLimit || posts.length === 0) {
        break;
      }
    }
  }

  public async loadFeedAndSavePosts(totalPosts: number) {
    let totalCreated = 0;
    for await (const postBatch of this.getFeedPostsBatch({
      batchSize: 20,
      targetLimit: totalPosts,
    })) {
      const result = await this.db.comment.createMany({
        data: postBatch.map((post) => ({
          id: ulid(),
          comment: "",
          accountId: this.accountId,
          postUrn: post.urn,
          postContentHtml: post.contentHtml,
          postCaptionPreview: post.captionPreview,
          postFullCaption: post.fullCaption,
          postCreatedAt: new Date(post.createdAt),
          authorUrn: post.author?.urn ?? null,
          authorName: post.author?.name ?? null,
          authorProfileUrl: post.author?.profileUrl ?? null,
          authorAvatarUrl: post.author?.avatarUrl ?? null,
          authorHeadline: post.author?.headline ?? null,
        })),
      });

      totalCreated += result.count;
    }

    return totalCreated;
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

interface AuthorInfo {
  urn: string | null;
  name: string | null;
  profileUrl: string | null;
  avatarUrl: string | null;
  headline: string | null;
}

interface Post {
  urn: string;
  contentHtml: string;
  captionPreview: string;
  fullCaption: string;
  createdAt: string;
  author: AuthorInfo | null;
}

async function injectEngagekitInternals(page: Page) {
  await page.evaluateOnNewDocument(() => {
    window.engagekitInternals = {
      retry: async <TOutput>(
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
      },
      extractTextWithLineBreaks(element) {
        const lines: string[] = [];
        let currentLine = "";

        function processNode(node: Node) {
          if (node.nodeType === Node.TEXT_NODE) {
            // Add text content, normalizing internal whitespace but not trimming
            const text = node.textContent?.replace(/[ \t]+/g, " ") ?? "";
            currentLine += text;
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tagName = el.tagName.toLowerCase();

            // Handle line break elements
            if (tagName === "br") {
              lines.push(currentLine.trim());
              currentLine = "";
              return;
            }

            // Block elements create natural breaks
            const isBlock = [
              "div",
              "p",
              "li",
              "h1",
              "h2",
              "h3",
              "h4",
              "h5",
              "h6",
            ].includes(tagName);

            if (isBlock && currentLine.trim()) {
              lines.push(currentLine.trim());
              currentLine = "";
            }

            // Process children
            for (const child of el.childNodes) {
              processNode(child);
            }

            if (isBlock && currentLine.trim()) {
              lines.push(currentLine.trim());
              currentLine = "";
            }
          }
        }

        processNode(element);

        // Don't forget the last line
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }

        // Join with newlines and collapse multiple empty lines
        return lines
          .join("\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      },
      extractPostCaption(postContainer) {
        try {
          // XPath: div with dir="ltr" that contains span > span[@dir="ltr"]
          const result = document.evaluate(
            './/div[@dir="ltr" and .//span//span[@dir="ltr"]]',
            postContainer,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null,
          );

          const captionDiv = result.singleNodeValue as HTMLElement | null;
          if (!captionDiv) {
            return "";
          }

          // Extract text preserving line breaks from <br> tags and block elements
          return this.extractTextWithLineBreaks(captionDiv);
        } catch (error) {
          console.error("EngageKit: failed to extract post caption", error);
          return "";
        }
      },
      getPostCaptionPreview(caption, wordCount) {
        const words = caption.trim().split(/\s+/);
        if (words.length <= wordCount) {
          return caption;
        }
        return words.slice(0, wordCount).join(" ") + "...";
      },
      extractPostTime(postContainer) {
        function extractLabeledTime() {
          try {
            // Find the author image
            const authorImg =
              postContainer.querySelector<HTMLImageElement>(
                'img[alt^="View "]',
              );

            if (!authorImg) {
              return null;
            }

            // Navigate to the author anchor
            const authorAnchor = authorImg.closest("a");
            if (!authorAnchor) {
              return null;
            }

            // The time span is typically a sibling of the author anchor's parent container
            // Navigate up to find the container that has both the anchor and the time span
            const authorMetaContainer = authorAnchor.parentElement;
            if (!authorMetaContainer) {
              return null;
            }

            // Look for spans that are siblings of the author anchor
            // The time span typically contains text like "1h •", "2d •", "1w •"
            const siblingSpans =
              authorMetaContainer.querySelectorAll<HTMLElement>(
                ":scope > span",
              );

            for (const span of siblingSpans) {
              // Skip if this span is inside the anchor (it's not a sibling then)
              if (authorAnchor.contains(span)) continue;

              // Check for time patterns in aria-hidden content
              const ariaHiddenSpan = span.querySelector<HTMLElement>(
                'span[aria-hidden="true"]',
              );
              const visuallyHiddenSpan = span.querySelector<HTMLElement>(
                "span.visually-hidden",
              );

              // Try to get display time from aria-hidden span
              if (ariaHiddenSpan) {
                const text = ariaHiddenSpan.textContent?.trim() ?? "";
                // Time patterns: "1h •", "2d •", "1w •", "3mo •"
                const timeMatch = /^(\d+[hdwmoy]+)\s*[•·]/i.exec(text);
                if (timeMatch?.[1]) {
                  return {
                    type: "display",
                    value: timeMatch[1],
                  } as const;
                }
              }

              // Try to get full time from visually-hidden span
              // Pattern: "1 hour ago", "2 days ago", etc.
              if (visuallyHiddenSpan) {
                const text = visuallyHiddenSpan.textContent?.trim() ?? "";
                const fullTimeMatch =
                  /^(\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago)/i.exec(
                    text,
                  );
                if (fullTimeMatch?.[1]) {
                  return {
                    type: "full",
                    value: fullTimeMatch[1],
                  } as const;
                }
              }
            }

            // Fallback: Search more broadly if sibling approach didn't work
            // Look for any span in the post that has time-like content
            // This is a broader search but still uses the visually-hidden pattern
            const allVisuallyHiddenSpans =
              postContainer.querySelectorAll<HTMLElement>(
                'span[class*="visually-hidden"]',
              );

            for (const span of allVisuallyHiddenSpans) {
              const text = span.textContent?.trim() ?? "";
              // Match patterns like "1 hour ago", "2 days ago" at the start
              const match =
                /^(\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago)/i.exec(
                  text,
                );
              if (match?.[1]) {
                return {
                  type: "full",
                  value: match[1],
                } as const;
              }
            }
          } catch (error) {
            console.error("EngageKit: Failed to extract post time", error);
          }

          return null;
        }

        function parsePostTime(input: {
          type: "full" | "display";
          value: string;
        }): Date {
          const now = new Date();

          // Helper to subtract time from the current date
          function subtractTime(
            amount: number,
            unit: "second" | "minute" | "hour" | "day" | "week",
          ) {
            const d = new Date(now);
            switch (unit) {
              case "second":
                d.setSeconds(d.getSeconds() - amount);
                break;
              case "minute":
                d.setMinutes(d.getMinutes() - amount);
                break;
              case "hour":
                d.setHours(d.getHours() - amount);
                break;
              case "day":
                d.setDate(d.getDate() - amount);
                break;
              case "week":
                d.setDate(d.getDate() - amount * 7);
                break;
            }
            return d;
          }
          switch (input.type) {
            case "display": {
              const match = /^(\d+)([smhdw])$/i.exec(input.value);
              if (!match) return now; // fallback if no match

              const [, amountStr, unitChar] = match;
              if (amountStr === undefined || unitChar === undefined) {
                return now;
              }

              const amount = parseInt(amountStr, 10);
              switch (unitChar.toLowerCase()) {
                case "s":
                  return subtractTime(amount, "second");
                case "m":
                  return subtractTime(amount, "minute");
                case "h":
                  return subtractTime(amount, "hour");
                case "d":
                  return subtractTime(amount, "day");
                case "w":
                  return subtractTime(amount, "week");
                default:
                  return now;
              }
            }
            case "full": {
              const match =
                /(\d+)\s*(second|minute|hour|day|week|month|year)s?\s+ago/i.exec(
                  input.value,
                );
              if (!match) return now;

              const [, amountStr, unit] = match;
              if (amountStr === undefined || unit === undefined) {
                return now;
              }
              const amount = parseInt(amountStr, 10);
              switch (unit.toLowerCase()) {
                case "second":
                  return subtractTime(amount, "second");
                case "minute":
                  return subtractTime(amount, "minute");
                case "hour":
                  return subtractTime(amount, "hour");
                case "day":
                  return subtractTime(amount, "day");
                case "week":
                  return subtractTime(amount, "week");
                case "month": {
                  const d = new Date(now);
                  d.setMonth(d.getMonth() - amount);
                  return d;
                }
                case "year": {
                  const d = new Date(now);
                  d.setFullYear(d.getFullYear() - amount);
                  return d;
                }
                default:
                  return now;
              }
            }
            default:
              return now;
          }
        }

        const labeledTime = extractLabeledTime();

        if (labeledTime === null) {
          return new Date();
        }

        return parsePostTime(labeledTime);
      },
      extractPostAuthorInfo(postContainer) {
        const result: AuthorInfo = {
          urn: null,
          name: null,
          avatarUrl: null,
          headline: null,
          profileUrl: null,
        };

        try {
          // Step 1: Find author image by alt text pattern
          // LinkedIn author images have alt="View {Name}'s profile"
          const authorImg =
            postContainer.querySelector<HTMLImageElement>('img[alt^="View "]');

          if (!authorImg) {
            return result;
          }

          // Step 2: Extract photo URL
          result.avatarUrl = authorImg.getAttribute("src");

          // Step 3: Extract name from alt text
          const alt = authorImg.getAttribute("alt");

          if (alt !== null) {
            const possessiveMatch = /^View\s+(.+?)['‘’]s?\s+/i.exec(alt);
            if (possessiveMatch?.[1]) {
              result.name = possessiveMatch[1].trim();
            }
          }

          // Step 4: Navigate up to find the anchor element for profile URL
          const photoAnchor = authorImg.closest("a");
          if (photoAnchor) {
            const href = photoAnchor.getAttribute("href");
            if (href !== null) {
              result.profileUrl = href.split("?")[0] ?? null;
            }

            // Step 5: Extract headline using sibling navigation (like extract-profile-info.ts)
            result.headline = extractHeadlineFromAuthorSection(photoAnchor);
          }
        } catch (error) {
          console.error(
            "EngageKit: Failed to extract author info from post",
            error,
          );
        }

        return result;
      },
      extractPostData(container) {
        const urn = container.getAttribute("data-urn");
        if (!urn) return null;

        const fullCaption = this.extractPostCaption(container);
        if (!fullCaption) return null;

        return {
          urn,
          fullCaption,
          contentHtml: container.innerHTML,
          captionPreview: this.getPostCaptionPreview(fullCaption, 10),
          createdAt: this.extractPostTime(container).toISOString(),
          author: this.extractPostAuthorInfo(container),
        };
      },
      findPosts({
        skipPostUrns,
        limit,
      }: {
        skipPostUrns: Set<string>;
        limit: number;
      }) {
        const posts = document.querySelectorAll<HTMLElement>("div[data-urn]");

        const validPosts: Post[] = [];

        for (const container of posts) {
          const urn = container.getAttribute("data-urn");
          if (!urn?.includes("activity")) continue;
          if (skipPostUrns.has(urn)) continue;

          const fullCaption = this.extractPostCaption(container);
          if (fullCaption === null) {
            continue;
          }

          const postData = this.extractPostData(container);
          if (postData === null) continue;

          if (validPosts.length >= limit) {
            return validPosts;
          }

          validPosts.push(postData);
        }

        return validPosts;
      },
    };

    function extractHeadlineFromAuthorSection(
      photoAnchor: Element,
    ): string | null {
      // Strategy 1: Look at the parent container and find spans that aren't the name
      const authorContainer = photoAnchor.parentElement;
      if (!authorContainer) return null;

      // The author section usually has the structure where headline is in a sibling anchor
      // or in spans within the container
      const siblingAnchors = authorContainer.querySelectorAll("a");

      for (const anchor of siblingAnchors) {
        // Skip the photo anchor itself
        if (anchor === photoAnchor) continue;

        // Check if this anchor contains profile info (has children with text)
        const lastChild = anchor.lastElementChild;
        if (lastChild) {
          const text = lastChild.textContent?.trim();
          // Headline is usually longer than name and doesn't start with "View"
          if (text && text.length > 5 && !text.startsWith("View ")) {
            return text;
          }
        }

        // Also check anchor's nextElementSibling for headline
        const nextSibling = anchor.nextElementSibling;
        if (nextSibling) {
          const siblingText = nextSibling.textContent?.trim();
          if (
            siblingText &&
            siblingText.length > 5 &&
            !siblingText.startsWith("View ")
          ) {
            return siblingText;
          }
        }
      }

      // Strategy 2: Look in the grandparent for a different structure
      const grandparent = authorContainer.parentElement;
      if (grandparent) {
        // Find all anchors and look for the one that's not the photo
        const anchors = grandparent.querySelectorAll("a");
        for (const anchor of anchors) {
          if (anchor.contains(photoAnchor) || anchor === photoAnchor) continue;

          // This might be the name/headline anchor
          const lastChild = anchor.lastElementChild;
          if (lastChild) {
            const text = lastChild.textContent?.trim();
            if (text && text.length > 5 && !text.startsWith("View ")) {
              return text;
            }
          }
        }
      }

      return null;
    }
  });
}
