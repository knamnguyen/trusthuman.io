"use client";

import * as React from "react";

import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import { Skeleton } from "@sassy/ui/skeleton";
import { cn } from "@sassy/ui/utils";

import { VideoPlayer } from "./video-player";

interface ViralStitch {
  id: string;
  stitchedVideoUrl: string;
  durationSeconds: number;
  createdAt: string;
  hookViralVideo: {
    id: string;
    title: string;
    hookEndTimestamp: string;
  };
  shortDemo: {
    id: string;
    durationSeconds: number;
  };
}

interface ViralStitchGridProps {
  stitches: ViralStitch[];
  isLoading?: boolean;
  showGeneratingSkeleton?: boolean;
  className?: string;
}

const ViralStitchGrid = React.forwardRef<HTMLDivElement, ViralStitchGridProps>(
  (
    { stitches, isLoading = false, showGeneratingSkeleton = false, className },
    ref,
  ) => {
    const handleDownload = (url: string, filename: string) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // Component for generating skeleton
    const GeneratingSkeleton = () => (
      <Card className="overflow-hidden border-blue-200 bg-blue-50/50">
        <CardContent className="p-0">
          {/* Video skeleton */}
          <Skeleton className="aspect-video w-full" />

          <div className="space-y-3 p-4">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <span className="text-sm font-medium text-blue-700">
                Generating viral video...
              </span>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>

            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );

    if (isLoading) {
      return (
        <div ref={ref} className={cn("w-full", className)}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Viral Stitch Library</CardTitle>
              <CardDescription>
                Your generated viral videos will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="bg-muted mb-3 aspect-video rounded-md" />
                      <div className="space-y-2">
                        <div className="bg-muted h-4 w-3/4 rounded" />
                        <div className="bg-muted h-3 w-1/2 rounded" />
                        <div className="bg-muted h-8 w-full rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("w-full", className)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              Viral Stitch Library
              <Badge variant="secondary">
                {stitches.length + (showGeneratingSkeleton ? 1 : 0)} videos
              </Badge>
            </CardTitle>
            <CardDescription>
              Your generated viral videos. Each combines your demo with a proven
              viral hook.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stitches.length === 0 && !showGeneratingSkeleton ? (
              <div className="py-12 text-center">
                <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                  <span className="text-2xl">🎬</span>
                </div>
                <h3 className="mb-2 text-lg font-medium">
                  No viral videos yet
                </h3>
                <p className="text-muted-foreground mx-auto max-w-sm text-sm">
                  Use the content guide form to generate your first viral video.
                  Each generation creates a unique combination with a different
                  viral hook.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Show generating skeleton first if active */}
                {showGeneratingSkeleton && <GeneratingSkeleton />}

                {/* Show existing stitches */}
                {stitches.map((stitch) => (
                  <Card key={stitch.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <VideoPlayer
                        src={stitch.stitchedVideoUrl}
                        title={`Viral Stitch - ${stitch.hookViralVideo.title}`}
                        className="rounded-none"
                        muted
                      />

                      <div className="space-y-3 p-4">
                        <div>
                          <h4 className="mb-1 line-clamp-2 text-sm font-medium">
                            {stitch.hookViralVideo.title}
                          </h4>
                          <div className="text-muted-foreground flex items-center gap-2 text-xs">
                            <span>
                              Duration: {formatDuration(stitch.durationSeconds)}
                            </span>
                            <span>•</span>
                            <span>
                              Hook: {stitch.hookViralVideo.hookEndTimestamp}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">
                            {formatDate(stitch.createdAt)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleDownload(
                                stitch.stitchedVideoUrl,
                                `viral-stitch-${stitch.id}.mp4`,
                              )
                            }
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  },
);

ViralStitchGrid.displayName = "ViralStitchGrid";

export { ViralStitchGrid, type ViralStitch };
