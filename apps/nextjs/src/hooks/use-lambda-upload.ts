"use client";

import { useCallback, useState } from "react";

const LAMBDA_BASE_URL =
  "https://xbmtuub6svrqosafjbsh4st23y0roxxe.lambda-url.us-west-2.on.aws";
const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB chunks - Lambda will buffer 2 chunks to make 8MB for Gemini

interface InitiateUploadResponse {
  success: boolean;
  sessionId?: string;
  uploadUrl?: string;
  message?: string;
}

interface UploadChunkResponse {
  success: boolean;
  fileUri?: string;
  uploadedBytes?: number;
  message?: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UploadResult {
  success: boolean;
  fileUri?: string;
  error?: string;
}

export function useLambdaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);
    setProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      console.log("🚀 Starting resumable upload:", {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      });

      // Step 1: Initiate resumable upload
      const initResponse = await fetch(`${LAMBDA_BASE_URL}/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse
          .json()
          .catch(() => ({ error: "Failed to parse error response" }));
        throw new Error(errorData.error || `HTTP ${initResponse.status}`);
      }

      const initData: InitiateUploadResponse = await initResponse.json();

      if (!initData.success || !initData.sessionId) {
        throw new Error(initData.message || "Failed to initiate upload");
      }

      console.log("✅ Upload session created:", {
        sessionId: initData.sessionId,
      });

      // Step 2: Upload file in chunks
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      let uploadedBytes = 0;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        const isLastChunk = chunkIndex === totalChunks - 1;

        console.log(`📤 Uploading chunk ${chunkIndex + 1}/${totalChunks}:`, {
          start,
          end,
          chunkSize: chunk.size,
          isLastChunk,
        });

        // Create form data for chunk
        const formData = new FormData();
        formData.append("sessionId", initData.sessionId);
        formData.append("chunkOffset", start.toString());
        formData.append("isLastChunk", isLastChunk.toString());
        formData.append("chunk", chunk);

        const chunkResponse = await fetch(`${LAMBDA_BASE_URL}/upload-chunk`, {
          method: "POST",
          body: formData,
        });

        if (!chunkResponse.ok) {
          const errorData = await chunkResponse
            .json()
            .catch(() => ({ error: "Failed to parse error response" }));
          throw new Error(errorData.error || `HTTP ${chunkResponse.status}`);
        }

        const chunkData: UploadChunkResponse = await chunkResponse.json();

        if (!chunkData.success) {
          throw new Error(chunkData.message || "Failed to upload chunk");
        }

        uploadedBytes += chunk.size;
        setProgress({
          loaded: uploadedBytes,
          total: file.size,
          percentage: Math.round((uploadedBytes / file.size) * 100),
        });

        console.log(`✅ Chunk ${chunkIndex + 1} uploaded successfully:`, {
          uploadedBytes,
          totalBytes: file.size,
          percentage: Math.round((uploadedBytes / file.size) * 100),
        });

        // If this is the last chunk, we should have the final file URI
        if (isLastChunk && chunkData.fileUri) {
          console.log("🎉 File upload completed:", chunkData.fileUri);
          return {
            success: true,
            fileUri: chunkData.fileUri,
          };
        }
      }

      throw new Error("Upload completed but no file URI received");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      console.error("❌ Upload error:", errorMessage);
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsUploading(false);
    }
  }, []);

  return {
    uploadFile,
    isUploading,
    progress,
    error,
  };
}
