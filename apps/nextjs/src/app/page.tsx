"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, SignUpButton, useAuth, UserButton } from "@clerk/nextjs";
import { toast } from "sonner";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@sassy/ui/components/file-uploader";
import { Progress } from "@sassy/ui/progress";
import { VIDEO_CONSTRAINTS } from "@sassy/ui/schema-validators";

import { useParallelUpload } from "~/hooks/use-parallel-upload";

export default function HomePage() {
  const { isSignedIn } = useAuth();
  const signInButtonRef = useRef<HTMLButtonElement>(null);
  const [files, setFiles] = useState<File[] | null>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "completed" | "failed"
  >("idle");

  const router = useRouter();

  // Parallel upload hook (S3 + Gemini)
  const { uploadFile: uploadFileParallel, isUploading: isParallelUploading } =
    useParallelUpload({
      onProgress: (progress) => {
        setUploadProgress(progress.overall);
      },
      onSuccess: (result) => {
        console.log("Parallel upload successful:", result);
        setUploadStatus("completed");

        if (result.demoVideo?.id) {
          toast.success(
            "Video uploaded successfully! Redirecting to generation page...",
          );
          // Redirect to generation page after short delay
          setTimeout(() => {
            router.push(`/generation/${result.demoVideo.id}`);
          }, 1500);
        } else {
          toast.error("Upload completed but demo video ID not found");
          setUploadStatus("failed");
        }
      },
      onError: (error) => {
        console.error("Parallel upload error:", error);
        toast.error(`Upload failed: ${error.message}`);
        setUploadStatus("failed");
      },
    });

  const dropzoneOptions = {
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
    },
    multiple: false,
    maxFiles: 1,
    maxSize: VIDEO_CONSTRAINTS.MAX_SIZE, // 2GB
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast.error("Please select a video file first");
      return;
    }

    const file = files[0]!;
    setUploadStatus("uploading");
    setUploadProgress(0);

    try {
      // Get video duration first
      const duration = await getVideoDuration(file);
      if (duration <= 0) {
        throw new Error("Unable to determine video duration");
      }

      // Upload to S3 with duration for database save
      await uploadFileParallel(file, {
        prefix: "uploads",
        durationSeconds: Math.round(duration),
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setUploadStatus("failed");
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
  };

  const handleUnauthenticatedUploadClick = () => {
    signInButtonRef.current?.click();
  };

  return (
    <main className="from-background to-muted/20 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto px-4 py-16">
        {/* Navigation Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-xl font-bold">
                <span className="text-primary">Viral</span>Cut
              </h2>
            </div>

            <div className="flex items-center gap-4">
              {isSignedIn ? (
                <UserButton />
              ) : (
                <div className="flex gap-2">
                  <SignInButton mode="modal">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button size="sm">Sign Up</Button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-6xl">
            <span className="text-primary">Viral</span>Cut
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
            Transform your product demos into viral social media content with
            AI-powered hook matching
          </p>
        </div>

        {/* Upload Section */}
        <div className="mx-auto mb-16 max-w-2xl">
          <Card className="border-2 border-dashed">
            <CardHeader className="text-center">
              <CardTitle>Upload Your Demo Video</CardTitle>
              <CardDescription>
                Upload a product demo video to get started. We'll analyze it and
                create viral versions using proven hooks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isSignedIn ? (
                <FileUploader
                  value={files}
                  onValueChange={setFiles}
                  dropzoneOptions={dropzoneOptions}
                >
                  <FileInput>
                    <div className="bg-background flex h-32 w-full items-center justify-center rounded-md border">
                      <div className="text-center">
                        <p className="text-muted-foreground mb-2">
                          Drop your video file here
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Supports MP4, MOV, AVI, MKV, WebM (max{" "}
                          {VIDEO_CONSTRAINTS.MAX_SIZE / 1024 / 1024 / 1024}GB)
                        </p>
                      </div>
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
                          <div className="text-muted-foreground text-sm">
                            <p>File: {file.name}</p>
                            <p>
                              Size: {(file.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                      </FileUploaderItem>
                    ))}
                  </FileUploaderContent>
                </FileUploader>
              ) : (
                <>
                  {/* Fake upload area that triggers sign-in */}
                  <div
                    onClick={handleUnauthenticatedUploadClick}
                    className="bg-background hover:bg-muted/50 flex h-32 w-full cursor-pointer items-center justify-center rounded-md border transition-colors"
                  >
                    <div className="text-center">
                      <p className="text-muted-foreground mb-2">
                        Sign in to drop your video file here
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Supports MP4, MOV, AVI, MKV, WebM (max{" "}
                        {VIDEO_CONSTRAINTS.MAX_SIZE / 1024 / 1024 / 1024}GB)
                      </p>
                    </div>
                  </div>

                  {/* Hidden SignInButton for programmatic triggering */}
                  <SignInButton mode="modal">
                    <button ref={signInButtonRef} className="hidden" />
                  </SignInButton>
                </>
              )}

              {files && files.length > 0 && uploadStatus === "idle" && (
                <div className="space-y-4">
                  {isSignedIn ? (
                    <>
                      <Button
                        onClick={handleUpload}
                        disabled={isParallelUploading}
                        className="w-full"
                        size="lg"
                      >
                        Upload & Generate Master Script
                      </Button>
                      <p className="text-muted-foreground text-center text-sm">
                        This will upload your video and automatically analyze it
                        with AI
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <p className="text-center text-sm font-medium">
                          Sign in to upload and generate viral videos
                        </p>
                        <div className="flex gap-3">
                          <SignInButton mode="modal">
                            <Button size="lg" className="flex-1">
                              Sign In
                            </Button>
                          </SignInButton>
                          <SignUpButton mode="modal">
                            <Button
                              size="lg"
                              variant="outline"
                              className="flex-1"
                            >
                              Sign Up
                            </Button>
                          </SignUpButton>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {uploadStatus === "uploading" && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading and analyzing video...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                      <p className="text-sm text-blue-700">
                        AI is processing your video in parallel with upload.
                        This may take a few minutes...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {uploadStatus === "completed" && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="space-y-2 text-center">
                      <h3 className="text-lg font-semibold text-green-800">
                        Upload Complete!
                      </h3>
                      <p className="text-sm text-green-700">
                        Video uploaded and analyzed successfully. Redirecting to
                        generation page...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {uploadStatus === "failed" && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-red-800">
                        Upload Failed
                      </h3>
                      <p className="text-sm text-red-700">
                        Something went wrong during upload or analysis. Please
                        try again.
                      </p>
                      <Button
                        onClick={resetUpload}
                        variant="outline"
                        className="w-full"
                      >
                        Try Again
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 AI Hook Matching</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Our AI finds the best viral hooks that match your product's
                style and audience
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">✂️ Smart Condensing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Automatically creates engaging segments from your demo with
                perfect timing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🚀 Viral Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Generate multiple viral versions optimized for social media
                platforms
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
