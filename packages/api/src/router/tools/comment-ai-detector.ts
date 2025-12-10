import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { AIDetectorService } from "@sassy/apify-runners/ai-detector-service";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import { fetchLinkedInComment } from "../../utils/tools/fetch-linkedin-comment";

// Initialize AI detector service
const aiDetectorService = new AIDetectorService({
  token: process.env.APIFY_API_TOKEN ?? "",
  actorId: process.env.APIFY_AI_DETECTOR_ACTOR_ID ?? "RoYpcsjrPfLmPCkZJ",
});

// Input validation schemas
const LinkedInCommentUrlSchema = z
  .string()
  .url("Invalid URL format")
  .refine(
    (url) => {
      try {
        const urlObj = new URL(url);
        return urlObj.searchParams.has("commentUrn");
      } catch {
        return false;
      }
    },
    { message: "URL must contain 'commentUrn' parameter" },
  )
  .refine(
    (url) => {
      try {
        const urlObj = new URL(url);
        return !urlObj.searchParams.has("replyUrn");
      } catch {
        return false;
      }
    },
    {
      message: "Reply URLs are not supported. Use top-level comment URLs only.",
    },
  );

const CommentTextSchema = z.object({
  text: z.string().min(1, "Comment text cannot be empty"),
});

export const commentAiDetectorRouter = createTRPCRouter({
  /**
   * Fetch LinkedIn comment data from URL
   */
  fetchCommentFromUrn: publicProcedure
    .input(z.object({ url: LinkedInCommentUrlSchema }))
    .mutation(async ({ input }) => {
      // Strict input validation passed, now fetch
      const result = await fetchLinkedInComment(input.url);

      if (!result) {
        // Return error object, don't throw
        return {
          success: false,
          error: {
            code: "COMMENT_NOT_FOUND",
            message:
              "Could not fetch comment from URL. The comment may be private or the URL may be invalid.",
          },
        };
      }

      if (!result.foundCommentId) {
        return {
          success: false,
          error: {
            code: "COMMENT_NOT_FOUND",
            message:
              "Comment ID was found in URL but comment could not be located in the page.",
          },
        };
      }

      if (!result.comment.text) {
        return {
          success: false,
          error: {
            code: "COMMENT_NOT_FOUND",
            message: "Comment was found but has no text content.",
          },
        };
      }

      return {
        success: true,
        data: result,
      };
    }),

  /**
   * Detect AI-generated content in comment text
   */
  detectAIContent: publicProcedure
    .input(CommentTextSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await aiDetectorService.analyzeText(input.text);

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        // Return error object, don't throw
        return {
          success: false,
          error: {
            code: "AI_ANALYSIS_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "Failed to analyze text for AI content",
          },
        };
      }
    }),
});
