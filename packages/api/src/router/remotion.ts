import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type {
  RemotionRenderResult,
  VideoProcessingRequest,
} from "@sassy/remotion/remotion-service";
import { RemotionService } from "@sassy/remotion/remotion-service";

import { createTRPCRouter, publicProcedure } from "../trpc";

// Initialize Remotion service
const remotionService = new RemotionService();

const ProcessVideoSpeedInputSchema = z.object({
  videoUrl: z.string().url(),
  speedMultiplier: z.number().min(0.1).max(10),
  originalDuration: z.number().positive(),
});

const GetRenderProgressInputSchema = z.object({
  renderId: z.string(),
  bucketName: z.string(),
});

const GetDownloadUrlInputSchema = z.object({
  bucketName: z.string(),
  outputFile: z.string(),
});

export const remotionRouter = createTRPCRouter({
  // Process video speed - direct processing without metadata storage
  processVideoSpeed: publicProcedure
    .input(ProcessVideoSpeedInputSchema)
    .mutation(async ({ input }) => {
      try {
        const request: VideoProcessingRequest = {
          videoUrl: input.videoUrl,
          speedMultiplier: input.speedMultiplier,
          originalDuration: input.originalDuration,
        };

        console.log("Starting video processing:", request);

        // Start Remotion processing
        const result: RemotionRenderResult =
          await remotionService.processVideoSpeed(request);

        return {
          success: true,
          renderId: result.renderId,
          bucketName: result.bucketName,
          message: result.message,
        };
      } catch (error) {
        console.error("Video processing failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Video processing failed",
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
