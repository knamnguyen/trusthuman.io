#!/usr/bin/env bun

/**
 * DEMO VIDEO CONDENSING FROM MASTER SCRIPT TEST SCRIPT
 * ====================================================
 *
 * PURPOSE:
 * Tests the GeminiVideoService's demo video condensing capability using existing
 * master script data from the database instead of uploading videos to Gemini.
 * This is faster and more efficient since it reuses previously processed video data.
 *
 * FUNCTIONALITY:
 * 1. Fetches demo video record from database by ID
 * 2. Uses existing masterScript, productInfo, and colorPalette data
 * 3. Sends AI prompt with master script context to Gemini (text-only)
 * 4. Parses JSON response with segments array
 * 5. Validates response format (captions, start/end times)
 * 6. Returns condensed segments without re-processing the video
 *
 * PARAMETERS (TEST_CONFIG):
 * - demoVideoId: string - Database ID of the demo video record to use
 * - exactDuration: number - Exact total duration for condensed version (seconds)
 * - numSegments: number - Target number of segments to create (1-20)
 * - contentGuide: string - Optional guidance for segment selection and captions
 *
 * OUTPUT FORMAT:
 * - segments: Array<{
 *     caption: string,    // Max 20 words
 *     start: number,      // Start timestamp in whole seconds
 *     end: number         // End timestamp in whole seconds
 *   }>
 * - totalDuration: number // Exact duration specified in input
 *
 * ADVANTAGES OVER VIDEO UPLOAD METHOD:
 * ✅ MUCH FASTER: No video download/upload to Gemini (saves 30-60 seconds)
 * ✅ NO STORAGE LIMITS: Doesn't consume Gemini's 20GB file storage quota
 * ✅ REUSABLE DATA: Leverages existing master script annotations
 * ✅ COST EFFICIENT: Smaller API requests (text-only vs video processing)
 * ✅ SERVERLESS FRIENDLY: No large file transfers or temporary storage
 *
 * REQUIREMENTS:
 * - Demo video must exist in database with master script data
 * - Master script must be generated first using generateMasterScriptFromUri
 * - Database must contain productInfo and colorPalette fields
 * - Environment Variable: GEMINI_API_KEY must be set
 *
 * DATABASE DEPENDENCIES:
 * Requires existing DemoVideo record with:
 * - masterScript: JSON array of time-based annotations
 * - productInfo: String description of the product
 * - colorPalette: JSON array of dominant colors
 * - durationSeconds: Original video duration
 *
 * VIDEOSTITCH INTEGRATION:
 * Output format is designed for seamless integration with @sassy/remotion VideoStitch:
 * - Timestamps are whole numbers for precise cutting
 * - Captions ready for overlay text
 * - Segment duration calculated for smooth transitions
 *
 * USAGE:
 * - Development: `pnpm test:demo-masterscript` (loads .env automatically)
 * - Production: Called via service methods in Next.js applications
 * - Integration: Results passed to VideoStitch composition for rendering
 *
 * EXAMPLE WORKFLOW:
 * 1. Upload demo video → Generate master script → Save to database
 * 2. Use this method to create multiple condensed versions quickly
 * 3. Different contentGuide values create different narratives from same video
 * 4. Pass results to VideoStitch for final video generation
 */
import { createGeminiVideoService } from "../src/index";

// Test configuration for demo video condensing from master script
const TEST_CONFIG = {
  // Using real demo video ID from database
  demoVideoId: "cmcctzxog00008z0k46s9m1ss",

  exactDuration: 12, // Exactly 12 seconds total
  numSegments: 4, // 4 segments of ~3 seconds each
  contentGuide:
    "Focus on user interactions and app features. Emphasize what buttons to click and what happens when you do. Make it actionable and clear for users who want to try the app.",
};

