import type { AwsRegion } from "@remotion/lambda/client";
import {
  getFunctions,
  getRenderProgress,
  getSites,
  renderMediaOnLambda,
  speculateFunctionName,
} from "@remotion/lambda/client";
import { format } from "date-fns";

import { REMOTION_CONFIG } from "@sassy/remotion/config";

// Type-safe AWS region with fallback - using Remotion-specific env vars
const REGION = (process.env.REMOTION_AWS_REGION || "us-west-2") as AwsRegion;

export interface VideoProcessingRequest {
  videoUrl: string;
  speedMultiplier: number;
  originalDuration: number;
}

export interface RemotionRenderResult {
  renderId: string;
  bucketName: string;
  success: boolean;
  message: string;
}

export interface RemotionProgress {
  done: boolean;
  progress: number;
  outputFile?: string;
  outputBucket?: string;
  costs?: any;
  errors?: any[];
  fatalErrorEncountered?: boolean;
}

export interface VideoStitchRequest {
  videoUrl: string;
  clips: Array<{
    range: string;
    caption: string;
  }>;
  originalDuration: number;
}

export interface CombineVideosRequest {
  shortHookUrl: string;
  shortDemoUrl: string;
  originalHookUrl: string;
  shortHookDuration: number;
  shortDemoDuration: number;
  originalHookDuration: number;
}

export class RemotionService {
  private region: AwsRegion;

  constructor() {
    this.region = REGION;
  }

  /**
   * Get available Remotion Lambda functions
   */
  async getFunctions() {
    return await getFunctions({
      region: this.region,
      compatibleOnly: false,
    });
    // return await speculateFunctionName({
    //   memorySizeInMb: 3008,
    //   diskSizeInMb: 2048,
    //   timeoutInSeconds: 900,
    // })
  }

  /**
   * Get deployed Remotion sites
   */
  async getSites() {
    return await getSites({
      region: this.region,
    });
  }

  /**
   * Find the viralcut-demo site
   */
  async getViralCutSite() {
    const sites = await this.getSites();
    const demoSite = sites.sites.find((site) => site.id === "viralcut-demo");

    if (!demoSite) {
      throw new Error(
        "ViralCut demo site not found. Please deploy the site first using 'pnpm remotion:sites:create'.",
      );
    }

    return demoSite;
  }

