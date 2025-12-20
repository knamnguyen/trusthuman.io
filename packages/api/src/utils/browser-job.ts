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
  private sleepResolver: {
    resolve: () => void;
    promise: Promise<void>;
    timeoutId: ReturnType<typeof setTimeout> | null;
  } | null = null;
  private readonly maxConcurrentSessions: number;
  private semaphore: Semaphore;
  private readonly db: PrismaClient;
  private readonly hyperbrowser: Hyperbrowser;
  private readonly jobRegistry: BrowserJobRegistry<TWorkerContext, TJobContext>;
  private readonly createJobContext: (
    ctx: NoInfer<TWorkerContext>,
    accountId: string,
  ) => Promise<TJobContext> | TJobContext;
  private readonly onJobCompleted?: (
    ctx: NoInfer<TWorkerContext>,
    jobCtx: TJobContext,
  ) => Promise<void> | void;

  constructor({
    hyperbrowser,
    db,
    jobRegistry,
    createJobContext,
    onJobCompleted,
    maxConcurrentJobs,
  }: {
    readonly hyperbrowser: Hyperbrowser;
    readonly db: PrismaClient;
    readonly browserRegistry: BrowserSessionRegistry;
    readonly jobRegistry: BrowserJobRegistry<TWorkerContext, TJobContext>;
    readonly createJobContext: (
      ctx: NoInfer<TWorkerContext>,
      accountId: string,
    ) => Promise<TJobContext> | TJobContext;
    readonly onJobCompleted?: (
      ctx: NoInfer<TWorkerContext>,
      jobCtx: TJobContext,
    ) => Promise<void> | void;
    readonly maxConcurrentJobs?: number;
  }) {
    this.hyperbrowser = hyperbrowser;
    this.db = db;
    this.jobRegistry = jobRegistry;
    this.createJobContext = createJobContext;
    this.onJobCompleted = onJobCompleted;
    this.maxConcurrentSessions = maxConcurrentJobs ?? 25;
    this.semaphore = new Semaphore(this.maxConcurrentSessions);
  }

  private async numSessionsRunning() {
    const sessions = await this.hyperbrowser.sessions.list({ limit: 1 });
    return sessions.totalCount;
  }

  async processJob(ctx: TWorkerContext, jobId: string) {
    try {
      const result = await this.db.browserJob.update({
        where: { id: jobId },
        data: {
          status: "RUNNING",
        },
        select: {
          accountId: true,
        },
      });

      const jobContext = await this.createJobContext(ctx, result.accountId);

      console.info("running functions");

      for (const job of this.jobRegistry.values()) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        await safe(() => job(ctx, jobContext));
      }

      try {
        await this.onJobCompleted?.(ctx, jobContext);
      } catch (error) {
        console.error(
          `Error in onJobCompleted for browser job ${jobId}:`,
          error,
        );
      }
    } catch (error) {
      await this.db.browserJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : String(error),
        },
      });
      console.error(`Browser job ${jobId} failed:`, error);
      return;
    } finally {
      await this.db.browserJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
        },
      });
    }
  }

  async work(ctx: TWorkerContext) {
    while (true) {
      const job = await this.db.browserJob.findFirst({
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
        continue;
      }

      const nextJob = await this.db.browserJob.findFirst({
        where: {
          status: "QUEUED",
        },
        orderBy: {
          startAt: "asc",
        },
      });

      // wait till next job or just wait indefinitely untill resumed
      await this.waitForJob(nextJob?.startAt);
    }
  }

  private resume() {
    if (this.sleepResolver === null) return;
    this.sleepResolver.resolve();
    if (this.sleepResolver.timeoutId !== null) {
      clearTimeout(this.sleepResolver.timeoutId);
    }
    this.sleepResolver = null;
  }

  private waitForJob(until?: Date) {
    if (this.sleepResolver !== null) {
      if (this.sleepResolver.timeoutId !== null)
        clearTimeout(this.sleepResolver.timeoutId);
      this.sleepResolver.resolve();
    }

    const resolver = Promise.withResolvers<void>();

    this.sleepResolver = {
      promise: resolver.promise,
      resolve: resolver.resolve,
      timeoutId:
        until !== undefined
          ? setTimeout(
              () => {
                resolver.resolve();
                this.sleepResolver = null;
              },
              Math.max(0, until.getTime() - Date.now()),
            )
          : null,
    };

    return resolver.promise;
  }

  private sleep(delayMs: number, signal?: AbortSignal) {
    return new Promise<"woke" | "aborted">((resolve) => {
      const timeoutId = setTimeout(() => resolve("woke"), delayMs);
      if (signal === undefined) return;

      const abortHandler = () => {
        resolve("aborted");
        clearTimeout(timeoutId);
        signal.removeEventListener("abort", abortHandler);
      };

      signal.addEventListener("abort", abortHandler);
    });
  }

  async tryQueue(accountId: string, startAt = new Date()) {
    const existing = await this.db.browserJob.findFirst({
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

    const result = await this.db.browserJob.create({
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

  public async scheduleJobsEvery(
    startAt: Date,
    intervalMs: number,
    signal?: AbortSignal,
  ) {
    const initialDelay = startAt.getTime() - Date.now();
    if (initialDelay > 0) {
      const status = await this.sleep(initialDelay, signal);
      if (status === "aborted") {
        return;
      }
    }

    while (true) {
      try {
        await this.enqueueJobs();
        this.resume();
      } catch (error) {
        console.error("Error enqueueing browser jobs:", error);
      }

      const status = await this.sleep(intervalMs, signal);
      if (status === "aborted") {
        return;
      }
    }
  }

  private async enqueueJobs(now: Date = new Date()) {
    const BATCH_SIZE = 20;

    let cursor = null as string | null;

    while (true) {
      // this is not thread safe and might get deadlocked if multiple workers run this function at the same time
      const result = await this.db.$transaction(async (tx) => {
        // selecting accounts that have autocomment enabled and are active
        // and do not have a queued browser job already
        const accounts = await tx.$queryRaw<
          { id: string; runDailyAt: string }[]
        >`
          select id, "runDailyAt" from "LinkedInAccount"
          where "autocommentEnabled" = true
            and "LinkedInAccount".status = 'ACTIVE'
            and "runDailyAt" is not null
            and not exists (
              select 1 from "BrowserJob"
              where "BrowserJob"."accountId" = "LinkedInAccount".id
                and "BrowserJob".status = 'QUEUED'
            )
            and (
              ${cursor}::text is null 
              or id >= ${cursor}
            )
          order by id
          limit ${BATCH_SIZE + 1}
        `; // the ::bigint cast is needed to make sure no "ERROR: could not determine data type of parameter" error

        if (accounts.length === 0) {
          return {
            next: null,
          };
        }

        await tx.browserJob.createMany({
          data: accounts.slice(0, BATCH_SIZE).map((account) => {
            const [hours, minutes] = account.runDailyAt.split(":").map(Number);
            const scheduledAt = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              hours,
              minutes,
              0,
              0,
            );
            if (scheduledAt < now) {
              scheduledAt.setDate(scheduledAt.getDate() + 1);
            }

            return {
              id: ulid(),
              accountId: account.id,
              status: "QUEUED",
              startAt: scheduledAt,
            };
          }),
        });

        return {
          next:
            accounts.length > BATCH_SIZE
              ? (accounts[BATCH_SIZE - 1]?.id ?? null)
              : null,
        };
      });

      if (result.next === null) {
        return;
      }

      cursor = result.next;
    }
  }
}

export class BrowserJobRegistry<
  TWorkerContext = unknown,
  TJobContext = unknown,
> extends Map<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ctx: TWorkerContext, jobCtx: TJobContext) => any
> {
  public register<T>(job: (ctx: TWorkerContext, jobCtx: TJobContext) => T) {
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
  createJobContext: async (ctx, accountId) => {
    const account = await ctx.db.linkedInAccount.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        location: true,
        browserProfileId: true,
        status: true,
      },
    });

    if (account === null) {
      throw new Error("LinkedIn account not found");
    }

    if (account.status !== "ACTIVE") {
      throw new Error("LinkedIn account is not active");
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

browserJobRegistry.register(async function tryRunAutocomment(
  { db },
  { accountId, session },
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
      await db.linkedInAccount.update({
        where: { id: accountId },
        data: {
          isRunning: true,
        },
      });

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
    } finally {
      await db.linkedInAccount.update({
        where: { id: accountId },
        data: {
          isRunning: false,
        },
      });
    }
  }
});

browserJobRegistry.register(async function trySubmitScheduledComments(
  { db },
  { session, accountId },
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
});
