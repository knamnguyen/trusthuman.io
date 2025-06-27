"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "~/trpc/react";
import { useGeminiStreamUpload } from "./use-gemini-stream-upload";
import { useMultipartUpload } from "./use-multipart-upload";

interface ParallelUploadProgress {
  s3: { loaded: number; total: number; percentage: number };
  gemini: { percentage: number; uploadedBytes: number; totalBytes: number };
  overall: number;
}

interface ParallelUploadResult {
  s3: {
    key: string;
    bucket: string;
    location: string;
  };
  gemini: {
    fileUri: string;
    mimeType: string;
    name: string;
  };
  demoVideo: any; // Database record
}

interface UseParallelUploadProps {
  onProgress?: (progress: ParallelUploadProgress) => void;
  onSuccess?: (result: ParallelUploadResult) => void;
  onError?: (error: Error) => void;
}

export const useParallelUpload = ({
  onProgress,
  onSuccess,
  onError,
}: UseParallelUploadProps = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<ParallelUploadProgress>({
    s3: { loaded: 0, total: 0, percentage: 0 },
    gemini: { percentage: 0, uploadedBytes: 0, totalBytes: 0 },
    overall: 0,
  });

  const trpc = useTRPC();

  // Create mutation for master script generation
  const generateMasterScript = useMutation(
    trpc.video.generateMasterScriptFromUri.mutationOptions(),
  );

  // Initialize regular multipart upload (we'll remove auto master script generation from backend)
  const s3Upload = useMultipartUpload({
    onProgress: (s3Progress) => {
      const newProgress = {
        ...progress,
        s3: s3Progress,
        overall: (s3Progress.percentage + progress.gemini.percentage) / 2,
      };
      setProgress(newProgress);
      onProgress?.(newProgress);
    },
    onError: (error) => {
      console.error("S3 upload failed:", error);
      onError?.(error);
    },
  });

  const geminiUpload = useGeminiStreamUpload({
    onProgress: (geminiProgress) => {
      const newProgress = {
        ...progress,
        gemini: geminiProgress,
        overall: (progress.s3.percentage + geminiProgress.percentage) / 2,
      };
      setProgress(newProgress);
      onProgress?.(newProgress);
    },
    onError: (error: Error) => {
      console.error("Gemini upload failed:", error);
      onError?.(error);
    },
  });

  const uploadFile = useCallback(
    async (
      file: File,
      options?: {
        fileName?: string;
        prefix?: string;
        durationSeconds?: number;
      },
    ): Promise<ParallelUploadResult> => {
      try {
        setIsUploading(true);
        console.log("🚀 Starting parallel upload to S3 and Gemini...");

        const durationSeconds = options?.durationSeconds;
        if (!durationSeconds) {
          throw new Error("Duration is required for video uploads");
        }

        // Start both uploads in parallel
        const [s3Result, geminiResult] = await Promise.all([
          // S3 upload (with duration for multipart uploads, but we'll disable auto master script in backend)
          s3Upload.uploadFile(file, {
            fileName: options?.fileName,
            prefix: options?.prefix,
            durationSeconds: durationSeconds,
          }),
          // Gemini upload via streaming
          geminiUpload.uploadToGemini(file),
        ]);

        console.log("✅ Both uploads completed successfully");
        console.log("📦 S3 Result:", s3Result);
        console.log("🧠 Gemini Result:", geminiResult);

        // Now generate master script using Gemini URI
        console.log("🎬 Generating master script from Gemini URI...");
        const masterScriptResult = await generateMasterScript.mutateAsync({
          fileUri: geminiResult.fileUri,
          mimeType: geminiResult.mimeType,
          s3Url: s3Result.location,
          durationSeconds,
        });

        const result: ParallelUploadResult = {
          s3: s3Result,
          gemini: geminiResult,
          demoVideo: masterScriptResult.demoVideo,
        };

        console.log(
          "✅ Parallel upload and master script generation completed!",
        );
        onSuccess?.(result);
        return result;
      } catch (error) {
        console.error("❌ Parallel upload failed:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        onError?.(new Error(errorMessage));
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [
      s3Upload,
      geminiUpload,
      generateMasterScript,
      onProgress,
      onSuccess,
      onError,
    ],
  );

  return {
    uploadFile,
    isUploading:
      isUploading || s3Upload.isUploading || geminiUpload.isUploading,
    progress,
    s3Progress: progress.s3,
    geminiProgress: progress.gemini,
  };
};
