import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { AIDetectorService } from "@sassy/apify-runners/ai-detector-service";
import { S3BucketService } from "@sassy/s3";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";
import { fetchLinkedInComment } from "../../utils/tools/fetch-linkedin-comment";
import { uploadAvatarToS3 } from "../../utils/tools/upload-avatar-to-s3";

// Initialize AI detector service
const aiDetectorService = new AIDetectorService({
  token: process.env.APIFY_API_TOKEN ?? "",
  actorId: process.env.APIFY_AI_DETECTOR_ACTOR_ID ?? "RoYpcsjrPfLmPCkZJ",
});

// Initialize S3 service (same bucket as linkedin-preview)
const s3Service = new S3BucketService({
  region: process.env.AWS_REGION || "us-west-2",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  bucket:
    process.env.AWS_S3_LINKEDIN_PREVIEW_BUCKET || "engagekit-linkedin-preview",
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

  /**
   * Save comment analysis result
   * Uploads avatar to S3 and stores analysis in database
   */
  saveAnalysis: protectedProcedure
    .input(
      z.object({
        commentUrl: z.string().url(),
        commentText: z.string(),
        authorName: z.string(),
        authorHeadline: z.string().optional(),
        authorProfileUrl: z.string().optional(),
        avatarUrl: z.string().url().optional(),
        analysisJson: z.any(), // Full AI detector output
        overallScore: z.number().min(0).max(100),
        aiScore: z.number().min(0).max(100),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Upload avatar to S3 (if provided)
      let avatarS3Key: string | null = null;
      let avatarS3Url: string | null = null;

      if (input.avatarUrl) {
        const uploadResult = await uploadAvatarToS3(
          input.avatarUrl,
          ctx.user.id,
          s3Service,
        );
        if (uploadResult) {
          avatarS3Key = uploadResult.s3Key;
          avatarS3Url = uploadResult.s3Url;
        }
      }

      // Save to database
      const analysis = await ctx.db.commentAnalysis.create({
        data: {
          userId: ctx.user.id,
          commentUrl: input.commentUrl,
          commentText: input.commentText,
          authorName: input.authorName,
          authorHeadline: input.authorHeadline || null,
          authorProfileUrl: input.authorProfileUrl || null,
          avatarS3Key,
          avatarS3Url,
          analysisJson: input.analysisJson,
          overallScore: input.overallScore,
          aiScore: input.aiScore,
          isPublic: true,
        },
      });

      return analysis;
    }),

  /**
   * Get analysis by ID (public for sharing)
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const analysis = await ctx.db.commentAnalysis.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
        },
      });

      if (!analysis) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Analysis not found",
        });
      }

      if (!analysis.isPublic) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This analysis is private",
        });
      }

      return analysis;
    }),

  /**
   * List user's saved analyses
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.commentAnalysis.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  /**
   * Delete saved analysis
   * Deletes avatar from S3 and analysis from database
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const analysis = await ctx.db.commentAnalysis.findUnique({
        where: { id: input.id },
      });

      if (!analysis) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Analysis not found",
        });
      }

      if (analysis.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Delete avatar from S3 (if exists)
      if (analysis.avatarS3Key) {
        try {
          await s3Service.deleteFile(analysis.avatarS3Key);
        } catch (error) {
          console.error("Failed to delete avatar from S3:", error);
          // Continue with DB deletion even if S3 deletion fails
        }
      }

      // Delete from database
      await ctx.db.commentAnalysis.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
