import { GoogleGenAI, createPartFromUri } from '@google/genai';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type {
  GeminiVideoConfig,
  ViralHookInput,
  ViralHookResponse,
  DemoVideoInput,
  DemoVideoResponse,
  VideoProcessingInput,
  GeminiFileResponse,
} from './schema-validators';
import {
  GeminiVideoConfigSchema,
  ViralHookInputSchema,
  ViralHookResponseSchema,
  DemoVideoInputSchema,
  DemoVideoResponseSchema,
  VideoProcessingInputSchema,
} from './schema-validators';

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
  private async uploadVideoToGemini(videoUrl: string): Promise<GeminiFileResponse> {
    let tempFilePath: string | null = null;
    
    try {
      console.log('📤 Uploading video to Gemini Files API...');
      console.log('🔗 Video URL:', videoUrl);

      // Extract filename from URL for display name
      const urlParts = videoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1] || 'video.mp4';
      const displayName = decodeURIComponent(fileName).replace(/[^\w\-_\.]/g, '_');

      // Download video to temporary file
      console.log('⬇️ Downloading video from S3...');
      const response = await fetch(videoUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
      }

      const videoBuffer = Buffer.from(await response.arrayBuffer());
      
      // Create temporary file
      const tempDir = tmpdir();
      tempFilePath = join(tempDir, `gemini-video-${Date.now()}-${displayName}`);
      writeFileSync(tempFilePath, videoBuffer);
      
      console.log('💾 Video downloaded to temporary file:', tempFilePath);

      // Upload video file to Gemini
      const uploadResult = await this.client.files.upload({
        file: tempFilePath,
        config: {
          mimeType: 'video/mp4',
          displayName: displayName,
        },
      });

      console.log('✅ Video uploaded successfully');
      console.log('📄 File name:', uploadResult.name);
      console.log('🔗 File URI:', uploadResult.uri);

      if (!uploadResult.name || !uploadResult.uri) {
        throw new Error('Upload result missing required name or uri');
      }

      // Wait for file to be processed and active
      console.log('⏳ Waiting for file to be processed...');
      await this.waitForFileActive(uploadResult.name);

      return {
        name: uploadResult.name,
        uri: uploadResult.uri,
        mimeType: uploadResult.mimeType || 'video/mp4',
      };
    } catch (error) {
      console.error('❌ Error uploading video to Gemini:', error);
      throw new Error(`Failed to upload video to Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clean up temporary file
      if (tempFilePath) {
        try {
          unlinkSync(tempFilePath);
          console.log('🗑️ Temporary file cleaned up');
        } catch (cleanupError) {
          console.warn('⚠️ Failed to clean up temporary file:', cleanupError);
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
        
        if (fileInfo.state === 'ACTIVE') {
          console.log('✅ File is now active and ready for processing');
          return;
        }
        
        if (fileInfo.state === 'FAILED') {
          throw new Error('File processing failed');
        }
        
        console.log(`⏳ File state: ${fileInfo.state}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('❌ Error checking file status:', error);
        throw new Error(`Failed to check file status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    throw new Error('Timeout waiting for file to become active');
  }

  /**
   * Clean up Gemini file after processing
   * @param fileName - Name of the file to delete from Gemini
   */
  private async cleanupGeminiFile(fileName: string): Promise<void> {
    try {
      await this.client.files.delete({ name: fileName });
      console.log('🗑️ Gemini file cleaned up:', fileName);
    } catch (error) {
      console.warn('⚠️ Failed to clean up Gemini file:', error);
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
      console.log('🎬 Processing video with custom prompt...');
      
      // Upload video to Gemini
      videoFile = await this.uploadVideoToGemini(validatedInput.videoUrl);
      
      // Generate content with video and prompt
      const response = await this.client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          createPartFromUri(videoFile.uri, videoFile.mimeType),
          validatedInput.prompt,
        ],
      });

      const result = response.text;
      console.log('✅ Video processing completed');
      
      if (!result) {
        throw new Error('Empty response from Gemini API');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error processing video:', error);
      throw new Error(`Failed to process video: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      console.log('🎣 Extracting viral hook timing...');
      
      // Upload video to Gemini
      videoFile = await this.uploadVideoToGemini(validatedInput.videoUrl);
      
      // Create specific prompt for hook extraction
      const hookPrompt = `
        The following video is a viral short form video with a hook.
        Identify at which time stamp does the hook end and transition to the main content of the video.
        The hook is at the beginning and related but separate from the rest of the content of the video.
        Be extremely specific to the 2 decimal points of the second because I need precise cut.
        
        Respond in JSON format with this exact structure:
        {
          "hookEndTimestamp": "MM:SS",
          "confidence": "high/medium/low",
          "description": "Brief description of what happens at the hook end"
        }
        
        Give me the time in MM:SS format (e.g., "00:05", "01:23").
      `;
      
      // Generate content with video and hook extraction prompt
      const response = await this.client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          createPartFromUri(videoFile.uri, videoFile.mimeType),
          hookPrompt,
        ],
      });

      const result = response.text;
      console.log('📝 Raw response:', result);
      
      if (!result) {
        throw new Error('Empty response from Gemini API');
      }
      
      // Parse JSON response
      let parsedResponse;
      try {
        // Extract JSON from response (handle cases where response includes markdown formatting)
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : result;
        parsedResponse = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        console.log('Raw response:', result);
        throw new Error('Failed to parse hook extraction response as JSON');
      }
      
      // Validate response format
      const validatedResponse = ViralHookResponseSchema.parse(parsedResponse);
      
      console.log('✅ Hook extraction completed');
      console.log('⏰ Hook ends at:', validatedResponse.hookEndTimestamp);
      
      return validatedResponse;
    } catch (error) {
      console.error('❌ Error extracting viral hook:', error);
      throw new Error(`Failed to extract viral hook: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Clean up Gemini file
      if (videoFile) {
        await this.cleanupGeminiFile(videoFile.name);
      }
    }
  }

  /**
   * Condense demo videos into segments with captions
   * @param input - Video URL, max duration, and number of segments
   * @returns Array of video segments with captions and timing
   */
  async condenseDemoVideo(input: DemoVideoInput): Promise<DemoVideoResponse> {
    // Validate input
    const validatedInput = DemoVideoInputSchema.parse(input);
    let videoFile: GeminiFileResponse | null = null;
    
    try {
      console.log('🎬 Condensing demo video...');
      console.log(`📊 Target: ${validatedInput.numSegments} segments, max ${validatedInput.maxDuration}s total`);
      
      // Upload video to Gemini
      videoFile = await this.uploadVideoToGemini(validatedInput.videoUrl);
      
      // Calculate segment length
      const snippetLength = Math.round(validatedInput.maxDuration / validatedInput.numSegments);
      
      // Create specific prompt for demo condensing
      const demoPrompt = `
        This is a product demo video. I need to condense it into a maximum ${validatedInput.maxDuration} second version.
        Create a script for a condensed version that highlights the key steps and features.
        The script should:
        1. Focus on important UI interactions, button clicks, and transitions
        2. Capture the essential flow of the demo
        3. Skip repetitive or unnecessary parts
        4. Be divided into ${validatedInput.numSegments} brief segments of approximately ${snippetLength} seconds each
        
        For each segment provide:
        1. A brief caption (maximum 20 words)
        2. The exact start and end timestamps in the video (in seconds.milliseconds format)
        
        Format your response as JSON with this structure:
        {
          "segments": [
            {"caption": "Brief caption here", "start": 12.5, "end": 18.2}
          ],
          "totalDuration": ${validatedInput.maxDuration}
        }
        
        Ensure the total duration of all segments is less than ${validatedInput.maxDuration} seconds.
      `;
      
      // Generate content with video and demo condensing prompt
      const response = await this.client.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          createPartFromUri(videoFile.uri, videoFile.mimeType),
          demoPrompt,
        ],
      });

      const result = response.text;
      console.log('📝 Raw response:', result);
      
      if (!result) {
        throw new Error('Empty response from Gemini API');
      }
      
      // Parse JSON response
      let parsedResponse;
      try {
        // Extract JSON from response (handle cases where response includes markdown formatting)
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : result;
        parsedResponse = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        console.log('Raw response:', result);
        throw new Error('Failed to parse demo condensing response as JSON');
      }
      
      // Validate response format
      const validatedResponse = DemoVideoResponseSchema.parse(parsedResponse);
      
      console.log('✅ Demo video condensing completed');
      console.log(`📊 Generated ${validatedResponse.segments.length} segments`);
      console.log(`⏱️ Total duration: ${validatedResponse.totalDuration}s`);
      
      return validatedResponse;
    } catch (error) {
      console.error('❌ Error condensing demo video:', error);
      throw new Error(`Failed to condense demo video: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
export const createGeminiVideoService = (apiKey?: string): GeminiVideoService => {
  const geminiApiKey = apiKey || process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  
  return new GeminiVideoService({ apiKey: geminiApiKey });
}; 