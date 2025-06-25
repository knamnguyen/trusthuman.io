import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { MasterScriptResponse } from "@sassy/gemini-video";
import type {
  RemotionRenderResult,
  VideoProcessingRequest,
} from "@sassy/remotion";
import type { VideoProcessingJob } from "@sassy/s3/schema-validators";
import { DemoVideoCreateInputSchema } from "@sassy/db/schema-validators";
import { createGeminiVideoService } from "@sassy/gemini-video";
import { S3BucketService } from "@sassy/s3";

import { createTRPCRouter, publicProcedure } from "../trpc";

// Initialize S3 service with single bucket
const s3Service = new S3BucketService({
  region: process.env.AWS_REGION || "us-west-2",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  bucket: process.env.S3_BUCKET || "viralcut-s3bucket",
});

// Initialize Gemini Video Service
const geminiVideoService = createGeminiVideoService(process.env.GEMINI_API_KEY);

const GetUploadUrlInputSchema = z.object({
  fileName: z.string(),
  contentType: z.string().optional(),
  prefix: z.string().optional(),
  durationSeconds: z.number().int().positive().optional(),
});

const InitMultipartUploadInputSchema = z.object({
  fileName: z.string(),
  contentType: z.string().optional(),
  prefix: z.string().optional(),
});

const GetPartUrlsInputSchema = z.object({
  key: z.string(),
  uploadId: z.string(),
  partNumbers: z.array(z.number()),
});

const CompleteMultipartUploadInputSchema = z.object({
  key: z.string(),
  uploadId: z.string(),
  parts: z.array(
    z.object({
      partNumber: z.number(),
      etag: z.string(),
    }),
  ),
  durationSeconds: z.number().int().positive(),
});

const AbortMultipartUploadInputSchema = z.object({
  key: z.string(),
  uploadId: z.string(),
});

const GenerateMasterScriptInputSchema = z.object({
  demoVideoId: z.string(),
});

const GenerateMasterScriptFromUriInputSchema = z.object({
  fileUri: z.string(),
  mimeType: z.string(),
  s3Url: z.string(),
  durationSeconds: z.number().int().positive(),
});

// Helper function to generate master script for a video
const generateMasterScriptForVideo = async (
  s3Url: string,
): Promise<MasterScriptResponse> => {
  try {
    console.log("🎬 Generating master script for video:", s3Url);
    const masterScriptResponse = await geminiVideoService.generateMasterScript({
      videoUrl: s3Url,
    });
    console.log("✅ Master script generated successfully");
    return masterScriptResponse;
  } catch (error) {
    console.error("❌ Failed to generate master script:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to generate master script for video",
      cause: error,
    });
  }
};

// Helper function to save video metadata with master script to database
const saveDemoVideoToDB = async (
  s3Url: string,
  durationSeconds: number,
  masterScript: MasterScriptResponse["masterScript"],
  db: any,
) => {
  try {
    return await db.demoVideo.create({
      data: {
        s3Url,
        durationSeconds,
        masterScript,
      },
    });
  } catch (error) {
    console.error("Failed to save demo video to database:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to save video metadata to database",
      cause: error,
    });
  }
};

