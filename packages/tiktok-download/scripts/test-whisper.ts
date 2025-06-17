#!/usr/bin/env bun

/**
 * Whisper Transcription Test Script
 *
 * Purpose: Test whisper transcription on video/audio URLs using Replicate API
 *
 * Package.json Usage:
 *   "test-whisper": "pnpm with-env bun scripts/test-whisper.ts"
 *
 * Command Line Usage:
 *   pnpm test-whisper --url <video-or-audio-url>
 *   bun scripts/test-whisper.ts --url <video-or-audio-url>
 *
 * Parameters:
 *   --url, -u          (REQUIRED) URL to video or audio file
 *   --help, -h         Show help message
 *
 * Behavior:
 *   - Downloads media file from provided URL
 *   - Detects if file is video or audio
 *   - If video: extracts audio using ffmpeg
 *   - Sends audio to Replicate whisper model for transcription
 *   - Uses Gemini AI to analyze if transcription is voice-over or music/soundtrack
 *   - Returns JSON response with voice-over detection and content
 *   - Cleans up temporary files after processing
 *
 * Prerequisites:
 *   - REPLICATE_API_TOKEN environment variable must be set
 *   - GEMINI_API_KEY environment variable must be set
 *   - ffmpeg must be installed and available in PATH
 *
 * Examples:
 *   pnpm test-whisper --url https://example.com/video.mp4
 *   pnpm test-whisper -u https://example.com/audio.mp3
 */
import { createReadStream, createWriteStream, existsSync } from "fs";
import { mkdir, readFile, unlink } from "fs/promises";
import { basename, extname, join } from "path";
import { pipeline } from "stream/promises";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ffmpeg from "fluent-ffmpeg";
import Replicate from "replicate";

import type {
  GeminiAnalysisResponse,
  WhisperTranscriptionResponse,
} from "../src/schema-validators";
import {
  geminiAnalysisResponseSchema,
  whisperTranscriptionInputSchema,
} from "../src/schema-validators";

interface TestWhisperArgs {
  url?: string;
}

class WhisperTranscriptionUtility {
  private replicate: Replicate;
  private gemini: GoogleGenerativeAI;
  private tempDir: string;

