import { useCallback, useState } from "react";
import { toast } from "sonner";

import type { CompressionSettings } from "../schema-validators";
import { VIDEO_CONSTRAINTS } from "../schema-validators";

interface UseVideoCompressionReturn {
  compressVideo: (file: File) => Promise<Blob | null>;
  isCompressing: boolean;
  compressionProgress: number;
  error: string | null;
}

export const useVideoCompression = (): UseVideoCompressionReturn => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const compressVideo = useCallback(
    async (file: File): Promise<Blob | null> => {
      if (!file) {
        setError("No file provided");
        return null;
      }

      // Check MediaRecorder support
      if (
        !window.MediaRecorder ||
        !MediaRecorder.isTypeSupported("video/webm")
      ) {
        const errorMsg = "Video compression not supported in this browser";
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }

      setIsCompressing(true);
      setCompressionProgress(0);
      setError(null);

      try {
        // Create video element to play the source
        const video = document.createElement("video");
        video.muted = true;
        video.crossOrigin = "anonymous";

        return new Promise<Blob | null>((resolve, reject) => {
          video.onloadedmetadata = () => {
            try {
              // Create canvas for capturing frames
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");

              if (!ctx) {
                throw new Error("Failed to get canvas context");
              }

              // Set canvas dimensions
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;

              // Capture stream from canvas
              const stream = canvas.captureStream(30); // 30 FPS

              // Start with a reasonable bitrate and adjust if needed
              let videoBitsPerSecond = 1000000; // 1 Mbps initial

              const mediaRecorder = new MediaRecorder(stream, {
                mimeType: "video/webm",
                videoBitsPerSecond,
              });

              const chunks: BlobPart[] = [];

              mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                  chunks.push(event.data);
                }
              };

              mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: "video/webm" });

                // Check if compressed size is acceptable
                if (blob.size <= VIDEO_CONSTRAINTS.TARGET_COMPRESSED_SIZE) {
                  setCompressionProgress(100);
                  setIsCompressing(false);
                  resolve(blob);
                } else {
                  // If still too large, reject and suggest re-compression
                  const errorMsg = `Compressed video is ${(blob.size / 1024 / 1024).toFixed(1)}MB, still over 18MB limit`;
                  setError(errorMsg);
                  toast.error(errorMsg);
                  setIsCompressing(false);
                  resolve(null);
                }
              };

              mediaRecorder.onerror = (event) => {
                const errorMsg = "Error during video compression";
                setError(errorMsg);
                toast.error(errorMsg);
                setIsCompressing(false);
                reject(new Error(errorMsg));
              };

              // Handle video playback and frame capture
              video.ontimeupdate = () => {
                // Draw current frame to canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Update progress
                const progress = (video.currentTime / video.duration) * 100;
                setCompressionProgress(Math.min(progress, 99)); // Keep at 99% until complete
              };

              video.onended = () => {
                mediaRecorder.stop();
              };

              // Start recording and play video
              mediaRecorder.start();
              video.play();
            } catch (err) {
              const errorMsg = `Compression setup failed: ${err instanceof Error ? err.message : "Unknown error"}`;
              setError(errorMsg);
              toast.error(errorMsg);
              setIsCompressing(false);
              reject(err);
            }
          };

          video.onerror = () => {
            const errorMsg = "Failed to load video for compression";
            setError(errorMsg);
            toast.error(errorMsg);
            setIsCompressing(false);
            reject(new Error(errorMsg));
          };

          // Set video source
          video.src = URL.createObjectURL(file);
        });
      } catch (err) {
        const errorMsg = `Video compression failed: ${err instanceof Error ? err.message : "Unknown error"}`;
        setError(errorMsg);
        toast.error(errorMsg);
        setIsCompressing(false);
        return null;
      }
    },
    [],
  );

  return {
    compressVideo,
    isCompressing,
    compressionProgress,
    error,
  };
};
