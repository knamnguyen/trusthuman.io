import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UseVideoAdjustSpeedReturn {
  adjustVideoSpeed: (file: File) => Promise<Blob | null>;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

export const useVideoAdjustSpeed = (): UseVideoAdjustSpeedReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const adjustVideoSpeed = useCallback(
    async (file: File): Promise<Blob | null> => {
      if (!file) {
        setError("No file provided");
        return null;
      }

      // Fixed speed multiplier - set to 0.5 to slow down video and double the length
      const speedMultiplier = 0.5;

      // Check MediaRecorder support
      if (
        !window.MediaRecorder ||
        !MediaRecorder.isTypeSupported("video/webm")
      ) {
        const errorMsg = "Video processing not supported in this browser";
        setError(errorMsg);
        toast.error(errorMsg);
        return null;
      }

      setIsProcessing(true);
      setProgress(0);
      setError(null);

      try {
        // Create video element to play the source
        const video = document.createElement("video");
        video.muted = false; // Keep audio enabled
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

              // Create audio context for audio processing
              const audioContext = new (window.AudioContext ||
                (window as any).webkitAudioContext)();
              const source = audioContext.createMediaElementSource(video);
              const destination = audioContext.createMediaStreamDestination();

              // Connect audio source to destination (preserves audio)
              source.connect(destination);

              // Capture stream from canvas
              const videoStream = canvas.captureStream(30); // 30 FPS

              // Combine video and audio streams
              const combinedStream = new MediaStream([
                ...videoStream.getVideoTracks(),
                ...destination.stream.getAudioTracks(),
              ]);

              // Calculate target bitrate based on speed adjustment
              // Slower videos might need higher bitrate to maintain quality
              const baseBitrate = 2000000; // 2 Mbps
              const adjustedBitrate = Math.max(
                500000,
                baseBitrate / speedMultiplier,
              );

              const mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: "video/webm",
                videoBitsPerSecond: adjustedBitrate,
                audioBitsPerSecond: 128000, // 128 kbps for audio
              });

              const chunks: BlobPart[] = [];

              mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                  chunks.push(event.data);
                }
              };

              mediaRecorder.onstop = () => {
                audioContext.close();
                const blob = new Blob(chunks, { type: "video/webm" });
                setProgress(100);
                setIsProcessing(false);
                resolve(blob);
              };

              mediaRecorder.onerror = (event) => {
                audioContext.close();
                const errorMsg = "Error during video speed adjustment";
                setError(errorMsg);
                toast.error(errorMsg);
                setIsProcessing(false);
                reject(new Error(errorMsg));
              };

              // Set up video playback at adjusted speed
              video.playbackRate = speedMultiplier;

              // Handle video playback and frame capture
              video.ontimeupdate = () => {
                // Draw current frame to canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Update progress
                const currentProgress =
                  (video.currentTime / video.duration) * 100;
                setProgress(Math.min(currentProgress, 99)); // Keep at 99% until complete
              };

              video.onended = () => {
                mediaRecorder.stop();
              };

              // Set up audio context resume (required by some browsers)
              const startProcessing = async () => {
                if (audioContext.state === "suspended") {
                  await audioContext.resume();
                }

                // Start recording and play video
                mediaRecorder.start();
                video.play();

                toast.success(
                  `Processing video at ${speedMultiplier}x speed (slowing down to double length)...`,
                );
              };

              startProcessing();
            } catch (err) {
              const errorMsg = `Speed adjustment setup failed: ${err instanceof Error ? err.message : "Unknown error"}`;
              setError(errorMsg);
              toast.error(errorMsg);
              setIsProcessing(false);
              reject(err);
            }
          };

          video.onerror = () => {
            const errorMsg = "Failed to load video for speed adjustment";
            setError(errorMsg);
            toast.error(errorMsg);
            setIsProcessing(false);
            reject(new Error(errorMsg));
          };

          // Set video source
          video.src = URL.createObjectURL(file);
        });
      } catch (err) {
        const errorMsg = `Video speed adjustment failed: ${err instanceof Error ? err.message : "Unknown error"}`;
        setError(errorMsg);
        toast.error(errorMsg);
        setIsProcessing(false);
        return null;
      }
    },
    [],
  );

  return {
    adjustVideoSpeed,
    isProcessing,
    progress,
    error,
  };
};
