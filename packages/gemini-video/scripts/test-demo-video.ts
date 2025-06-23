#!/usr/bin/env bun

/**
 * DEMO VIDEO CONDENSING TEST SCRIPT
 * =================================
 *
 * PURPOSE:
 * Tests the GeminiVideoService's demo video condensing capability.
 * Analyzes a product demo video and creates a condensed version with key segments,
 * captions, and precise timestamps for video editing workflows.
 *
 * FUNCTIONALITY:
 * 1. Downloads video from S3 URL to temporary local file
 * 2. Uploads video to Gemini Files API
 * 3. Waits for Gemini to process the video (PROCESSING -> ACTIVE state)
 * 4. Sends AI prompt with condensing requirements and constraints
 * 5. Parses JSON response with segments array
 * 6. Validates response format (captions, start/end times)
 * 7. Performs dual cleanup (local temp file + Gemini file)
 * 8. Converts timestamps to VideoStitch-compatible format
 *
 * PARAMETERS (TEST_CONFIG):
 * - videoUrl: string - S3 URL of the demo video to condense
 * - maxDuration: number - Maximum total duration for condensed version (seconds)
 * - numSegments: number - Target number of segments to create (1-20)
 *
 * CALCULATED VALUES:
 * - snippetLength: number - Approximate length per segment (maxDuration / numSegments)
 *
 * OUTPUT FORMAT:
 * - segments: Array<{
 *     caption: string,    // Max 100 characters (~20 words)
 *     start: number,      // Start timestamp in seconds.milliseconds
 *     end: number         // End timestamp in seconds.milliseconds
 *   }>
 * - totalDuration: number // Total duration of all segments combined
 *
 * CLEANUP PROCESS (TWO-STAGE):
 * 1. LOCAL CLEANUP: Removes temporary downloaded video file from OS temp directory
 *    - Location: /var/folders/.../gemini-video-{timestamp}-{filename}.mp4
 *    - Handled in finally block of uploadVideoToGemini()
 *    - Uses fs.unlinkSync() to delete file
 *
 * 2. GEMINI API CLEANUP: Deletes uploaded file from Gemini's cloud storage
 *    - Reason: Gemini has 20GB total storage limit per project
 *    - Handled in finally block of condenseDemoVideo()
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
 * - Function Timeout: Minimum 60s for video processing
 * - Memory: 512MB+ recommended for video downloads
 * - Regions: Consider proximity to S3 bucket for faster downloads
 *
 * VIDEOSTITCH INTEGRATION:
 * Output format is designed for seamless integration with @sassy/remotion VideoStitch:
 * - Timestamps converted to MM:SS format for ranges
 * - Captions ready for overlay text
 * - Segment duration calculated for smooth transitions
 *
 * USAGE:
 * - Development: `pnpm test:demo` (loads .env automatically)
 * - Production: Called via tRPC endpoints in Next.js API routes
 * - Integration: Results passed to VideoStitch composition for rendering
 */
import { createGeminiVideoService } from "../src/index";

// Test configuration for demo video condensing
const TEST_CONFIG = {
  // Use the TikTok video as demo video for testing
  videoUrl:
    "https://viralcut-s3bucket.s3.us-west-2.amazonaws.com/uploads%2F1749454504863-ikkpy1mr-ivatar_code_overview.mp4",
  maxDuration: 15, // 15 seconds total
  numSegments: 5, // 5 segments of ~3 seconds each
  contentGuide:
    "Focus on how to use the app. Which button to click, what it does, benefit, effect, and so on",
};

async function main() {
  console.log("🎬 Testing Demo Video Condensing");
  console.log("=================================");
  console.log("📹 Video URL:", TEST_CONFIG.videoUrl);
  console.log("⏱️ Max Duration:", TEST_CONFIG.maxDuration, "seconds");
  console.log("📊 Target Segments:", TEST_CONFIG.numSegments);
  console.log("📝 Content Guide:", TEST_CONFIG.contentGuide);
  console.log("");

  try {
    // Create Gemini video service
    const geminiService = createGeminiVideoService();

    console.log("🚀 Starting demo video condensing...");
    console.log("");

    // Condense demo video
    const result = await geminiService.condenseDemoVideo({
      videoUrl: TEST_CONFIG.videoUrl,
      maxDuration: TEST_CONFIG.maxDuration,
      numSegments: TEST_CONFIG.numSegments,
      contentGuide: TEST_CONFIG.contentGuide,
    });

    console.log("");
    console.log("📊 DEMO VIDEO CONDENSING RESULTS");
    console.log("=================================");
    console.log("📝 Total Segments:", result.segments.length);
    console.log("⏱️ Total Duration:", result.totalDuration, "seconds");
    console.log("");
    console.log("🏷️ PRODUCT INFO:");
    console.log("================");
    console.log(result.productInfo);
    console.log("");
    console.log("🎨 COLOR PALETTE:");
    console.log("=================");
    result.colorPalette.forEach((color, index) => {
      const percentage = (color.percentage * 100).toFixed(1);
      console.log(
        `${index + 1}. RGB(${color.red}, ${color.green}, ${color.blue}) - ${percentage}%`,
      );
    });
    console.log("");
    console.log("🎥 SEGMENTS:");
    console.log("============");

    result.segments.forEach((segment, index) => {
      const duration = segment.end - segment.start;
      console.log(`${index + 1}. "${segment.caption}"`);
      console.log(
        `   ⏱️ ${segment.start}s - ${segment.end}s (${duration.toFixed(1)}s)`,
      );
      console.log("");
    });

    console.log("✅ Demo video condensing completed successfully!");
    console.log("");
    console.log("💡 These segments can be used with VideoStitch composition.");
    console.log(
      "💡 Convert start/end times to MM:SS format for VideoStitch ranges.",
    );
    console.log("💡 Product info can be used for similarity search matching.");
    console.log(
      "💡 Color palette can be used for video style matching and theming.",
    );

    // Show VideoStitch format conversion
    console.log("");
    console.log("🔄 VIDEOSTITCH FORMAT CONVERSION:");
    console.log("==================================");
    result.segments.forEach((segment, index) => {
      const startMinutes = Math.floor(segment.start / 60);
      const startSeconds = Math.floor(segment.start % 60);
      const endMinutes = Math.floor(segment.end / 60);
      const endSeconds = Math.floor(segment.end % 60);

      const range = `${startMinutes.toString().padStart(2, "0")}:${startSeconds.toString().padStart(2, "0")}-${endMinutes.toString().padStart(2, "0")}:${endSeconds.toString().padStart(2, "0")}`;

      console.log(
        `${index + 1}. { range: "${range}", caption: "${segment.caption}" }`,
      );
    });
  } catch (error) {
    console.error("");
    console.error("❌ DEMO VIDEO CONDENSING FAILED");
    console.error("================================");
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
    console.error(
      "   - Try reducing maxDuration or numSegments if the video is too short",
    );

    process.exit(1);
  }
}

// Run the main function
main();
