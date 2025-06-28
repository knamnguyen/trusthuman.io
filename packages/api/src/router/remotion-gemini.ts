import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { VideoSegment } from "@sassy/gemini-video";
import type { RemotionRenderResult, VideoStitchRequest } from "@sassy/remotion";
import { db } from "@sassy/db";
import { createGeminiVideoService } from "@sassy/gemini-video";
import { RemotionService } from "@sassy/remotion";

import { createTRPCRouter, publicProcedure } from "../trpc";

// Input schema for Gemini + Remotion processing
const RemotionGeminiInputSchema = z.object({
  demoVideoId: z.string().cuid("Valid demo video ID is required"),
  exactDuration: z
    .number()
    .positive("Exact duration must be positive")
    .max(300, "Exact duration cannot exceed 300 seconds")
    .default(15), // Default to 15 seconds if not provided
  numSegments: z
    .number()
    .int()
    .min(1)
    .max(20, "Number of segments must be between 1 and 20"),
  contentGuide: z.string().optional(),
});

// Response schema
const RemotionGeminiResponseSchema = z.object({
  success: z.boolean(),
  shortDemoId: z.string(),
  renderId: z.string(),
  bucketName: z.string(),
  message: z.string(),
  segmentCount: z.number(),
  totalDuration: z.number(),
});

// Progress tracking schemas (re-use from remotion-demo-stitch)
const GetRenderProgressInputSchema = z.object({
  renderId: z.string(),
  bucketName: z.string(),
});

const GetDownloadUrlInputSchema = z.object({
  bucketName: z.string(),
  outputFile: z.string(),
});

const UpdateShortDemoUrlInputSchema = z.object({
  shortDemoId: z.string().cuid(),
  demoCutUrl: z.string().url(),
});

// Initialize services lazily to avoid environment variable issues at module load
const getGeminiService = () => createGeminiVideoService();
const getRemotionService = () => new RemotionService();

/**
 * Convert Gemini video segments to VideoStitch clip format
 * @param segments - Array of Gemini segments with start/end in seconds
 * @returns Array of VideoStitch clips with MM:SS-MM:SS range format
 */
const convertSegmentsToVideoStitchClips = (segments: VideoSegment[]) => {
  return segments.map((segment) => {
    const startMinutes = Math.floor(segment.start / 60);
    const startSeconds = segment.start % 60;
    const endMinutes = Math.floor(segment.end / 60);
    const endSeconds = segment.end % 60;

    const range = `${startMinutes.toString().padStart(2, "0")}:${startSeconds.toString().padStart(2, "0")}-${endMinutes.toString().padStart(2, "0")}:${endSeconds.toString().padStart(2, "0")}`;

    return {
      range,
      caption: segment.caption,
    };
  });
};

export const remotionGeminiRouter = createTRPCRouter({
  // Main endpoint: Process demo video using Gemini + Remotion
  processGeminiDemo: publicProcedure
    .input(RemotionGeminiInputSchema)
    .mutation(async ({ input }) => {
      try {
        console.log("🚀 Starting Gemini + Remotion demo processing...");
        console.log("📊 Input:", input);

        // Step 1: Get original video and master script data from database
        console.log("🔍 Step 1: Fetching demo video with master script...");
        const demoVideo = await db.demoVideo.findUnique({
          where: { id: input.demoVideoId },
          select: {
            id: true,
            s3Url: true,
            durationSeconds: true,
            masterScript: true,
            productInfo: true,
          },
        });

        if (!demoVideo) {
          throw new Error(`Demo video with ID ${input.demoVideoId} not found`);
        }

        if (!demoVideo.productInfo) {
          throw new Error(
            "Demo video missing productInfo. Please regenerate master script.",
          );
        }

        // Validate masterScript data
        if (
          !Array.isArray(demoVideo.masterScript) ||
          demoVideo.masterScript.length === 0
        ) {
          throw new Error(
            "Demo video missing masterScript data. Please regenerate master script.",
          );
        }

        console.log(`✅ Demo video found: ${demoVideo.s3Url}`);

        // Step 2: Get condensed segments from Gemini using master script
        console.log("🧠 Step 2: Getting condensed segments from Gemini...");
        const geminiService = getGeminiService();
        const geminiResult =
          await geminiService.condenseDemoFromMasterScriptData({
            masterScript: demoVideo.masterScript as any[],
            productInfo: demoVideo.productInfo,
            exactDuration: input.exactDuration,
            numSegments: input.numSegments,
            contentGuide: input.contentGuide,
          });

        console.log(
          `✅ Gemini processing complete: ${geminiResult.segments.length} segments`,
        );

        // Step 3: Convert segments to VideoStitch format
        console.log("🔄 Step 3: Converting segments to VideoStitch format...");
        const videoStitchClips = convertSegmentsToVideoStitchClips(
          geminiResult.segments,
        );

        console.log("📐 Converted clips:");
        videoStitchClips.forEach((clip, index) => {
          console.log(`  ${index + 1}. ${clip.range} - "${clip.caption}"`);
        });

        // Step 4: Start Remotion video processing
        console.log("🎬 Step 4: Starting Remotion video stitching...");
        const videoStitchRequest: VideoStitchRequest = {
          videoUrl: demoVideo.s3Url,
          clips: videoStitchClips,
          originalDuration: demoVideo.durationSeconds,
        };

        const remotionService = getRemotionService();
        const remotionResult: RemotionRenderResult =
          await remotionService.processVideoStitch(videoStitchRequest);

        console.log(
          `✅ Remotion processing started: ${remotionResult.renderId}`,
        );

        // Step 5: Save ShortDemo to database
        console.log("💾 Step 5: Saving ShortDemo to database...");
        const shortDemo = await db.shortDemo.create({
          data: {
            demoVideoId: input.demoVideoId,
            durationSeconds: input.exactDuration,
            demoCutUrl: "", // Will be updated when processing completes
            segments: geminiResult.segments, // Store original Gemini segments
          },
        });

        console.log(`✅ ShortDemo created: ${shortDemo.id}`);

        const response = {
          success: true,
          shortDemoId: shortDemo.id,
          renderId: remotionResult.renderId,
          bucketName: remotionResult.bucketName,
          message: "Gemini + Remotion processing started successfully",
          segmentCount: geminiResult.segments.length,
          totalDuration: geminiResult.totalDuration,
        };

        console.log("🎉 Processing pipeline initiated successfully!");
        return response;
      } catch (error) {
        console.error("❌ Gemini + Remotion processing failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Gemini + Remotion processing failed",
        });
      }
    }),

  // Get render progress by renderId and bucketName
  getRenderProgress: publicProcedure
    .input(GetRenderProgressInputSchema)
    .query(async ({ input }) => {
      try {
        const remotionService = getRemotionService();
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
        const remotionService = getRemotionService();
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

  // Update ShortDemo with final demoCutUrl when processing completes
  updateShortDemoUrl: publicProcedure
    .input(UpdateShortDemoUrlInputSchema)
    .mutation(async ({ input }) => {
      try {
        const updatedShortDemo = await db.shortDemo.update({
          where: { id: input.shortDemoId },
          data: { demoCutUrl: input.demoCutUrl },
        });

        return {
          success: true,
          shortDemoId: updatedShortDemo.id,
          message: "ShortDemo URL updated successfully",
        };
      } catch (error) {
        console.error("Failed to update ShortDemo URL:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update ShortDemo URL",
        });
      }
    }),
});

export type RemotionGeminiInput = z.infer<typeof RemotionGeminiInputSchema>;
export type RemotionGeminiResponse = z.infer<
  typeof RemotionGeminiResponseSchema
>;
