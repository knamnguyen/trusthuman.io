"use client";

import { useState } from "react";

interface UploadServerResult {
  fileUri: string;
  mimeType: string;
  name: string;
  state: string;
}

interface UseUploadServerProps {
  onProgress?: (progress: { percentage: number }) => void;
  onSuccess?: (result: UploadServerResult) => void;
  onError?: (error: Error) => void;
}

interface UseUploadServerReturn {
  uploadToGemini: (file: File) => Promise<UploadServerResult>;
  isUploading: boolean;
  progress: number;
  error: Error | null;
}

export const useUploadServer = ({
  onProgress,
  onSuccess,
  onError,
}: UseUploadServerProps): UseUploadServerReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const uploadToGemini = async (file: File): Promise<UploadServerResult> => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      console.log("🚀 Starting upload to Gemini via upload-server...");
      console.log("📁 File:", file.name, file.type, file.size);

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append("file", file);

      // Track upload progress
      const xhr = new XMLHttpRequest();

      // Promise wrapper for XMLHttpRequest
      const uploadPromise = new Promise<UploadServerResult>(
        (resolve, reject) => {
          // Progress tracking
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percentage = Math.round((event.loaded / event.total) * 100);
              setProgress(percentage);
              onProgress?.({ percentage });
            }
          });

          // Handle completion
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                if (response.success && response.data) {
                  console.log("✅ Upload to Gemini successful:", response.data);
                  resolve(response.data);
                } else {
                  reject(new Error(response.error || "Upload failed"));
                }
              } catch (parseError) {
                reject(new Error("Failed to parse upload response"));
              }
            } else {
              reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
          });

          // Handle errors
          xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
          });

          // Handle timeouts
          xhr.addEventListener("timeout", () => {
            reject(new Error("Upload timeout"));
          });

          // Start the upload
          xhr.open("POST", "http://localhost:3001/upload/gemini");
          xhr.timeout = 300000; // 5 minutes timeout
          xhr.send(formData);
        },
      );

      const result = await uploadPromise;
      setProgress(100);
      onSuccess?.(result);
      return result;
    } catch (err) {
      console.error("❌ Upload to Gemini failed:", err);
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
