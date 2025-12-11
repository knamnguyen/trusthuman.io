import type { Hyperbrowser } from "@hyperbrowser/sdk";
import { ulid } from "ulidx";

import type { PrismaClient } from "@sassy/db";

import type { ProxyLocation } from "./browser-session";
import { getAutocommentParamsWithFallback } from "../router/autocomment";
import { BrowserSession } from "./browser-session";
import { Semaphore } from "./mutex";

export class BrowserJobWorker {
  private waiter = Promise.withResolvers();
  private readonly MAX_CONCURRENT_SESSIONS = 25;
  private semaphore = new Semaphore(this.MAX_CONCURRENT_SESSIONS);

  constructor(
    private readonly hyperbrowser: Hyperbrowser,
    private readonly db: PrismaClient,
  ) {}

  async numSessionsRunning() {
    const sessions = await this.hyperbrowser.sessions.list({ limit: 1 });
    return sessions.totalCount;
  }

  async processJob(jobId: string, accountId: string) {
    try {
      await this.db.browserJob.update({
        where: { id: jobId },
        data: {
          status: "RUNNING",
        },
      });

      const session = await startSession(this.db, accountId);

      if (session.status === "error") {
        throw new Error(`Failed to start session: ${session.reason}`);
      }

      await trySubmitScheduledComments(session.instance, this.db, accountId);
      await tryRunAutocomment(session.instance, this.db, accountId);
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

  async work() {
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

        void this.processJob(job.id, job.accountId).finally(() => {
          this.semaphore.release();
        });
      }

      await this.sleep;
    }
  }

  resume() {
    const resolve = this.waiter.resolve;
    this.waiter = Promise.withResolvers();
    resolve();
  }

  get sleep() {
    return this.waiter.promise;
  }

  async queue(accountId: string, startAt = new Date()) {
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
}

async function tryRunAutocomment(
  session: BrowserSession,
  db: PrismaClient,
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

async function startSession(db: PrismaClient, accountId: string) {
  const account = await db.linkedInAccount.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      location: true,
      browserProfileId: true,
    },
  });

  if (account === null) {
    return {
      status: "error",
      reason: "account_not_found",
    } as const;
  }

  const session = new BrowserSession(db, accountId, {
    location: account.location as ProxyLocation,
    browserProfileId: account.browserProfileId,
    liveviewViewOnlyMode: process.env.NODE_ENV === "production",
  });

  await session.ready;

  return {
    status: "success",
    instance: session,
  } as const;
}

async function trySubmitScheduledComments(
  session: BrowserSession,
  db: PrismaClient,
  accountId: string,
) {
  const now = new Date();
  while (true) {
    const comment = await db.userComment.findFirst({
      where: {
        accountId,
        commentedAt: null,
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

    const result = await session.commentOnPost(comment.urn, comment.comment);

    if (result.status === "error") {
      console.error(`Failed to post comment on ${comment.urn}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    await db.userComment.updateMany({
      where: {
        id: comment.id,
      },
      data: {
        commentedAt: new Date(),
      },
    });
  }

  return {
    status: "complete",
    session,
  } as const;
}
