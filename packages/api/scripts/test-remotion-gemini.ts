#!/usr/bin/env bun

/**
 * REMOTION-GEMINI ROUTER TEST SCRIPT WITH HOOK MATCHING
 * =====================================================
 *
 * PURPOSE:
 * Tests the remotion-gemini tRPC router and hook similarity matching:
 * 1. Find best matching viral hook using similarity search
 * 2. Calculate optimal duration from hook timing
 * 3. Gemini master script condensing (text-only, no video upload)
 * 4. Remotion video stitching with generated segments
 * 5. Database storage of ShortDemo records
 *
 * WORKFLOW TESTING:
 * 1. Get demo video productInfo and colorPalette from database
 * 2. Use similarity search to find best matching viral hook
 * 3. Calculate optimal duration from hook's timing data
 * 4. Call processGeminiDemo endpoint with calculated duration
 * 5. Monitor render progress using polling
 * 6. Retrieve download URL when complete
 * 7. Update ShortDemo with final demoCutUrl
 *
 * PARAMETERS (TEST_CONFIG):
 * - demoVideoId: string - Database ID of demo video with master script
 * - exactDuration: number - Exact total duration for condensed version
 * - numSegments: number - Number of segments to create
 * - contentGuide: string - Optional guidance for segment selection
 * - pollInterval: number - Progress polling interval in milliseconds
 * - maxPollAttempts: number - Maximum polling attempts before timeout
 *
 * TESTING PHASES:
 * Phase 1: Hook Similarity Matching
 * - Fetches demo video productInfo and colorPalette
 * - Uses VideoVectorStore for similarity search
 * - Calculates optimal duration from best matching hook
 * - Displays matching results and calculated duration
 *
 * Phase 2: Initial Processing
 * - Validates input parameters with calculated duration
 * - Calls Gemini service for segment generation
 * - Converts segments to VideoStitch format
 * - Starts Remotion Lambda processing
 * - Creates ShortDemo database record
 * - Returns processing IDs
 *
 * Phase 3: Progress Monitoring
 * - Polls render progress every N seconds
 * - Displays current status and completion percentage
 * - Handles various render states (progress, done, error)
 * - Exits on completion or timeout
 *
 * Phase 4: Completion Handling
 * - Retrieves final download URL
 * - Updates ShortDemo record with demoCutUrl
 * - Displays final results and file locations
 *
 * ENVIRONMENT REQUIREMENTS:
 * - GEMINI_API_KEY: For AI processing
 * - AWS credentials: For Remotion Lambda
 * - DATABASE_URL: For database access
 * - Existing demo video with master script data
 *
 * USAGE:
 * - Development: `pnpm test:remotion-gemini`
 * - With different video: Update TEST_CONFIG.demoVideoId
 * - Custom duration: Update TEST_CONFIG.exactDuration/numSegments
 *
 * OUTPUT INFORMATION:
 * ✅ Processing initiated successfully
 * 📊 Segment count and duration details
 * 🎬 Remotion render ID and bucket info
 * 💾 ShortDemo database record ID
 * 📈 Real-time progress updates
 * 🎯 Final download URL and completion status
 *
 * ERROR HANDLING:
 * - Invalid demo video ID
 * - Missing master script data
 * - Gemini API failures
 * - Remotion Lambda errors
 * - Database connectivity issues
 * - Progress polling timeouts
 */
import type { ColorPalette } from "@sassy/gemini-video";
import type { VideoSearchResult } from "@sassy/langchain";
import { db } from "@sassy/db";
import { VideoVectorStore } from "@sassy/langchain";

import { createServerClient } from "../src/index";

// Test configuration
const TEST_CONFIG = {
  // Replace with actual demo video ID that has master script data
  demoVideoId: "cmcctzxog00008z0k46s9m1ss",

  exactDuration: 15, // 15 seconds total
  numSegments: 5, // 5 segments of ~3 seconds each
  contentGuide:
    "Focus on clear user interactions and key app features. Make captions actionable and engaging for viral social media content.",

  // Progress monitoring settings
  pollInterval: 10000, // Poll every 10 seconds
  maxPollAttempts: 60, // Max 10 minutes of polling (60 * 10s)
};

// Sleep utility for polling
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Parse MM:SS timestamp to seconds (using same logic as remotion utils)
 */
