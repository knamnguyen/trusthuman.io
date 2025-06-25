import { unlinkSync, writeFileSync } from "fs";
import { writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { createPartFromUri, GoogleGenAI } from "@google/genai";

import type {
  DemoVideoInput,
  DemoVideoResponse,
  GeminiFileResponse,
  GeminiVideoConfig,
  MasterScriptInput,
  MasterScriptResponse,
  VideoProcessingInput,
  ViralHookInput,
  ViralHookResponse,
} from "./schema-validators";
import {
  DemoVideoInputSchema,
  DemoVideoResponseSchema,
  GeminiVideoConfigSchema,
  MasterScriptInputSchema,
  MasterScriptResponseSchema,
  VideoProcessingInputSchema,
  ViralHookInputSchema,
  ViralHookResponseSchema,
} from "./schema-validators";

/**
 * GeminiVideoService - A comprehensive service for video processing using Google's Gemini API
 *
 * Features:
 * - Upload videos from S3 URLs to Gemini Files API
 * - Extract viral video hook timing with precise timestamps
 * - Condense demo videos into segments with captions
 * - General purpose video processing with custom prompts
 */
export class GeminiVideoService {
  private client: GoogleGenAI;
  private config: GeminiVideoConfig;

  constructor(config: GeminiVideoConfig) {
    // Validate configuration
    this.config = GeminiVideoConfigSchema.parse(config);

    // Initialize Gemini client
    this.client = new GoogleGenAI({ apiKey: this.config.apiKey });
  }

  /**
   * Download video from URL and upload to Gemini Files API
   * @param videoUrl - URL of the video to upload
   * @returns File response with name, URI, and MIME type
   */
  private async uploadVideoToGemini(
    videoUrl: string,
  ): Promise<GeminiFileResponse> {
    let tempFilePath: string | null = null;

    try {
      console.log("📤 Uploading video to Gemini Files API...");
      console.log("🔗 Video URL:", videoUrl);

      // Extract filename from URL for display name
      const urlParts = videoUrl.split("/");
      const fileName = urlParts[urlParts.length - 1] || "video.mp4";
      const displayName = decodeURIComponent(fileName).replace(
        /[^\w\-_\.]/g,
        "_",
      );

      // Download video to temporary file
      console.log("⬇️ Downloading video from S3...");
      const response = await fetch(videoUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to download video: ${response.status} ${response.statusText}`,
        );
      }

      const videoBuffer = Buffer.from(await response.arrayBuffer());

      // Create temporary file
      const tempDir = tmpdir();
      tempFilePath = join(tempDir, `gemini-video-${Date.now()}-${displayName}`);
      writeFileSync(tempFilePath, videoBuffer);

      console.log("💾 Video downloaded to temporary file:", tempFilePath);

      // Upload video file to Gemini
      const uploadResult = await this.client.files.upload({
        file: tempFilePath,
        config: {
          mimeType: "video/mp4",
          displayName: displayName,
        },
      });

      console.log("✅ Video uploaded successfully");
      console.log("📄 File name:", uploadResult.name);
      console.log("🔗 File URI:", uploadResult.uri);

      if (!uploadResult.name || !uploadResult.uri) {
        throw new Error("Upload result missing required name or uri");
      }

      // Wait for file to be processed and active
      console.log("⏳ Waiting for file to be processed...");
      await this.waitForFileActive(uploadResult.name);

      return {
        name: uploadResult.name,
        uri: uploadResult.uri,
        mimeType: uploadResult.mimeType || "video/mp4",
      };
    } catch (error) {
      console.error("❌ Error uploading video to Gemini:", error);
      throw new Error(
        `Failed to upload video to Gemini: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      // Clean up temporary file
      if (tempFilePath) {
        try {
          unlinkSync(tempFilePath);
          console.log("🗑️ Temporary file cleaned up");
        } catch (cleanupError) {
          console.warn("⚠️ Failed to clean up temporary file:", cleanupError);
        }
      }
    }
  }

  /**
   * Wait for uploaded file to be in ACTIVE state
   * @param fileName - Name of the file to check
   */
  private async waitForFileActive(fileName: string): Promise<void> {
    const maxWaitTime = 60000; // 60 seconds max wait
    const pollInterval = 2000; // Check every 2 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const fileInfo = await this.client.files.get({ name: fileName });

        if (fileInfo.state === "ACTIVE") {
          console.log("✅ File is now active and ready for processing");
          return;
        }

        if (fileInfo.state === "FAILED") {
          throw new Error("File processing failed");
        }

        console.log(`⏳ File state: ${fileInfo.state}, waiting...`);
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error("❌ Error checking file status:", error);
        throw new Error(
          `Failed to check file status: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    throw new Error("Timeout waiting for file to become active");
  }

  /**
   * Clean up Gemini file after processing
   * @param fileName - Name of the file to delete from Gemini
   */
  private async cleanupGeminiFile(fileName: string): Promise<void> {
    try {
      await this.client.files.delete({ name: fileName });
      console.log("🗑️ Gemini file cleaned up:", fileName);
    } catch (error) {
      console.warn("⚠️ Failed to clean up Gemini file:", error);
    }
  }

  /**
   * Process video with a custom prompt
   * @param input - Video URL and custom prompt
   * @returns Raw response text from Gemini
   */
  async processVideoWithPrompt(input: VideoProcessingInput): Promise<string> {
    // Validate input
    const validatedInput = VideoProcessingInputSchema.parse(input);
    let videoFile: GeminiFileResponse | null = null;

    try {
      console.log("🎬 Processing video with custom prompt...");

      // Upload video to Gemini
      videoFile = await this.uploadVideoToGemini(validatedInput.videoUrl);

      // Generate content with video and prompt
      const response = await this.client.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          createPartFromUri(videoFile.uri, videoFile.mimeType),
          validatedInput.prompt,
        ],
      });

      const result = response.text;
      console.log("✅ Video processing completed");

      if (!result) {
        throw new Error("Empty response from Gemini API");
      }

      return result;
    } catch (error) {
      console.error("❌ Error processing video:", error);
      throw new Error(
        `Failed to process video: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      // Clean up Gemini file
      if (videoFile) {
        await this.cleanupGeminiFile(videoFile.name);
      }
    }
  }

  /**
   * Extract hook timing from viral videos
   * @param input - Video URL of the viral video
   * @returns Hook end timestamp and analysis
   */
  async extractViralHook(input: ViralHookInput): Promise<ViralHookResponse> {
    // Validate input
    const validatedInput = ViralHookInputSchema.parse(input);
    let videoFile: GeminiFileResponse | null = null;

    try {
      console.log("🎣 Extracting viral hook timing...");

      // Upload video to Gemini
      videoFile = await this.uploadVideoToGemini(validatedInput.videoUrl);

      // Create specific prompt for hook extraction
      const hookPrompt = `
        The following video is a viral short form video with a hook.
        Identify at which time stamp does the hook end and transition to the main content of the video.
        The hook is at the beginning and related but separate from the rest of the content of the video.
        Be extremely specific to the 2 decimal points of the second because I need precise cut.
        
        Additionally, analyze the visual theme of the video by extracting a color palette from frames throughout the video.
        Sample frames consistently across the entire video duration to get the overall color theme.
        Identify the 5 most dominant colors and their approximate percentages in the video.
        
        Respond in JSON format with this exact structure:
        {
          "hookEndTimestamp": "MM:SS",
          "confidence": "high/medium/low",
          "hookInfo": "A comprehensive 100-word description of the hook including what happens at the beginning, throughout, and end of the hook, text that appears, visual elements, audio cues, and any other relevant details for similarity matching with product demos",
          "colorPalette": [
            {"red": 0, "green": 0, "blue": 0, "percentage": 0.4},
            {"red": 255, "green": 255, "blue": 255, "percentage": 0.35},
            {"red": 162, "green": 146, "blue": 106, "percentage": 0.15},
            {"red": 107, "green": 142, "blue": 35, "percentage": 0.08},
            {"red": 200, "green": 100, "blue": 50, "percentage": 0.02}
          ]
        }
        
        Give me the time in MM:SS format (e.g., "00:05", "01:23").
        Make sure the hookInfo is approximately 100 words and includes relevant keywords for similarity search.
        Make sure the colorPalette contains exactly 5 colors sorted by percentage (descending) and percentages add up to exactly 1.0.
        Use RGB values (0-255) and percentage values (0.0-1.0).

      `;

      // Generate content with video and hook extraction prompt
      const response = await this.client.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          createPartFromUri(videoFile.uri, videoFile.mimeType),
          hookPrompt,
        ],
        config: {
          maxOutputTokens: 50000,
          temperature: 0.1,
        },
      });

      const result = response.text;
      console.log("📝 Raw response:", result);

      if (!result) {
        throw new Error("Empty response from Gemini API");
      }

      // Parse JSON response
      let parsedResponse;
      try {
        // Extract JSON from response (handle cases where response includes markdown formatting)
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : result;
        parsedResponse = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("❌ Failed to parse JSON response:", parseError);
        console.log("Raw response:", result);
        throw new Error("Failed to parse hook extraction response as JSON");
      }

      // Validate response format
      const validatedResponse = ViralHookResponseSchema.parse(parsedResponse);

      console.log("✅ Hook extraction completed");
      console.log("⏰ Hook ends at:", validatedResponse.hookEndTimestamp);
      console.log(
        "📝 Hook info:",
        validatedResponse.hookInfo.substring(0, 100) + "...",
      );

      return validatedResponse;
    } catch (error) {
      console.error("❌ Error extracting viral hook:", error);
      throw new Error(
        `Failed to extract viral hook: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      // Clean up Gemini file
      if (videoFile) {
        await this.cleanupGeminiFile(videoFile.name);
      }
    }
  }

  /**
   * Generate master script with time-range-based annotations
   * @param input - Video URL to analyze
   * @returns Master script with annotations for time ranges
   */
  async generateMasterScript(
    input: MasterScriptInput,
  ): Promise<MasterScriptResponse> {
    // Validate input
    const validatedInput = MasterScriptInputSchema.parse(input);
    let videoFile: GeminiFileResponse | null = null;

    try {
      console.log(
        "📝 Generating master script with time-range-based annotations...",
      );

      // Upload video to Gemini
      videoFile = await this.uploadVideoToGemini(validatedInput.videoUrl);

      // Create specific prompt for master script generation
      const masterScriptPrompt = `
        You have already processed this video and have access to its full duration.
        I need you to return time-range-based annotations for the ENTIRE video, from 00:00 to the final second.
        
        Return a JSON array of objects, with one entry for each time range where the content is similar.
        Each object should have three fields: "secondRange" (string), "transcript" (string), and "frameDescription" (string).

        Group similar content efficiently:
        - When transcript and visual content are similar across multiple seconds, group them into a single range
        - When content changes significantly (new speaker, scene change, different visual), start a new range
        - Optimize for efficiency while maintaining accuracy

        For each range, provide:
        - secondRange: Time range in MM:SS-MM:SS format (e.g., "00:23-00:47", "01:15-01:32")
        - transcript: All speech/audio content within that time range (empty string if no speech)
        - frameDescription: Description of the visual content throughout that range

        Don't generate new information, just use the existing annotations from your system that you have access to.

        Example response format:
        [
          {"secondRange": "00:00-00:05", "transcript": "Hello everyone, welcome to today's video", "frameDescription": "Person standing in front of camera with bright background"},
          {"secondRange": "00:06-00:15", "transcript": "", "frameDescription": "Cut to computer screen showing application interface with various menu options"},
          {"secondRange": "00:16-00:22", "transcript": "Now let's explore the main features", "frameDescription": "Mouse cursor clicking through different sections of the application"}
        ]
        
        CRITICAL INSTRUCTIONS:
        - Return ONLY a valid JSON array of objects.
        - The FIRST range MUST start with "00:00"
        - The LAST range MUST end with the final second of the video (e.g., if video is 148 seconds, last range ends with "02:28")
        - Ranges should be contiguous and cover the entire video with no gaps
        - Each object must have exactly three fields: secondRange, transcript, frameDescription
        - Use MM:SS format for all timestamps (e.g., "00:05", "01:23", "02:47")
        - Group similar content efficiently to reduce redundancy
        - Transcript should include all speech within the range
        - FrameDescription should describe the consistent visual elements throughout the range
        - Do not include any other text, markdown, or explanations outside the JSON array.
      `;

      // Generate content with video and master script prompt
      const response = await this.client.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          createPartFromUri(videoFile.uri, videoFile.mimeType),
          masterScriptPrompt,
        ],
        config: {
          maxOutputTokens: 1000000, // Maximum possible limit for complete video annotations
          temperature: 0.1, // Low temperature for consistent, factual output
        },
      });

      const result = response.text;
      console.log("📝 Raw response received from Gemini");

      if (!result) {
        throw new Error("Empty response from Gemini API");
      }

      // Write raw response to file for debugging/backup
      const timestamp = Date.now();
      const responseFilePath = join(
        process.cwd(),
        "scripts",
        `master-script-response-${timestamp}.txt`,
      );
      await writeFile(responseFilePath, result, "utf-8");
      console.log(`💾 Raw response saved to: ${responseFilePath}`);

      // Parse JSON response which should be an array of objects
      let parsedObjectArray: {
        secondRange: string;
        transcript: string;
        frameDescription: string;
      }[];
      try {
        // Extract JSON from response (handle cases where response includes markdown formatting)
        let jsonStr;

        // First try to extract from markdown code block
        const markdownMatch = result.match(/```json\s*([\s\S]*?)\s*```/);
        if (markdownMatch && markdownMatch[1]) {
          jsonStr = markdownMatch[1];
        } else {
          // Fallback to looking for array directly
          const jsonMatch = result.match(/\[[\s\S]*\]/);
          jsonStr = jsonMatch ? jsonMatch[0] : result;
        }

        parsedObjectArray = JSON.parse(jsonStr);

        if (
          !Array.isArray(parsedObjectArray) ||
          !parsedObjectArray.every(
            (item) =>
              typeof item.secondRange === "string" &&
              typeof item.transcript === "string" &&
              typeof item.frameDescription === "string",
          )
        ) {
          throw new Error("Response is not a valid array of objects.");
        }
      } catch (parseError) {
        console.error(
          "❌ Failed to parse JSON response as an array of objects:",
          parseError,
        );
        console.log("Raw response length:", result.length);
        console.log("Raw response preview:", result.substring(0, 500) + "...");
        throw new Error(
          "Failed to parse master script response as a JSON array of objects",
        );
      }

      // Transform the array of objects into the required MasterScriptResponse format
      const masterScript = parsedObjectArray.map(
        ({ secondRange, transcript, frameDescription }) => ({
          secondRange,
          transcript,
          frameDescription,
        }),
      );

      const responseToValidate = { masterScript };

      // Validate response format
      const validatedResponse =
        MasterScriptResponseSchema.parse(responseToValidate);

      console.log("✅ Master script generation completed");
      console.log(
        `📊 Generated ${validatedResponse.masterScript.length} time-range-based annotations`,
      );

      return validatedResponse;
    } catch (error) {
      console.error("❌ Error generating master script:", error);
      throw new Error(
        `Failed to generate master script: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      // Clean up Gemini file
      if (videoFile) {
        await this.cleanupGeminiFile(videoFile.name);
      }
    }
  }

  /**
   * Condense demo videos into segments with captions
   * @param input - Video URL, max duration, number of segments, and optional content guide
   * @returns Array of video segments with captions and timing
   */
  async condenseDemoVideo(input: DemoVideoInput): Promise<DemoVideoResponse> {
    // Validate input
    const validatedInput = DemoVideoInputSchema.parse(input);
    let videoFile: GeminiFileResponse | null = null;

    try {
      console.log("🎬 Condensing demo video...");
      console.log(
        `📊 Target: ${validatedInput.numSegments} segments, max ${validatedInput.maxDuration}s total`,
      );
      if (validatedInput.contentGuide) {
        console.log("📝 Content guide provided:", validatedInput.contentGuide);
      }

      // Upload video to Gemini
      videoFile = await this.uploadVideoToGemini(validatedInput.videoUrl);

      // Calculate segment length
      const snippetLength = Math.round(
        validatedInput.maxDuration / validatedInput.numSegments,
      );

      // Create specific prompt for demo condensing with optional content guide
      const contentGuideInstruction = validatedInput.contentGuide
        ? `
        IMPORTANT: Follow this content guide for segment selection and caption direction:
        "${validatedInput.contentGuide}"
        
        Use this guide to determine:
        - Which parts of the video to prioritize for segments
        - The style and focus for captions
        - The overall narrative direction for the condensed version
        `
        : `
        Focus on the most important and engaging parts of the demo that showcase key features and user interactions.
        `;

      const demoPrompt = `
        This is a product demo video. I need to condense it into a maximum ${validatedInput.maxDuration} second version.
        Create a script for a condensed version that highlights the key steps and features.
        
        ${contentGuideInstruction}
        
        The script should:
        1. Focus on important UI interactions, button clicks, and transitions
        2. Capture the essential flow of the demo
        3. Skip repetitive or unnecessary parts
        4. Be divided into ${validatedInput.numSegments} brief segments of approximately ${snippetLength} seconds each
        
        For each segment provide:
        1. A brief caption (maximum 20 words)
        2. The exact start and end timestamps in the video (in whole seconds format)
        
        Additionally, analyze the product being demonstrated and provide a comprehensive description that includes:
        - Product name and type/category
        - Key features and functionality shown
        - Benefits and use cases demonstrated
        - Target audience or industry
        - Any technical specifications or capabilities mentioned
        - Keywords that would help match this product with relevant marketing content
        
        Also, analyze the visual theme of the video by extracting a color palette from frames throughout the video.
        Sample frames consistently across the entire video duration to get the overall color theme.
        Identify the 5 most dominant colors and their approximate percentages in the video.
        
        Format your response as JSON with this structure:
        {
          "segments": [
            {"caption": "Brief caption here", "start": 12, "end": 18}
          ],
          "totalDuration": ${validatedInput.maxDuration},
          "productInfo": "A comprehensive 100-word description of the product including features, benefits, categories, and relevant keywords for similarity matching...",
          "colorPalette": [
            {"red": 0, "green": 0, "blue": 0, "percentage": 0.4},
            {"red": 255, "green": 255, "blue": 255, "percentage": 0.35},
            {"red": 162, "green": 146, "blue": 106, "percentage": 0.15},
            {"red": 107, "green": 142, "blue": 35, "percentage": 0.08},
            {"red": 200, "green": 100, "blue": 50, "percentage": 0.02}
          ]
        }
        
        IMPORTANT: Use whole number values for start and end times (e.g., 12, 18) NOT decimal values like 12.5 or string values like "00:12".
        The start and end times must be integers representing whole seconds.
        Ensure the total duration of all segments is less than ${validatedInput.maxDuration} seconds.
        Ensure the productInfo is approximately 100 words and includes relevant keywords for similarity search.
        Make sure the colorPalette contains exactly 5 colors sorted by percentage (descending) and percentages add up to exactly 1.0.
        Use RGB values (0-255) and percentage values (0.0-1.0).
      `;

      // Generate content with video and demo condensing prompt
      const response = await this.client.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          createPartFromUri(videoFile.uri, videoFile.mimeType),
          demoPrompt,
        ],
        config: {
          maxOutputTokens: 50000,
          temperature: 0.1,
        },
      });

      const result = response.text;
      console.log("📝 Raw response:", result);

      if (!result) {
        throw new Error("Empty response from Gemini API");
      }

      // Parse JSON response
      let parsedResponse;
      try {
        // Extract JSON from response (handle cases where response includes markdown formatting)
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : result;
        parsedResponse = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("❌ Failed to parse JSON response:", parseError);
        console.log("Raw response:", result);
        throw new Error("Failed to parse demo condensing response as JSON");
      }

      // Validate response format
      const validatedResponse = DemoVideoResponseSchema.parse(parsedResponse);

      console.log("✅ Demo video condensing completed");
      console.log(`📊 Generated ${validatedResponse.segments.length} segments`);
      console.log(`⏱️ Total duration: ${validatedResponse.totalDuration}s`);

      return validatedResponse;
    } catch (error) {
      console.error("❌ Error condensing demo video:", error);
      throw new Error(
        `Failed to condense demo video: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      // Clean up Gemini file
      if (videoFile) {
        await this.cleanupGeminiFile(videoFile.name);
      }
    }
  }
}

/**
 * Factory function to create GeminiVideoService with environment variables
 * @param apiKey - Optional API key, falls back to environment variable
 * @returns Configured GeminiVideoService instance
 */
export const createGeminiVideoService = (
  apiKey?: string,
): GeminiVideoService => {
  const geminiApiKey = apiKey || process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY environment variable is required");
  }

  return new GeminiVideoService({ apiKey: geminiApiKey });
};
