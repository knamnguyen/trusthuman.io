import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { S3BucketService } from "@sassy/s3";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";

// Initialize S3 service
const s3Service = new S3BucketService({
  region: process.env.AWS_REGION || "us-west-2",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  bucket:
    process.env.AWS_S3_LINKEDIN_PREVIEW_BUCKET || "engagekit-linkedin-preview",
});

export const linkedInPreviewRouter = createTRPCRouter({
  // Generate presigned URL for S3 upload
  generatePresignedUrl: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        contentType: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const s3Key = s3Service.generateUniqueKey(ctx.user.id, input.fileName);
      const presignedUrl = await s3Service.getPresignedUploadUrl(
        s3Key,
        input.contentType || "image/jpeg",
        900, // 15 min expiry
      );

      const s3Url = `https://${s3Service.getBucket()}.s3.${process.env.AWS_REGION || "us-west-2"}.amazonaws.com/${s3Key}`;

      return {
        presignedUrl,
        s3Key,
        s3Url,
      };
    }),

  // Save generation after S3 upload completes
  saveResult: protectedProcedure
    .input(
      z.object({
        s3Key: z.string(),
        s3Url: z.string(),
        contentJson: z.any(),
        contentText: z.string(),
        title: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const generation = await ctx.db.linkedInPostPreview.create({
        data: {
          userId: ctx.user.id,
          s3Key: input.s3Key,
          s3Url: input.s3Url,
          contentJson: input.contentJson,
          contentText: input.contentText,
          title: input.title,
          isPublic: true,
        },
      });

      return generation;
    }),

  // Get generation by ID (public for sharing)
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const generation = await ctx.db.linkedInPostPreview.findUnique({
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

      if (!generation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Generation not found",
        });
      }

      if (!generation.isPublic) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This generation is private",
        });
      }

      return generation;
    }),

  // List user's generations
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.linkedInPostPreview.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  // Delete generation
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const generation = await ctx.db.linkedInPostPreview.findUnique({
        where: { id: input.id },
      });

      if (!generation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Generation not found",
        });
      }

      if (generation.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Delete from S3
      await s3Service.deleteFile(generation.s3Key);

      // Delete from DB
      await ctx.db.linkedInPostPreview.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
