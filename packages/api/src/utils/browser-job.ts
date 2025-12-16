import type { Hyperbrowser } from "@hyperbrowser/sdk";
import { ulid } from "ulidx";

import type { PrismaClient } from "@sassy/db";
import { db } from "@sassy/db";
import {
  autoCommentConfigurationDefaults,
  DEFAULT_STYLE_GUIDES,
} from "@sassy/feature-flags";

import type { BrowserSessionRegistry, ProxyLocation } from "./browser-session";
import {
  browserRegistry,
  BrowserSession,
  hyperbrowser,
} from "./browser-session";
import { safe, transformValuesIfMatch } from "./commons";
import { Semaphore } from "./mutex";

export class BrowserJobWorker<TWorkerContext = unknown, TJobContext = unknown> {
  private waiter = Promise.withResolvers();
  private readonly maxConcurrentSessions: number;
  private semaphore: Semaphore;

  constructor(
    private readonly deps: {
      readonly hyperbrowser: Hyperbrowser;
      readonly db: PrismaClient;
      readonly browserRegistry: BrowserSessionRegistry;
      readonly jobRegistry: BrowserJobRegistry<TWorkerContext, TJobContext>;
      readonly createJobContextFactory: (
        ctx: NoInfer<TWorkerContext>,
        accountId: string,
      ) => Promise<TJobContext> | TJobContext;
      readonly onJobCompleted?: (
        ctx: NoInfer<TWorkerContext>,
        jobCtx: TJobContext,
      ) => Promise<void> | void;
      readonly maxConcurrentJobs?: number;
    },
  ) {
    this.maxConcurrentSessions = deps.maxConcurrentJobs ?? 25;
    this.semaphore = new Semaphore(this.maxConcurrentSessions);
  }

  private async numSessionsRunning() {
    const sessions = await this.deps.hyperbrowser.sessions.list({ limit: 1 });
    return sessions.totalCount;
  }

  async processJob(ctx: TWorkerContext, jobId: string) {
    try {
      const result = await this.deps.db.browserJob.update({
        where: { id: jobId },
        data: {
          status: "RUNNING",
        },
        select: {
          accountId: true,
        },
      });

      if (process.env.NODE_ENV !== "test") {
        const jobContext = await this.deps.createJobContextFactory(
          ctx,
          result.accountId,
        );

        for (const job of this.deps.jobRegistry.values()) {
          await safe(() => job(ctx, jobContext));
        }

        try {
          await this.deps.onJobCompleted?.(ctx, jobContext);
        } catch (error) {
          console.error(
            `Error in onJobCompleted for browser job ${jobId}:`,
            error,
          );
        }
      }
    } catch (error) {
      await this.deps.db.browserJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : String(error),
        },
      });
      console.error(`Browser job ${jobId} failed:`, error);
      return;
    } finally {
      await this.deps.db.browserJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
        },
      });
    }
  }

  async work(ctx: TWorkerContext) {
    while (true) {
      const job = await this.deps.db.browserJob.findFirst({
        where: {
          status: "QUEUED",
          startAt: {
            lte: new Date(),
          },
        },
        orderBy: {
          id: "asc",
        },
      });

      if (job !== null) {
        await this.semaphore.acquire();

        void this.processJob(ctx, job.id).finally(() => {
          this.semaphore.release();
        });
      }

      await this.sleep;
    }
  }

  private resume() {
    const resolve = this.waiter.resolve;
    this.waiter = Promise.withResolvers();
    resolve();
  }

  private get sleep() {
    return this.waiter.promise;
  }

  async tryQueue(accountId: string, startAt = new Date()) {
    const existing = await this.deps.db.browserJob.findFirst({
      where: {
        accountId,
        status: "QUEUED",
      },
      select: {
        id: true,
        startAt: true,
      },
    });

    if (existing !== null) {
      this.resume();

      return {
        status: "exists",
        id: existing.id,
        startAt: existing.startAt,
      } as const;
    }

    const result = await this.deps.db.browserJob.create({
      data: {
        id: ulid(),
        accountId,
        status: "QUEUED",
        startAt,
      },
      select: {
        id: true,
      },
    });

    this.resume();

    return {
      status: "created",
      id: result.id,
      startAt,
    } as const;
  }
}

export async function trySubmitScheduledComments(
  db: PrismaClient,
  session: BrowserSession,
  accountId: string,
) {
  const now = new Date();
  while (true) {
    const comment = await db.userComment.findFirst({
      where: {
        accountId,
        commentedAt: null,
        autoCommentError: null,
        OR: [
          {
            schedulePostAt: {
              lte: now,
            },
          },
          {
            schedulePostAt: null,
          },
        ],
      },
      orderBy: {
        schedulePostAt: "asc",
      },
    });

    if (comment === null) {
      break;
    }

    const result = await session.commentOnPost(
      comment.postUrn,
      comment.comment,
    );

    if (result.status === "error") {
      console.error(`Failed to post comment on ${comment.postUrn}`);
      await db.userComment.updateMany({
        where: {
          id: comment.id,
        },
        data: {
          autoCommentError: result.reason,
        },
      });
    } else {
      await db.userComment.updateMany({
        where: {
          id: comment.id,
        },
        data: {
          commentedAt: new Date(),
        },
      });
    }
  }

  return {
    status: "complete",
    session,
  } as const;
}

