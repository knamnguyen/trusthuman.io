"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ViralStitch } from "@sassy/ui/components/viral-stitch-grid";
import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import { ContentGuideForm } from "@sassy/ui/components/content-guide-form";
import { VideoPlayer } from "@sassy/ui/components/video-player";
import { ViralStitchGrid } from "@sassy/ui/components/viral-stitch-grid";

import { useTRPC } from "~/trpc/react";

export default function GenerationPage() {
  const params = useParams();
  const demoVideoId = params.demoVideoId as string;

  const [isGenerating, setIsGenerating] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch demo video data
  const {
    data: demoVideoData,
    isLoading: isDemoLoading,
    error: demoError,
  } = useQuery(
    trpc.viralStitch.getDemoVideo.queryOptions({
      demoVideoId,
    }),
  );

  // Fetch viral stitches
  const {
    data: viralStitchesData,
    isLoading: isStitchesLoading,
    refetch: refetchStitches,
  } = useQuery(
    trpc.viralStitch.getViralStitches.queryOptions({
      demoVideoId,
      limit: 20,
    }),
  );

  // Generate viral stitch mutation
  const generateStitchMutation = useMutation(
    trpc.viralStitch.generateViralStitch.mutationOptions({
      onSuccess: (result: any) => {
        console.log("Viral stitch generated:", result);
        setIsGenerating(false);
        // Refetch stitches to show the new one
        refetchStitches();
      },
      onError: (error: any) => {
        console.error("Failed to generate viral stitch:", error);
        toast.error(`Generation failed: ${error.message}`);
        setIsGenerating(false);
      },
    }),
  );

  const handleGenerate = async (contentGuide: string) => {
    setIsGenerating(true);
    console.log("Starting generation with content guide:", contentGuide);

    try {
      await generateStitchMutation.mutateAsync({
        demoVideoId,
        contentGuide: contentGuide || undefined,
      });
    } catch (error) {
      // Error handling is done in onError callback
      console.error("Generation error:", error);
    }
  };

  // Loading state
  if (isDemoLoading) {
    return (
      <main className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left side skeleton */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="bg-muted h-6 w-1/2 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="bg-muted aspect-video animate-pulse rounded" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="bg-muted h-6 w-1/3 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="bg-muted mb-4 h-24 animate-pulse rounded" />
                  <div className="bg-muted h-10 animate-pulse rounded" />
                </CardContent>
              </Card>
            </div>

            {/* Right side skeleton */}
            <div>
              <Card>
                <CardHeader>
                  <div className="bg-muted h-6 w-1/2 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="bg-muted aspect-video animate-pulse rounded" />
                        <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
                        <div className="bg-muted h-3 w-1/2 animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (demoError || !demoVideoData?.success) {
    return (
      <main className="bg-background min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Card className="mx-auto max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
              <CardDescription>
                {demoError?.message || "Failed to load demo video"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
                className="w-full"
              >
                Return to Homepage
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const demoVideo = demoVideoData.demoVideo;
  const stitches: ViralStitch[] = viralStitchesData?.success
    ? viralStitchesData.stitches
    : [];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => (window.location.href = "/")}
            className="mb-4"
          >
            ← Back to Upload
          </Button>
          <h1 className="mb-2 text-3xl font-bold">
            <span className="text-primary">Viral</span>Cut Generation
          </h1>
          <p className="text-muted-foreground">
            Generate viral videos from your demo using AI-powered hook matching
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column: Demo Video Only */}
          <div className="space-y-6">
            {/* Demo Video Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Original Demo Video</CardTitle>
                <CardDescription>
                  Uploaded {formatDate(demoVideo.createdAt)} • Duration:{" "}
                  {formatDuration(demoVideo.durationSeconds)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VideoPlayer
                  src={demoVideo.s3Url}
                  title="Demo Video"
                  controls
                />
                {demoVideo.productInfo && (
                  <div className="bg-muted mt-4 rounded-md p-3">
                    <h4 className="mb-1 text-sm font-medium">Product Info</h4>
                    <p className="text-muted-foreground text-sm">
                      {demoVideo.productInfo}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Content Guide + Viral Stitch Library */}
          <div className="space-y-6">
            {/* Content Guide Form */}
            <ContentGuideForm
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />

            {/* Viral Stitch Library */}
            <ViralStitchGrid
              stitches={stitches}
              isLoading={isStitchesLoading}
              showGeneratingSkeleton={isGenerating}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
