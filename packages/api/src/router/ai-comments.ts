import z from "zod";

import { commentGenerationInputSchema } from "../schema-validators";
import { accountProcedure, createTRPCRouter } from "../trpc";
import {
  getAccountQuota,
  incrementDailyAiCommentUsage,
  reserveQuota,
} from "../utils/ai-quota";
import {
  DEFAULT_CREATIVITY,
  DEFAULT_MAX_WORDS,
  DEFAULT_STYLE_GUIDE,
} from "../utils/ai-service/constants";
import { truncateToWords } from "../utils/text-utils";

export const aiCommentsRouter = () =>
  createTRPCRouter({
    /**
     * Generate AI comment based on post content and style guide
     * Account procedure requiring active account context
     *
     * Enforces daily quota limits based on organization subscription tier
     */
    generateComment: accountProcedure
      .input(commentGenerationInputSchema)
      .mutation(async ({ input, ctx }) => {
        const reservation = await reserveQuota(ctx.db, ctx.activeAccount.id, 1);

        if (reservation.status === "not_found") {
          return {
            status: "error",
            reason: "account_not_found",
            message: "Failed to retrieve account quota.",
          } as const;
        }

        if (reservation.status === "exceeded") {
          return {
            status: "error",
            reason: "daily_quota_exceeded",
            message: `Daily AI comment limit reached (${reservation.used}/${reservation.limit}). Resets at ${reservation.resetsAt.toISOString()}. Upgrade to premium for unlimited comments.`,
          } as const;
        }

        // Generate comment
        const result = await ctx.ai.generateComment(input);

        if (result.success === false) {
          console.info("[aiCommentsRouter] AI generation failed:", {
            accountId: ctx.activeAccount.id,
            error: result.error,
          });

          await incrementDailyAiCommentUsage(ctx.db, ctx.activeAccount.id, -1);

          return {
            status: "error",
            reason: "internal_error",
            message: `Failed to generate ai comment due to overload. Please try again later.`,
          } as const;
        }

        return {
          status: "success",
          comment: result.comment,
        } as const;
      }),

    /**
     * Generate AI comments with dynamic style selection.
     * Uses AI to select the most appropriate styles from user's saved styles.
     *
     * Flow:
     * 1. Fetch all styles for the account
     * 2. If no styles → generate with DEFAULT_STYLE_GUIDE, return styleId: null, styleSnapshot: null
     * 3. If styles exist → AI selects 3 best styles → generate comments in parallel
     * 4. Return results with styleId and full styleSnapshot for history tracking
     */
    generateDynamic: accountProcedure
      .input(
        z.object({
          postContent: z.string().min(1, "Post content is required"),
          adjacentComments: z
            .array(
              z.object({
                commentContent: z.string(),
                likeCount: z.number(),
                replyCount: z.number(),
              }),
            )
            .optional(),
          count: z.number().min(1).max(5).default(3),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        const { postContent, adjacentComments, count } = input;
        const accountId = ctx.activeAccount.id;

        const reservation = await reserveQuota(ctx.db, accountId, count);

        if (reservation.status === "not_found") {
          return {
            status: "error",
            reason: "account_not_found",
            message: "Failed to retrieve account quota.",
          } as const;
        }

        if (reservation.status === "exceeded") {
          return {
            status: "error",
            reason: "daily_quota_exceeded",
            message: `Daily AI comment limit reached (${reservation.used}/${reservation.limit}). Resets at ${reservation.resetsAt.toISOString()}. Upgrade to premium for unlimited comments.`,
          } as const;
        }

        console.log("[generateDynamic] Starting dynamic generation", {
          accountId,
          postContentLength: postContent.length,
          adjacentCommentsCount: adjacentComments?.length ?? 0,
          count,
          quotaUsed: reservation.used,
          quotaLimit: reservation.limit,
        });

        // 1. Fetch all styles for this account
        const styles = await ctx.db.commentStyle.findMany({
          where: { accountId },
          select: {
            id: true,
            name: true,
            description: true,
            content: true,
            maxWords: true,
            creativity: true,
          },
        });

        console.log("[generateDynamic] Found styles:", styles.length);

        // 2. If no styles, generate with defaults
        if (styles.length === 0) {
          console.log("[generateDynamic] No styles found, using defaults");

          // Generate `count` comments with default style
          const results = await Promise.all(
            Array.from({ length: count }, async () => {
              const result = await ctx.ai.generateComment({
                postContent,
                styleGuide: DEFAULT_STYLE_GUIDE,
                maxWords: DEFAULT_MAX_WORDS,
                creativity: DEFAULT_CREATIVITY,
              });

              return {
                comment: result.comment,
                styleId: null,
                styleSnapshot: null,
              };
            }),
          );

          return {
            status: "success",
            data: results,
          } as const;
        }

        // 3. Build style summaries for selector (description or first 100 words of content)
        const styleSummaries = styles.map((style) => ({
          id: style.id,
          name: style.name,
          description:
            style.description.trim() || truncateToWords(style.content, 100),
        }));

        // 4. Call AI to select 3 best styles
        const selectedStyleIds = await ctx.ai.selectCommentStyles({
          postContent,
          adjacentComments,
          styles: styleSummaries,
        });

        console.log("[generateDynamic] AI selected styles:", selectedStyleIds);

        // 5. Take first `count` style IDs
        const styleIdsToUse = selectedStyleIds.slice(0, count);

        // 6. Generate comments in parallel with selected styles
        const results = await Promise.all(
          styleIdsToUse.map(async (styleId, index) => {
            const style = styles.find((s) => s.id === styleId);

            // This shouldn't happen since we validated IDs, but handle gracefully
            if (!style) {
              console.warn(
                `[generateDynamic] Style ${styleId} not found, using defaults`,
              );
              const result = await ctx.ai.generateComment({
                postContent,
                styleGuide: DEFAULT_STYLE_GUIDE,
                maxWords: DEFAULT_MAX_WORDS,
                creativity: DEFAULT_CREATIVITY,
              });
              return {
                comment: result.comment,
                styleId: null,
                styleSnapshot: null,
              };
            }

            console.log(
              `[generateDynamic] Generating comment ${index + 1}/${count} with style: "${style.name}" (${style.id})`,
            );

            const result = await ctx.ai.generateComment({
              postContent,
              styleGuide: style.content,
              maxWords: style.maxWords ?? DEFAULT_MAX_WORDS,
              creativity: style.creativity ?? DEFAULT_CREATIVITY,
            });

            return {
              comment: result.comment,
              styleId: style.id,
              styleSnapshot: {
                name: style.name,
                content: style.content,
                maxWords: style.maxWords ?? DEFAULT_MAX_WORDS,
                creativity: style.creativity ?? DEFAULT_CREATIVITY,
              },
            };
          }),
        );
        console.log("[generateDynamic] Generated comments:", results.length);

        return {
          status: "success",
          data: results,
        } as const;
      }),

    /**
     * Get current quota status for active account
     * Used by UI to show remaining daily comment limit
     */
    quota: accountProcedure.query(({ ctx }) => {
      return getAccountQuota(ctx.db, ctx.activeAccount.id);
    }),
  });
