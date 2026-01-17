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
import type { PostCommentInfo } from "@sassy/linkedin-automation/post/types";
import type { StartAutoCommentingParams } from "@sassy/validators";

import type { Logger } from "../commons";
import type { EngagekitInternals } from "./utilities";
import { chunkify, safe } from "../commons";
import { env } from "../env";
import { jwtFactory } from "../jwt";

declare const window: Window & {
  engagekitInternals: EngagekitInternals;
};

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

    const linkedin = await this.browser.newPage();

    const utilities = await getEngagekitBundledUtilities();

    await linkedin.evaluateOnNewDocument((utilities) => {
      // eval in a function scope to avoid polluting global scope
      {
        eval(utilities);
      }
    }, utilities);

    await linkedin.goto("https://www.linkedin.com", {
      timeout: 0,
    });

    await linkedin.bringToFront();

    this.pages = {
      linkedin,
    };

    await linkedin.bringToFront();

    await linkedin.evaluate((utilities) => {
      // eval in a function scope to avoid polluting global scope
      {
        eval(utilities);
      }
    }, utilities);

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

    // TODO:
  }

  async stopAutoCommenting() {
    // TODO:
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

    const settings = await this.db.submitCommentSetting.findFirst({
      where: {
        accountId: this.accountId,
      },
    });

    const result = await this.pages.linkedin.evaluate(
      (postUrn, comment, settings) =>
        window.engagekitInternals.navigateToPostAndSubmitComment(
          postUrn,
          comment,
          settings ?? undefined,
        ),
      postUrn,
      comment,
      settings,
    );

    if (result.ok === false) {
      console.warn(`Failed to comment on post ${postUrn}: ${result.reason}`);
      return {
        status: "error",
        reason: result.reason,
      } as const;
    }

    return {
      status: "success",
    } as const;
  }

  async waitForFeedPageToLoad() {
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
      const anyPostExists = await this.pages.linkedin.evaluate(
        () => window.engagekitInternals.feedUtils.countPosts() > 0,
      );

      if (anyPostExists) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  private async getFeedPosts({ batchSize }: { batchSize: number }) {
    await this.ready;

    await this.waitForFeedPageToLoad();

    return await this.pages.linkedin.evaluate(async (targetCount) => {
      const posts = await window.engagekitInternals.collectPostsBatch({
        targetCount,
      });

      return posts.map((post) => {
        return {
          postUrn: post.urn,
          postUrl: post.url,
          postAlternateUrns: post.postAlternateUrls.map((p) => p.urn),
          captionPreview: post.captionPreview,
          fullCaption: post.fullCaption,
          postCreatedAt: post.postCreatedAt.toISOString(),
          authorName: post.authorInfo?.name ?? null,
          postComments: post.comments,
          authorProfileUrl: post.authorInfo?.profileUrl ?? null,
          authorAvatarUrl: post.authorInfo?.photoUrl ?? null,
          authorHeadline: post.authorInfo?.headline ?? null,
        };
      });
    }, batchSize);
  }

  public async loadFeedAndSavePosts(totalPosts: number) {
    const posts = await this.getFeedPosts({ batchSize: totalPosts });

    let totalInserted = 0;

    for (const batch of chunkify(posts, 20)) {
      const inserted = await insertCommentOnNonPreviouslyCommentedPosts(
        this.db,
        batch.map((post) => ({
          id: ulid(),
          comment: "",
          postUrn: post.postUrn,
          postUrl: post.postUrl,
          accountId: this.accountId,
          postAlternateUrns: post.postAlternateUrns,
          postComments: post.postComments,
          postCaptionPreview: post.captionPreview,
          postFullCaption: post.fullCaption,
          postCreatedAt: new Date(post.postCreatedAt),
          authorName: post.authorName,
          authorProfileUrl: post.authorProfileUrl,
          authorAvatarUrl: post.authorAvatarUrl,
          authorHeadline: post.authorHeadline,
        })),
      );

      totalInserted += inserted;
    }

    return totalInserted;
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
    postUrl: string;
    postAlternateUrns: string[];
    postFullCaption: string;
    postComments: PostCommentInfo[];
    comment: string;
    postCreatedAt: Date;
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
      postAlternateUrns: `{${comment.postAlternateUrns.join(",")}}`,
    })),
  );

  const inserted = await db.$executeRaw`
    insert into "Comment" (
      "id", 
      "postUrn", 
      "postUrl",
      "postAlternateUrns",
      "postCreatedAt",
      "postFullCaption", 
      "postComments",
      "authorName", 
      "authorProfileUrl", 
      "authorAvatarUrl", 
      "authorHeadline", 
      "accountId",
      "comment"
    ) select 
      payload->>'id',
      payload->>'postUrn',
      payload->>'postUrl',
      (payload->>'postAlternateUrns')::text[],
      (payload->>'postCreatedAt')::timestamp,
      payload->>'postFullCaption',
      (payload->>'postComments')::jsonb,
      payload->>'authorName',
      payload->>'authorProfileUrl',
      payload->>'authorAvatarUrl',
      payload->>'authorHeadline',
      payload->>'accountId',
      payload->>'comment'
    from jsonb_array_elements(${stringifiedValues}) as payload where not exists (
      select 1 from "Comment" where "Comment"."accountId" = payload->>'accountId' and ("Comment"."postUrn" = payload->>'postUrn' or payload->>'postUrn' = any("Comment"."postAlternateUrns")) limit 1
    )
  `;

  return inserted;
}

let bundledEngagekitUtilitiesPromise: Promise<string> | null = null;

export async function getEngagekitBundledUtilities() {
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

  return await bundledEngagekitUtilitiesPromise;
}
