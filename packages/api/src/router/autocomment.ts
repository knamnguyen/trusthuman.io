import { ulid } from "ulidx";
import z from "zod";

// import {
//   userCreateSchema,
//   userUpdateSchema,
// } from "@sassy/db/schema-validators";

import { protectedProcedure } from "../trpc";
import { browserRegistry } from "../utils/linkedin-browser-session";
import { paginate } from "../utils/pagination";
import { registerOrGetBrowserSession } from "./browser";

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
      const runs = await ctx.db.autoCommentRun.findMany({
        where: { userId: ctx.user.id },
        orderBy: { id: "desc" },
        cursor: input?.cursor ? { id: input.cursor } : undefined,
        take: 20,
      });

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
          commentedAt: row.commentedAt ?? now,
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

  hasCommentedBefore: protectedProcedure
    .input(
      z.object({
        urns: z.string().array(),
        hashes: z.string().array(),
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

      const comments = await ctx.db.userComment.findMany({
        where: {
          OR: clause,
        },
        select: { urn: true },
      });

      const commentedUrns = new Set(comments.map((comment) => comment.urn));

      return {
        uncommentedUrns: input.urns.filter((urn) => !commentedUrns.has(urn)),
      } as const;
    }),

  startAutoCommenting: protectedProcedure
    .input(
      z.object({
        linkedInAccountId: z.string(),
        scrollDuration: z.number(),
        commentDelay: z.number(),
        maxPosts: z.number(),
        styleGuide: z.string(),
        duplicateWindow: z.number(),
        commentAsCompanyEnabled: z.boolean().optional(),
        timeFilterEnabled: z.boolean().optional(),
        minPostAge: z.number().optional(),
        manualApproveEnabled: z.boolean().optional(),
        authenticityBoostEnabled: z.boolean().optional(),
        commentProfileName: z.string().optional(),
        languageAwareEnabled: z.boolean().optional(),
        skipCompanyPagesEnabled: z.boolean().optional(),
        blacklistEnabled: z.boolean().optional(),
        skipPromotedPostsEnabled: z.boolean().optional(),
        skipFriendsActivitiesEnabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const browserSession = await registerOrGetBrowserSession(
        ctx.db,
        ctx.user.id,
        input.linkedInAccountId,
      );

      if (browserSession.status === "error") {
        return browserSession;
      }

      const instance = browserSession.instance;

      const autoCommentRun = await ctx.db.autoCommentRun.create({
        data: {
          // use ulid here because we wanna paginate by creation time + id
          id: ulid(),
          userId: ctx.user.id,
          status: "pending",
        },

        select: {
          id: true,
        },
      });

      await instance.startAutoCommenting({
        autoCommentRunId: autoCommentRun.id,
        scrollDuration: input.scrollDuration,
        commentDelay: input.commentDelay,
        styleGuide: input.styleGuide,
        maxPosts: input.maxPosts,
        blacklistEnabled: input.blacklistEnabled,
        duplicateWindow: input.duplicateWindow,
        commentAsCompanyEnabled: input.commentAsCompanyEnabled,
        timeFilterEnabled: input.timeFilterEnabled,
        minPostAge: input.minPostAge,
        manualApproveEnabled: input.manualApproveEnabled,
        authenticityBoostEnabled: input.authenticityBoostEnabled,
        commentProfileName: input.commentProfileName,
        languageAwareEnabled: input.languageAwareEnabled,
      });
    }),

  stopAutoCommenting: protectedProcedure
    .input(
      z.object({
        autoCommentRunId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const autoCommentRun = await ctx.db.autoCommentRun.findUnique({
        where: { id: input.autoCommentRunId },
      });

      if (autoCommentRun === null) {
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

      const session = browserRegistry.get(ctx.user.id);

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
