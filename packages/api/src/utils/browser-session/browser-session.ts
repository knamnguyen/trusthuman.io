import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser, Page } from "puppeteer-core";
import { Hyperbrowser } from "@hyperbrowser/sdk";
import puppeteer from "puppeteer";
import { connect } from "puppeteer-core";
import invariant from "tiny-invariant";
import { ulid } from "ulidx";
import { z } from "zod";

import type { PrismaClient } from "@sassy/db";
import type { StartAutoCommentingParams } from "@sassy/validators";

import type { Logger } from "../commons";
import { abortableAsyncIterator, safe } from "../commons";
import { env } from "../env";
import { jwtFactory } from "../jwt";

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

export interface BrowserSessionParams {
  location: ProxyLocation;
  staticIpId?: string;
  browserProfileId: string;
  liveviewViewOnlyMode?: boolean;
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
  };
  public pageInView: (string & {}) | "linkedin" = "linkedin";
  private controller = new AbortController();
  public signal = this.controller.signal;
  public ready: Promise<BrowserSession>;
  public lastHeartbeatAt = Date.now();
  private LATEST_HEARTBEAT_THRESHOLD_MS = 15_000;
  private destroying = false;
  private onDestroyCallbacks = new Set<() => unknown>();

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
      await safe(() =>
        this.db.browserInstance.update({
          where: {
            id: this.id,
          },
          data: {
            status: "STOPPED",
          },
        }),
      );
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

    const browser = (await puppeteer.launch({
      defaultViewport: null,
      headless: false,
      pipe: true,
      userDataDir: path.join(process.cwd(), ".puppeteer", "user_data"),
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

    this.controller = new AbortController();

    const instance = await this.createSession({
      useProxy: true,
      useStealth: true,
      viewOnlyLiveView: this.opts.liveviewViewOnlyMode ?? false,
      solveCaptchas: true,
      proxyCountry: this.opts.location,
      profile: {
        id: this.opts.browserProfileId,
        persistChanges: true,
      },
      staticIpId: this.opts.staticIpId,
    });

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

    const linkedin = await this.browser.newPage().then(async (page) => {
      await this.setup(page);
      await page.goto("https://www.linkedin.com", {
        timeout: 0,
      });

      return page;
    });

    await linkedin.bringToFront();

    this.pages = {
      linkedin,
    };

    await linkedin.bringToFront();

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
  }

  private async setup(page: Page) {
    await injectEngagekitUtilities(page);
  }

  async waitForSigninSuccess(signal: AbortSignal) {
    // just keep polling until we hit the feed page or an error
    // if we hit the feed page, means signin has succeeded
    // 5 minute timeout
    const time = Date.now();
    const combinedSignal = AbortSignal.any([this.controller.signal, signal]);
    while (
      time + 5 * 60 * 1000 > Date.now() ||
      combinedSignal.aborted === false
    ) {
      try {
        const url = this.pages.linkedin.url();
        console.info("Polling LinkedIn URL:", url);
        if (url.includes("linkedin.com/feed")) {
          return true;
        }

        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(resolve, 2000);
          combinedSignal.addEventListener("abort", () => {
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

  async startAutoCommenting(params: StartAutoCommentingParams) {
    await this.pages.linkedin.bringToFront();
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

  private async waitForFeedPageToLoad() {
    const feedPageTimeout = Date.now() + 2 * 60 * 1000;

    // wait for url to change to feed page
    while (Date.now() < feedPageTimeout) {
      const url = this.pages.linkedin.url();
      if (url.includes("linkedin.com/feed")) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const anyPostsLoadedTimeout = Date.now() + 2 * 60 * 1000;

    // wait for any posts to be loaded
    while (Date.now() < anyPostsLoadedTimeout) {
      const anyPostExists = await this.pages.linkedin.evaluate(() =>
        window.engagekitInternals.doesAnyPostContainerExist(),
      );

      if (anyPostExists) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  private async *getFeedPostsBatch({ batchSize }: { batchSize: number }) {
    await this.ready;

    await this.waitForFeedPageToLoad();

    const addedUrns = new Set<string>();

    while (true) {
      const posts = await this.pages.linkedin.evaluate(
        async (skipPostUrns, limit) =>
          await window.engagekitInternals.findPosts({
            skipPostUrns: new Set(skipPostUrns),
            limit,
          }),
        [...addedUrns],
        batchSize,
      );

      yield posts;

      for (const post of posts) {
        addedUrns.add(post.urn);
      }

      if (posts.length === 0) {
        break;
      }

      await this.pages.linkedin.evaluate(() =>
        window.engagekitInternals.loadMore(),
      );
    }
  }

  public async loadFeedAndSavePosts(totalPosts: number, signal?: AbortSignal) {
    let totalCreated = 0;
    // we do a max iteration of 20 in case the feed is not loading more posts
    // or in case some shit happens in the fe that hangs stuff
    // so we can shut down the session and not just leave it there hanging

    let maxIterations = 10;

    const combinedSignals = [this.controller.signal];

    if (signal !== undefined) {
      combinedSignals.push(signal);
    }

    for await (const postBatch of abortableAsyncIterator(
      AbortSignal.any(combinedSignals),
      this.getFeedPostsBatch({
        batchSize: 20,
      }),
    )) {
      const truncated = postBatch.slice(
        0,
        Math.max(totalPosts - totalCreated, 0),
      );

      if (truncated.length === 0) {
        break;
      }

      const numInserted = await insertCommentOnNonPreviouslyCommentedPosts(
        this.db,
        truncated.map((post) => ({
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
      );

      totalCreated += numInserted;

      if (totalCreated >= totalPosts) {
        break;
      }

      maxIterations--;

      if (maxIterations <= 0) {
        break;
      }
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

// this query inserts comments only on posts that have not been commented on before
// caveat: if there are multiple comments for the same postUrn in the input array
// all of them will be inserted, we can accept this limitation for now bcs it's unlikely
// that the same input array contains duped postUrns
export async function insertCommentOnNonPreviouslyCommentedPosts(
  db: PrismaClient,
  comments: {
    id: string;
    postUrn: string;
    postContentHtml: string;
    postCaptionPreview: string;
    postFullCaption: string;
    comment: string;
    postCreatedAt: Date;
    authorUrn: string | null;
    authorName: string | null;
    authorProfileUrl: string | null;
    authorAvatarUrl: string | null;
    authorHeadline: string | null;
    accountId: string;
  }[],
) {
  const stringifiedValues = JSON.stringify(
    comments.map((comment) => ({
      ...comment,
      // postgres raw queries accepts timestamp in "YYYY-MM-DD HH:MM:SS" format
      // so we gotta do this ugly parsing
      postCreatedAt: comment.postCreatedAt
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
    })),
  );

  const inserted = await db.$executeRaw`
    insert into "Comment" (
      "id", 
      "postUrn", 
      "postContentHtml", 
      "postCaptionPreview", 
      "postFullCaption", 
      "postCreatedAt", 
      "authorUrn", 
      "authorName", 
      "authorProfileUrl", 
      "authorAvatarUrl", 
      "authorHeadline", 
      "accountId",
      "comment"
    ) select 
      values->>'id',
      values->>'postUrn',
      values->>'postContentHtml',
      values->>'postCaptionPreview',
      values->>'postFullCaption',
      (values->>'createdAt')::timestamp,
      values->>'authorUrn',
      values->>'authorName',
      values->>'authorProfileUrl',
      values->>'authorAvatarUrl',
      values->>'authorHeadline',
      values->>'accountId',
      values->>'comment'
    from jsonb_array_elements(${stringifiedValues}) as values where not exists (
      select 1 from "Comment" where "Comment"."postUrn" = values->>'postUrn' and "Comment"."accountId" = values->>'accountId' limit 1
    )
  `;

  return inserted;
}

let bundledEngagekitUtilitiesPromise: Promise<string> | null = null;

export async function injectEngagekitUtilities(page: Page) {
  bundledEngagekitUtilitiesPromise ??= (async () => {
    const result = await Bun.build({
      entrypoints: [path.join(__dirname, "utilities.ts")],
      minify: true,
      target: "browser",
    });

    if (result.success === false) {
      throw new Error(
        `Failed to bundle engagekit utilities: \n${result.logs.map((log) => log.message).join("\n")}`,
      );
    }

    const file = result.outputs[0];

    invariant(
      file && result.outputs.length === 1,
      "Expected exactly one output file",
    );

    return await file.text();
  })();

  const bundledUtilities = await bundledEngagekitUtilitiesPromise;

  await page.evaluateOnNewDocument((utilities) => {
    // eval inside a curly bracket to avoid polluting global scope
    // and referencing variables from outer scope
    {
      eval(utilities);
    }
  }, bundledUtilities);
}
