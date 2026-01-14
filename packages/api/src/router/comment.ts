/**
 * Comment Router
 *
 * Handles saving and retrieving comments for the extension's compose flow.
 * Uses accountProcedure to ensure we know which LinkedIn account the comment belongs to.
 */

import { ulid } from "ulidx";
import { z } from "zod";

import { accountProcedure, createTRPCRouter } from "../trpc";
import { paginate } from "../utils/pagination";

export const commentRouter = () =>
  createTRPCRouter({
    /**
     * Save a successfully submitted comment to the database.
     * Called from the extension after comment is verified posted on LinkedIn.
     */
    saveSubmitted: accountProcedure
      .input(
        z.object({
          postUrn: z.string(),
          postFullCaption: z.string(),
          postCaptionPreview: z.string(),
          comment: z.string(),
          originalAiComment: z.string().optional(),
          postAlternateUrns: z.array(z.string()).optional(),
          adjacentComments: z
            .array(
              z.object({
                authorName: z.string().nullable(),
                content: z.string().nullable(),
              }),
            )
            .optional(),
          authorName: z.string().nullable().optional(),
          authorProfileUrl: z.string().nullable().optional(),
          authorAvatarUrl: z.string().nullable().optional(),
          authorHeadline: z.string().nullable().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const commentId = ulid();

        await ctx.db.comment.create({
          data: {
            id: commentId,
            postUrn: input.postUrn,
            postFullCaption: input.postFullCaption,
            postCaptionPreview: input.postCaptionPreview,
            comment: input.comment,
            originalAiComment: input.originalAiComment ?? null,
            postAlternateUrns: input.postAlternateUrns ?? [],
            adjacentComments: input.adjacentComments,
            authorName: input.authorName ?? null,
            authorProfileUrl: input.authorProfileUrl ?? null,
            authorAvatarUrl: input.authorAvatarUrl ?? null,
            authorHeadline: input.authorHeadline ?? null,
            // Set status to POSTED since we only call this after successful submission
            status: "POSTED",
            commentedAt: new Date(),
            isAutoCommented: false,
            accountId: ctx.activeAccount.id,
          },
        });

        return {
          status: "success",
          commentId,
        } as const;
      }),

    /**
     * List comments for the active account (for history page).
     * Ordered by most recent first.
     */
    listByAccount: accountProcedure
      .input(
        z
          .object({
            cursor: z.string().optional(),
            limit: z.number().min(1).max(100).default(20),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        const limit = input?.limit ?? 20;

        const comments = await ctx.db.comment.findMany({
          where: {
            accountId: ctx.activeAccount.id,
            status: "POSTED", // Only show posted comments in history
          },
          orderBy: {
            commentedAt: "desc",
          },
          cursor: input?.cursor ? { id: input.cursor } : undefined,
          take: limit + 1, // Take one extra for pagination
          select: {
            id: true,
            postUrn: true,
            postCaptionPreview: true,
            comment: true,
            commentedAt: true,
            authorName: true,
            authorAvatarUrl: true,
          },
        });

        return paginate(comments, {
          key: "id",
          size: limit,
        });
      }),
  });
