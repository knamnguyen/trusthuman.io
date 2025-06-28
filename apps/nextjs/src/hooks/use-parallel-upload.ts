"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "~/trpc/react";
import { useLambdaUpload } from "./use-lambda-upload";
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

  // Initialize Lambda upload for Gemini
  const lambdaUpload = useLambdaUpload();

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
        console.log(
          "🚀 Starting parallel upload to S3 and Gemini via Lambda...",
        );

        const durationSeconds = options?.durationSeconds;
        if (!durationSeconds) {
          throw new Error("Duration is required for video uploads");
        }

        // Set initial total bytes for progress calculation
        setProgress((prev) => ({
          ...prev,
          gemini: { ...prev.gemini, totalBytes: file.size },
        }));

        // Start both uploads in parallel
        console.log("🎯 Starting Promise.all for S3 and Lambda uploads");
        const [s3Result, lambdaResult] = await Promise.all([
          // S3 upload (with duration for multipart uploads, but we'll disable auto master script in backend)
          s3Upload.uploadFile(file, {
            fileName: options?.fileName,
            prefix: options?.prefix,
            durationSeconds: durationSeconds,
          }),
          // Gemini upload via Lambda
          lambdaUpload.uploadFile(file),
        ]);
        console.log("🎉 Promise.all completed - both uploads finished!");

        console.log("✅ Both uploads completed successfully");
        console.log("📦 S3 Result:", s3Result);
        console.log("🧠 Lambda Result:", lambdaResult);

        // Extract fileUri string from Lambda response object
        if (!lambdaResult.success || !lambdaResult.fileUri) {
          throw new Error(lambdaResult.error || "Lambda upload failed");
        }

        const fileUriString = lambdaResult.fileUri;

        // Create Gemini result object to match expected interface
        const geminiResult = {
          fileUri: fileUriString,
          mimeType: file.type,
          name: file.name,
        };

        // Now generate master script using Gemini URI
        console.log("🎬 Generating master script from Gemini URI...");
        const masterScriptResult = await generateMasterScript.mutateAsync({
          fileUri: fileUriString,
          mimeType: file.type,
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
      lambdaUpload,
      generateMasterScript,
      onProgress,
      onSuccess,
      onError,
    ],
  );

  return {
    uploadFile,
    isUploading:
      isUploading || s3Upload.isUploading || lambdaUpload.isUploading,
    progress,
    s3Progress: progress.s3,
    geminiProgress: progress.gemini,
  };
};
