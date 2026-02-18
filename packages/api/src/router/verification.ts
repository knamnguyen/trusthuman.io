import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const verificationRouter = createTRPCRouter({
  /**
   * Analyze photo for human faces (MVP - no auth required)
   * In future: integrate AWS Rekognition DetectFaces
   */
  analyzePhoto: publicProcedure
    .input(
      z.object({
        photoBase64: z.string(),
        activityType: z.enum(["linkedin_comment", "x_comment"]),
        linkedinCommentId: z.string().optional(),
        xCommentId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement AWS Rekognition DetectFaces integration
      // For now, return mock verification result

      const mockResult = {
        verified: true,
        confidence: 0.95,
        faceCount: 1,
      };

      // Store verification in database
      const verification = await ctx.db.humanVerification.create({
        data: {
          verified: mockResult.verified,
          confidence: mockResult.confidence,
          faceCount: mockResult.faceCount,
          activityType: input.activityType,
          linkedinCommentId: input.linkedinCommentId,
          xCommentId: input.xCommentId,
          // photoS3Key will be added when we implement S3 upload
        },
      });

      return {
        verificationId: verification.id,
        ...mockResult,
      };
    }),

  /**
   * Get verification history for a user
   */
  getHistory: publicProcedure
    .input(
      z.object({
        trustProfileId: z.string(),
        limit: z.number().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.humanVerification.findMany({
        where: {
          trustProfileId: input.trustProfileId,
        },
        take: input.limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          linkedinComment: true,
          xComment: true,
        },
      });
    }),
});
