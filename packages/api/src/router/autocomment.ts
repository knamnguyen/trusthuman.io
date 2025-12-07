import { ulid } from "ulidx";
import z from "zod";

import type { PrismaClient } from "@sassy/db";
import type { StartAutoCommentingParams } from "@sassy/validators";
import {
  autoCommentConfigurationDefaults,
  DEFAULT_STYLE_GUIDES,
} from "@sassy/feature-flags";

import type { ProxyLocation } from "../utils/browser-session";
// import {
//   userCreateSchema,
//   userUpdateSchema,
// } from "@sassy/db/schema-validators";

import { protectedProcedure } from "../trpc";
import { browserRegistry, BrowserSession } from "../utils/browser-session";
import { chunkify, transformValuesIfMatch } from "../utils/commons";
import { paginate } from "../utils/pagination";

export const autoCommentRouter = {
  runs: protectedProcedure
    .input(
      z
        .object({
          cursor: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // before returning to users here, just do a registry check and update status if stale
      const runs = await ctx.db.autoCommentRun.findMany({
        where: { userId: ctx.user.id },
        orderBy: { id: "desc" },
        cursor: input?.cursor ? { id: input.cursor } : undefined,
        take: 20,
      });

      const toUpdate: {
        id: string;
        // if browser registry has no session we can assume its errored out
        // else if run.status is pending and registry does not have session means its some non-graceful exit
        status: "errored";
      }[] = [];

      for (const run of runs) {
        if (
          run.status === "pending" &&
          !(await BrowserSession.isInstanceRunning(ctx.db, run.accountId))
        ) {
          toUpdate.push({
            id: run.id,
            status: "errored",
          });
          // just mutate it here and update asynchronously later
          run.status = "errored";
        }
      }

      // technically wont exceed parameter limits but just to be safe chunk it
      for (const chunk of chunkify(toUpdate, 500)) {
        // try to upsert many here at once bcs we dont wanna have so many damn roundtrips
        void ctx.db.autoCommentRun.updateMany({
          where: {
            id: {
              in: chunk.map((u) => u.id),
            },
          },
          data: {
            status: "errored",
          },
        });
      }

      return paginate(runs, {
        key: "id",
        size: 20,
      });
    }),
  run: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const run = await ctx.db.autoCommentRun.findUnique({
        where: {
          id: input.id,
        },
      });

      return run;
    }),
  comments: protectedProcedure
    .input(
      z.object({
        runId: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const comments = await ctx.db.userComment.findMany({
        where: {
          userId: ctx.user.id,
          autoCommentRunId: input.runId,
        },
        orderBy: {
          id: "desc",
        },
        take: 51,
      });

      return paginate(comments, {
        key: "id",
        size: 50,
      });
    }),
  saveComments: protectedProcedure
    .input(
      z
        .object({
          comment: z.string(),
          postContentHtml: z.string().nullable(),
          autoCommentRunId: z.string().optional(),
          urn: z.string(),
          hash: z.string().nullable(),
          isDuplicate: z.boolean().default(false),
          isAutoCommented: z.boolean().default(true),
          commentedAt: z.date().optional(),
          hitlMode: z.boolean().optional(),
        })
        .array()
        .min(1),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const result = await ctx.db.userComment.createMany({
        data: input.map((row) => ({
          id: ulid(),
          urn: row.urn,
          userId: ctx.user.id,
          autoCommentRunId: row.autoCommentRunId,
          hash: row.hash,
          comment: row.comment,
          postContentHtml: row.postContentHtml,
          // if hitlmode is true we leave commentedAt as null to indicate that the comment is still pending human review
          commentedAt: row.hitlMode === true ? null : (row.commentedAt ?? now),
          isDuplicate: row.isDuplicate,
          isAutoCommented: row.isAutoCommented,
        })),
        skipDuplicates: true,
      });

      return {
        status: "success",
        inserted: result.count,
      } as const;
    }),

  pending: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const comments = await ctx.db.userComment.findMany({
        where: {
          userId: ctx.user.id,
          commentedAt: null,
          id: {
            gt: input.cursor,
          },
        },
        orderBy: {
          id: "asc",
        },
      });

      return paginate(comments, {
        key: "id",
        size: 20,
      });
    }),

  editComment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        comment: z.string(),
        schedulePostAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.userComment.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        select: {
          commentedAt: true,
        },
      });

      if (comment === null) {
        return {
          status: "error",
          code: 404,
          message: "Comment not found",
        } as const;
      }

      if (comment.commentedAt !== null) {
        return {
          status: "error",
          code: 400,
          message: "Cannot edit a comment that has already been posted",
        } as const;
      }

      await ctx.db.userComment.updateMany({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        data: {
          comment: input.comment,
          schedulePostAt: input.schedulePostAt,
        },
      });

      // should technically be accountId instead of userId
      void trySubmitScheduledComments(ctx.db, ctx.user.id);

      return {
        status: "success",
      } as const;
    }),

  postComment: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.userComment.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        select: {
          commentedAt: true,
          accountId: true,
        },
      });

      if (comment === null) {
        return {
          status: "error",
          code: 404,
          message: "Comment not found",
        } as const;
      }

      if (comment.commentedAt !== null) {
        return {
          status: "error",
          code: 400,
          message: "Comment has already been posted",
        } as const;
      }

      // just set schedulePostAt to now to indicate it should be posted immediately
      await ctx.db.userComment.updateMany({
        where: {
          id: input.id,
        },
        data: {
          schedulePostAt: new Date(),
        },
      });

      // TODO: accountId has to be non-null
      // this will be fixed once we implement the 1-to-1 account linking flow
      void trySubmitScheduledComments(ctx.db, comment.accountId);

      return {
        status: "success",
      } as const;
    }),

  hasCommentedBefore: protectedProcedure
    .input(
      z.object({
        urns: z.string().array(),
        hashes: z.string().array(),
        duplicateWindow: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const clause = [];

      if (input.urns.length > 0) {
        clause.push({
          urn: { in: input.urns },
        } as const);
      }

      if (input.hashes.length > 0) {
        clause.push({
          hash: { in: input.hashes },
        } as const);
      }

      let commentedBefore: Date | undefined = undefined;
      if (input.duplicateWindow !== undefined) {
        commentedBefore = new Date(
          Date.now() - input.duplicateWindow * 60 * 60 * 1000,
        );
      }

      const comments = await ctx.db.userComment.findMany({
        where: {
          AND: [
            { OR: clause },
            commentedBefore
              ? {
                  commentedAt: { lt: commentedBefore, not: null },
                }
              : {},
            {
              OR: [
                { userId: ctx.user.id },
                ...(ctx.account !== null
                  ? [
                      {
                        accountId: ctx.account.id,
                      },
                    ]
                  : []),
              ],
            },
          ],
        },
        select: { urn: true },
      });

      const commentedUrns = new Set(comments.map((comment) => comment.urn));

      return {
        uncommentedUrns: input.urns.filter((urn) => !commentedUrns.has(urn)),
      } as const;
    }),

  start: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.linkedInAccount.findUnique({
        where: { id: input.accountId, userId: ctx.user.id },
        select: {
          id: true,
          location: true,
          browserProfileId: true,
        },
      });

      if (account === null) {
        return {
          status: "error",
          code: 400,
          message: "LinkedIn account not found",
        } as const;
      }

      const runId = ulid();

      const anySessionRunning = await BrowserSession.isAnySessionRunning(
        ctx.db,
        account.id,
      );

      if (anySessionRunning) {
        return {
          status: "error",
          code: 429,
          message: "Another action is currently running on this account.",
        } as const;
      }

      void startAutoComment(ctx.db, runId, ctx.user.id, input.accountId);

      return {
        status: "success",
        runId,
      } as const;
    }),

  stop: protectedProcedure
    .input(
      z.object({
        autoCommentRunId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const autoCommentRun = await ctx.db.autoCommentRun.findUnique({
        where: { id: input.autoCommentRunId },
      });

      // if autocomment is not made by user or not found, return error
      if (autoCommentRun === null || autoCommentRun.userId !== ctx.user.id) {
        return {
          status: "error",
          code: 404,
          message: "Auto comment run not found",
        } as const;
      }

      if (autoCommentRun.status !== "pending") {
        return {
          status: "success",
          message: "auto commenting already stopped",
        } as const;
      }

      const session = browserRegistry.get(autoCommentRun.accountId);

      if (session === undefined) {
        return {
          status: "error",
          code: 400,
          message: "No active browser session found",
        } as const;
      }

      await session.stopAutoCommenting();

      await ctx.db.autoCommentRun.update({
        where: { id: input.autoCommentRunId },
        data: { status: "terminated", endedAt: new Date() },
      });

      return {
        status: "success",
      } as const;
    }),

  configuration: {
    save: protectedProcedure
      .input(
        z.object({
          linkedInAccountId: z.string(),
          scrollDuration: z.number(),
          commentDelay: z.number(),
          defaultCommentStyle: z.string().nullish(),
          commentStyleId: z.string().nullish(),
          targetListId: z.string().nullish(),
          duplicateWindow: z.number(),
          commentAsCompanyEnabled: z.boolean().optional(),
          timeFilterEnabled: z.boolean().optional(),
          minPostAge: z.number().optional(),
          manualApproveEnabled: z.boolean().optional(),
          maxPosts: z.number(),
          finishListModeEnabled: z.boolean().optional(),
          authenticityBoostEnabled: z.boolean().optional(),
          commentProfileName: z.string().optional(),
          languageAwareEnabled: z.boolean().optional(),
          skipCompanyPagesEnabled: z.boolean().optional(),
          blacklistEnabled: z.boolean().optional(),
          skipPromotedPostsEnabled: z.boolean().optional(),
          skipFriendsActivitiesEnabled: z.boolean().optional(),
          hitlMode: z.boolean().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const account = await ctx.db.linkedInAccount.findUnique({
          where: {
            id: input.linkedInAccountId,
          },
        });

        if (account?.userId !== ctx.user.id) {
          return {
            status: "error",
            code: 403,
            message:
              "You do not have permission to modify this account's configuration",
          } as const;
        }
        await ctx.db.autoCommentConfig.upsert({
          where: {
            accountId: input.linkedInAccountId,
          },
          create: {
            userId: ctx.user.id,
            accountId: input.linkedInAccountId,
            scrollDuration: input.scrollDuration,
            commentDelay: input.commentDelay,
            maxPosts: input.maxPosts,
            finishListModeEnabled: input.finishListModeEnabled ?? false,
            duplicateWindow: input.duplicateWindow,
            commentAsCompanyEnabled: input.commentAsCompanyEnabled ?? false,
            defaultCommentStyle: input.defaultCommentStyle ?? null,
            timeFilterEnabled: input.timeFilterEnabled ?? false,
            commentStyleId: input.commentStyleId ?? null,
            targetListId: input.targetListId ?? null,
            minPostAge: input.minPostAge,
            manualApproveEnabled: input.manualApproveEnabled ?? false,
            authenticityBoostEnabled: input.authenticityBoostEnabled ?? false,
            commentProfileName: input.commentProfileName,
            languageAwareEnabled: input.languageAwareEnabled ?? false,
            skipCompanyPagesEnabled: input.skipCompanyPagesEnabled ?? false,
            blacklistEnabled: input.blacklistEnabled ?? false,
            skipPromotedPostsEnabled: input.skipPromotedPostsEnabled ?? false,
            skipFriendActivitiesEnabled:
              input.skipFriendsActivitiesEnabled ?? false,
            hitlMode: input.hitlMode ?? false,
          },
          update: {
            scrollDuration: input.scrollDuration,
            commentDelay: input.commentDelay,
            commentStyleId: input.commentStyleId ?? null,
            targetListId: input.targetListId ?? null,
            maxPosts: input.maxPosts,
            finishListModeEnabled: input.finishListModeEnabled ?? false,
            defaultCommentStyle: input.defaultCommentStyle ?? null,
            duplicateWindow: input.duplicateWindow,
            commentAsCompanyEnabled: input.commentAsCompanyEnabled,
            timeFilterEnabled: input.timeFilterEnabled,
            minPostAge: input.minPostAge,
            manualApproveEnabled: input.manualApproveEnabled,
            authenticityBoostEnabled: input.authenticityBoostEnabled,
            commentProfileName: input.commentProfileName,
            languageAwareEnabled: input.languageAwareEnabled,
            skipCompanyPagesEnabled: input.skipCompanyPagesEnabled,
            blacklistEnabled: input.blacklistEnabled,
            skipPromotedPostsEnabled: input.skipPromotedPostsEnabled,
            skipFriendActivitiesEnabled: input.skipFriendsActivitiesEnabled,
            hitlMode: input.hitlMode ?? false,
          },
        });

        return {
          status: "success",
        } as const;
      }),
    load: protectedProcedure
      .input(
        z.object({
          linkedInAccountId: z.string(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const config = await ctx.db.autoCommentConfig.findUnique({
          where: {
            accountId: input.linkedInAccountId,
          },
        });

        return config;
      }),
  },

  addCommentStyle: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        prompt: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = ulid();
      await ctx.db.commentStyle.create({
        data: {
          id,
          userId: ctx.user.id,
          name: input.name,
          prompt: input.prompt,
        },
      });

      return {
        status: "success",
        id,
      } as const;
    }),

  listCommentStyles: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereClause = [];
      whereClause.push({ userId: ctx.user.id });
      if (input.cursor) {
        whereClause.push({ id: { lt: input.cursor } });
      }
      const styles = await ctx.db.commentStyle.findMany({
        where: {
          OR: whereClause,
        },
        orderBy: { id: "desc" },
        take: 21,
      });

      return paginate(styles, { key: "id", size: 20 });
    }),

  deleteCommentStyle: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.commentStyle.deleteMany({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
      });

      return {
        status: "success",
      } as const;
    }),

  updateCommentStyle: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        prompt: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.commentStyle.updateMany({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
        data: {
          name: input.name,
          prompt: input.prompt,
        },
      });

      return {
        status: "success",
      } as const;
    }),
};

