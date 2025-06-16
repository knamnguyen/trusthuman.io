#!/usr/bin/env bun

/**
 * TikTok Video Processor Script
 * 
 * Purpose: Process downloaded TikTok videos by uploading to S3 and saving metadata to database
 * 
 * Package.json Usage:
 *   "process-videos": "bun scripts/process-videos.ts"
 * 
 * Command Line Usage:
 *   pnpm process-videos [options]
 *   bun scripts/process-videos.ts [options]
 * 
 * Parameters (ALL OPTIONAL):
 *   --skip-duplicates, -s    Skip videos that already exist in database (check by webpage_url)
 *   --skip-cleanup, -c       Don't delete processed files after successful upload/save
 *   --dry-run, -d           Show what would be processed without actually doing it
 *   --help, -h              Show help message
 * 
 * Behavior:
 *   - Scans ./downloads/ folder for video files (.mp4, .webm, .mkv) and their .info.json metadata
 *   - For each video pair: uploads video to S3 (viralcut-s3bucket/video-sample/) 
 *   - Saves metadata to SampleVideo database table with S3 URL reference
 *   - By default, cleans up processed files after successful upload
 *   - Requires AWS credentials and database connection to be configured
 * 
 * Prerequisites:
 *   - Videos must be downloaded first (use tiktok-download script)
 *   - AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY environment variables
 *   - S3_BUCKET environment variable (defaults to "viralcut-s3bucket")
 *   - Database connection configured via @sassy/db package
 * 
 * Examples:
 *   pnpm process-videos                           # Process all videos, clean up after
 *   pnpm process-videos --skip-duplicates        # Skip videos already in database
 *   pnpm process-videos --skip-cleanup           # Keep files after processing
 *   pnpm process-videos --dry-run                # Preview what would be processed
 *   bun scripts/process-videos.ts -s -c          # Skip duplicates, keep files
 */

import { readdir, readFile, unlink, rmdir } from "fs/promises";
import { join, extname, basename } from "path";
import { S3BucketService } from "@sassy/s3";
import { db } from "@sassy/db";

interface TikTokVideoMetadata {
  id: string;
  title: string;
  description?: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  duration: number;
  webpage_url: string;
}

interface ProcessVideoArgs {
  skipDuplicates?: boolean;
  skipCleanup?: boolean;
  dryRun?: boolean;
}

class VideoProcessor {
  private s3Service: S3BucketService;
  private downloadsDir: string;

  constructor() {
    // Initialize S3 service
    this.s3Service = new S3BucketService({
      region: process.env.AWS_REGION || "us-west-2",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      bucket: process.env.S3_BUCKET || "viralcut-s3bucket",
    });

    this.downloadsDir = join(process.cwd(), "downloads");
  }