export const videoRouter = createTRPCRouter({
  // Get presigned URL for direct upload to S3 (single part - for files < 10MB)
  getUploadUrl: publicProcedure
    .input(GetUploadUrlInputSchema)
    .mutation(async ({ input, ctx }) => {
      const key = s3Service.generateUniqueKey(
        input.fileName,
        input.prefix || "uploads",
      );

      try {
        const uploadUrl = await s3Service.getPresignedUploadUrl(
          key,
          input.contentType,
          3600, // 1 hour expiry
        );

        console.log("uploadUrl", uploadUrl);

        // No automatic master script generation - will be done separately via generateMasterScriptFromUri

        return {
          success: true,
          uploadUrl,
          key,
          bucket: s3Service.getBucket(),
          expiresIn: 3600,
        };
      } catch (error) {
        console.error("Failed to process upload URL request:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process upload request",
          cause: error,
        });
      }
    }),

  // Initialize multipart upload for large files (≥ 10MB)
  initMultipartUpload: publicProcedure
    .input(InitMultipartUploadInputSchema)
    .mutation(async ({ input }) => {
      try {
        const key = s3Service.generateUniqueKey(
          input.fileName,
          input.prefix || "uploads",
        );
        const result = await s3Service.initializeMultipartUpload(
          key,
          input.contentType,
        );

        return {
          success: true,
          ...result,
        };
      } catch (error) {
        console.error("Failed to initialize multipart upload:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to initialize multipart upload",
        });
      }
    }),

  // Get presigned URLs for uploading multiple parts
  getPartUploadUrls: publicProcedure
    .input(GetPartUrlsInputSchema)
    .mutation(async ({ input }) => {
      try {
        const partUrls = await s3Service.getPresignedUploadPartUrls(
          input.key,
          input.uploadId,
          input.partNumbers,
          3600, // 1 hour expiry
        );

        return {
          success: true,
          partUrls,
        };
      } catch (error) {
        console.error("Failed to get part upload URLs:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get part upload URLs",
        });
      }
    }),

  // Complete multipart upload
  completeMultipartUpload: publicProcedure
    .input(CompleteMultipartUploadInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Complete the S3 multipart upload
        const result = await s3Service.completeMultipartUpload(
          input.key,
          input.uploadId,
          input.parts,
        );

        // No automatic master script generation - will be done separately via generateMasterScriptFromUri

        return {
          success: true,
          ...result,
        };
      } catch (error) {
        console.error("Failed to complete multipart upload:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to complete multipart upload",
        });
      }
    }),

  // Abort multipart upload (cleanup)
  abortMultipartUpload: publicProcedure
    .input(AbortMultipartUploadInputSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await s3Service.abortMultipartUpload(
          input.key,
          input.uploadId,
        );

        return {
          success: result,
        };
      } catch (error) {
        console.error("Failed to abort multipart upload:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to abort multipart upload",
        });
      }
    }),

  // Generate master script for existing demo video
  generateMasterScript: publicProcedure
    .input(GenerateMasterScriptInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // First, get the demo video from database
        const demoVideo = await ctx.db.demoVideo.findUnique({
          where: { id: input.demoVideoId },
        });

        if (!demoVideo) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Demo video not found",
          });
        }

        // Generate master script for the video
        const masterScriptResponse = await generateMasterScriptForVideo(
          demoVideo.s3Url,
        );

        // Update the database record with the new master script
        const updatedDemoVideo = await ctx.db.demoVideo.update({
          where: { id: input.demoVideoId },
          data: {
            masterScript: masterScriptResponse.masterScript,
          },
        });

        return {
          success: true,
          demoVideo: updatedDemoVideo,
          masterScript: masterScriptResponse.masterScript,
        };
      } catch (error) {
        console.error("Failed to generate master script:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate master script",
          cause: error,
        });
      }
    }),

  // Generate master script from existing Gemini file URI (optimized for parallel upload)
  generateMasterScriptFromUri: publicProcedure
    .input(GenerateMasterScriptFromUriInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        console.log(
          "🎬 Generating master script from Gemini URI:",
          input.fileUri,
        );

        // Use the optimized method that doesn't download from S3
        const masterScriptResponse =
          await geminiVideoService.generateMasterScriptFromUri(
            input.fileUri,
            input.mimeType,
          );

        // Save to database with the S3 URL and master script
        const demoVideo = await saveDemoVideoToDB(
          input.s3Url,
          input.durationSeconds,
          masterScriptResponse.masterScript,
          ctx.db,
        );

        return {
          success: true,
          demoVideo,
          masterScript: masterScriptResponse.masterScript,
        };
      } catch (error) {
        console.error("Failed to generate master script from URI:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate master script from URI",
          cause: error,
        });
      }
    }),
});