async function main() {
  console.log("🎬 Testing Demo Video Condensing from Master Script");
  console.log("===================================================");
  console.log("📊 Demo Video ID:", TEST_CONFIG.demoVideoId);
  console.log("⏱️ Exact Duration:", TEST_CONFIG.exactDuration, "seconds");
  console.log("📊 Target Segments:", TEST_CONFIG.numSegments);
  console.log("📝 Content Guide:", TEST_CONFIG.contentGuide);
  console.log("");

  // Check if demo video ID looks like a placeholder
  if (
    TEST_CONFIG.demoVideoId.includes("placeholder") ||
    TEST_CONFIG.demoVideoId.includes("xxxx")
  ) {
    console.error("❌ CONFIGURATION ERROR");
    console.error("======================");
    console.error(
      "Please update TEST_CONFIG.demoVideoId with a real demo video ID from your database.",
    );
    console.error("");
    console.error("💡 How to find a demo video ID:");
    console.error(
      "   1. Check your database DemoVideo table for existing records",
    );
    console.error(
      "   2. Or upload a video and generate master script first using:",
    );
    console.error("      - Upload video to S3");
    console.error("      - Call generateMasterScriptFromUri tRPC endpoint");
    console.error("      - Use the returned demoVideo.id");
    console.error("");
    console.error(
      "Example valid ID format: cm6abc123-def4-5678-9abc-def123456789",
    );
    process.exit(1);
  }

  try {
    // Create Gemini video service
    const geminiService = createGeminiVideoService();

    console.log("🚀 Starting demo condensing from master script...");
    console.log("");

    // Condense demo from master script
    const result = await geminiService.condenseDemoFromMasterScript({
      demoVideoId: TEST_CONFIG.demoVideoId,
      exactDuration: TEST_CONFIG.exactDuration,
      numSegments: TEST_CONFIG.numSegments,
      contentGuide: TEST_CONFIG.contentGuide,
    });

    console.log("");
    console.log("📊 DEMO CONDENSING RESULTS (FROM MASTER SCRIPT)");
    console.log("===============================================");
    console.log("📝 Total Segments:", result.segments.length);
    console.log("⏱️ Total Duration:", result.totalDuration, "seconds");
    console.log("");
    console.log("🎥 SEGMENTS:");
    console.log("============");

    result.segments.forEach((segment, index) => {
      const duration = segment.end - segment.start;
      console.log(`${index + 1}. "${segment.caption}"`);
      console.log(`   ⏱️ ${segment.start}s - ${segment.end}s (${duration}s)`);
      console.log("");
    });

    console.log(
      "✅ Demo condensing from master script completed successfully!",
    );
    console.log("");
    console.log("💡 These segments can be used with VideoStitch composition.");
    console.log(
      "💡 No video upload was needed - used existing master script data.",
    );
    console.log("💡 Much faster than processing the original video again.");

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

    console.log("");
    console.log("🚀 PERFORMANCE BENEFITS:");
    console.log("========================");
    console.log("⚡ No video download/upload (saves 30-60 seconds)");
    console.log("💾 No Gemini storage consumption (stays under 20GB limit)");
    console.log("💰 Lower API costs (text-only request vs video processing)");
    console.log(
      "🔄 Reusable master script data for multiple condensed versions",
    );
  } catch (error) {
    console.error("");
    console.error("❌ DEMO CONDENSING FROM MASTER SCRIPT FAILED");
    console.error("============================================");
    console.error(
      "Error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    console.error("");
    console.error("💡 Troubleshooting tips:");
    console.error("   - Make sure GEMINI_API_KEY is set in your .env file");
    console.error(
      "   - Verify the demoVideoId exists in your database DemoVideo table",
    );
    console.error(
      "   - Ensure the demo video has masterScript data (not empty/null)",
    );
    console.error(
      "   - Check that the demo video has productInfo and colorPalette fields",
    );
    console.error("   - Try reducing exactDuration or numSegments");
    console.error("");
    console.error("🔍 Common issues:");
    console.error(
      "   - Demo video not found: Check if the ID is correct and exists",
    );
    console.error(
      "   - No master script: Generate master script first using generateMasterScriptFromUri",
    );
    console.error(
      "   - Invalid duration: Make sure exactDuration is reasonable for the video length",
    );

    process.exit(1);
  }
}

// Run the main function
main();
