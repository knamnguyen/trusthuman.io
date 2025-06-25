#!/usr/bin/env bun

/**
 * MASTER SCRIPT GENERATION TEST SCRIPT
 * ====================================
 *
 * PURPOSE:
 * Tests the GeminiVideoService's master script generation capability.
 * Analyzes a video and creates second-by-second annotations for the entire duration,
 * providing detailed descriptions of what happens at each moment in the video.
 *
 * FUNCTIONALITY:
 * 1. Downloads video from S3 URL to temporary local file
 * 2. Uploads video to Gemini Files API
 * 3. Waits for Gemini to process the video (PROCESSING -> ACTIVE state)
 * 4. Sends AI prompt requesting second-by-second video analysis
 * 5. Parses JSON response with masterScript array
 * 6. Validates response format (second numbers, descriptions)
 * 7. Performs dual cleanup (local temp file + Gemini file)
 * 8. Saves complete results to JSON file for inspection
 *
 * PARAMETERS (TEST_CONFIG):
 * - videoUrl: string - S3 URL of the video to analyze
 *
 * OUTPUT FORMAT:
 * - masterScript: Array<{
 *     second: number,     // Second timestamp (0, 1, 2, 3, ...)
 *     description: string // Detailed description of what happens at that second
 *   }>
 *
 * GEMINI SAMPLING CAPABILITY:
 * Gemini 2.0 Flash has the ability to analyze video content at frame-level precision
 * and can provide annotations for every second of video content. This test validates:
 * - Whether Gemini can consistently sample every second
 * - Quality and detail level of annotations
 * - Reliability of second-by-second coverage
 * - Usefulness for video editing workflows
 *
 * FILE OUTPUT:
 * Results are saved to: scripts/master-script-output-{timestamp}.json
 * This allows inspection of the full response which may be very long for longer videos.
 *
 * CLEANUP PROCESS (TWO-STAGE):
 * 1. LOCAL CLEANUP: Removes temporary downloaded video file from OS temp directory
 *    - Location: /var/folders/.../gemini-video-{timestamp}-{filename}.mp4
 *    - Handled in finally block of uploadVideoToGemini()
 *    - Uses fs.unlinkSync() to delete file
 *
 * 2. GEMINI API CLEANUP: Deletes uploaded file from Gemini's cloud storage
 *    - Reason: Gemini has 20GB total storage limit per project
 *    - Handled in finally block of generateMasterScript()
 *    - Uses client.files.delete({ name: fileName })
 *
 * SERVERLESS DEPLOYMENT CONSIDERATIONS:
 * ✅ WORKS PERFECTLY: Both cleanup stages function correctly
 *
 * LOCAL CLEANUP IN SERVERLESS:
 * - Vercel functions use ephemeral file system (/tmp directory)
 * - Files are automatically destroyed when function execution completes
 * - Our explicit cleanup is redundant but harmless
 * - Benefits: Consistent behavior between local dev and production
 * - No storage leaks possible in serverless environment
 *
 * GEMINI API CLEANUP IN SERVERLESS:
 * - CRITICAL: Must run to avoid hitting 20GB storage limit
 * - Works perfectly in serverless (HTTP API call)
 * - Independent of function execution lifecycle
 * - Runs in finally block to ensure execution even on errors
 *
 * VERCEL DEPLOYMENT REQUIREMENTS:
 * - Environment Variable: GEMINI_API_KEY must be set
 * - Function Timeout: Minimum 60s for video processing + analysis time
 * - Memory: 512MB+ recommended for video downloads
 * - Regions: Consider proximity to S3 bucket for faster downloads
 *
 * VIDEO EDITING INTEGRATION:
 * Output format is designed for video editing workflows:
 * - Second-level precision for accurate timing
 * - Detailed descriptions for content identification
 * - Consistent terminology for object/element tracking
 * - Actionable details for automated editing decisions
 *
 * USAGE:
 * - Development: `pnpm test:master-script` (loads .env automatically)
 * - Production: Called via tRPC endpoints in Next.js API routes
 * - Integration: Results used for precise video editing and content analysis
 */
import { writeFileSync } from "fs";

import { createGeminiVideoService } from "../src/index";

// Test configuration for master script generation
const TEST_CONFIG = {
  // Use a shorter test video to avoid response length limits
  // Original long video: "https://viralcut-s3bucket.s3.us-west-2.amazonaws.com/uploads%2F1749454504863-ikkpy1mr-ivatar_code_overview.mp4",
  // Let's try with the same video but mention it might be long in the console
  videoUrl:
    "https://viralcut-s3bucket.s3.us-west-2.amazonaws.com/uploads%2F1749454504863-ikkpy1mr-ivatar_code_overview.mp4",
};

