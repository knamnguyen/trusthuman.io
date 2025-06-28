import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { ColorPalette } from "@sassy/gemini-video";
import type { VideoSearchResult } from "@sassy/langchain";
import type {
  CombineVideosRequest,
  RemotionRenderResult,
} from "@sassy/remotion";
import { db } from "@sassy/db";
import { createGeminiVideoService } from "@sassy/gemini-video";
import { VideoVectorStore } from "@sassy/langchain";
import { RemotionService } from "@sassy/remotion";

import { createTRPCRouter, publicProcedure } from "../trpc";

// Input schemas
const GenerateViralStitchInputSchema = z.object({
  demoVideoId: z.string().cuid("Valid demo video ID is required"),

  contentGuide: z
    .string()
    .max(500, "Content guide must be 500 characters or less")
    .optional(),
});

const GetViralStitchesInputSchema = z.object({
  demoVideoId: z.string().cuid("Valid demo video ID is required"),
  limit: z.number().int().min(1).max(50).default(20),
});

const GetViralStitchProgressInputSchema = z.object({
  viralStitchId: z.string().cuid("Valid viral stitch ID is required"),
});

// Response schemas
const ViralStitchResponseSchema = z.object({
  id: z.string(),
  stitchedVideoUrl: z.string(),
  durationSeconds: z.number(),
  createdAt: z.string(),
  hookViralVideo: z.object({
    id: z.string(),
    title: z.string(),
    hookEndTimestamp: z.string(),
  }),
  shortDemo: z.object({
    id: z.string(),
    durationSeconds: z.number(),
  }),
});

// Initialize services
const getGeminiService = () => createGeminiVideoService();
const getRemotionService = () => new RemotionService();

/**
 * Parse MM:SS timestamp to seconds
 */
const parseTimeToSeconds = (timeStr: string | null | undefined): number => {
  if (!timeStr || typeof timeStr !== "string") {
    throw new Error(
      `Invalid time format: received ${timeStr}. Expected MM:SS or HH:MM:SS format.`,
    );
  }

  const parts = timeStr.split(":").map(Number);

  if (parts.length === 2) {
    // MM:SS format
    const [minutes, seconds] = parts;
    if (minutes === undefined || seconds === undefined) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts;
    if (hours === undefined || minutes === undefined || seconds === undefined) {
      throw new Error(`Invalid time format: ${timeStr}`);
    }
    return hours * 3600 + minutes * 60 + seconds;
  }

  throw new Error(`Invalid time format: ${timeStr}. Use MM:SS or HH:MM:SS`);
};

/**
 * Calculate optimal duration from hook viral video
 */
const calculateOptimalDuration = (
  hookViralVideo: VideoSearchResult,
): number => {
  const hookEndSeconds = parseTimeToSeconds(
    hookViralVideo.hookEndTimestamp || "00:05",
  );
  const remainingDuration = hookViralVideo.durationSeconds - hookEndSeconds;

  // Apply reasonable bounds
  const minDuration = 5;
  const maxDuration = 30;

  return Math.max(minDuration, Math.min(maxDuration, remainingDuration));
};

/**
 * Find best matching hook using similarity search with randomization
 */
const findRandomMatchingHook = async (
  productInfo: string,
  colorPalette: ColorPalette,
): Promise<VideoSearchResult> => {
  const vectorStore = new VideoVectorStore();

  // Add randomization by varying search parameters
  const randomLimit = Math.floor(Math.random() * 20) + 30; // 30-50 results
  const finalLimit = Math.floor(Math.random() * 5) + 3; // 3-8 final results

  const similarHooks = await vectorStore.findSimilarVideosSequential({
    textQuery: productInfo,
    colorPalette: colorPalette,
    textResultLimit: randomLimit,
    finalLimit: finalLimit,
  });

  if (similarHooks.length === 0) {
    throw new Error("No similar viral hooks found for this demo video");
  }

  // Add additional randomization by shuffling results and picking one
  const shuffled = [...similarHooks].sort(() => Math.random() - 0.5);
  return shuffled[0]!;
};

