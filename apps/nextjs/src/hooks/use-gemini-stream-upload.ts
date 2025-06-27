"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";

const CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks (required by Gemini Files API)

interface GeminiUploadProgress {
  percentage: number;
  uploadedBytes: number;
  totalBytes: number;
}

interface GeminiUploadResult {
  fileUri: string;
  mimeType: string;
  name: string;
}

interface UseGeminiStreamUploadProps {
  onProgress?: (progress: GeminiUploadProgress) => void;
  onSuccess?: (result: GeminiUploadResult) => void;
  onError?: (error: Error) => void;
}

interface UseGeminiStreamUploadReturn {
  uploadToGemini: (file: File) => Promise<GeminiUploadResult>;
  isUploading: boolean;
  progress: GeminiUploadProgress;
  error: Error | null;
}

export const useGeminiStreamUpload = ({
  onProgress,
  onSuccess,
  onError,
}: UseGeminiStreamUploadProps = {}): UseGeminiStreamUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<GeminiUploadProgress>({
    percentage: 0,
    uploadedBytes: 0,
    totalBytes: 0,
  });
  const [error, setError] = useState<Error | null>(null);

  const trpc = useTRPC();

  // Mutations for streaming upload
  const initiateUpload = useMutation(
    trpc.geminiUpload.initiateUpload.mutationOptions(),
  );
  const uploadChunk = useMutation(
    trpc.geminiUpload.uploadChunk.mutationOptions(),
  );

  const updateProgress = (uploadedBytes: number, totalBytes: number) => {
    const percentage = Math.round((uploadedBytes / totalBytes) * 100);
    const progressData = { percentage, uploadedBytes, totalBytes };
    setProgress(progressData);
    onProgress?.(progressData);
  };

  const uploadToGemini = async (file: File): Promise<GeminiUploadResult> => {
    setIsUploading(true);
    setError(null);
    updateProgress(0, file.size);

    try {
      console.log("🚀 Starting Gemini streaming upload:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      // Step 1: Initiate upload session
      console.log("🔄 Initiating upload session...");
      const session = await initiateUpload.mutateAsync({
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });

      console.log("✅ Upload session initiated:", session.sessionId);

      // Step 2: Upload file in chunks
      let uploadedBytes = 0;
      let fileUri: string | undefined;

      for (let offset = 0; offset < file.size; offset += CHUNK_SIZE) {
        const end = Math.min(offset + CHUNK_SIZE, file.size);
        const chunk = file.slice(offset, end);
        const isLastChunk = end === file.size;

        console.log(
          `📤 Uploading chunk ${Math.floor(offset / CHUNK_SIZE) + 1}/${Math.ceil(file.size / CHUNK_SIZE)}`,
        );

        // Convert chunk to base64
        const chunkBuffer = await chunk.arrayBuffer();
        const base64Chunk = Buffer.from(chunkBuffer).toString("base64");

        // Upload chunk
        const chunkResult = await uploadChunk.mutateAsync({
          sessionId: session.sessionId,
          chunkData: base64Chunk,
          isLastChunk,
        });

        uploadedBytes = end;
        updateProgress(uploadedBytes, file.size);

        // Get file URI from final chunk
        if (isLastChunk && chunkResult.fileUri) {
          fileUri = chunkResult.fileUri;
        }
      }

      if (!fileUri) {
        throw new Error("No file URI returned from upload");
      }

      console.log("✅ Gemini streaming upload completed successfully");

      const result: GeminiUploadResult = {
        fileUri,
        mimeType: file.type,
        name: file.name,
      };

      onSuccess?.(result);
      return result;
    } catch (err) {
      console.error("❌ Gemini streaming upload failed:", err);
      const error =
        err instanceof Error ? err : new Error("Unknown upload error");
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadToGemini,
    isUploading,
    progress,
    error,
  };
};