  constructor() {
    const replicateApiToken = process.env.REPLICATE_API_TOKEN;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!replicateApiToken) {
      throw new Error("REPLICATE_API_TOKEN environment variable is required");
    }

    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }

    this.replicate = new Replicate({
      auth: replicateApiToken,
    });

    this.gemini = new GoogleGenerativeAI(geminiApiKey);

    this.tempDir = join(process.cwd(), "temp-whisper");
  }

  /**
   * Parse command line arguments
   */
  parseArgs(): TestWhisperArgs {
    const args = process.argv.slice(2);
    const result: TestWhisperArgs = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case "--url":
        case "-u":
          if (i + 1 < args.length) {
            result.url = args[++i];
          }
          break;
      }
    }

    return result;
  }

  /**
   * Print usage information
   */
  printUsage(): void {
    console.log(`
🎤 Whisper Transcription Test Utility

Usage: bun scripts/test-whisper.ts --url <video-or-audio-url>

Options:
  -u, --url     URL to video or audio file (required)
  -h, --help    Show this help message

Description:
  Downloads media from URL, extracts audio if needed, and transcribes using Replicate Whisper API.
  Uses Gemini AI to analyze if the transcription is voice-over content or music/soundtrack.
  Returns JSON response indicating if voice-over was detected and the transcription content.

Examples:
  bun scripts/test-whisper.ts --url https://example.com/video.mp4
  bun scripts/test-whisper.ts -u https://example.com/audio.mp3
    `);
  }

  /**
   * Download file from URL to temporary location
   */
  private async downloadFile(url: string): Promise<string> {
    console.log(`📥 Downloading file from: ${url}`);

    // Ensure temp directory exists
    await mkdir(this.tempDir, { recursive: true });

    // Extract filename from URL or generate one
    const urlPath = new URL(url).pathname;
    let filename = basename(urlPath);

    if (!filename || !extname(filename)) {
      filename = `download-${Date.now()}`;
    }

    const filePath = join(this.tempDir, filename);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to download: ${response.status} ${response.statusText}`,
        );
      }

      if (!response.body) {
        throw new Error("No response body received");
      }

      const fileStream = createWriteStream(filePath);
      await pipeline(response.body as any, fileStream);

      console.log(`✅ Downloaded to: ${filePath}`);
      return filePath;
    } catch (error) {
      throw new Error(
        `Download failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Check if file is a video format
   */
  private isVideoFile(filePath: string): boolean {
    const videoExtensions = [
      ".mp4",
      ".webm",
      ".mkv",
      ".avi",
      ".mov",
      ".m4v",
      ".flv",
      ".wmv",
    ];
    const ext = extname(filePath).toLowerCase();
    return videoExtensions.includes(ext);
  }

  /**
   * Check if file is an audio format
   */
  private isAudioFile(filePath: string): boolean {
    const audioExtensions = [
      ".mp3",
      ".wav",
      ".m4a",
      ".aac",
      ".ogg",
      ".flac",
      ".wma",
    ];
    const ext = extname(filePath).toLowerCase();
    return audioExtensions.includes(ext);
  }

  /**
   * Extract audio from video file using ffmpeg
   */
  private async extractAudio(videoPath: string): Promise<string> {
    console.log(`🎵 Extracting audio from video...`);

    const audioPath = join(this.tempDir, `extracted-${Date.now()}.wav`);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat("wav")
        .audioCodec("pcm_s16le")
        .audioFrequency(16000)
        .audioChannels(1)
        .on("start", (commandLine: string) => {
          console.log(`🔧 FFmpeg command: ${commandLine}`);
        })
        .on("progress", (progress: any) => {
          if (progress.percent) {
            console.log(`⏳ Processing: ${Math.round(progress.percent)}%`);
          }
        })
        .on("end", () => {
          console.log(`✅ Audio extracted to: ${audioPath}`);
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
    console.log(`🎤 Transcribing audio with Whisper...`);

    try {
      // Read the audio file as buffer and convert to base64
      const audioBuffer = await readFile(audioPath);
      const audioBase64 = `data:audio/wav;base64,${audioBuffer.toString("base64")}`;

      console.log(`📁 Processing audio file: ${basename(audioPath)}`);
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
      console.log(`✅ Transcription completed`);
      console.log(`📝 Length: ${transcription.length} characters`);

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

      console.log(`🤖 Gemini raw response: ${responseText}`);

      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in Gemini response");
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      const validatedResponse =
        geminiAnalysisResponseSchema.parse(parsedResponse);

      console.log(`✅ Gemini analysis completed`);
      console.log(
        `🎯 Voice-over detected: ${validatedResponse.voiceoverDetected}`,
      );
      console.log(
        `🎯 Confidence: ${(validatedResponse.confidence * 100).toFixed(1)}%`,
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
   * Clean up temporary files
   */
  private async cleanup(filesToDelete: string[]): Promise<void> {
    console.log(`🧹 Cleaning up ${filesToDelete.length} temporary files...`);

    for (const file of filesToDelete) {
      try {
        if (existsSync(file)) {
          await unlink(file);
          console.log(`🗑️  Deleted: ${basename(file)}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to delete ${file}:`, error);
      }
    }
  }

  /**
   * Process media URL and return transcription result
   */
  async processMediaUrl(url: string): Promise<WhisperTranscriptionResponse> {
    // Validate input
    const validatedInput = whisperTranscriptionInputSchema.parse({ url });

    const filesToCleanup: string[] = [];

    try {
      // Download the media file
      const downloadedFile = await this.downloadFile(validatedInput.url);
      filesToCleanup.push(downloadedFile);

      let audioFile = downloadedFile;

      // Check file type and extract audio if needed
      if (this.isVideoFile(downloadedFile)) {
        console.log(`🎬 Detected video file, extracting audio...`);
        audioFile = await this.extractAudio(downloadedFile);
        filesToCleanup.push(audioFile);
      } else if (this.isAudioFile(downloadedFile)) {
        console.log(`🎵 Detected audio file, using directly...`);
      } else {
        console.log(`❓ Unknown file type, attempting to process as audio...`);
      }

      // Transcribe the audio
      const transcription = await this.transcribeAudio(audioFile);

      // Analyze transcription with Gemini if it has sufficient content
      let voiceoverDetected = false;

      if (transcription.trim().length >= 20) {
        const geminiAnalysis =
          await this.analyzeTranscriptionWithGemini(transcription);
        voiceoverDetected = geminiAnalysis.voiceoverDetected;
      } else {
        console.log(
          `ℹ️  Transcription too short (${transcription.trim().length} chars), skipping Gemini analysis`,
        );
      }

      const result: WhisperTranscriptionResponse = {
        voiceoverDetected,
        speechContent: transcription.trim(),
      };

      return result;
    } finally {
      // Always clean up temporary files
      await this.cleanup(filesToCleanup);
    }
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  const utility = new WhisperTranscriptionUtility();
  const args = utility.parseArgs();

  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    utility.printUsage();
    return;
  }

  if (!args.url) {
    console.error("❌ Error: URL is required");
    utility.printUsage();
    process.exit(1);
  }

  try {
    console.log("🚀 Starting whisper transcription...\n");

    const result = await utility.processMediaUrl(args.url);

    console.log("\n📊 Transcription Result:");
    console.log(JSON.stringify(result, null, 2));

    process.exit(0);
  } catch (error) {
    console.error(
      "\n❌ Transcription failed:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

// Run the script
main();