export async function trySubmitScheduledComments(
  db: PrismaClient,
  accountId: string,
) {
  const now = new Date();

  const accout = await db.linkedInAccount.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      location: true,
      browserProfileId: true,
    },
  });

  if (accout === null) {
    return {
      status: "account_not_found",
    } as const;
  }

  const anySessionRunning = await BrowserSession.isInstanceRunning(
    db,
    accountId,
  );

  if (anySessionRunning === true) {
    return {
      status: "some_session_running",
    } as const;
  }

  const session = new BrowserSession(db, accountId, {
    location: accout.location as ProxyLocation,
    browserProfileId: accout.browserProfileId,
    liveviewViewOnlyMode: process.env.NODE_ENV === "production",
  });

  await session.ready;

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
  } as const;
}

async function startAutoComment(
  db: PrismaClient,
  runId: string,
  userId: string,
  accountId: string,
  params?: StartAutoCommentingParams,
) {
  const account = await db.linkedInAccount.findFirst({
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
      message: "LinkedIn account not found",
    } as const;
  }

  const browserSession = new BrowserSession(db, accountId, {
    location: account.location as ProxyLocation,
    browserProfileId: account.browserProfileId,
    liveviewViewOnlyMode: process.env.NODE_ENV === "production",
  });

  await browserSession.ready;

  const [autoCommentRun, autocommentConfig] = await Promise.all([
    db.autoCommentRun.create({
      data: {
        // use ulid here because we wanna paginate by creation time + id
        id: runId,
        userId,
        accountId,
        status: "pending",
        liveUrl: browserSession.liveUrl,
      },
      select: {
        id: true,
      },
    }),
    db.autoCommentConfig.findFirst({
      where: { accountId },
      include: {
        commentStyle: true,
      },
    }),
  ]);

  let styleGuide: string | undefined = undefined;

  // if a custom comment style is selected, use that
  if (autocommentConfig?.commentStyle) {
    styleGuide = autocommentConfig.commentStyle.prompt;
  }

  // if not fallback to defaultCommentStyle if provided by user
  if (styleGuide === undefined) {
    if (
      autocommentConfig?.defaultCommentStyle &&
      autocommentConfig.defaultCommentStyle in DEFAULT_STYLE_GUIDES
    ) {
      styleGuide =
        DEFAULT_STYLE_GUIDES[
          autocommentConfig.defaultCommentStyle as keyof typeof DEFAULT_STYLE_GUIDES
        ].prompt;
    }
  }

  // if still undefined, use PROFESSIONAL as default
  styleGuide ??= DEFAULT_STYLE_GUIDES.PROFESSIONAL.prompt;

  const blacklisted = autocommentConfig?.blacklistEnabled
    ? await db.blacklistedProfile.findMany({
        where: {
          accountId,
        },
      })
    : [];

  try {
    const result = await browserSession.startAutoCommenting({
      autoCommentRunId: autoCommentRun.id,
      styleGuide,
      ...autoCommentConfigurationDefaults,
      ...(autocommentConfig !== null
        ? transformValuesIfMatch(autocommentConfig, {
            from: null,
            to: undefined,
          })
        : {}),
      ...params,
      blacklistAuthors: blacklisted.map((b) => b.profileUrn),
    });

    if (result.status === "errored") {
      await db.autoCommentRun.update({
        where: { id: autoCommentRun.id },
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
      liveUrl: browserSession.liveUrl,
      runId: autoCommentRun.id,
    } as const;
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    await db.autoCommentRun.update({
      where: { id: autoCommentRun.id },
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
