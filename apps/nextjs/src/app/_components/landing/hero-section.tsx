"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { Button } from "@sassy/ui/button";
import { TrustBadge } from "@sassy/ui/components/trust-badge";

import { useTRPC } from "~/trpc/react";
import { MESSAGING } from "./landing-content";

// Extract YouTube video ID from embed URL
function getYouTubeVideoId(embedUrl: string): string | null {
  const match = embedUrl.match(/youtube\.com\/embed\/([^?]+)/);
  return match?.[1] ?? null;
}

// Get YouTube thumbnail URL from video ID
function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// Tilting video card - static CSS transform like EngageKit + subtle hover enhancement
// 3-level fallback: MP4 video → YouTube embed → YouTube thumbnail image
interface TiltingVideoCardProps {
  position?: "left" | "right" | "center";
  videoPath: string;
  youtubeEmbedUrl?: string;
}

function TiltingVideoCard({
  position = "right",
  videoPath,
  youtubeEmbedUrl,
}: TiltingVideoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [hoverTransform, setHoverTransform] = useState({
    rotateX: 0,
    rotateY: 0,
  });
  const [videoFailed, setVideoFailed] = useState(false);
  const [youtubeFailed, setYoutubeFailed] = useState(false);

  // Extract video ID for thumbnail fallback
  const youtubeVideoId = youtubeEmbedUrl
    ? getYouTubeVideoId(youtubeEmbedUrl)
    : null;
  const thumbnailUrl = youtubeVideoId
    ? getYouTubeThumbnail(youtubeVideoId)
    : null;

  // Static CSS transform classes (exactly like EngageKit step-card)
  const baseTransformClass = {
    right:
      "[transform:scale(1.1)_perspective(1040px)_rotateY(-11deg)_rotateX(2deg)_rotate(2deg)]",
    left: "[transform:scale(1.1)_perspective(1040px)_rotateY(11deg)_rotateX(2deg)_rotate(-2deg)]",
    center:
      "[transform:scale(1.05)_perspective(1040px)_rotateY(0deg)_rotateX(5deg)_rotate(0deg)]",
  };

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

  // YouTube thumbnail fallback image (auto-generated from video ID)
  const renderThumbnail = () => (
    <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnailUrl || "/trusthuman-logo.png"}
        alt="TrustHuman Demo Preview"
        className="h-full w-full object-cover"
      />
      {/* Play button overlay to indicate it's a video */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
          <div className="ml-1 h-0 w-0 border-y-8 border-l-12 border-y-transparent border-l-slate-900" />
        </div>
      </div>
    </div>
  );

  // YouTube embed with scaled iframe to crop black bars (like EngageKit)
  const renderYouTubeEmbed = () => (
    <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
      <iframe
        src={youtubeEmbedUrl}
        title="TrustHuman Demo"
        className="absolute -top-[20%] -left-[20%] h-[140%] w-[140%]"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen={false}
        style={{ border: 0, pointerEvents: "none" }}
        onError={handleYouTubeError}
      />
    </div>
  );

  // Native video with autoplay, loop, muted (required for autoplay), playsInline
  // Uses poster attribute to show YouTube thumbnail while video loads
  const renderVideo = () => (
    <video
      autoPlay
      loop
      muted
      playsInline
      poster={thumbnailUrl ?? undefined}
      aria-label="TrustHuman demo video"
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
      className={`relative w-full max-w-lg overflow-hidden rounded-xl border shadow-xl transition-transform duration-200 ease-out ${baseTransformClass[position]}`}
      style={{
        // Layer hover transform on top of the base CSS transform
        transform:
          hoverTransform.rotateX !== 0 || hoverTransform.rotateY !== 0
            ? `scale(1.1) perspective(1040px) rotateY(${position === "right" ? -11 + hoverTransform.rotateY : position === "left" ? 11 + hoverTransform.rotateY : hoverTransform.rotateY}deg) rotateX(${(position === "center" ? 5 : 2) + hoverTransform.rotateX}deg) rotate(${position === "right" ? 2 : position === "left" ? -2 : 0}deg)`
            : undefined,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-video bg-slate-900">{renderMedia()}</div>
    </div>
  );
}

export function HeroSection() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const trpc = useTRPC();

  const { data: stats } = useQuery({
    ...trpc.trustProfile.getStats.queryOptions(),
    refetchInterval: 30000,
  });

  // Get current user's profile if signed in
  const { data: myProfile } = useQuery({
    ...trpc.trustProfile.getMyProfile.queryOptions(),
    enabled: isSignedIn,
  });

  const handleClaimClick = () => {
    if (isSignedIn && myProfile?.username) {
      // Navigate to their profile page
      router.push(`/${myProfile.username}`);
    }
    // If not signed in, the SignInButton wrapper handles it
  };

  return (
    <section className="bg-card w-full pt-20">
      <div className="container mx-auto max-w-6xl px-6 py-8 sm:py-12">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1fr] lg:gap-12">
          {/* Left Column */}
          <div className="flex flex-col gap-8">
            {/* Badge */}
            {stats && (
              <div className="flex">
                <div className="bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-semibold">
                  {stats.totalHumans > 0
                    ? `${stats.totalHumans.toLocaleString()} verified humans`
                    : "Be among the first verified humans"}
                </div>
              </div>
            )}

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Be a <span className="text-primary">real human</span> on social
                media, <span className="text-primary">save the internet</span>
              </h1>

              {/* Feature bullet points - 2x2 grid */}
              <div className="text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span>📸</span>
                  <span>Quick selfie verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🛡️</span>
                  <span>Stand out from bots</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🏆</span>
                  <span>Compete on leaderboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🔥</span>
                  <span>Build streaks</span>
                </div>
              </div>
            </div>

            {/* CTA Button + Badge */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              {isSignedIn && myProfile?.username ? (
                <Button
                  variant="primary"
                  className="h-auto gap-2 rounded-xl px-5 py-2.5 text-base font-bold"
                  onClick={handleClaimClick}
                >
                  View your profile
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <SignInButton mode="modal" forceRedirectUrl="/welcome">
                  <Button
                    variant="primary"
                    className="h-auto gap-2 rounded-xl px-5 py-2.5 text-base font-bold"
                  >
                    Claim your human status
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </SignInButton>
              )}

              {/* Badge Preview with tilt effect */}
              <TrustBadge
                humanNumber={stats?.totalHumans ? stats.totalHumans + 1 : 1}
                totalVerified={0}
                username={myProfile?.username || "you"}
                variant="full"
                logoUrl="/trusthuman-logo.svg"
                tiltEffect
              />
            </div>
          </div>

          {/* Right Column - 3D Tilting Video */}
          <div className="flex items-center justify-center lg:justify-end">
            <TiltingVideoCard
              videoPath={MESSAGING.videoDemo.videoPath}
              youtubeEmbedUrl={MESSAGING.videoDemo.youtubeEmbedUrl}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