export const viralStitchRouter = createTRPCRouter({
  // Generate a new viral stitch (complete workflow)
  generateViralStitch: publicProcedure
    .input(GenerateViralStitchInputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        console.log("🚀 Starting viral stitch generation...");
        console.log("📊 Input:", input);

        // Step 1: Get demo video data
        console.log("🔍 Fetching demo video from database...");
        const demoVideo = await db.demoVideo.findUnique({
          where: { id: input.demoVideoId },
          select: {
            id: true,
            s3Url: true,
            productInfo: true,
            colorPalette: true,
            durationSeconds: true,
            masterScript: true,
          },
        });

        if (!demoVideo) {
          throw new Error(`Demo video with ID ${input.demoVideoId} not found`);
        }

        if (!demoVideo.productInfo || !demoVideo.colorPalette) {
          throw new Error(
            "Demo video missing productInfo or colorPalette. Please regenerate master script.",
          );
        }

        console.log("✅ Demo video found");

        // Step 2: Find matching viral hook with randomization
        console.log("🎯 Finding random matching viral hook...");
        const matchingHook = await findRandomMatchingHook(
          demoVideo.productInfo,
          demoVideo.colorPalette as ColorPalette,
        );

        console.log(
          `✅ Selected hook: "${matchingHook.title}" (${matchingHook.hookEndTimestamp})`,
        );

        // Step 3: Calculate optimal duration
        const optimalDuration = calculateOptimalDuration(matchingHook);
        const numSegments = Math.min(
          5,
          Math.max(3, Math.floor(optimalDuration / 3)),
        );

        console.log(
          `📊 Calculated duration: ${optimalDuration}s with ${numSegments} segments`,
        );

        // Step 4: Generate condensed demo using Gemini
        console.log("🧠 Generating condensed demo...");
        const geminiService = getGeminiService();
        const demoResult = await geminiService.condenseDemoFromMasterScriptData(
          {
            demoVideoId: input.demoVideoId,
            exactDuration: optimalDuration,
            numSegments: numSegments,
            contentGuide: input.contentGuide,
          },
        );

        console.log(
          `✅ Demo condensed: ${demoResult.segments.length} segments`,
        );

        // Step 5: Convert segments to VideoStitch format and process
        const videoStitchClips = demoResult.segments.map((segment) => {
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

        // Step 6: Process demo video stitch
        console.log("🎬 Processing demo video stitch...");
        const remotionService = getRemotionService();
        const demoStitchResult = await remotionService.processVideoStitch({
          videoUrl: demoVideo.s3Url,
          clips: videoStitchClips,
          originalDuration: demoVideo.durationSeconds,
        });

        console.log(`✅ Demo stitch initiated: ${demoStitchResult.renderId}`);

        // Step 7: Save ShortDemo to database
        console.log("💾 Saving ShortDemo to database...");
        const shortDemo = await db.shortDemo.create({
          data: {
            demoVideoId: input.demoVideoId,
            durationSeconds: optimalDuration,
            demoCutUrl: "", // Will be updated when processing completes
            segments: demoResult.segments,
          },
        });

        console.log(`✅ ShortDemo created: ${shortDemo.id}`);

        // Step 8: Wait for demo stitch completion
        console.log("⏳ Waiting for demo stitch completion...");
        let demoProgress;
        let attempts = 0;
        const maxAttempts = 60; // 10 minutes max

        do {
          await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
          demoProgress = await remotionService.getRenderProgress(
            demoStitchResult.renderId,
            demoStitchResult.bucketName,
          );
          attempts++;
          console.log(
            `📊 Demo progress: ${(demoProgress.progress * 100).toFixed(1)}% (${attempts}/${maxAttempts})`,
          );
        } while (
          !demoProgress.done &&
          attempts < maxAttempts &&
          !demoProgress.fatalErrorEncountered
        );

        if (demoProgress.fatalErrorEncountered) {
          throw new Error("Demo stitch rendering failed");
        }

        if (!demoProgress.done) {
          throw new Error("Demo stitch rendering timed out");
        }

        const demoDownloadUrl = remotionService.generateDownloadUrl(
          demoProgress.outputBucket!,
          demoProgress.outputFile!,
        );

        // Update ShortDemo with final URL
        await db.shortDemo.update({
          where: { id: shortDemo.id },
          data: { demoCutUrl: demoDownloadUrl },
        });

        console.log("✅ Demo stitch completed");

        // Step 9: Combine with viral hook
        console.log("🔗 Combining demo with viral hook...");
        const hookEndSeconds = parseTimeToSeconds(
          matchingHook.hookEndTimestamp,
        );

        // Validate hookCutUrl
        if (!matchingHook.hookCutUrl) {
          throw new Error(
            `Selected viral hook "${matchingHook.title}" does not have a processed hookCutUrl. Please process viral hooks first.`,
          );
        }

        const combineRequest: CombineVideosRequest = {
          shortHookUrl: matchingHook.hookCutUrl,
          shortDemoUrl: demoDownloadUrl,
          originalHookUrl: matchingHook.s3Url,
          shortHookDuration: hookEndSeconds,
          shortDemoDuration: optimalDuration,
          originalHookDuration: matchingHook.durationSeconds,
        };

        const combineResult =
          await remotionService.processCombineVideos(combineRequest);

        console.log(`✅ Combine initiated: ${combineResult.renderId}`);

        // Step 10: Wait for combine completion
        console.log("⏳ Waiting for combine completion...");
        let combineProgress;
        attempts = 0;

        do {
          await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
          combineProgress = await remotionService.getRenderProgress(
            combineResult.renderId,
            combineResult.bucketName,
          );
          attempts++;
          console.log(
            `📊 Combine progress: ${(combineProgress.progress * 100).toFixed(1)}% (${attempts}/${maxAttempts})`,
          );
        } while (
          !combineProgress.done &&
          attempts < maxAttempts &&
          !combineProgress.fatalErrorEncountered
        );

        if (combineProgress.fatalErrorEncountered) {
          throw new Error("Video combine rendering failed");
        }

        if (!combineProgress.done) {
          throw new Error("Video combine rendering timed out");
        }

        const finalDownloadUrl = remotionService.generateDownloadUrl(
          combineProgress.outputBucket!,
          combineProgress.outputFile!,
        );

        console.log("✅ Video combine completed");

        // Step 11: Save ViralStitch to database
        console.log("💾 Saving ViralStitch to database...");
        const totalDurationSeconds = hookEndSeconds + optimalDuration;

        const viralStitch = await db.viralStitch.create({
          data: {
            shortDemoId: shortDemo.id,
            hookViralVideoId: matchingHook.id,
            stitchedVideoUrl: finalDownloadUrl,
            durationSeconds: Math.ceil(totalDurationSeconds),
          },
          include: {
            hookViralVideo: {
              select: {
                id: true,
                title: true,
                hookEndTimestamp: true,
              },
            },
            shortDemo: {
              select: {
                id: true,
                durationSeconds: true,
              },
            },
          },
        });

        console.log(`✅ ViralStitch created: ${viralStitch.id}`);

        return {
          success: true,
          viralStitch: {
            id: viralStitch.id,
            stitchedVideoUrl: viralStitch.stitchedVideoUrl,
            durationSeconds: viralStitch.durationSeconds,
            createdAt: viralStitch.createdAt.toISOString(),
            hookViralVideo: viralStitch.hookViralVideo,
            shortDemo: viralStitch.shortDemo,
          },
          message: "Viral stitch generated successfully",
        };
      } catch (error) {
        console.error("❌ Viral stitch generation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Viral stitch generation failed",
        });
      }
    }),

  // Get existing viral stitches for a demo video
  getViralStitches: publicProcedure
    .input(GetViralStitchesInputSchema)
    .query(async ({ input }) => {
      try {
        const stitches = await db.viralStitch.findMany({
          where: {
            shortDemo: {
              demoVideoId: input.demoVideoId,
            },
          },
          include: {
            hookViralVideo: {
              select: {
                id: true,
                title: true,
                hookEndTimestamp: true,
              },
            },
            shortDemo: {
              select: {
                id: true,
                durationSeconds: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: input.limit,
        });

        return {
          success: true,
          stitches: stitches.map((stitch) => ({
            id: stitch.id,
            stitchedVideoUrl: stitch.stitchedVideoUrl,
            durationSeconds: stitch.durationSeconds,
            createdAt: stitch.createdAt.toISOString(),
            hookViralVideo: stitch.hookViralVideo,
            shortDemo: stitch.shortDemo,
          })),
        };
      } catch (error) {
        console.error("Failed to fetch viral stitches:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch viral stitches",
        });
      }
    }),

  // Get demo video details
  getDemoVideo: publicProcedure
    .input(z.object({ demoVideoId: z.string().cuid() }))
    .query(async ({ input }) => {
      try {
        const demoVideo = await db.demoVideo.findUnique({
          where: { id: input.demoVideoId },
          select: {
            id: true,
            s3Url: true,
            durationSeconds: true,
            productInfo: true,
            createdAt: true,
          },
        });

        if (!demoVideo) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Demo video not found",
          });
        }

        return {
          success: true,
          demoVideo: {
            ...demoVideo,
            createdAt: demoVideo.createdAt.toISOString(),
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        console.error("Failed to fetch demo video:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch demo video",
        });
      }
    }),
});

export type ViralStitchResponse = z.infer<typeof ViralStitchResponseSchema>;
