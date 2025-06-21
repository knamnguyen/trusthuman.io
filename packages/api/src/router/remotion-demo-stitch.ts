import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { RemotionRenderResult, VideoStitchRequest } from "@sassy/remotion";
import { RemotionService } from "@sassy/remotion";

import { createTRPCRouter, publicProcedure } from "../trpc";

// Define schemas directly here to avoid importing React components
const VideoStitchClipSchema = z.object({
  range: z
    .string()
    .regex(
      /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/,
      "Time range must be in format MM:SS-MM:SS or HH:MM-HH:MM",
    ),
  caption: z
    .string()
    .min(1, "Caption is required")
    .max(200, "Caption must be 200 characters or less"),
});

const VideoStitchInputSchema = z.object({
  videoUrl: z.string().url("Valid video URL is required"),
  clips: z
    .array(VideoStitchClipSchema)
    .min(1, "At least one clip is required")
    .max(20, "Maximum 20 clips allowed"),
  originalDuration: z.number().positive("Original duration must be positive"),
});

// Initialize Remotion service
const remotionService = new RemotionService();

const GetRenderProgressInputSchema = z.object({
  renderId: z.string(),
  bucketName: z.string(),
});

const GetDownloadUrlInputSchema = z.object({
  bucketName: z.string(),
  outputFile: z.string(),
});

export const remotionDemoStitchRouter = createTRPCRouter({
  // Process video stitch - cuts clips and adds captions
  processVideoStitch: publicProcedure
    .input(VideoStitchInputSchema)
    .mutation(async ({ input }) => {
      try {
        const request: VideoStitchRequest = {
          videoUrl: input.videoUrl,
          clips: input.clips,
          originalDuration: input.originalDuration,
        };

        console.log("Starting video stitch processing:", request);

        // Start Remotion processing
        const result: RemotionRenderResult =
          await remotionService.processVideoStitch(request);

        return {
          success: true,
          renderId: result.renderId,
          bucketName: result.bucketName,
          message: result.message,
        };
      } catch (error) {
        console.error("Video stitch processing failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Video stitch processing failed",
        });
      }
    }),

  // Get render progress by renderId and bucketName
  getRenderProgress: publicProcedure
    .input(GetRenderProgressInputSchema)
    .query(async ({ input }) => {
      try {
        const progress = await remotionService.getRenderProgress(
          input.renderId,
          input.bucketName,
        );

        return progress;
      } catch (error) {
        console.error("Failed to get render progress:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get render progress",
        });
      }
    }),

  // Get download URL for processed video
  getDownloadUrl: publicProcedure
    .input(GetDownloadUrlInputSchema)
    .query(async ({ input }) => {
      try {
        const downloadUrl = remotionService.generateDownloadUrl(
          input.bucketName,
          input.outputFile,
        );

        return {
          success: true,
          downloadUrl,
        };
      } catch (error) {
        console.error("Failed to generate download URL:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to generate download URL",
        });
      }
    }),
});
