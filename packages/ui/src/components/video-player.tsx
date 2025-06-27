"use client";

import * as React from "react";

import { Card, CardContent } from "@sassy/ui/card";
import { cn } from "@sassy/ui/utils";

interface VideoPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  title?: string;
  poster?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  width?: string | number;
  height?: string | number;
}

const VideoPlayer = React.forwardRef<HTMLDivElement, VideoPlayerProps>(
  (
    {
      className,
      src,
      title,
      poster,
      controls = true,
      autoPlay = false,
      muted = false,
      loop = false,
      width,
      height,
      ...props
    },
    ref,
  ) => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [hasError, setHasError] = React.useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    if (hasError) {
      return (
        <Card className={cn("w-full", className)}>
          <CardContent className="flex h-48 items-center justify-center p-6">
            <div className="space-y-2 text-center">
              <p className="text-destructive text-sm font-medium">
                Failed to load video
              </p>
              <p className="text-muted-foreground text-xs">
                Please check the video URL or try refreshing the page
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div ref={ref} className={cn("relative w-full", className)} {...props}>
        <Card className="overflow-hidden">
          <CardContent className="relative p-0">
            {isLoading && (
              <div className="bg-muted absolute inset-0 z-10 flex items-center justify-center">
                <div className="space-y-2 text-center">
                  <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
                  <p className="text-muted-foreground text-sm">
                    Loading video...
                  </p>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              src={src}
              title={title}
              poster={poster}
              controls={controls}
              autoPlay={autoPlay}
              muted={muted}
              loop={loop}
              width={width}
              height={height}
              onLoadStart={handleLoadStart}
              onCanPlay={handleCanPlay}
              onError={handleError}
              className="h-auto w-full rounded-md"
              preload="metadata"
            >
              <track kind="captions" />
              Your browser does not support the video tag.
            </video>
          </CardContent>
        </Card>

        {title && (
          <div className="mt-2">
            <h3 className="text-foreground truncate text-sm font-medium">
              {title}
            </h3>
          </div>
        )}
      </div>
    );
  },
);

VideoPlayer.displayName = "VideoPlayer";

export { VideoPlayer };