const parseTimeToSeconds = (timeStr: string): number => {
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
 * Find best matching hook using similarity search
 */
const findBestMatchingHook = async (
  productInfo: string,
  colorPalette: ColorPalette,
): Promise<VideoSearchResult> => {
  const vectorStore = new VideoVectorStore();

  const similarHooks = await vectorStore.findSimilarVideosSequential({
    textQuery: productInfo,
    colorPalette: colorPalette,
    textResultLimit: 50,
    finalLimit: 3,
  });

  if (similarHooks.length === 0) {
    throw new Error("No similar viral hooks found for this demo video");
  }

  return similarHooks[0]!;
};

async function main() {
  console.log("🧪 REMOTION-GEMINI ROUTER TEST");
  console.log("==============================");
  console.log("📊 Test Configuration:");
  console.log(`   Demo Video ID: ${TEST_CONFIG.demoVideoId}`);
  console.log(`   Target Duration: ${TEST_CONFIG.exactDuration}s`);
  console.log(`   Number of Segments: ${TEST_CONFIG.numSegments}`);
  console.log(`   Content Guide: "${TEST_CONFIG.contentGuide}"`);
  console.log("");

  try {
    // Create server-side tRPC client
    const trpc = await createServerClient();

    // Phase 1: Hook Similarity Matching
    console.log("🔍 PHASE 1: HOOK SIMILARITY MATCHING");
    console.log("====================================");

    console.log("📊 Fetching demo video data...");
    const demoVideo = await db.demoVideo.findUnique({
      where: { id: TEST_CONFIG.demoVideoId },
      select: {
        id: true,
        productInfo: true,
        colorPalette: true,
        durationSeconds: true,
      },
    });

    if (!demoVideo) {
      throw new Error(
        `Demo video with ID ${TEST_CONFIG.demoVideoId} not found`,
      );
    }

    console.log("✅ Demo video data retrieved:");
    console.log(`   Product Info: "${demoVideo.productInfo || "N/A"}"`);
    console.log(
      `   Color Palette: ${demoVideo.colorPalette ? "Available" : "N/A"}`,
    );
    console.log(`   Duration: ${demoVideo.durationSeconds}s`);
    console.log("");

    if (!demoVideo.productInfo || !demoVideo.colorPalette) {
      console.log(
        "⚠️  Missing productInfo or colorPalette, using default duration",
      );
      console.log(
        `   Using configured duration: ${TEST_CONFIG.exactDuration}s`,
      );
    } else {
      console.log("🎯 Starting similarity search for matching viral hooks...");

      const matchingHook = await findBestMatchingHook(
        demoVideo.productInfo,
        demoVideo.colorPalette as ColorPalette,
      );

      console.log("✅ Best matching hook found:");
      console.log(`   Hook ID: ${matchingHook.id}`);
      console.log(`   Title: "${matchingHook.title}"`);
      console.log(
        `   Similarity Score: ${(matchingHook.similarity || 0).toFixed(3)}`,
      );
      console.log(
        `   Hook End Timestamp: ${matchingHook.hookEndTimestamp || "N/A"}`,
      );
      console.log(`   Video Duration: ${matchingHook.durationSeconds}s`);

      const calculatedDuration = calculateOptimalDuration(matchingHook);
      console.log(`   🧮 Calculated Optimal Duration: ${calculatedDuration}s`);

      // Override the configured duration with calculated one
      TEST_CONFIG.exactDuration = calculatedDuration;
      console.log(
        `   ✅ Updated target duration to: ${TEST_CONFIG.exactDuration}s`,
      );
    }

    console.log("");

    // Phase 2: Initial Processing
    console.log("🚀 PHASE 2: INITIAL PROCESSING");
    console.log("==============================");

    const startTime = Date.now();
    const processResult = await trpc.remotionGemini.processGeminiDemo({
      demoVideoId: TEST_CONFIG.demoVideoId,
      exactDuration: TEST_CONFIG.exactDuration,
      numSegments: TEST_CONFIG.numSegments,
      contentGuide: TEST_CONFIG.contentGuide,
    });

    const processingTime = Date.now() - startTime;

    console.log("✅ Processing initiated successfully!");
    console.log(`⏱️ Processing time: ${(processingTime / 1000).toFixed(1)}s`);
    console.log("📊 Results:");
    console.log(`   Success: ${processResult.success}`);
    console.log(`   ShortDemo ID: ${processResult.shortDemoId}`);
    console.log(`   Render ID: ${processResult.renderId}`);
    console.log(`   Bucket Name: ${processResult.bucketName}`);
    console.log(`   Segment Count: ${processResult.segmentCount}`);
    console.log(`   Total Duration: ${processResult.totalDuration}s`);
    console.log(`   Message: ${processResult.message}`);
    console.log("");

    // Phase 2: Progress Monitoring
    console.log("📈 PHASE 2: PROGRESS MONITORING");
    console.log("===============================");
    console.log(
      `🔄 Polling every ${TEST_CONFIG.pollInterval / 1000}s (max ${TEST_CONFIG.maxPollAttempts} attempts)`,
    );
    console.log("");

    let pollAttempt = 0;
    let renderComplete = false;
    let finalProgress: any = null;

    while (pollAttempt < TEST_CONFIG.maxPollAttempts && !renderComplete) {
      pollAttempt++;

      try {
        const progress = await trpc.remotionGemini.getRenderProgress({
          renderId: processResult.renderId,
          bucketName: processResult.bucketName,
        });

        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

        console.log(
          `📊 Poll ${pollAttempt}/${TEST_CONFIG.maxPollAttempts} (${elapsedTime}s elapsed):`,
        );
        console.log(`   Done: ${progress.done}`);

        if (!progress.done) {
          const percentage = ((progress.progress || 0) * 100).toFixed(1);
          console.log(`   Progress: ${percentage}%`);
          if (progress.fatalErrorEncountered) {
            console.error(`   ❌ Fatal error encountered`);
            console.error(`   Errors:`, progress.errors);
            throw new Error(`Render failed with fatal error`);
          }
        } else {
          console.log(`   ✅ Render completed!`);
          console.log(`   Output File: ${progress.outputFile}`);
          console.log(`   Output Bucket: ${progress.outputBucket}`);
          if (progress.costs) {
            console.log(`   Costs: $${progress.costs.estimatedCost}`);
          }
          renderComplete = true;
          finalProgress = progress;
        }

        console.log("");

        if (!renderComplete) {
          await sleep(TEST_CONFIG.pollInterval);
        }
      } catch (progressError) {
        console.error(
          `❌ Failed to get progress (attempt ${pollAttempt}):`,
          progressError,
        );
        if (pollAttempt < TEST_CONFIG.maxPollAttempts) {
          console.log(`🔄 Retrying in ${TEST_CONFIG.pollInterval / 1000}s...`);
          console.log("");
          await sleep(TEST_CONFIG.pollInterval);
        }
      }
    }

    if (!renderComplete) {
      throw new Error(
        `Render did not complete within ${TEST_CONFIG.maxPollAttempts} polling attempts`,
      );
    }

    // Phase 3: Completion Handling
    console.log("🎯 PHASE 3: COMPLETION HANDLING");
    console.log("===============================");

    // Get download URL
    console.log("🔗 Getting download URL...");
    const downloadResult = await trpc.remotionGemini.getDownloadUrl({
      bucketName: processResult.bucketName,
      outputFile: finalProgress.outputFile,
    });

    console.log("✅ Download URL generated:");
    console.log(`   Success: ${downloadResult.success}`);
    console.log(`   URL: ${downloadResult.downloadUrl}`);
    console.log("");

    // Update ShortDemo with final URL
    console.log("💾 Updating ShortDemo with final URL...");
    const updateResult = await trpc.remotionGemini.updateShortDemoUrl({
      shortDemoId: processResult.shortDemoId,
      demoCutUrl: downloadResult.downloadUrl,
    });

    console.log("✅ ShortDemo updated:");
    console.log(`   Success: ${updateResult.success}`);
    console.log(`   ShortDemo ID: ${updateResult.shortDemoId}`);
    console.log(`   Message: ${updateResult.message}`);
    console.log("");

    // Final Summary
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("🎉 TEST COMPLETED SUCCESSFULLY!");
    console.log("==============================");
    console.log("📊 Final Results:");
    console.log(`   Total Time: ${totalTime}s`);
    console.log(`   Processing Phases: 3/3 completed`);
    console.log(`   ShortDemo ID: ${processResult.shortDemoId}`);
    console.log(`   Final Video URL: ${downloadResult.downloadUrl}`);
    console.log(`   Segments Created: ${processResult.segmentCount}`);
    console.log(`   Video Duration: ${processResult.totalDuration}s`);
    console.log("");
    console.log("💡 Next Steps:");
    console.log("   - Check database for ShortDemo record");
    console.log("   - Download and review the condensed video");
    console.log("   - Test with different contentGuide values");
    console.log("   - Integration with frontend components");
  } catch (error) {
    console.error("");
    console.error("❌ REMOTION-GEMINI ROUTER TEST FAILED");
    console.error("=====================================");
    console.error(
      "Error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    console.error("");
    console.error("💡 Troubleshooting tips:");
    console.error(
      "   - Verify demo video ID exists and has master script data",
    );
    console.error(
      "   - Check environment variables (GEMINI_API_KEY, DATABASE_URL)",
    );
    console.error(
      "   - Ensure AWS credentials are configured for Remotion Lambda",
    );
    console.error("   - Verify Remotion Lambda functions are deployed");
    console.error("   - Check database connectivity and schema");
    console.error("   - Try with a different demo video ID");
    console.error("   - Reduce exactDuration or numSegments for testing");

    process.exit(1);
  }
}

main();