async function getAutocommentParamsWithFallback(
  db: PrismaClient,
  accountId: string,
) {
  const userConfig = await db.autoCommentConfig.findFirst({
    where: {
      accountId,
    },
    include: {
      commentStyle: true,
    },
  });

  // TODO: in the future we want to make the frontend check for blacklisted profiles at every comment
  // instead of passing this list of blacklisted authors to the caller
  const blacklisted = userConfig?.blacklistEnabled
    ? await db.blacklistedProfile.findMany({
        where: {
          accountId,
        },
      })
    : [];

  let styleGuide: string | undefined = undefined;

  // if a custom comment style is selected, use that
  if (userConfig?.commentStyle) {
    styleGuide = userConfig.commentStyle.prompt;
  }

  // if not fallback to defaultCommentStyle if provided by user
  if (styleGuide === undefined) {
    if (
      userConfig?.defaultCommentStyle &&
      userConfig.defaultCommentStyle in DEFAULT_STYLE_GUIDES
    ) {
      styleGuide =
        DEFAULT_STYLE_GUIDES[
          userConfig.defaultCommentStyle as keyof typeof DEFAULT_STYLE_GUIDES
        ].prompt;
    }
  }

  // if still undefined, use PROFESSIONAL as default
  styleGuide ??= DEFAULT_STYLE_GUIDES.PROFESSIONAL.prompt;

  return {
    styleGuide,
    ...autoCommentConfigurationDefaults,
    ...(userConfig !== null
      ? transformValuesIfMatch(userConfig, {
          from: null,
          to: undefined,
        })
      : {}),
    blacklistAuthors: blacklisted.map((b) => b.profileUrn),
  };
}

export async function tryRunAutocomment(
  db: PrismaClient,
  session: BrowserSession,
  accountId: string,
) {
  while (true) {
    const pendingRun = await db.autoCommentRun.findFirst({
      where: {
        accountId,
        scheduledAt: {
          lte: new Date(),
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    if (pendingRun === null) {
      break;
    }

    const config = await getAutocommentParamsWithFallback(db, accountId);

    try {
      const result = await session.startAutoCommenting({
        autoCommentRunId: pendingRun.id,
        ...config,
      });

      if (result.status === "errored") {
        await db.autoCommentRun.update({
          where: { id: pendingRun.id },
          data: {
            status: "errored",
            error: result.error,
            endedAt: new Date(),
          },
        });
        return {
          status: "error",
          message: result.error,
        } as const;
      }

      return {
        status: "success",
      } as const;
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      await db.autoCommentRun.update({
        where: { id: pendingRun.id },
        data: {
          status: "errored",
          error: errMessage,
          endedAt: new Date(),
        },
      });

      return {
        status: "error",
        message: errMessage,
      } as const;
    }
  }
}

export class BrowserJobRegistry<
  TWorkerContext = unknown,
  TJobContext = unknown,
> extends Map<
  string,
  (ctx: TWorkerContext, jobCtx: TJobContext) => Promise<void>
> {
  public register(
    job: (ctx: TWorkerContext, jobCtx: TJobContext) => Promise<void>,
  ) {
    if (this.has(job.name)) {
      throw new Error(`Job with name ${job.name} is already registered`);
    }
    this.set(job.name, job);
  }
}

export interface WorkerContext {
  db: PrismaClient;
  browserRegistry: BrowserSessionRegistry;
}

export interface JobContext {
  session: BrowserSession;
  accountId: string;
}

export const browserJobRegistry = new BrowserJobRegistry<
  WorkerContext,
  JobContext
>();

export const browserJobs = new BrowserJobWorker<WorkerContext, JobContext>({
  hyperbrowser,
  db,
  browserRegistry,
  jobRegistry: browserJobRegistry,
  createJobContextFactory: async (ctx, accountId) => {
    const account = await ctx.db.linkedInAccount.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        location: true,
        browserProfileId: true,
      },
    });

    if (account === null) {
      throw new Error("LinkedIn account not found");
    }

    const session = new BrowserSession(ctx.db, ctx.browserRegistry, accountId, {
      location: account.location as ProxyLocation,
      browserProfileId: account.browserProfileId,
      liveviewViewOnlyMode: process.env.NODE_ENV === "production",
    });

    await session.ready;

    return {
      accountId,
      session,
    };
  },
  onJobCompleted: async (_, jobCtx) => {
    await jobCtx.session.destroy();
  },
});

export function registerJobs(
  browserJobRegistry: BrowserJobRegistry<WorkerContext, JobContext>,
) {
  browserJobRegistry.register(async (ctx, jobCtx) => {
    await trySubmitScheduledComments(ctx.db, jobCtx.session, jobCtx.accountId);
  });

  browserJobRegistry.register(async (ctx, jobCtx) => {
    await tryRunAutocomment(ctx.db, jobCtx.session, jobCtx.accountId);
  });
}
