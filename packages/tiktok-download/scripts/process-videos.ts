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
 *   --skip-voiceovers, -v    Skip videos that contain voice-over content (don't save to database)
 *   --check-voiceovers       Enable voice-over detection but don't skip (log results only)
 *   --dry-run, -d           Show what would be processed without actually doing it
 *   --help, -h              Show help message
 *
 * Behavior:
 *   - Scans ./downloads/ folder for video files (.mp4, .webm, .mkv) and their .info.json metadata
 *   - Optional: Checks for voice-over content using Whisper + Gemini AI analysis
 *   - For each video pair: uploads video to S3 (viralcut-s3bucket/video-sample/)
 *   - Saves metadata to HookViralVideo database table with S3 URL reference
 *   - By default, cleans up processed files after successful upload
 *   - Requires AWS credentials and database connection to be configured
 *
 * Prerequisites:
 *   - Videos must be downloaded first (use tiktok-download script)
 *   - AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY environment variables
 *   - S3_BUCKET environment variable (defaults to "viralcut-s3bucket")
 *   - REPLICATE_API_TOKEN environment variable (for voice-over detection)
 *   - GEMINI_API_KEY environment variable (for voice-over detection)
 *   - Database connection configured via @sassy/db package
 *   - ffmpeg installed and available in PATH (for voice-over detection)
 *
 * Examples:
 *   pnpm process-videos                           # Process all videos, clean up after
 *   pnpm process-videos --skip-duplicates        # Skip videos already in database
 *   pnpm process-videos --skip-voiceovers        # Skip videos with voice-over content
 *   pnpm process-videos --check-voiceovers       # Check voice-overs but don't skip
 *   pnpm process-videos --skip-cleanup           # Keep files after processing
 *   pnpm process-videos --dry-run                # Preview what would be processed
 *   bun scripts/process-videos.ts -s -v          # Skip duplicates and voice-overs
 */
import { existsSync } from "fs";
import { readdir, readFile, rmdir, unlink, writeFile } from "fs/promises";
import { basename, dirname, extname, join } from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import chalk from "chalk";
import { format } from "date-fns";
import ffmpeg from "fluent-ffmpeg";
import pLimit from "p-limit";
import Replicate from "replicate";

import type { ColorPalette } from "@sassy/gemini-video";
// Local imports
import { db } from "@sassy/db";
import {
  createGeminiVideoService,
  GeminiVideoService,
} from "@sassy/gemini-video";
import { VideoVectorStore } from "@sassy/langchain/vector-store";
import { RemotionService } from "@sassy/remotion";
import { S3BucketService } from "@sassy/s3";

import type { GeminiAnalysisResponse } from "../src/schema-validators";
import { geminiAnalysisResponseSchema } from "../src/schema-validators";

interface TikTokVideoMetadata {
  id: string;
  title: string;
  description?: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  duration: number;
  webpage_url: string;
  hookEndTimestamp?: string;
  hookCutConfidence?: string;
  hookInfo?: string;
  hookCutUrl?: string;
  colorPalette?: ColorPalette;
}

interface ProcessVideoArgs {
  skipDuplicates?: boolean;
  skipCleanup?: boolean;
  skipVoiceovers?: boolean;
  checkVoiceovers?: boolean;
  dryRun?: boolean;
}

class VideoProcessor {
  private s3Service: S3BucketService;
  private videoVectorStore: VideoVectorStore;
  private replicate?: Replicate;
  private gemini?: GoogleGenerativeAI;
  private geminiVideoService: any;
  private remotionService: RemotionService;
  private downloadsDir: string;

  constructor() {
    // Initialize S3 service
    this.s3Service = new S3BucketService({
      region: process.env.AWS_REGION || "us-west-2",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      bucket: process.env.S3_BUCKET || "viralcut-s3bucket",
    });

    // Initialize vector store
    this.videoVectorStore = new VideoVectorStore();

    // Initialize voice-over detection services if API keys are available
    if (process.env.REPLICATE_API_TOKEN) {
      this.replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      });
    }

    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    // Initialize Gemini Video Service for hook extraction
    this.geminiVideoService = createGeminiVideoService();

    // Initialize RemotionService
    this.remotionService = new RemotionService();

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
        case "--skip-voiceovers":
        case "-v":
          result.skipVoiceovers = true;
          break;
        case "--check-voiceovers":
          result.checkVoiceovers = true;
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
   * Extract audio from video file for voice-over detection (optimized for speed)
   */
  private async extractAudioForAnalysis(videoPath: string): Promise<string> {
    console.log(`🎵 Extracting audio for voice-over analysis...`);

    const audioPath = join(dirname(videoPath), `analysis-${Date.now()}.wav`);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat("wav")
        .audioCodec("pcm_s16le")
        .audioFrequency(16000)
        .audioChannels(1)
        .duration(45) // Only extract first 45 seconds for faster processing
        .on("start", (commandLine: string) => {
          console.log(`🔧 FFmpeg command: ${commandLine}`);
        })
        .on("progress", (progress: any) => {
          if (progress.percent) {
            console.log(
              `⏳ Audio extraction: ${Math.round(progress.percent)}%`,
            );
          }
        })
        .on("end", () => {
          console.log(
            `✅ Audio extracted for analysis: ${basename(audioPath)}`,
          );
          resolve(audioPath);
        })
        .on("error", (error: Error) => {
          console.error(`❌ FFmpeg error: ${error.message}`);
          reject(new Error(`Audio extraction failed: ${error.message}`));
        })
        .save(audioPath);
    });
  }

  /**
   * Transcribe audio using Replicate Whisper API
   */
  private async transcribeAudio(audioPath: string): Promise<string> {
    if (!this.replicate) {
      throw new Error(
        "Replicate API not initialized - REPLICATE_API_TOKEN required",
      );
    }

    console.log(`🎤 Transcribing audio with Whisper...`);

    try {
      // Read the audio file as buffer and convert to base64
      const audioBuffer = await readFile(audioPath);
      const audioBase64 = `data:audio/wav;base64,${audioBuffer.toString("base64")}`;

      console.log(
        `📁 Audio file size: ${(audioBuffer.length / 1024 / 1024).toFixed(2)}MB`,
      );

      const output = (await this.replicate.run(
        "vaibhavs10/incredibly-fast-whisper:3ab86df6c8f54c11309d4d1f930ac292bad43ace52d10c80d87eb258b3c9f79c",
        {
          input: {
            audio: audioBase64,
            task: "transcribe",
            language: "None",
            timestamp: "chunk",
            batch_size: 64,
            diarise_audio: false,
          },
        },
      )) as { text: string };

      const transcription = output.text || "";
      console.log(`✅ Transcription completed (${transcription.length} chars)`);

      return transcription;
    } catch (error) {
      throw new Error(
        `Transcription failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Analyze transcription with Gemini to determine if it's voice-over or music/soundtrack
   */
  private async analyzeTranscriptionWithGemini(
    transcription: string,
  ): Promise<GeminiAnalysisResponse> {
    if (!this.gemini) {
      throw new Error("Gemini API not initialized - GEMINI_API_KEY required");
    }

    console.log(`🧠 Analyzing transcription with Gemini AI...`);

    try {
      const model = this.gemini.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
      });

      const prompt = `
You are analyzing a transcription from a TikTok video to determine if it contains voice-over content (human speech/narration) or just music/soundtrack lyrics.

Transcription to analyze:
"${transcription}"

Please analyze this transcription and determine:
1. Is this voice-over content (human speech, narration, talking) or music/soundtrack lyrics?
2. What's your confidence level in this determination?

Voice-over indicators:
- Conversational language and natural speech patterns
- Personal pronouns (I, you, we, my, your)
- Questions and direct address to audience
- Technical explanations or storytelling
- Natural pauses and discourse markers (so, well, now, today)
- Complete sentences with varied structure

Music/soundtrack indicators:
- Repetitive phrases or choruses
- Simple, rhythmic language
- Lack of conversational elements
- Song-like structure with rhyming
- Commands or exclamations without context (come on, rock your body)
- Short, repetitive phrases

Respond with a JSON object in this exact format:
{
  "voiceoverDetected": boolean,
  "confidence": number between 0.0 and 1.0
}

Be strict in your analysis - only classify as voice-over if you're confident it's human speech/narration, not song lyrics.
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      console.log(`🤖 Gemini response: ${responseText.substring(0, 100)}...`);

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in Gemini response");
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      const validatedResponse =
        geminiAnalysisResponseSchema.parse(parsedResponse);

      console.log(
        `✅ Voice-over detected: ${validatedResponse.voiceoverDetected} (${(validatedResponse.confidence * 100).toFixed(1)}% confidence)`,
      );

      return validatedResponse;
    } catch (error) {
      console.warn(
        `⚠️  Gemini analysis failed, falling back to basic detection:`,
        error,
      );

      // Fallback to basic length-based detection
      return {
        voiceoverDetected: transcription.trim().length >= 20,
        confidence: 0.5,
      };
    }
  }

  /**
   * Check if video contains voice-over content
   */
  private async checkVoiceOver(
    videoFilePath: string,
  ): Promise<{ hasVoiceover: boolean; confidence: number }> {
    const tempFiles: string[] = [];

    try {
      // Extract audio for analysis
      const audioPath = await this.extractAudioForAnalysis(videoFilePath);
      tempFiles.push(audioPath);

      // Transcribe audio
      const transcription = await this.transcribeAudio(audioPath);

      // Analyze with Gemini if transcription has sufficient content
      if (transcription.trim().length >= 20) {
        const analysis =
          await this.analyzeTranscriptionWithGemini(transcription);
        return {
          hasVoiceover: analysis.voiceoverDetected,
          confidence: analysis.confidence,
        };
      } else {
        console.log(
          `ℹ️  Transcription too short (${transcription.trim().length} chars), assuming no voice-over`,
        );
        return {
          hasVoiceover: false,
          confidence: 0.8,
        };
      }
    } finally {
      // Clean up temporary audio files
      for (const file of tempFiles) {
        try {
          if (existsSync(file)) {
            await unlink(file);
            console.log(`🗑️  Cleaned up: ${basename(file)}`);
          }
        } catch (error) {
          console.warn(`⚠️  Failed to clean up ${file}:`, error);
        }
      }
    }
  }

  /**
   * Get all video files and their corresponding JSON metadata files
   */
  private async getVideoFiles(): Promise<
    { videoFile: string; jsonFile: string }[]
  > {
    try {
      const files = await readdir(this.downloadsDir);
      const videoFiles = files.filter((file) =>
        [".mp4", ".webm", ".mkv"].includes(extname(file)),
      );

      const pairs: { videoFile: string; jsonFile: string }[] = [];

      for (const videoFile of videoFiles) {
        // Extract the base name without extension and find corresponding JSON
        const baseName = basename(videoFile, extname(videoFile));
        const jsonFile = files.find(
          (file) => file.endsWith(".info.json") && file.startsWith(baseName),
        );

        if (jsonFile) {
          pairs.push({
            videoFile: join(this.downloadsDir, videoFile),
            jsonFile: join(this.downloadsDir, jsonFile),
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
  private async parseMetadata(
    jsonFilePath: string,
  ): Promise<TikTokVideoMetadata | null> {
    try {
      const jsonContent = await readFile(jsonFilePath, "utf-8");
      const metadata = JSON.parse(jsonContent);

      // Only process if this is a video type
      if (metadata._type !== "video") {
        console.log(
          `⏭️  Skipping non-video content: ${metadata._type || "unknown type"}`,
        );
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
      const existingVideo = await db.hookViralVideo.findUnique({
        where: { webpageUrl },
      });
      return !!existingVideo;
    } catch (error) {
      console.error("Error checking if video exists:", error);
      return false;
    }
  }

  /**
   * Cut viral hook using Remotion Lambda and wait for completion
   */
  private async cutViralHook(
    s3Url: string,
    hookEndTimestamp: string,
    videoFilename: string,
  ): Promise<string | null> {
    try {
      console.log(
        `✂️  Cutting viral hook from ${videoFilename} at ${hookEndTimestamp}...`,
      );

      // Start the render
      const renderResult = await this.remotionService.processVideoStitch({
        videoUrl: s3Url,
        clips: [
          {
            range: `00:00-${hookEndTimestamp}`,
            caption: "Viral Hook",
          },
        ],
        originalDuration: 60, // Default duration, will be updated when we have metadata
      });

      if (!renderResult.success) {
        console.error(`❌ Hook cutting failed:`, renderResult.message);
        return null;
      }

      console.log(
        `🎬 Render started successfully. Render ID: ${renderResult.renderId}`,
      );
      console.log(`⏳ Waiting for render to complete...`);

      // Poll for completion
      const maxAttempts = 60; // 5 minutes max (5 second intervals)
      let attempts = 0;

      while (attempts < maxAttempts) {
        attempts++;

        try {
          const progress = await this.remotionService.getRenderProgress(
            renderResult.renderId,
            renderResult.bucketName,
          );

          console.log(
            `📊 Render progress: ${(progress.progress * 100).toFixed(1)}% (attempt ${attempts}/${maxAttempts})`,
          );

          if (progress.done) {
            if (progress.outputFile) {
              // Check if outputFile is already a complete URL
              const finalUrl = progress.outputFile.startsWith("https://")
                ? progress.outputFile
                : this.remotionService.generateDownloadUrl(
                    progress.outputBucket || "",
                    progress.outputFile,
                  );
              console.log(`✅ Viral hook cut completed: ${finalUrl}`);
              return finalUrl;
            } else {
              console.error(`❌ Render completed but no output file found`);
              return null;
            }
          }

          if (
            progress.fatalErrorEncountered ||
            (progress.errors && progress.errors.length > 0)
          ) {
            console.error(`❌ Render failed with errors:`, progress.errors);
            return null;
          }

          // Wait 5 seconds before next check
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (progressError) {
          console.warn(
            `⚠️  Error checking progress (attempt ${attempts}):`,
            progressError,
          );

          // Wait a bit longer on error
          await new Promise((resolve) => setTimeout(resolve, 10000));
        }
      }

      console.error(`❌ Render timed out after ${maxAttempts} attempts`);
      return null;
    } catch (error) {
      console.error(`❌ Hook cutting failed for ${videoFilename}:`, error);
      return null;
    }
  }

  /**
   * Extract viral hook from S3 URL using GeminiVideoService
   */
  private async extractViralHook(s3Url: string): Promise<{
    hookEndTimestamp: string;
    confidence: string;
    hookInfo: string;
    colorPalette: ColorPalette;
  }> {
    console.log(`🎣 Extracting viral hook from S3 URL...`);

    try {
      const result = await this.geminiVideoService.extractViralHook({
        videoUrl: s3Url,
      });

      console.log(`✅ Hook extraction completed: ${result.hookEndTimestamp}`);
      console.log(
        `🎨 Color palette extracted with ${result.colorPalette.length} colors`,
      );

      return {
        hookEndTimestamp: result.hookEndTimestamp,
        confidence: result.confidence || "medium",
        hookInfo: result.hookInfo || "",
        colorPalette: result.colorPalette,
      };
    } catch (error) {
      console.error(`❌ Hook extraction failed:`, error);
      throw new Error(
        `Hook extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Upload video to S3 using optimized multipart upload for large files
   */
  private async uploadVideoToS3(
    videoFilePath: string,
    filename: string,
  ): Promise<string | null> {
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
        "video/mp4",
      );

      console.log(`✅ Video uploaded successfully: ${result.location}`);
      return result.location;
    } catch (error) {
      console.error(`Error uploading video to S3:`, error);
      return null;
    }
  }

  /**
   * Save video metadata to database with vector embedding
   */
  private async saveToDatabase(
    metadata: TikTokVideoMetadata,
    s3Url: string,
  ): Promise<boolean> {
    try {
      console.log(`💾 Saving metadata to database for: ${metadata.title}`);

      // Create the video record first
      const savedVideo = await db.hookViralVideo.create({
        data: {
          webpageUrl: metadata.webpage_url,
          s3Url: s3Url,
          hookEndTimestamp: metadata.hookEndTimestamp || "00:00",
          hookCutConfidence: metadata.hookCutConfidence,
          hookInfo: metadata.hookInfo,
          hookCutUrl: metadata.hookCutUrl,
          title: metadata.title,
          description: metadata.description,
          colorPalette: metadata.colorPalette
            ? JSON.parse(JSON.stringify(metadata.colorPalette))
            : undefined,
          views: metadata.view_count,
          comments: metadata.comment_count,
          likes: metadata.like_count,
          durationSeconds: Math.round(metadata.duration),
        },
      });

      console.log(`✅ Metadata saved successfully`);

      // Generate and store both text and color embeddings using VideoVectorStore
      try {
        console.log(`🧠 Generating embeddings (text and color)...`);
        await this.videoVectorStore.addVideoWithEmbedding({
          id: savedVideo.id,
          description: metadata.description || null,
          hookInfo: metadata.hookInfo || null,
          title: metadata.title,
          s3Url: s3Url,
          views: metadata.view_count,
          likes: metadata.like_count,
          comments: metadata.comment_count,
          durationSeconds: Math.round(metadata.duration),
          colorPalette: metadata.colorPalette || null,
        });
        console.log(`✅ All embeddings generated and saved successfully`);
      } catch (embeddingError) {
        console.warn(`⚠️  Failed to generate embeddings:`, embeddingError);
        // Don't fail the entire operation if embedding fails
      }

      return true;
    } catch (error) {
      console.error(`Error saving to database:`, error);
      return false;
    }
  }

  /**
   * Add video and related files to cleanup list
   */
  private addVideoFilesToCleanup(
    videoFile: string,
    jsonFile: string,
    filesToCleanup: string[],
  ): void {
    // Add video and metadata files
    filesToCleanup.push(videoFile, jsonFile);

    // Also add description file if it exists
    const descFile = videoFile.replace(extname(videoFile), ".description");
    try {
      if (existsSync(descFile)) {
        filesToCleanup.push(descFile);
      }
    } catch {
      // Description file doesn't exist, ignore
    }
  }

  /**
   * Get playlist metadata files for cleanup
   */
  private async getPlaylistMetadataFiles(): Promise<string[]> {
    try {
      const files = await readdir(this.downloadsDir);
      // Find playlist metadata files (user-level .info.json files)
      // These have format: username-{hash}.info.json
      const playlistFiles = files.filter(
        (file) =>
          file.endsWith(".info.json") &&
          !file.match(/\d{13,}\.info\.json$/) && // Not video files (which have long numeric IDs)
          file.includes("-MS4w"), // Playlist files contain this hash pattern
      );

      return playlistFiles.map((file) => join(this.downloadsDir, file));
    } catch (error) {
      console.warn("Error finding playlist metadata files:", error);
      return [];
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

    if (args.skipVoiceovers || args.checkVoiceovers) {
      if (!this.replicate || !this.gemini) {
        console.error(
          "❌ Voice-over detection requires REPLICATE_API_TOKEN and GEMINI_API_KEY",
        );
        console.log("ℹ️  Continuing without voice-over detection...");
        args.skipVoiceovers = false;
        args.checkVoiceovers = false;
      } else {
        console.log(
          `🎤 Voice-over detection enabled (${args.skipVoiceovers ? "will skip" : "will log only"})`,
        );
      }
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
    let skippedVoiceovers = 0;
    let hookExtractionFailed = 0;
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
      if (
        args.skipDuplicates &&
        (await this.videoExists(metadata.webpage_url))
      ) {
        console.log(
          `⏭️  Video already exists in database, skipping: ${metadata.title}`,
        );
        skipped++;
        this.addVideoFilesToCleanup(videoFile, jsonFile, filesToCleanup);
        continue;
      }

      // Check for voice-overs if enabled
      if (args.skipVoiceovers || args.checkVoiceovers) {
        try {
          const voiceoverCheck = await this.checkVoiceOver(videoFile);

          if (voiceoverCheck.hasVoiceover) {
            console.log(
              `🎤 Voice-over detected (${(voiceoverCheck.confidence * 100).toFixed(1)}% confidence)`,
            );

            if (args.skipVoiceovers) {
              console.log(
                `⏭️  Skipping video with voice-over: ${metadata.title}`,
              );
              skippedVoiceovers++;
              this.addVideoFilesToCleanup(videoFile, jsonFile, filesToCleanup);
              continue;
            }
          } else {
            console.log(
              `🎵 No voice-over detected (${(voiceoverCheck.confidence * 100).toFixed(1)}% confidence)`,
            );
          }
        } catch (error) {
          console.warn(
            `⚠️  Voice-over detection failed for ${videoFilename}:`,
            error,
          );
          console.log(`ℹ️  Continuing with processing...`);
        }
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

      // Extract viral hook after S3 upload
      try {
        const hookData = await this.extractViralHook(s3Url);
        metadata.hookEndTimestamp = hookData.hookEndTimestamp;
        metadata.hookCutConfidence = hookData.confidence;
        metadata.hookInfo = hookData.hookInfo;
        metadata.colorPalette = hookData.colorPalette;
        console.log(`✅ Hook extraction successful for ${videoFilename}`);
        console.log(
          `🎨 Color palette extracted with ${hookData.colorPalette.length} colors`,
        );

        // Cut the viral hook using Remotion Lambda
        const hookCutResult = await this.cutViralHook(
          s3Url,
          hookData.hookEndTimestamp,
          videoFilename,
        );
        if (hookCutResult) {
          metadata.hookCutUrl = hookCutResult;
          console.log(`✅ Hook cutting initiated for ${videoFilename}`);
        } else {
          console.warn(
            `⚠️  Hook cutting failed for ${videoFilename}, continuing without cut URL`,
          );
        }
      } catch (error) {
        console.error(`❌ Hook extraction failed for ${videoFilename}:`, error);
        hookExtractionFailed++;
        // Skip this video for data quality
        this.addVideoFilesToCleanup(videoFile, jsonFile, filesToCleanup);
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
      this.addVideoFilesToCleanup(videoFile, jsonFile, filesToCleanup);
    }

    // Add playlist metadata files to cleanup
    if (!args.skipCleanup) {
      const playlistFiles = await this.getPlaylistMetadataFiles();
      filesToCleanup.push(...playlistFiles);
    }

    // Cleanup files
    if (!args.skipCleanup && filesToCleanup.length > 0) {
      await this.cleanupFiles(filesToCleanup);
    }

    // Summary
    console.log(`\n📊 Processing Summary:`);
    console.log(`   ✅ Processed: ${processed}`);
    console.log(`   ⏭️  Skipped (duplicates): ${skipped}`);
    if (args.skipVoiceovers) {
      console.log(`   🎤 Skipped (voice-overs): ${skippedVoiceovers}`);
    }
    console.log(
      `   🎣 Skipped (hook extraction failed): ${hookExtractionFailed}`,
    );
    console.log(`   ❌ Failed: ${failed}`);
    console.log(
      `   📁 Cleaned up: ${!args.skipCleanup ? filesToCleanup.length : 0} files`,
    );
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
  -v, --skip-voiceovers    Skip videos that contain voice-over content
      --check-voiceovers   Enable voice-over detection but don't skip (log only)
  -d, --dry-run           Show what would be processed without doing it
  -h, --help              Show this help message

Description:
  Processes downloaded TikTok videos by:
  1. Reading video files and metadata from downloads folder
  2. Optionally checking for voice-over content using AI analysis
  3. Checking for existing videos in database (optional)
  4. Uploading videos to S3 under video-sample/ prefix
       5. Saving metadata to HookViralVideo table
  6. Cleaning up processed files (optional)

Voice-over Detection:
  Requires REPLICATE_API_TOKEN and GEMINI_API_KEY environment variables.
  Uses Whisper for transcription and Gemini AI for voice-over vs music detection.

Examples:
  bun scripts/process-videos.ts                     # Process all videos
  bun scripts/process-videos.ts --skip-duplicates   # Skip existing videos
  bun scripts/process-videos.ts --skip-voiceovers   # Skip videos with voice-overs
  bun scripts/process-videos.ts --check-voiceovers  # Log voice-over detection results
    `);
  }
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
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