async function main() {
  console.log("📝 Testing Master Script Generation");
  console.log("==================================");
  console.log("📹 Video URL:", TEST_CONFIG.videoUrl);
  console.log("");
  console.log(
    "⚠️ NOTE: This is a ~5 minute video which may hit response length limits.",
  );
  console.log("📊 Gemini may truncate the response for very long videos.");
  console.log(
    "💡 For production use, consider chunking longer videos or using shorter clips.",
  );
  console.log("");

  try {
    // Create Gemini video service
    const geminiService = createGeminiVideoService();

    console.log("🚀 Starting master script generation...");
    console.log("⏳ This may take a while for longer videos...");
    console.log("");

    // Generate master script
    const result = await geminiService.generateMasterScript({
      videoUrl: TEST_CONFIG.videoUrl,
    });

    console.log("");
    console.log("📊 MASTER SCRIPT GENERATION RESULTS");
    console.log("===================================");
    console.log("📝 Total Range Annotations:", result.masterScript.length);
    console.log("");

    // Show first few and last few entries as preview
    console.log("🎬 SAMPLE ANNOTATIONS (First 5 ranges):");
    console.log("=========================================");
    result.masterScript.slice(0, 5).forEach((entry) => {
      console.log(`${entry.secondRange}:`);
      console.log(`  📝 Transcript: "${entry.transcript}"`);
      console.log(`  🎬 Frame: ${entry.frameDescription}`);
      console.log("");
    });

    if (result.masterScript.length > 10) {
      console.log("... (middle entries omitted for console display) ...");
      console.log("");
      console.log("🎬 SAMPLE ANNOTATIONS (Last 5 ranges):");
      console.log("========================================");
      result.masterScript.slice(-5).forEach((entry) => {
        console.log(`${entry.secondRange}:`);
        console.log(`  📝 Transcript: "${entry.transcript}"`);
        console.log(`  🎬 Frame: ${entry.frameDescription}`);
        console.log("");
      });
    }

    // Save complete results to file
    const timestamp = Date.now();
    const outputFileName = `master-script-output-${timestamp}.json`;
    const outputPath = `scripts/${outputFileName}`;

    try {
      writeFileSync(outputPath, JSON.stringify(result, null, 2));
      console.log("");
      console.log("💾 COMPLETE RESULTS SAVED TO FILE");
      console.log("=================================");
      console.log("📄 File:", outputPath);
      console.log(
        "📊 File Size:",
        (JSON.stringify(result).length / 1024).toFixed(1),
        "KB",
      );
      console.log("");
      console.log("💡 Use this file to inspect the complete master script");
      console.log(
        "💡 Each entry contains second-level timing and detailed descriptions",
      );
    } catch (fileError) {
      console.warn("⚠️ Failed to save results to file:", fileError);
    }

    // Analysis and insights
    console.log("");
    console.log("📈 ANALYSIS INSIGHTS");
    console.log("===================");

    // Parse the last range to get video duration
    const lastRange = result.masterScript[result.masterScript.length - 1];
    if (lastRange) {
      // Extract end time from the last range (format: "MM:SS-MM:SS")
      const endTimeMatch = lastRange.secondRange.match(/-(\d{2}):(\d{2})$/);
      if (endTimeMatch) {
        const minutes = parseInt(endTimeMatch[1] || "0", 10);
        const seconds = parseInt(endTimeMatch[2] || "0", 10);
        const totalDuration = minutes * 60 + seconds + 1; // +1 because timestamps are inclusive
        console.log("⏱️ Video Duration:", totalDuration, "seconds");

        const avgDescriptionLength =
          result.masterScript.reduce(
            (sum, entry) =>
              sum + entry.transcript.length + entry.frameDescription.length,
            0,
          ) / result.masterScript.length;
        console.log(
          "📝 Average Description Length:",
          Math.round(avgDescriptionLength),
          "characters",
        );

        const coverage =
          (result.masterScript.length / (totalDuration / 10)) * 100; // Rough estimate of range efficiency
        console.log(
          "📊 Range Efficiency:",
          coverage.toFixed(1) + "% (ranges per 10 seconds)",
        );
      }
    }

    console.log("");
    console.log("✅ Master script generation completed successfully!");
    console.log("");
    console.log("💡 This master script can be used for:");
    console.log("   - Precise video editing and cutting");
    console.log("   - Content analysis and categorization");
    console.log("   - Automated video processing workflows");
    console.log("   - Frame-accurate video manipulation");
    console.log("   - AI-powered video understanding");
  } catch (error) {
    console.error("");
    console.error("❌ MASTER SCRIPT GENERATION FAILED");
    console.error("==================================");
    console.error(
      "Error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    console.error("");
    console.error("💡 Troubleshooting tips:");
    console.error("   - Make sure GEMINI_API_KEY is set in your .env file");
    console.error(
      "   - Verify the video URL is accessible and points to a valid MP4 file",
    );
    console.error("   - Check your internet connection");
    console.error(
      "   - Ensure the video is uploaded to S3 and publicly accessible",
    );
    console.error("   - Try with a shorter video if processing times out");
    console.error("   - Check Gemini API quota and usage limits");

    process.exit(1);
  }
}

// Run the main function
main();