  /**
   * Start video speed adjustment processing
   */
  async processVideoSpeed(
    request: VideoProcessingRequest,
  ): Promise<RemotionRenderResult> {
    console.log("process video triggered");
    try {
      // Get deployed functions
      const functions = await this.getFunctions();

      if (functions.length === 0) {
        throw new Error(
          "No Remotion Lambda functions found. Please deploy a function first.",
        );
      }

      const functionName = functions[0]?.functionName;
      if (!functionName) {
        throw new Error("Function name is undefined");
      }

      // Get the viralcut demo site
      const demoSite = await this.getViralCutSite();

      console.log("starting remotion processing inside service ");
      console.log("functions", functions);
      console.log("functionName", functionName);
      console.log("demoSite", demoSite);
      console.log("request", request);
      console.log("region", this.region);
      console.log("serveUrl", demoSite.serveUrl);
      console.log("composition", "VideoSpeedAdjust");
      console.log("inputProps", {
        videoUrl: request.videoUrl,
        speedMultiplier: request.speedMultiplier,
      });
      console.log("codec", "h264");

      // Calculate the correct duration in frames based on speed multiplier
      const originalDurationInSeconds = request.originalDuration;
      const adjustedDurationInSeconds =
        originalDurationInSeconds / request.speedMultiplier;
      const fps = 30;
      const durationInFrames = Math.ceil(adjustedDurationInSeconds * fps);

      // Use practical framesPerLambda for simple scenarios
      // const practicalFramesPerLambda = this.calculatePracticalFramesPerLambda(durationInFrames);

      // Let Remotion choose optimal framesPerLambda based on video length
      // This follows Remotion's built-in concurrency optimization that interpolates
      // between 75-150 concurrency based on frame count and ensures minimum 20 frames per Lambda
      const practicalFramesPerLambda = undefined; // Use Remotion's default optimization

      console.log("Duration calculations:", {
        originalDurationInSeconds,
        adjustedDurationInSeconds,
        fps,
        durationInFrames,
        speedMultiplier: request.speedMultiplier,
        practicalFramesPerLambda: "undefined (using Remotion defaults)",
        note: "Letting Remotion optimize concurrency automatically",
      });

      // Render video on Lambda with optimized settings for long videos

      const currentTime = format(new Date(), "yyyy-MM-dd-HH-mm-ss");
      const renderResult = await renderMediaOnLambda({
        region: this.region,
        functionName,
        serveUrl: demoSite.serveUrl,
        composition: "VideoSpeedAdjust",
        inputProps: {
          videoUrl: request.videoUrl,
          speedMultiplier: request.speedMultiplier,
        },
        codec: "h264",
        imageFormat: "jpeg",
        maxRetries: 1,
        framesPerLambda: practicalFramesPerLambda,
        concurrencyPerLambda: 1, // Single browser tab for better video processing performance
        privacy: "public",
        // Increase timeout significantly for large video processing
        timeoutInMilliseconds: 3000000,
        // Add verbose logging for debugging
        logLevel: "verbose",
        outName: `video-speed-adjusted-${currentTime}.mp4`,
      });

      const { renderId, bucketName } = renderResult;

      // Log debugging information
      console.log("🔍 DEBUGGING INFO:");
      console.log("CloudWatch Logs:", renderResult.cloudWatchLogs);
      console.log("S3 Console Folder:", renderResult.folderInS3Console);
      console.log("Render ID:", renderId);
      console.log("Bucket Name:", bucketName);

      return {
        renderId,
        bucketName,
        success: true,
        message: "Video speed adjustment started successfully",
      };
    } catch (error) {
      console.error("Error processing video speed:", error);
      throw new Error(
        `Failed to process video speed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get render progress for a video processing job
   */
  async getRenderProgress(
    renderId: string,
    bucketName: string,
  ): Promise<RemotionProgress> {
    console.log("getRenderProgress called with:", {
      renderId,
      bucketName,
      region: this.region,
    });

    try {
      // Get deployed functions
      console.log("Getting functions for progress check...");
      const functions = await this.getFunctions();
      console.log(
        "Functions found for progress:",
        functions.map((f) => ({ name: f.functionName, version: f.version })),
      );

      if (functions.length === 0) {
        throw new Error("No Remotion Lambda functions found.");
      }

      const functionName = functions[0]?.functionName;
      if (!functionName) {
        throw new Error("Function name is undefined");
      }

      console.log("Calling getRenderProgress with:", {
        renderId,
        bucketName,
        functionName,
        region: this.region,
      });

      const progress = await getRenderProgress({
        renderId,
        bucketName,
        functionName,
        region: this.region,
      });

      console.log("Progress result:", {
        done: progress.done,
        progress: progress.overallProgress,
        outputFile: progress.outputFile,
        errors: progress.errors,
        fatalErrorEncountered: progress.fatalErrorEncountered,
        // Additional debugging info
        chunks: progress.chunks,
        timeToFinish: progress.timeToFinish,
        renderId: progress.renderId,
        bucket: progress.bucket,
      });

      // If progress is stuck, log additional debugging info
      if (
        !progress.done &&
        progress.overallProgress > 0 &&
        progress.overallProgress < 1
      ) {
        console.log("🚨 RENDER APPEARS STUCK - DEBUGGING INFO:");
        console.log(
          "Progress percentage:",
          (progress.overallProgress * 100).toFixed(1) + "%",
        );
        console.log("Chunks info:", progress.chunks);
        console.log("Time to finish estimate:", progress.timeToFinish);
        console.log("Errors so far:", progress.errors);

        // Log the full progress object to see all available properties
        console.log("Full progress object:", JSON.stringify(progress, null, 2));
      }

      return {
        done: progress.done,
        progress: progress.overallProgress,
        outputFile: progress.outputFile || undefined,
        outputBucket: progress.outBucket || undefined,
        costs: progress.costs,
        errors: progress.errors,
        fatalErrorEncountered: progress.fatalErrorEncountered,
      };
    } catch (error) {
      console.error("Error getting render progress:", error);
      throw new Error(
        `Failed to get render progress: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Start video stitch processing
   */
  async processVideoStitch(
    request: VideoStitchRequest,
  ): Promise<RemotionRenderResult> {
    console.log("processVideoStitch triggered");
    try {
      // Get deployed functions
      const functions = await this.getFunctions();

      if (functions.length === 0) {
        throw new Error(
          "No Remotion Lambda functions found. Please deploy a function first.",
        );
      }

      const functionName = functions[0]?.functionName;
      if (!functionName) {
        throw new Error("Function name is undefined");
      }

      // Get the viralcut demo site
      const demoSite = await this.getViralCutSite();

      console.log("starting video stitch processing inside service");
      console.log("functions", functions);
      console.log("functionName", functionName);
      console.log("demoSite", demoSite);
      console.log("request", request);
      console.log("region", this.region);
      console.log("serveUrl", demoSite.serveUrl);
      console.log("composition", "VideoStitch");
      console.log("inputProps", {
        videoUrl: request.videoUrl,
        clips: request.clips,
      });
      console.log("codec", "h264");

      // Calculate the total duration based on clip durations inline
      let totalClipDurationSeconds = 0;
      for (const clip of request.clips) {
        const [startStr, endStr] = clip.range.split("-");
        if (startStr && endStr) {
          const startParts = startStr.trim().split(":").map(Number);
          const endParts = endStr.trim().split(":").map(Number);

          let startSeconds = 0;
          let endSeconds = 0;

          if (startParts.length === 2) {
            startSeconds = startParts[0]! * 60 + startParts[1]!;
          }
          if (endParts.length === 2) {
            endSeconds = endParts[0]! * 60 + endParts[1]!;
          }

          totalClipDurationSeconds += endSeconds - startSeconds;
        }
      }
      const fps = 30;
      const durationInFrames = Math.ceil(totalClipDurationSeconds * fps);

      // Use Remotion's default optimization for framesPerLambda
      const practicalFramesPerLambda = undefined;

      console.log("VideoStitch duration calculations:", {
        totalClipDurationSeconds,
        fps,
        durationInFrames,
        clipCount: request.clips.length,
        practicalFramesPerLambda: "undefined (using Remotion defaults)",
        note: "Letting Remotion optimize concurrency automatically",
      });

      const currentTime = format(new Date(), "yyyy-MM-dd-HH-mm-ss");
      // Render video on Lambda with optimized settings
      const renderResult = await renderMediaOnLambda({
        region: this.region,
        functionName,
        serveUrl: demoSite.serveUrl,
        composition: "VideoStitch",
        inputProps: {
          videoUrl: request.videoUrl,
          clips: request.clips,
        },
        codec: "h264",
        imageFormat: "jpeg",
        maxRetries: 1,
        framesPerLambda: practicalFramesPerLambda,
        concurrencyPerLambda: 1, // Single browser tab for better video processing performance
        privacy: "public",
        // Increase timeout for video stitching
        timeoutInMilliseconds: 3000000,
        // Add verbose logging for debugging
        logLevel: "verbose",
        outName: `video-stitched-${currentTime}.mp4`,
      });

      const { renderId, bucketName } = renderResult;

      // Log debugging information
      console.log("🔍 VideoStitch DEBUGGING INFO:");
      console.log("CloudWatch Logs:", renderResult.cloudWatchLogs);
      console.log("S3 Console Folder:", renderResult.folderInS3Console);
      console.log("Render ID:", renderId);
      console.log("Bucket Name:", bucketName);

      return {
        renderId,
        bucketName,
        success: true,
        message: "Video stitch processing started successfully",
      };
    } catch (error) {
      console.error("Error processing video stitch:", error);
      throw new Error(
        `Failed to process video stitch: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Start combine videos processing
   */
  async processCombineVideos(
    request: CombineVideosRequest,
  ): Promise<RemotionRenderResult> {
    console.log("processCombineVideos triggered");
    try {
      // Get deployed functions
      const functions = await this.getFunctions();

      if (functions.length === 0) {
        throw new Error(
          "No Remotion Lambda functions found. Please deploy a function first.",
        );
      }

      const functionName = functions[0]?.functionName;
      if (!functionName) {
        throw new Error("Function name is undefined");
      }

      // Get the viralcut demo site
      const demoSite = await this.getViralCutSite();

      console.log("starting combine videos processing inside service");
      console.log("functions", functions);
      console.log("functionName", functionName);
      console.log("demoSite", demoSite);
      console.log("request", request);
      console.log("region", this.region);
      console.log("serveUrl", demoSite.serveUrl);
      console.log("composition", "CombineVideos");
      console.log("inputProps", {
        shortHookUrl: request.shortHookUrl,
        shortDemoUrl: request.shortDemoUrl,
        originalHookUrl: request.originalHookUrl,
        shortHookDuration: request.shortHookDuration,
        shortDemoDuration: request.shortDemoDuration,
        originalHookDuration: request.originalHookDuration,
      });
      console.log("codec", "h264");

      // Calculate the total duration from the two video segments
      const totalDurationSeconds =
        request.shortHookDuration + request.shortDemoDuration;
      const fps = 30;
      const durationInFrames = Math.ceil(totalDurationSeconds * fps);

      // Use Remotion's default optimization for framesPerLambda
      const practicalFramesPerLambda = undefined;

      console.log("CombineVideos duration calculations:", {
        shortHookDuration: request.shortHookDuration,
        shortDemoDuration: request.shortDemoDuration,
        totalDurationSeconds,
        fps,
        durationInFrames,
        practicalFramesPerLambda: "undefined (using Remotion defaults)",
        note: "Letting Remotion optimize concurrency automatically",
      });

      const currentTime = format(new Date(), "yyyy-MM-dd-HH-mm-ss");
      // Render video on Lambda with optimized settings
      const renderResult = await renderMediaOnLambda({
        region: this.region,
        functionName,
        serveUrl: demoSite.serveUrl,
        composition: "CombineVideos",
        inputProps: {
          shortHookUrl: request.shortHookUrl,
          shortDemoUrl: request.shortDemoUrl,
          originalHookUrl: request.originalHookUrl,
          shortHookDuration: request.shortHookDuration,
          shortDemoDuration: request.shortDemoDuration,
          originalHookDuration: request.originalHookDuration,
        },
        codec: "h264",
        imageFormat: "jpeg",
        maxRetries: 1,
        framesPerLambda: practicalFramesPerLambda,
        concurrencyPerLambda: 1, // Single browser tab for better video processing performance
        privacy: "public",
        // Increase timeout for video combining
        timeoutInMilliseconds: 3000000,
        // Add verbose logging for debugging
        logLevel: "verbose",
        outName: `video-combined-${currentTime}.mp4`,
      });

      const { renderId, bucketName } = renderResult;

      // Log debugging information
      console.log("🔍 CombineVideos DEBUGGING INFO:");
      console.log("CloudWatch Logs:", renderResult.cloudWatchLogs);
      console.log("S3 Console Folder:", renderResult.folderInS3Console);
      console.log("Render ID:", renderId);
      console.log("Bucket Name:", bucketName);

      return {
        renderId,
        bucketName,
        success: true,
        message: "Video combine processing started successfully",
      };
    } catch (error) {
      console.error("Error processing combine videos:", error);
      throw new Error(
        `Failed to process combine videos: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate download URL for processed video
   */
  generateDownloadUrl(outputBucket: string, outputFile: string): string {
    // If outputFile is already a full URL, return it as-is
    if (outputFile.startsWith("https://")) {
      return outputFile;
    }

    // Otherwise, construct the URL from bucket and file path
    return `https://${outputBucket}.s3.${this.region}.amazonaws.com/${outputFile}`;
  }
}
