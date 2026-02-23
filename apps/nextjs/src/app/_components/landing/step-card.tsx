"use client";

import { useState } from "react";

import { Badge } from "@sassy/ui/badge";

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  videoPath: string;
  youtubeEmbedUrl?: string;
}

export function StepCard({
  number,
  title,
  description,
  videoPath,
  youtubeEmbedUrl,
}: StepCardProps) {
  const isOdd = number % 2 === 1;
  const [videoFailed, setVideoFailed] = useState(false);

  const handleVideoError = () => {
    console.log(
      `Video failed to load for step ${number}, falling back to YouTube`,
    );
    setVideoFailed(true);
  };

  // Shared video classes with 3D perspective
  const videoClassOdd =
    "m-auto rounded-xl border shadow-xl md:max-h-[350px] md:object-cover md:object-left md:[transform:scale(1.2)_perspective(1040px)_rotateY(-11deg)_rotateX(2deg)_rotate(2deg)]";
  const videoClassEven =
    "m-auto rounded-xl border shadow-xl md:max-h-[350px] md:object-cover md:object-right md:[transform:scale(1.2)_perspective(1040px)_rotateY(11deg)_rotateX(2deg)_rotate(-2deg)]";

  // YouTube iframe with same styling
  const renderYouTubeEmbed = (isOddPosition: boolean) => (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-xl border shadow-xl md:max-h-[350px] ${
        isOddPosition
          ? "md:[transform:scale(1.2)_perspective(1040px)_rotateY(-11deg)_rotateX(2deg)_rotate(2deg)]"
          : "md:[transform:scale(1.2)_perspective(1040px)_rotateY(11deg)_rotateX(2deg)_rotate(-2deg)]"
      }`}
    >
      <iframe
        src={youtubeEmbedUrl}
        title={`Demo video showing ${title}`}
        className="absolute -left-[20%] -top-[20%] h-[140%] w-[140%]"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={false}
        style={{ border: 0, pointerEvents: "none" }}
      />
    </div>
  );

  // Video element with error handling
  const renderVideo = (isOddPosition: boolean) => (
    <video
      autoPlay
      loop
      muted
      playsInline
      aria-label={`Demo video showing ${title}`}
      className={isOddPosition ? videoClassOdd : videoClassEven}
      onError={handleVideoError}
    >
      <source src={videoPath} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );

  // Placeholder when no video available
  const renderPlaceholder = (isOddPosition: boolean) => (
    <div
      className={`bg-muted/50 flex aspect-video w-full items-center justify-center rounded-xl border shadow-xl md:max-h-[350px] ${
        isOddPosition
          ? "md:[transform:scale(1.2)_perspective(1040px)_rotateY(-11deg)_rotateX(2deg)_rotate(2deg)]"
          : "md:[transform:scale(1.2)_perspective(1040px)_rotateY(11deg)_rotateX(2deg)_rotate(-2deg)]"
      }`}
    >
      <span className="text-muted-foreground text-sm">Video coming soon</span>
    </div>
  );

  // Decide which media to show
  const renderMedia = (isOddPosition: boolean) => {
    if (videoFailed && youtubeEmbedUrl) {
      return renderYouTubeEmbed(isOddPosition);
    }
    if (videoPath && !videoPath.includes("TODO")) {
      return renderVideo(isOddPosition);
    }
    if (youtubeEmbedUrl) {
      return renderYouTubeEmbed(isOddPosition);
    }
    return renderPlaceholder(isOddPosition);
  };

  return (
    <div className="flex flex-wrap items-center py-8 md:py-16">
      {isOdd ? (
        <>
          {/* Text on left, video on right */}
          <div className="w-full space-y-4 pr-6 md:w-5/12 md:pr-16">
            <Badge
              variant="secondary"
              className="border-border bg-primary text-primary-foreground border-2 px-3 py-1 text-lg font-bold shadow-[2px_2px_0px_#000]"
            >
              {number}
            </Badge>
            <h3 className="text-foreground text-3xl font-bold">{title}</h3>
            <p className="text-muted-foreground text-lg">{description}</p>
          </div>
          <div className="w-full px-4 pt-8 md:w-7/12 md:px-0 md:pl-16 md:pt-0">
            {renderMedia(true)}
          </div>
        </>
      ) : (
        <>
          {/* Video on left, text on right */}
          <div className="order-2 w-full px-4 pt-8 md:order-1 md:w-7/12 md:px-0 md:pr-16 md:pt-0">
            {renderMedia(false)}
          </div>
          <div className="order-1 w-full space-y-4 pl-6 md:order-2 md:w-5/12 md:pl-16">
            <Badge
              variant="secondary"
              className="border-border bg-primary text-primary-foreground border-2 px-3 py-1 text-lg font-bold shadow-[2px_2px_0px_#000]"
            >
              {number}
            </Badge>
            <h3 className="text-foreground text-3xl font-bold">{title}</h3>
            <p className="text-muted-foreground text-lg">{description}</p>
          </div>
        </>
      )}
    </div>
  );
}
