import { ulid } from "ulidx";
import z from "zod";

import type { PrismaClient } from "@sassy/db";
import type { StartAutoCommentingParams } from "@sassy/validators";
import {
  autoCommentConfigurationDefaults,
  DEFAULT_STYLE_GUIDES,
} from "@sassy/feature-flags";

import type {
  BrowserSessionRegistry,
  ProxyLocation,
} from "../utils/browser-session/browser-session";
import { createTRPCRouter, protectedProcedure } from "../trpc";
// import {
//   userCreateSchema,
//   userUpdateSchema,
// } from "@sassy/db/schema-validators";

import { BrowserSession } from "../utils/browser-session/browser-session";
import { chunkify, transformValuesIfMatch } from "../utils/commons";
import { paginate } from "../utils/pagination";
import { hasPermissionToAccessAccount } from "./account";

export const autoCommentRouter = () =>
  createTRPCRouter({
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
        const comments = await ctx.db.comment.findMany({
          where: {
            accountId: ctx.user.id,
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
        z.object({
          comment: z.string(),
          postFullCaption: z.string(),
          autoCommentRunId: z.string().optional(),
          postUrl: z.string(),
          postCreatedAt: z.date().optional(),
          postComments: z
            .array(
              z.object({
                authorName: z.string().nullable(),
                authorHeadline: z.string().nullable(),
                authorProfileUrl: z.string().nullable(),
                authorPhotoUrl: z.string().nullable(),
                content: z.string().nullable(),
                urn: z.string().nullable(),
                isReply: z.boolean(),
              }),
            )
            .optional(),
          postAlternateUrns: z.string().array().optional(),
          authorName: z.string().optional(),
          authorProfileUrl: z.string().optional(),
          authorAvatarUrl: z.string().optional(),
          schedulePostAt: z.date().optional(),
          authorHeadline: z.string().optional(),
          isDuplicate: z.boolean().default(false),
          isAutoCommented: z.boolean().default(true),
          commentedAt: z.date().optional(),
          hitlMode: z.boolean().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.activeAccount === null) {
          return {
            status: "error",
            code: 400,
            message:
              "You must have a Linked In Account registered to save comments.",
          } as const;
        }

        const result = await ctx.db.comment.createMany({
          data: {
            id: ulid(),
            postUrl: input.postUrl,
            postFullCaption: input.postFullCaption,
            postCreatedAt: input.postCreatedAt,

            postComments: input.postComments,

            authorName: input.authorName,
            authorHeadline: input.authorHeadline,
            authorProfileUrl: input.authorProfileUrl,
            authorAvatarUrl: input.authorAvatarUrl,
            comment: input.comment,
            postAlternateUrns: input.postAlternateUrns,
            commentedAt: input.hitlMode === true ? null : input.commentedAt,
            isAutoCommented: input.isAutoCommented,
            schedulePostAt: input.schedulePostAt,

            accountId: ctx.activeAccount.id,

            autoCommentRunId: input.autoCommentRunId,
            // if hitlmode is true we leave commentedAt as null to indicate that the comment is still pending human review
          },
          skipDuplicates: true,
        });

        return {
          status: "success",
          inserted: result.count,
        } as const;
      }),

    // check if UserComment exists based on urns
    // return the non-existent ones along with the generated comments

    pending: protectedProcedure
      .input(
        z.object({
          cursor: z.string().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        if (ctx.activeAccount === null) {
          return paginate([], {
            key: "id",
            size: 20,
          });
        }

        const comments = await ctx.db.comment.findMany({
          where: {
            accountId: ctx.activeAccount.id,
            commentedAt: null,
            id: {
              gt: input.cursor,
            },
          },
          orderBy: {
            id: "asc",
          },
          take: 21,
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
        if (ctx.activeAccount === null) {
          return {
            status: "error",
            code: 400,
            message:
              "You must have a Linked In Account registered to edit comments.",
          } as const;
        }

        const comment = await ctx.db.comment.findFirst({
          where: {
            id: input.id,
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

        const canEdit = canEditComment(comment, ctx.activeAccount.id);
        if (canEdit.status === "denied") {
          return {
            status: "error",
            code: 403,
            message: canEdit.reason,
          } as const;
        }

        await ctx.db.comment.updateMany({
          where: {
            id: input.id,
          },
          data: {
            comment: input.comment,
            schedulePostAt: input.schedulePostAt,
          },
        });

        await ctx.browserJobs.tryQueue(ctx.user.id);

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
        if (ctx.activeAccount === null) {
          return {
            status: "error",
            code: 400,
            message:
              "You must have a Linked In Account registered to post comments.",
          } as const;
        }

        const comment = await ctx.db.comment.findFirst({
          where: {
            id: input.id,
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

        const canEdit = canEditComment(comment, ctx.activeAccount.id);
        if (canEdit.status === "denied") {
          return {
            status: "error",
            code: 403,
            message: canEdit.reason,
          } as const;
        }

        // just set schedulePostAt to now to indicate it should be posted immediately
        await ctx.db.comment.updateMany({
          where: {
            id: input.id,
          },
          data: {
            schedulePostAt: new Date(),
          },
        });

        await ctx.browserJobs.tryQueue(comment.accountId, new Date());

        return {
          status: "success",
        } as const;
      }),

    hasCommentedBefore: protectedProcedure
      .input(
        z.object({
          postUrns: z.string().array(),
          duplicateWindow: z.number().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        if (ctx.activeAccount === null) {
          return {
            status: "error",
            code: 400,
            message:
              "You must have a Linked In Account registered to check commented posts.",
          } as const;
        }

        const results = await filterCommentedUrns(ctx.db, {
          postUrns: input.postUrns,
          duplicateWindowSeconds: input.duplicateWindow,
          accountId: ctx.activeAccount.id,
        });

        return {
          status: "success",
          uncommentedUrns: results.uncommentedUrns,
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
          where: { id: input.accountId },
          select: {
            id: true,
            browserLocation: true,
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

        const permitted = await hasPermissionToAccessAccount(ctx.db, {
          actorUserId: ctx.user.id,
          accountId: account.id,
        });

        if (permitted === false) {
          return {
            status: "error",
            code: 403,
            message: "You do not have permission to access this account.",
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

        void startAutoComment(
          ctx.db,
          ctx.browserRegistry,
          runId,
          ctx.user.id,
          input.accountId,
        );

        return {
          status: "success",
          runId,
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
            select: {
              id: true,
            },
          });

          if (account === null) {
            return {
              status: "error",
              code: 400,
              message: "LinkedIn account not found",
            } as const;
          }

          const permitted = await hasPermissionToAccessAccount(ctx.db, {
            actorUserId: ctx.user.id,
            accountId: account.id,
          });

          if (permitted === false) {
            return {
              status: "error",
              code: 403,
              message: "You do not have permission to access this account.",
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
  });

export async function getAutocommentParamsWithFallback(
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
    styleGuide = userConfig.commentStyle.content;
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

async function startAutoComment(
  db: PrismaClient,
  browserRegistry: BrowserSessionRegistry,
  runId: string,
  userId: string,
  accountId: string,
  params?: StartAutoCommentingParams,
) {
  const account = await db.linkedInAccount.findFirst({
    where: { id: accountId },
    select: {
      id: true,
      browserLocation: true,
      browserProfileId: true,
      ownerId: true,
    },
  });

  if (account === null) {
    return {
      status: "error",
      message: "LinkedIn account not found",
    } as const;
  }

  const anySessionRunning = await BrowserSession.isAnySessionRunning(
    db,
    account.id,
  );

  if (anySessionRunning) {
    return {
      status: "error",
      message: "Another action is currently running on this account.",
    } as const;
  }

  const browserSession = new BrowserSession(
    db,
    browserRegistry,
    accountId,
    userId,
    {
      location: account.browserLocation as ProxyLocation,
      browserProfileId: account.browserProfileId,
      liveviewViewOnlyMode: process.env.NODE_ENV === "production",
    },
  );

  await browserSession.ready;

  const [autoCommentRun, autocommentConfig] = await Promise.all([
    db.autoCommentRun.create({
      data: {
        // use ulid here because we wanna paginate by creation time + id
        id: runId,
        accountId,
        status: "pending",
        scheduledAt: new Date(),
        liveUrl: browserSession.liveUrl,
      },
      select: {
        id: true,
      },
    }),
    getAutocommentParamsWithFallback(db, accountId),
  ]);

  try {
    const result = await browserSession.startAutoCommenting({
      autoCommentRunId: autoCommentRun.id,
      ...autocommentConfig,
      ...params,
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

export function canEditComment(
  comment: {
    accountId: string;
    commentedAt: Date | null;
  },
  currentAccountId: string,
) {
  if (comment.accountId !== currentAccountId) {
    return {
      status: "denied",
      reason: "You have no permission to edit this comment",
    } as const;
  }

  if (comment.commentedAt !== null) {
    return {
      status: "denied",
      reason: "Comment that has already been posted cannot be edited",
    } as const;
  }

  return {
    status: "granted",
  } as const;
}

async function filterCommentedUrns(
  db: PrismaClient,
  {
    postUrns,
    duplicateWindowSeconds,
    accountId,
  }: {
    postUrns: string[];
    duplicateWindowSeconds?: number;
    accountId: string;
  },
) {
  const clause = [];

  if (postUrns.length > 0) {
    clause.push({
      postUrl: { in: postUrns },
      postAlternateUrns: { hasSome: postUrns },
    } as const);
  }

  let commentedBeforeTime: Date | undefined = undefined;
  if (duplicateWindowSeconds !== undefined) {
    commentedBeforeTime = new Date(
      Date.now() - duplicateWindowSeconds * 60 * 60 * 1000,
    );
  }

  const comments = await db.comment.findMany({
    where: {
      AND: [
        { OR: clause },
        commentedBeforeTime
          ? {
              commentedAt: { lt: commentedBeforeTime, not: null },
            }
          : {},
        {
          accountId,
        },
      ],
    },
    select: { postUrl: true },
  });

  const commentedUrns = new Set(comments.map((comment) => comment.postUrl));

  return {
    status: "success",
    uncommentedUrns: postUrns.filter((urn) => !commentedUrns.has(urn)),
  } as const;
}
