"use client";

import { useState, useRef } from "react";
import { Download, MessageSquare, Camera, Award } from "lucide-react";

import { AccordionTabs, type AccordionTab } from "@sassy/ui/components/accordion-tabs";

import { MESSAGING } from "./landing-content";

const STEP_ICONS = [Download, MessageSquare, Camera, Award] as const;

// Extract YouTube video ID from embed URL
function getYouTubeVideoId(embedUrl: string): string | null {
  const match = embedUrl.match(/youtube\.com\/embed\/([^?]+)/);
  return match?.[1] ?? null;
}

// Get YouTube thumbnail URL from video ID
function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// Tilting video card with 3-level fallback: MP4 → YouTube → YouTube thumbnail (center position)
interface TiltingVideoCardProps {
  videoPath: string;
  youtubeEmbedUrl?: string;
}

function TiltingVideoCard({ videoPath, youtubeEmbedUrl }: TiltingVideoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hoverTransform, setHoverTransform] = useState({ rotateX: 0, rotateY: 0 });
  const [videoFailed, setVideoFailed] = useState(false);
  const [youtubeFailed, setYoutubeFailed] = useState(false);

  // Extract video ID for thumbnail fallback
  const youtubeVideoId = youtubeEmbedUrl ? getYouTubeVideoId(youtubeEmbedUrl) : null;
  const thumbnailUrl = youtubeVideoId ? getYouTubeThumbnail(youtubeVideoId) : null;

  // Base transform for center position
  const baseRotateX = 5;
  const baseRotateY = 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normalized position from -1 to 1
    const normalizedX = (e.clientX - centerX) / (rect.width / 2);
    const normalizedY = (e.clientY - centerY) / (rect.height / 2);

    // Subtle hover adjustment - pulls hovered area toward viewer
    setHoverTransform({
      rotateY: -normalizedX * 8,
      rotateX: normalizedY * 6,
    });
  };

  const handleMouseLeave = () => {
    setHoverTransform({ rotateX: 0, rotateY: 0 });
  };

  const handleVideoError = () => {
    console.log("Video failed to load, falling back to YouTube");
    setVideoFailed(true);
  };

  const handleYouTubeError = () => {
    console.log("YouTube failed to load, falling back to thumbnail");
    setYoutubeFailed(true);
  };

  // YouTube thumbnail fallback image
  const renderThumbnail = () => (
    <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnailUrl || "/trusthuman-logo.png"}
        alt="TrustHuman Step Demo Preview"
        className="h-full w-full object-cover"
      />
      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
          <div className="ml-1 h-0 w-0 border-y-8 border-l-12 border-y-transparent border-l-slate-900" />
        </div>
      </div>
    </div>
  );

  // YouTube embed with scaled iframe to crop black bars
  const renderYouTubeEmbed = () => (
    <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
      <iframe
        src={youtubeEmbedUrl}
        title="TrustHuman step demo"
        className="absolute -left-[20%] -top-[20%] h-[140%] w-[140%]"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={false}
        style={{ border: 0, pointerEvents: "none" }}
        onError={handleYouTubeError}
      />
    </div>
  );

  // Native video with autoplay, loop, muted, playsInline + YouTube thumbnail as poster
  const renderVideo = () => (
    <video
      key={videoPath}
      autoPlay
      loop
      muted
      playsInline
      poster={thumbnailUrl ?? undefined}
      aria-label="TrustHuman step demo video"
      className="h-full w-full object-cover"
      onError={handleVideoError}
    >
      <source src={videoPath} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  );

  // 3-level fallback: Video → YouTube → YouTube Thumbnail
  const renderMedia = () => {
    if (videoFailed) {
      if (youtubeEmbedUrl && !youtubeFailed) {
        return renderYouTubeEmbed();
      }
      return renderThumbnail();
    }
    return renderVideo();
  };

  return (
    <div
      ref={cardRef}
      className="relative w-full overflow-hidden rounded-xl border shadow-xl transition-transform duration-200 ease-out [transform:scale(1.05)_perspective(1040px)_rotateY(0deg)_rotateX(5deg)_rotate(0deg)]"
      style={{
        // Layer hover transform on top of the base CSS transform
        transform: hoverTransform.rotateX !== 0 || hoverTransform.rotateY !== 0
          ? `scale(1.05) perspective(1040px) rotateY(${baseRotateY + hoverTransform.rotateY}deg) rotateX(${baseRotateX + hoverTransform.rotateX}deg) rotate(0deg)`
          : undefined,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-video bg-slate-900">
        {renderMedia()}
      </div>
    </div>
  );
}

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const steps = MESSAGING.howItWorks.steps;

  // Convert steps to AccordionTab format
  const tabs: AccordionTab[] = steps.map((step, index) => ({
    id: index,
    icon: STEP_ICONS[index] ?? Download,
    title: step.title,
    description: step.description,
  }));

  return (
    <section className="bg-card overflow-hidden py-20 md:py-28">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {MESSAGING.howItWorks.headline}
          </h2>
          <p className="text-muted-foreground text-lg">
            {MESSAGING.howItWorks.subheadline}
          </p>
        </div>

        {/* Accordion Tabs - Steps Row */}
        <AccordionTabs
          tabs={tabs}
          defaultActiveId={0}
          onTabChange={(id) => setActiveStep(id as number)}
          className="mb-10"
        />

        {/* Video Card - Changes based on active step */}
        <TiltingVideoCard
          videoPath={steps[activeStep]?.videoPath ?? ""}
          youtubeEmbedUrl={steps[activeStep]?.youtubeEmbedUrl}
        />
      </div>
    </section>
  );
}
