import {
  commentGenerationInputSchema,
  commentGenerationOutputSchema,
  generateDynamicInputSchema,
  generateDynamicOutputSchema,
} from "../schema-validators";
import { accountProcedure, createTRPCRouter, protectedProcedure } from "../trpc";
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
     * Protected procedure requiring user authentication
     *
     * Note: Rate limiting (daily comment limit) is handled separately
     * via getDailyLimit and incrementDailyLimit endpoints
     */
    generateComment: protectedProcedure
      .input(commentGenerationInputSchema)
      .output(commentGenerationOutputSchema)
      .mutation(({ input, ctx }) => {
        return ctx.ai.generateComment(input);
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

        console.log("[generateDynamic] Starting dynamic generation", {
          accountId,
          postContentLength: postContent.length,
          adjacentCommentsCount: adjacentComments?.length ?? 0,
          count,
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

        console.log("[generateDynamic] Generated comments:", results.length);

        return results;
      }),
  });
