import {
  commentGenerationInputSchema,
  commentGenerationOutputSchema,
} from "../schema-validators";
import { createTRPCRouter, protectedProcedure } from "../trpc";

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
  });
