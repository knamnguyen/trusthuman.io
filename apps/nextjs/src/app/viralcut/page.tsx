"use client";

import type { DropzoneOptions } from "react-dropzone";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@sassy/ui/button";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@sassy/ui/components/file-uploader";
import { Progress } from "@sassy/ui/progress";
import { VIDEO_CONSTRAINTS } from "@sassy/ui/schema-validators";

import { useMultipartUpload } from "~/hooks/use-multipart-upload";
import { useTRPC } from "~/trpc/react";

const FileUploadDropzone = () => {
  const [files, setFiles] = useState<File[] | null>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "completed" | "failed"
  >("idle");
  const [speedMultiplier, setSpeedMultiplier] = useState(0.5);
  const [processingStatus, setProcessingStatus] = useState<
    "idle" | "processing" | "completed" | "failed"
  >("idle");

  // Store processing data from Remotion
  const [processingData, setProcessingData] = useState<{
    renderId: string;
    bucketName: string;
    videoUrl: string;
    originalDuration: number;
  } | null>(null);

  // Store final result
  const [processedVideoUrl, setProcessedVideoUrl] = useState<string | null>(
    null,
  );

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Multipart upload hook
  const {
    uploadFile: uploadFileWithMultipart,
    isUploading: isMultipartUploading,
  } = useMultipartUpload({
    onProgress: (progress) => {
      setUploadProgress(progress.percentage);
    },
    onSuccess: (result) => {
      console.log("Upload successful:", result);
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error(`Error: ${error.message}`);
      setUploadStatus("failed");
    },
  });

  const processVideoSpeed = useMutation(
    trpc.remotion.processVideoSpeed.mutationOptions({
      onSuccess: (data) => {
        setProcessingStatus("processing");
        toast.success("Video processing started!");
      },
      onError: (err: any) => {
        console.error("Failed to start video processing:", err.message);
        toast.error("Failed to start video processing");
        setProcessingStatus("failed");
      },
    }),
  );

  // Query for processing progress
  const { data: progress } = useQuery({
    ...trpc.remotion.getRenderProgress.queryOptions({
      renderId: processingData?.renderId || "",
      bucketName: processingData?.bucketName || "",
    }),
    enabled: Boolean(
      processingData?.renderId &&
        processingData?.bucketName &&
        processingStatus === "processing",
    ),
    refetchInterval: (data: any) => {
      return processingStatus === "processing" && !data?.done ? 10000 : false;
    },
  });

  // Query for download URL when processing is complete
  const { data: downloadData } = useQuery({
    ...trpc.remotion.getDownloadUrl.queryOptions({
      bucketName: processingData?.bucketName || "",
      outputFile: progress?.outputFile || "",
    }),
    enabled: Boolean(
      processingData?.bucketName &&
        progress?.outputFile &&
        progress?.done &&
        !progress?.fatalErrorEncountered,
    ),
  });

  // Update processing status based on progress
  if (progress?.done && processingStatus === "processing") {
    if (progress.fatalErrorEncountered) {
      setProcessingStatus("failed");
    } else {
      setProcessingStatus("completed");
      if (downloadData?.downloadUrl) {
        setProcessedVideoUrl(downloadData.downloadUrl);
      }
    }
  }

  // Debug logging
  console.log("Frontend Debug:", {
    processingData,
    processingStatus,
    progress,
    downloadData,
    processedVideoUrl,
  });

  const dropzone = {
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
    },
    multiple: false,
    maxFiles: 1,
    maxSize: VIDEO_CONSTRAINTS.MAX_SIZE, // 2GB
  } satisfies DropzoneOptions;

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast.error("Please select a video file first");
      return;
    }

    const file = files[0]!;
    setIsUploading(true);
    setUploadStatus("uploading");
    setUploadProgress(0);

    try {
      // Step 1: Get video duration first
      const duration = await getVideoDuration(file);
      if (duration <= 0) {
        throw new Error("Unable to determine video duration");
      }

      // Step 2: Upload to S3 with duration for database save
      const uploadResult = await uploadFileWithMultipart(file, {
        prefix: "uploads",
        durationSeconds: Math.round(duration),
      });

      // Step 3: Store processing info for later use
      setProcessingData({
        renderId: "", // Will be set after processing starts
        bucketName: "", // Will be set after processing starts
        videoUrl: uploadResult.location,
        originalDuration: duration,
      });

      setUploadProgress(100);
      setUploadStatus("completed");

      toast.success("Video uploaded successfully!");
      if (uploadResult.demoVideo) {
        console.log("Demo video saved to database:", uploadResult.demoVideo);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setUploadStatus("failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdjustSpeed = async () => {
    if (!processingData?.videoUrl) {
      toast.error("No video available for processing");
      return;
    }

    try {
      const result = await processVideoSpeed.mutateAsync({
        videoUrl: processingData.videoUrl,
        speedMultiplier,
        originalDuration: processingData.originalDuration,
      });

      // Update processing data with render info
      setProcessingData((prev) =>
        prev
          ? {
              ...prev,
              renderId: result.renderId,
              bucketName: result.bucketName,
            }
          : null,
      );
    } catch (error) {
      console.error("Processing error:", error);
      setProcessingStatus("failed");
    }
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        resolve(video.duration);
      };

      video.onerror = () => {
        resolve(0); // Default duration if unable to detect
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const resetUpload = () => {
    setFiles([]);
    setUploadStatus("idle");
    setUploadProgress(0);
    setProcessingStatus("idle");
    setProcessingData(null);
    setProcessedVideoUrl(null);
  };

  const getUploadStatusMessage = () => {
    switch (uploadStatus) {
      case "uploading":
        return "Uploading video to cloud storage...";
      case "completed":
        return "Video uploaded successfully!";
      case "failed":
        return "Upload failed. Please try again.";
      default:
        return "";
    }
  };

  const getProcessingStatusMessage = () => {
    switch (processingStatus) {
      case "processing":
        return `Processing video with ${speedMultiplier}x speed...`;
      case "completed":
        return "Video processing completed!";
      case "failed":
        return "Processing failed. Please try again.";
      default:
        return "";
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Video Speed Adjustment</h1>
        <p className="text-gray-600">
          Upload a video (max 2GB, 5 minutes) and adjust its playback speed
          using AI processing
        </p>
      </div>

      <FileUploader
        value={files}
        onValueChange={setFiles}
        dropzoneOptions={dropzone}
      >
        <FileInput>
          <div className="bg-background flex h-32 w-full items-center justify-center rounded-md border">
            <p className="text-gray-400">Drop video files here</p>
          </div>
        </FileInput>
        <FileUploaderContent className="flex flex-row items-center gap-2">
          {files?.map((file, i) => (
            <FileUploaderItem
              key={i}
              index={i}
              className="w-full overflow-hidden rounded-md border p-4"
              aria-roledescription={`file ${i + 1} containing ${file.name}`}
            >
              <div className="space-y-2">
                <video
                  src={URL.createObjectURL(file)}
                  controls
                  className="h-40 w-full rounded"
                  preload="metadata"
                />
                <div className="text-sm text-gray-600">
                  <p>File: {file.name}</p>
                  <p>Size: {(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              </div>
            </FileUploaderItem>
          ))}
        </FileUploaderContent>
      </FileUploader>

      {files && files.length > 0 && uploadStatus === "idle" && (
        <div className="space-y-4">
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full"
          >
            Upload Video
          </Button>
        </div>
      )}

      {uploadStatus === "uploading" && (
        <div className="space-y-4 rounded border border-blue-200 bg-blue-50 p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{getUploadStatusMessage()}</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        </div>
      )}

      {uploadStatus === "completed" && processingStatus === "idle" && (
        <div className="space-y-4 rounded border border-green-200 bg-green-50 p-4">
          <h3 className="text-lg font-semibold text-green-800">
            Video Uploaded Successfully!
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-green-700">
                Speed Multiplier: {speedMultiplier}x
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={speedMultiplier}
                onChange={(e) => setSpeedMultiplier(parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0.1x (Very Slow)</span>
                <span>1x (Normal)</span>
                <span>3x (Fast)</span>
              </div>
            </div>

            <Button
              onClick={handleAdjustSpeed}
              disabled={processVideoSpeed.isPending}
              className="w-full"
            >
              {processVideoSpeed.isPending
                ? "Starting Processing..."
                : "Adjust Video Speed"}
            </Button>

            <Button onClick={resetUpload} variant="outline" className="w-full">
              Upload Another Video
            </Button>
          </div>
        </div>
      )}

      {processingStatus === "processing" && (
        <div className="space-y-4 rounded border border-blue-200 bg-blue-50 p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{getProcessingStatusMessage()}</span>
              <span>{progress ? Math.round(progress.progress * 100) : 0}%</span>
            </div>
            <Progress
              value={progress ? progress.progress * 100 : 0}
              className="w-full"
            />
          </div>
          <p className="text-sm text-blue-700">
            This may take a few minutes depending on video length...
          </p>
        </div>
      )}

      {processingStatus === "completed" && (
        <div className="space-y-4 rounded border border-green-200 bg-green-50 p-4">
          <h3 className="text-lg font-semibold text-green-800">
            Video Processing Complete!
          </h3>

          {!processedVideoUrl && (
            <p className="text-sm text-blue-700">Loading processed video...</p>
          )}

          {processedVideoUrl && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-700">
                  Processed Video Preview:
                </p>
                <video
                  src={processedVideoUrl}
                  controls
                  className="h-60 w-full rounded border"
                  preload="metadata"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(processedVideoUrl, "_blank")}
                  className="flex-1"
                >
                  Download Video
                </Button>
                <Button
                  onClick={resetUpload}
                  variant="outline"
                  className="flex-1"
                >
                  Process Another Video
                </Button>
              </div>
            </div>
          )}

          {!processedVideoUrl && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Video URL not available yet. This may take a moment...
              </p>
              <Button
                onClick={resetUpload}
                variant="outline"
                className="w-full"
              >
                Try Processing Another Video
              </Button>
            </div>
          )}
        </div>
      )}

      {(uploadStatus === "failed" || processingStatus === "failed") && (
        <div className="space-y-4 rounded border border-red-200 bg-red-50 p-4">
          <h3 className="text-lg font-semibold text-red-800">
            {uploadStatus === "failed" ? "Upload Failed" : "Processing Failed"}
          </h3>
          <div className="space-y-2">
            <p className="text-sm text-red-700">
              Something went wrong. Please try again.
            </p>
            <Button onClick={resetUpload} variant="outline" className="w-full">
              Try Again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploadDropzone;
