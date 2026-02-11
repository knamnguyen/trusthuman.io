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
    console.log(`Video failed to load for step ${number}, falling back to YouTube`);
    setVideoFailed(true);
  };

  // Shared video classes
  const videoClassOdd =
    "m-auto rounded-lg border shadow-xl md:max-h-[350px] md:object-cover md:object-left md:[transform:scale(1.3)_perspective(1040px)_rotateY(-11deg)_rotateX(2deg)_rotate(2deg)]";
  const videoClassEven =
    "m-auto rounded-lg border shadow-xl md:max-h-[350px] md:object-cover md:object-right md:[transform:scale(1.3)_perspective(1040px)_rotateY(11deg)_rotateX(2deg)_rotate(-2deg)]";

  // YouTube iframe with same styling - scaled up to crop black bars
  const renderYouTubeEmbed = (isOddPosition: boolean) => (
    <div
      className={`relative aspect-video w-full overflow-hidden rounded-lg border shadow-xl md:max-h-[350px] ${
        isOddPosition
          ? "md:[transform:scale(1.3)_perspective(1040px)_rotateY(-11deg)_rotateX(2deg)_rotate(2deg)]"
          : "md:[transform:scale(1.3)_perspective(1040px)_rotateY(11deg)_rotateX(2deg)_rotate(-2deg)]"
      }`}
    >
      {/* Scale up iframe to crop out black letterbox bars */}
      <iframe
        src={youtubeEmbedUrl}
        title={`Demo video showing ${title}`}
        className="absolute h-[140%] w-[140%] -left-[20%] -top-[20%]"
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

  // Decide which media to show
  const renderMedia = (isOddPosition: boolean) => {
    if (videoFailed && youtubeEmbedUrl) {
      return renderYouTubeEmbed(isOddPosition);
    }
    return renderVideo(isOddPosition);
  };

  return (
    <div className="flex flex-wrap items-center py-8 md:py-16">
      {isOdd ? (
        <>
          {/* Text on left (5/12), video on right (7/12) */}
          <div className="w-full pr-6 md:w-5/12 md:pr-16 space-y-4">
            <Badge
              variant="secondary"
              className="border-2 border-border bg-primary text-primary-foreground px-3 py-1 text-lg font-bold shadow-[2px_2px_0px_#000]"
            >
              {number}
            </Badge>
            <h3 className="text-3xl font-bold text-foreground">{title}</h3>
            <p className="text-lg text-muted-foreground">{description}</p>
          </div>
          <div className="w-full px-4 pt-8 md:w-7/12 md:px-0 md:pt-0 md:pl-16">
            {renderMedia(true)}
          </div>
        </>
      ) : (
        <>
          {/* Video on left (7/12), text on right (5/12) */}
          <div className="w-full px-4 pt-8 md:w-7/12 md:px-0 md:pt-0 md:pr-16 order-2 md:order-1">
            {renderMedia(false)}
          </div>
          <div className="w-full pl-6 md:w-5/12 md:pl-16 space-y-4 order-1 md:order-2">
            <Badge
              variant="secondary"
              className="border-2 border-border bg-primary text-primary-foreground px-3 py-1 text-lg font-bold shadow-[2px_2px_0px_#000]"
            >
              {number}
            </Badge>
            <h3 className="text-3xl font-bold text-foreground">{title}</h3>
            <p className="text-lg text-muted-foreground">{description}</p>
          </div>
        </>
      )}
    </div>
  );
}
