#!/usr/bin/env bun

/**
 * VIRAL VIDEO HOOK EXTRACTION TEST SCRIPT
 * =======================================
 * 
 * PURPOSE:
 * Tests the GeminiVideoService's viral hook extraction capability using a real TikTok video.
 * Extracts the precise timestamp where the hook ends and main content begins.
 * 
 * FUNCTIONALITY:
 * 1. Downloads video from S3 URL to temporary local file
 * 2. Uploads video to Gemini Files API
 * 3. Waits for Gemini to process the video (PROCESSING -> ACTIVE state)
 * 4. Sends AI prompt to analyze hook timing
 * 5. Parses JSON response with hook end timestamp
 * 6. Validates response format (MM:SS timestamp)
 * 7. Performs dual cleanup (local temp file + Gemini file)
 * 
 * PARAMETERS (TEST_CONFIG):
 * - videoUrl: string - S3 URL of the viral TikTok video to analyze
 * 
 * OUTPUT FORMAT:
 * - hookEndTimestamp: string (MM:SS format, e.g., "00:07")
 * - confidence: string ("high", "medium", "low")
 * - description: string (explanation of what happens at hook end)
 * 
 * CLEANUP PROCESS (TWO-STAGE):
 * 1. LOCAL CLEANUP: Removes temporary downloaded video file from OS temp directory
 *    - Location: /var/folders/.../gemini-video-{timestamp}-{filename}.mp4
 *    - Handled in finally block of uploadVideoToGemini()
 *    - Uses fs.unlinkSync() to delete file
 * 
 * 2. GEMINI API CLEANUP: Deletes uploaded file from Gemini's cloud storage
 *    - Reason: Gemini has 20GB total storage limit per project
 *    - Handled in finally block of extractViralHook()
 *    - Uses client.files.delete({ name: fileName })
 * 
 * SERVERLESS DEPLOYMENT CONSIDERATIONS:
 * ✅ WORKS: Gemini API cleanup (cloud-to-cloud deletion)
 * ⚠️  WORKS BUT UNNECESSARY: Local temp file cleanup
 *    - Vercel serverless functions have ephemeral file system
 *    - Temp files are automatically destroyed when function execution ends
 *    - Our cleanup code will still run but is redundant in serverless
 *    - No harm in keeping it for local development consistency
 * 
 * VERCEL DEPLOYMENT NOTES:
 * - Ensure GEMINI_API_KEY is set in Vercel environment variables
 * - Function timeout should be sufficient for video processing (60s+ recommended)
 * - No persistent storage concerns since files are ephemeral
 * - Network bandwidth matters for S3 download and Gemini upload
 * 
 * USAGE:
 * - Development: `pnpm test:viral` (loads .env automatically)
 * - Production: Called via tRPC endpoints with video URLs
 */

import { createGeminiVideoService } from '../src/index';

// Test configuration using the TikTok sample video
const TEST_CONFIG = {
  videoUrl: 'https://viralcut-s3bucket.s3.us-west-2.amazonaws.com/video-sample/1750055333038-ix8d8sz0-TikTok_video__7497132021819477256-7497132021819477256.mp4',
};

async function main() {
  console.log('🎣 Testing Viral Video Hook Extraction');
  console.log('=====================================');
  console.log('📹 Video URL:', TEST_CONFIG.videoUrl);
  console.log('');

  try {
    // Create Gemini video service
    const geminiService = createGeminiVideoService();
    
    console.log('🚀 Starting hook extraction...');
    console.log('');
    
    // Extract viral hook
    const result = await geminiService.extractViralHook({
      videoUrl: TEST_CONFIG.videoUrl,
    });
    
    console.log('');
    console.log('📊 HOOK EXTRACTION RESULTS');
    console.log('===========================');
    console.log('⏰ Hook ends at:', result.hookEndTimestamp);
    console.log('🎯 Confidence:', result.confidence || 'Not specified');
    console.log('📝 Description:', result.description || 'Not provided');
    console.log('');
    console.log('✅ Hook extraction completed successfully!');
    console.log('');
    console.log('💡 This timestamp can be used to cut the hook from the viral video.');
    console.log('💡 Format is compatible with VideoStitch composition ranges.');
    
  } catch (error) {
    console.error('');
    console.error('❌ HOOK EXTRACTION FAILED');
    console.error('==========================');
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('');
    console.error('💡 Troubleshooting tips:');
    console.error('   - Make sure GEMINI_API_KEY is set in your .env file');
    console.error('   - Verify the video URL is accessible and points to a valid MP4 file');
    console.error('   - Check your internet connection');
    console.error('   - Ensure the video is uploaded to S3 and publicly accessible');
    
    process.exit(1);
  }
}

// Run the main function
main(); 