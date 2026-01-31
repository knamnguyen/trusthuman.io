import { TRPCError } from "@trpc/server";
import {
  commentGenerationInputSchema,
  commentGenerationOutputSchema,
  generateDynamicInputSchema,
  generateDynamicOutputSchema,
} from "../schema-validators";
import {
  accountProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../trpc";
import {
  DEFAULT_CREATIVITY,
  DEFAULT_MAX_WORDS,
  DEFAULT_STYLE_GUIDE,
} from "../utils/ai-service/constants";
import { getAccountQuota, incrementAccountUsage } from "../utils/ai-quota";
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
      .output(commentGenerationOutputSchema)
      .mutation(async ({ input, ctx }) => {
        // Check quota before generation
        const quota = await getAccountQuota(ctx.db, ctx.activeAccount.id);

        if (!quota.isPremium && quota.used >= quota.limit) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Daily AI comment limit reached (${quota.used}/${quota.limit}). Resets at ${quota.resetsAt.toISOString()}. Upgrade to premium for unlimited comments.`
          });
        }

        // Generate comment
        const result = await ctx.ai.generateComment(input);

        // Increment usage
        await incrementAccountUsage(ctx.db, ctx.activeAccount.id, 1);

        return result;
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
      .input(generateDynamicInputSchema)
      .output(generateDynamicOutputSchema)
      .mutation(async ({ input, ctx }) => {
        const { postContent, adjacentComments, count } = input;
        const accountId = ctx.activeAccount.id;

        // Check quota BEFORE generating
        const quota = await getAccountQuota(ctx.db, accountId);

        if (!quota.isPremium && quota.used + count > quota.limit) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Daily AI comment limit reached (${quota.used}/${quota.limit}). Resets at ${quota.resetsAt.toISOString()}. Upgrade to premium for unlimited comments.`
          });
        }

        console.log("[generateDynamic] Starting dynamic generation", {
          accountId,
          postContentLength: postContent.length,
          adjacentCommentsCount: adjacentComments?.length ?? 0,
          count,
          quotaUsed: quota.used,
          quotaLimit: quota.limit,
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

          return results;
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

        // After successful generation, increment usage
        await incrementAccountUsage(ctx.db, accountId, count);

        console.log("[generateDynamic] Generated comments:", results.length);

        return results;
      }),

    /**
     * Get current quota status for active account
     * Used by UI to show remaining daily comment limit
     */
    quota: accountProcedure.query(async ({ ctx }) => {
      return getAccountQuota(ctx.db, ctx.activeAccount.id);
    }),
  });
