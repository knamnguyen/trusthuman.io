"use client";

import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
const MAX_CONCURRENT_UPLOADS = 3; // Upload 3 parts in parallel

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  key: string;
  bucket: string;
  location: string;
  // demoVideo removed - no longer auto-generated during S3 upload
}

interface UseMultipartUploadProps {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

export const useMultipartUpload = ({
  onProgress,
  onSuccess,
  onError,
}: UseMultipartUploadProps = {}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });

  const trpc = useTRPC();

  // Create mutation hooks
  const getUploadUrl = useMutation(trpc.video.getUploadUrl.mutationOptions());
  const initMultipartUpload = useMutation(
    trpc.video.initMultipartUpload.mutationOptions(),
  );
  const getPartUploadUrls = useMutation(
    trpc.video.getPartUploadUrls.mutationOptions(),
  );
  const completeMultipartUpload = useMutation(
    trpc.video.completeMultipartUpload.mutationOptions(),
  );
  const abortMultipartUpload = useMutation(
    trpc.video.abortMultipartUpload.mutationOptions(),
  );

  const updateProgress = useCallback(
    (loaded: number, total: number) => {
      const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
      const progress = { loaded, total, percentage };
      setUploadProgress(progress);
      onProgress?.(progress);
    },
    [onProgress],
  );

  const uploadPart = async (
    uploadUrl: string,
    chunk: Blob,
    partNumber: number,
  ): Promise<{ partNumber: number; etag: string }> => {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: chunk,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload part ${partNumber}: ${errorText}`);
    }

    const etag = response.headers.get("ETag");
    if (!etag) {
      throw new Error(`No ETag returned for part ${partNumber}`);
    }

    return {
      partNumber,
      etag: etag.replace(/"/g, ""), // Remove quotes from ETag
    };
  };

  const uploadInParallel = async (
    chunks: Blob[],
    partUrls: { partNumber: number; uploadUrl: string }[],
  ): Promise<{ partNumber: number; etag: string }[]> => {
    const results: { partNumber: number; etag: string }[] = [];
    let completedParts = 0;

    // Create a semaphore to limit concurrent uploads
    const uploadQueue = partUrls.map((partData, index) => ({
      ...partData,
      chunk: chunks[index]!,
    }));

    const executeUpload = async (item: (typeof uploadQueue)[0]) => {
      try {
        const result = await uploadPart(
          item.uploadUrl,
          item.chunk,
          item.partNumber,
        );
        results.push(result);

        completedParts++;
        updateProgress(completedParts * CHUNK_SIZE, chunks.length * CHUNK_SIZE);

        return result;
      } catch (error) {
        console.error(`Failed to upload part ${item.partNumber}:`, error);
        throw error;
      }
    };

    // Process uploads with concurrency limit
    const processBatch = async (batch: typeof uploadQueue) => {
      return await Promise.all(batch.map(executeUpload));
    };

    // Split into batches to control concurrency
    for (let i = 0; i < uploadQueue.length; i += MAX_CONCURRENT_UPLOADS) {
      const batch = uploadQueue.slice(i, i + MAX_CONCURRENT_UPLOADS);
      await processBatch(batch);
    }

    return results;
  };

  const uploadFile = useCallback(
    async (
      file: File,
      options?: {
        fileName?: string;
        prefix?: string;
        durationSeconds?: number;
      },
    ): Promise<UploadResult> => {
      try {
        setIsUploading(true);
        updateProgress(0, file.size);

        const finalFileName = options?.fileName || file.name;
        const prefix = options?.prefix || "uploads";
        const durationSeconds = options?.durationSeconds;

        // Determine if we need multipart upload (files >= 10MB)
        if (file.size < CHUNK_SIZE) {
          // Single part upload for small files
          console.log("Using single part upload for file size:", file.size);

          const uploadData = await getUploadUrl.mutateAsync({
            fileName: finalFileName,
            contentType: file.type,
            prefix,
            durationSeconds,
          });

          if (!uploadData.success) {
            throw new Error("Failed to get upload URL");
          }

          // Upload directly
          const response = await fetch(uploadData.uploadUrl, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${errorText}`);
          }

          updateProgress(file.size, file.size);

          const result: UploadResult = {
            key: uploadData.key,
            bucket: uploadData.bucket,
            location: `https://${uploadData.bucket}.s3.amazonaws.com/${uploadData.key}`,
          };

          onSuccess?.(result);
          return result;
        }

        // Multipart upload for large files
        console.log("Using multipart upload for file size:", file.size);

        // Step 1: Initialize multipart upload
        const initResult = await initMultipartUpload.mutateAsync({
          fileName: finalFileName,
          contentType: file.type,
          prefix,
        });

        if (!initResult.success) {
          throw new Error("Failed to initialize multipart upload");
        }

        // Step 2: Split file into chunks
        const chunks: Blob[] = [];
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          chunks.push(file.slice(start, end));
        }

        // Step 3: Get presigned URLs for all parts
        const partNumbers = Array.from(
          { length: totalChunks },
          (_, i) => i + 1,
        );
        const partUrlsResult = await getPartUploadUrls.mutateAsync({
          key: initResult.key,
          uploadId: initResult.uploadId,
          partNumbers,
        });

        if (!partUrlsResult.success) {
          throw new Error("Failed to get part upload URLs");
        }

        // Step 4: Upload all parts in parallel
        const uploadedParts = await uploadInParallel(
          chunks,
          partUrlsResult.partUrls,
        );

        // Step 5: Complete multipart upload with duration
        if (!durationSeconds) {
          throw new Error("Duration is required for video uploads");
        }

        const completeResult = await completeMultipartUpload.mutateAsync({
          key: initResult.key,
          uploadId: initResult.uploadId,
          parts: uploadedParts.sort((a, b) => a.partNumber - b.partNumber),
          durationSeconds,
        });

        if (!completeResult.success) {
          throw new Error("Failed to complete multipart upload");
        }

        const result: UploadResult = {
          key: completeResult.key,
          bucket: completeResult.bucket,
          location: completeResult.location,
        };

        onSuccess?.(result);
        return result;
      } catch (error) {
        console.error("Upload error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        onError?.(new Error(errorMessage));
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [
      getUploadUrl,
      initMultipartUpload,
      getPartUploadUrls,
      completeMultipartUpload,
      updateProgress,
      onSuccess,
      onError,
    ],
  );

  const abortUpload = useCallback(
    async (key: string, uploadId: string) => {
      try {
        await abortMultipartUpload.mutateAsync({ key, uploadId });
      } catch (error) {
        console.error("Failed to abort upload:", error);
      }
    },
    [abortMultipartUpload],
  );

  return {
    uploadFile,
    abortUpload,
    isUploading,
    uploadProgress,
  };
};

export type { UploadProgress, UploadResult };