  /**
   * Parse command line arguments
   */
  private parseArgs(): ProcessVideoArgs {
    const args = process.argv.slice(2);
    const result: ProcessVideoArgs = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case "--skip-duplicates":
        case "-s":
          result.skipDuplicates = true;
          break;
        case "--skip-cleanup":
        case "-c":
          result.skipCleanup = true;
          break;
        case "--dry-run":
        case "-d":
          result.dryRun = true;
          break;
      }
    }

    return result;
  }

  /**
   * Get all video files and their corresponding JSON metadata files
   */
  private async getVideoFiles(): Promise<{ videoFile: string; jsonFile: string }[]> {
    try {
      const files = await readdir(this.downloadsDir);
      const videoFiles = files.filter(file => 
        ['.mp4', '.webm', '.mkv'].includes(extname(file))
      );

      const pairs: { videoFile: string; jsonFile: string }[] = [];

      for (const videoFile of videoFiles) {
        // Extract the base name without extension and find corresponding JSON
        const baseName = basename(videoFile, extname(videoFile));
        const jsonFile = files.find(file => 
          file.endsWith('.info.json') && file.startsWith(baseName)
        );

        if (jsonFile) {
          pairs.push({
            videoFile: join(this.downloadsDir, videoFile),
            jsonFile: join(this.downloadsDir, jsonFile)
          });
        } else {
          console.warn(`⚠️  No metadata file found for ${videoFile}`);
        }
      }

      return pairs;
    } catch (error) {
      console.error("Error reading downloads directory:", error);
      return [];
    }
  }

  /**
   * Parse JSON metadata file and validate it's a video
   */
  private async parseMetadata(jsonFilePath: string): Promise<TikTokVideoMetadata | null> {
    try {
      const jsonContent = await readFile(jsonFilePath, 'utf-8');
      const metadata = JSON.parse(jsonContent);

      // Only process if this is a video type
      if (metadata._type !== "video") {
        console.log(`⏭️  Skipping non-video content: ${metadata._type || "unknown type"}`);
        return null;
      }

      return {
        id: metadata.id || "",
        title: metadata.title || metadata.fulltitle || "",
        description: metadata.description || "",
        view_count: metadata.view_count || 0,
        like_count: metadata.like_count || 0,
        comment_count: metadata.comment_count || 0,
        duration: metadata.duration || 0,
        webpage_url: metadata.webpage_url || "",
      };
    } catch (error) {
      console.error(`Error parsing metadata from ${jsonFilePath}:`, error);
      return null;
    }
  }

  /**
   * Check if video already exists in database
   */
  private async videoExists(webpageUrl: string): Promise<boolean> {
    try {
      const existingVideo = await db.sampleVideo.findUnique({
        where: { webpageUrl },
      });
      return !!existingVideo;
    } catch (error) {
      console.error("Error checking if video exists:", error);
      return false;
    }
  }

  /**
   * Upload video to S3 using optimized multipart upload for large files
   */
  private async uploadVideoToS3(videoFilePath: string, filename: string): Promise<string | null> {
    try {
      console.log(`📤 Uploading ${filename} to S3...`);
      
      // Read the video file
      const videoBuffer = await readFile(videoFilePath);
      
      // Log file size
      const fileSizeMB = (videoBuffer.length / 1024 / 1024).toFixed(2);
      console.log(`📁 File size: ${fileSizeMB}MB`);
      
      // Generate unique key for the video
      const key = this.s3Service.generateUniqueKey(filename, "video-sample");
      
      // Upload to S3 using server-side multipart upload for large files
      const result = await this.s3Service.multipartUploadServer(
        videoBuffer,
        key,
        "video/mp4"
      );

      console.log(`✅ Video uploaded successfully: ${result.location}`);
      return result.location;
    } catch (error) {
      console.error(`Error uploading video to S3:`, error);
      return null;
    }
  }

  /**
   * Save video metadata to database
   */
  private async saveToDatabase(metadata: TikTokVideoMetadata, s3Url: string): Promise<boolean> {
    try {
      console.log(`💾 Saving metadata to database for: ${metadata.title}`);
      
      await db.sampleVideo.create({
        data: {
          webpageUrl: metadata.webpage_url,
          s3Url: s3Url,
          title: metadata.title,
          description: metadata.description,
          views: metadata.view_count,
          comments: metadata.comment_count,
          likes: metadata.like_count,
          durationSeconds: Math.round(metadata.duration),
        },
      });

      console.log(`✅ Metadata saved successfully`);
      return true;
    } catch (error) {
      console.error(`Error saving to database:`, error);
      return false;
    }
  }

  /**
   * Clean up downloaded files
   */
  private async cleanupFiles(filesToDelete: string[]): Promise<void> {
    console.log(`🧹 Cleaning up ${filesToDelete.length} files...`);
    
    for (const file of filesToDelete) {
      try {
        await unlink(file);
        console.log(`🗑️  Deleted: ${basename(file)}`);
      } catch (error) {
        console.error(`Error deleting ${file}:`, error);
      }
    }

    // Try to remove the downloads directory if it's empty
    try {
      const remainingFiles = await readdir(this.downloadsDir);
      if (remainingFiles.length === 0) {
        await rmdir(this.downloadsDir);
        console.log(`📂 Removed empty downloads directory`);
      }
    } catch (error) {
      // Directory not empty or other error, ignore
    }
  }

  /**
   * Process all downloaded videos
   */
  async processVideos(): Promise<void> {
    const args = this.parseArgs();
    console.log("🚀 Starting video processing...");
    if (args.dryRun) {
      console.log("🔍 DRY RUN MODE - No actual processing will occur");
    }
    console.log(`📁 Processing videos from: ${this.downloadsDir}`);

    const videoPairs = await this.getVideoFiles();
    
    if (videoPairs.length === 0) {
      console.log("📭 No video files found to process.");
      return;
    }

    console.log(`🎬 Found ${videoPairs.length} video(s) to process`);

    let processed = 0;
    let skipped = 0;
    let failed = 0;
    const filesToCleanup: string[] = [];

    for (const { videoFile, jsonFile } of videoPairs) {
      const videoFilename = basename(videoFile);
      console.log(`\n🎯 Processing: ${videoFilename}`);

      // Parse metadata
      const metadata = await this.parseMetadata(jsonFile);
      if (!metadata) {
        console.error(`❌ Failed to parse metadata for ${videoFilename}`);
        failed++;
        continue;
      }

      // Check for duplicates
      if (args.skipDuplicates && await this.videoExists(metadata.webpage_url)) {
        console.log(`⏭️  Video already exists in database, skipping: ${metadata.title}`);
        skipped++;
        filesToCleanup.push(videoFile, jsonFile);
        continue;
      }

      if (args.dryRun) {
        console.log(`🔍 [DRY RUN] Would upload: ${videoFilename}`);
        console.log(`🔍 [DRY RUN] Would save metadata:`);
        console.dir(metadata);
        processed++;
        continue;
      }

      // Upload to S3
      const s3Url = await this.uploadVideoToS3(videoFile, videoFilename);
      if (!s3Url) {
        console.error(`❌ Failed to upload ${videoFilename} to S3`);
        failed++;
        continue;
      }

      // Save to database
      const saved = await this.saveToDatabase(metadata, s3Url);
      if (!saved) {
        console.error(`❌ Failed to save metadata for ${videoFilename}`);
        failed++;
        continue;
      }

      processed++;
      filesToCleanup.push(videoFile, jsonFile);
      
      // Also clean up description file if it exists
      const descFile = videoFile.replace(extname(videoFile), '.description');
      try {
        await readFile(descFile);
        filesToCleanup.push(descFile);
      } catch {
        // Description file doesn't exist, ignore
      }
    }

    // Cleanup files
    if (!args.skipCleanup && filesToCleanup.length > 0) {
      await this.cleanupFiles(filesToCleanup);
    }

    // Summary
    console.log(`\n📊 Processing Summary:`);
    console.log(`   ✅ Processed: ${processed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📁 Cleaned up: ${!args.skipCleanup ? filesToCleanup.length : 0} files`);
  }

  /**
   * Print usage information
   */
  private printUsage(): void {
    console.log(`
🎬 TikTok Video Processor

Usage: bun scripts/process-videos.ts [options]

Options:
  -s, --skip-duplicates    Skip videos that already exist in database
  -c, --skip-cleanup       Don't delete processed files
  -d, --dry-run           Show what would be processed without doing it
  -h, --help              Show this help message

Description:
  Processes downloaded TikTok videos by:
  1. Reading video files and metadata from downloads folder
  2. Checking for existing videos in database (optional)
  3. Uploading videos to S3 under video-sample/ prefix
  4. Saving metadata to SampleVideo table
  5. Cleaning up processed files (optional)

Examples:
  bun scripts/process-videos.ts                    # Process all videos
  bun scripts/process-videos.ts --skip-duplicates  # Skip existing videos
  bun scripts/process-videos.ts --skip-cleanup     # Keep files after processing
    `);
  }
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    const processor = new VideoProcessor();
    (processor as any).printUsage();
    return;
  }

  try {
    const processor = new VideoProcessor();
    await processor.processVideos();
  } catch (error) {
    console.error("❌ Fatal error during video processing:", error);
    process.exit(1);
  }
}

// Run the script
main(); 