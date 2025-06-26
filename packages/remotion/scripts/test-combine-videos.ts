#!/usr/bin/env bun
import { db } from "@sassy/db";

import type { CombineVideosRequest } from "../src/remotion-service";
import { RemotionService } from "../src/remotion-service";

// Configuration - you can modify these to test with different data
const TEST_CONFIG = {
  // Set these to specific IDs if you want to test with particular records
  shortDemoId: null as string | null, // e.g., "cm123456789"
  hookViralVideoId: null as string | null, // e.g., "cm987654321"

  // Or let the script find the first available records
  useFirstAvailable: true,
};

async function testCombineVideos() {
  console.log("🚀 Starting CombineVideos test...");

  try {
    // Query database for test data
    console.log("📊 Querying database for test data...");

    let shortDemo;
    let hookViralVideo;

    if (TEST_CONFIG.shortDemoId && TEST_CONFIG.hookViralVideoId) {
      // Use specific IDs if provided
      shortDemo = await db.shortDemo.findUnique({
        where: { id: TEST_CONFIG.shortDemoId },
        include: { demoVideo: true },
      });

      hookViralVideo = await db.hookViralVideo.findUnique({
        where: { id: TEST_CONFIG.hookViralVideoId },
      });
    } else if (TEST_CONFIG.useFirstAvailable) {
      // Find the first available records
      shortDemo = await db.shortDemo.findFirst({
        include: { demoVideo: true },
        orderBy: { createdAt: "desc" },
      });

      hookViralVideo = await db.hookViralVideo.findFirst({
        where: {
          hookCutUrl: { not: null },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!shortDemo) {
      throw new Error(
        "No ShortDemo found. Please create some demo videos first.",
      );
    }

    if (!hookViralVideo) {
      throw new Error(
        "No HookViralVideo with hookCutUrl found. Please create some viral videos with hooks first.",
      );
    }

    console.log("✅ Found test data:");
    console.log("📹 Short Demo:", {
      id: shortDemo.id,
      demoCutUrl: shortDemo.demoCutUrl,
      durationSeconds: shortDemo.durationSeconds,
    });
    console.log("🎣 Hook Viral Video:", {
      id: hookViralVideo.id,
      title: hookViralVideo.title,
      hookCutUrl: hookViralVideo.hookCutUrl,
      s3Url: hookViralVideo.s3Url,
      hookEndTimestamp: hookViralVideo.hookEndTimestamp,
      durationSeconds: hookViralVideo.durationSeconds,
    });

    // Prepare the request
    const combineRequest: CombineVideosRequest = {
      shortHookUrl: hookViralVideo.hookCutUrl!,
      shortDemoUrl: shortDemo.demoCutUrl,
      originalHookUrl: hookViralVideo.s3Url,
      shortHookDuration: parseTimestampToSeconds(
        hookViralVideo.hookEndTimestamp,
      ), // Convert MM:SS to seconds
      shortDemoDuration: shortDemo.durationSeconds,
      originalHookDuration: hookViralVideo.durationSeconds, // Duration of original hook video
    };

    console.log("🔧 Combine request configuration:", combineRequest);

    // Initialize RemotionService and process the video
    console.log("🎬 Starting Remotion processing...");
    const remotionService = new RemotionService();

    const renderResult =
      await remotionService.processCombineVideos(combineRequest);

    console.log("✅ Remotion render started:", renderResult);

    // Monitor progress
    console.log("⏳ Monitoring render progress...");
    let progress;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes with 5-second intervals

    do {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
      progress = await remotionService.getRenderProgress(
        renderResult.renderId,
        renderResult.bucketName,
      );

      attempts++;
      console.log(
        `📊 Progress ${attempts}/${maxAttempts}: ${(progress.progress * 100).toFixed(1)}% - Done: ${progress.done}`,
      );

      if (progress.errors && progress.errors.length > 0) {
        console.error("❌ Render errors:", progress.errors);
      }
    } while (
      !progress.done &&
      attempts < maxAttempts &&
      !progress.fatalErrorEncountered
    );

    if (progress.fatalErrorEncountered) {
      throw new Error(
        `Render failed with fatal error: ${JSON.stringify(progress.errors)}`,
      );
    }

    if (!progress.done) {
      throw new Error("Render timed out after 5 minutes");
    }

    if (!progress.outputFile || !progress.outputBucket) {
      throw new Error("Render completed but no output file found");
    }

    // Generate download URL
    const downloadUrl = remotionService.generateDownloadUrl(
      progress.outputBucket,
      progress.outputFile,
    );

    console.log("🎉 Render completed successfully!");
    console.log("📁 Output file:", progress.outputFile);
    console.log("🌐 Download URL:", downloadUrl);

    // Save to ViralStitch table (upsert to handle existing combinations)
    console.log("💾 Saving to ViralStitch table...");

    const totalDurationSeconds =
      combineRequest.shortHookDuration + combineRequest.shortDemoDuration;

    const viralStitch = await db.viralStitch.upsert({
      where: {
        shortDemoId_hookViralVideoId: {
          shortDemoId: shortDemo.id,
          hookViralVideoId: hookViralVideo.id,
        },
      },
      update: {
        stitchedVideoUrl: downloadUrl,
        durationSeconds: Math.ceil(totalDurationSeconds),
        updatedAt: new Date(),
      },
      create: {
        shortDemoId: shortDemo.id,
        hookViralVideoId: hookViralVideo.id,
        stitchedVideoUrl: downloadUrl,
        durationSeconds: Math.ceil(totalDurationSeconds),
      },
    });

    console.log("✅ ViralStitch record saved:", {
      id: viralStitch.id,
      stitchedVideoUrl: viralStitch.stitchedVideoUrl,
      durationSeconds: viralStitch.durationSeconds,
      action: "created or updated",
    });

    console.log("\n🎊 Test completed successfully!");
    console.log("Summary:");
    console.log(`- Combined ${hookViralVideo.title} hook with demo`);
    console.log(`- Total duration: ${totalDurationSeconds} seconds`);
    console.log(`- Final video: ${downloadUrl}`);
    console.log(`- Database record: ${viralStitch.id}`);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Helper function to convert MM:SS timestamp to seconds
function parseTimestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(":").map(Number);
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return (minutes || 0) * 60 + (seconds || 0);
  }
  return 0;
}

// Run the test
testCombineVideos().catch(console.error);
