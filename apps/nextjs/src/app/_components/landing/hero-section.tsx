"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Play } from "lucide-react";

import { Button } from "@sassy/ui/button";
import { TrustBadge } from "@sassy/ui/components/trust-badge";

import { useTRPC } from "~/trpc/react";

function TiltingVideoCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState(
    "perspective(1000px) rotateX(0deg) rotateY(0deg)",
  );
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Calculate rotation based on mouse position
    // Max rotation of 15 degrees
    // Positive rotateX tilts top toward viewer when mouse is at top
    // Positive rotateY tilts right side toward viewer when mouse is at right
    const rotateX = ((y - centerY) / centerY) * 15;
    const rotateY = ((x - centerX) / centerX) * -15;

    setTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`,
    );
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)");
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-2xl cursor-pointer"
      style={{
        transform,
        transition: isHovering
          ? "transform 0.1s ease-out"
          : "transform 0.3s ease-out",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Glowing border effect */}
      <div
        className="from-primary/50 via-primary to-primary/50 absolute -inset-1 rounded-2xl bg-gradient-to-r opacity-75 blur-sm"
        style={{
          transform: "translateZ(-10px)",
        }}
      />

      {/* Main card */}
      <div
        className="border-border bg-card relative overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          transform: "translateZ(0px)",
        }}
      >
        {/* Video placeholder - dark theme like the metrics screenshot */}
        <div className="relative aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Mockup content - similar to metrics dashboard */}
          <div className="absolute inset-0 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary h-3 w-3 rounded-full" />
                <span className="text-sm font-medium text-white">
                  TrustHuman Demo
                </span>
              </div>
              <div className="flex gap-1">
                <div className="h-2 w-8 rounded bg-slate-700" />
                <div className="h-2 w-8 rounded bg-slate-700" />
                <div className="bg-primary/50 h-2 w-8 rounded" />
              </div>
            </div>

            {/* Content area */}
            <div className="mt-6 space-y-4">
              {/* Stats row */}
              <div className="flex gap-4">
                <div className="flex-1 rounded-lg bg-slate-800/50 p-3">
                  <div className="text-xs text-slate-400">Verified Humans</div>
                  <div className="text-primary mt-1 text-2xl font-bold">
                    1,247
                  </div>
                </div>
                <div className="flex-1 rounded-lg bg-slate-800/50 p-3">
                  <div className="text-xs text-slate-400">Comments</div>
                  <div className="mt-1 text-2xl font-bold text-white">
                    12.4K
                  </div>
                </div>
              </div>

              {/* Chart placeholder */}
              <div className="rounded-lg bg-slate-800/30 p-3">
                <div className="flex h-16 items-end gap-1">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95].map((height, i) => (
                    <div
                      key={i}
                      className="from-primary/50 to-primary flex-1 rounded-t bg-gradient-to-t"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/10">
            <div className="bg-primary/90 text-primary-foreground flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110">
              <Play className="ml-1 h-6 w-6" fill="currentColor" />
            </div>
          </div>
        </div>

        {/* Caption bar */}
        <div className="border-border bg-card border-t px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">
              Watch the 2-minute demo
            </span>
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <span className="bg-primary flex h-2 w-2 animate-pulse rounded-full" />
              Live Preview
            </div>
          </div>
        </div>
      </div>

      {/* 3D shadow effect */}
      <div
        className="bg-primary/20 absolute inset-4 -z-10 rounded-2xl blur-2xl"
        style={{
          transform: "translateZ(-30px) translateY(20px)",
        }}
      />
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
      <div className="container py-8 sm:py-12">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-12">
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
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Show that you are a{" "}
                <span className="text-primary">real human</span> on social media
                and <span className="text-primary">save the internet</span>
              </h1>

              {/* Feature bullet points - 2x2 grid */}
              <div className="text-muted-foreground grid grid-cols-2 gap-x-6 gap-y-2 text-base">
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
            <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
              {isSignedIn && myProfile?.username ? (
                <Button
                  variant="primary"
                  className="h-auto gap-2 rounded-2xl px-6 py-3 text-lg font-bold"
                  onClick={handleClaimClick}
                >
                  View your profile
                  <ArrowRight className="h-5 w-5" />
                </Button>
              ) : (
                <SignInButton mode="modal" forceRedirectUrl="/welcome">
                  <Button
                    variant="primary"
                    className="h-auto gap-2 rounded-2xl px-6 py-3 text-lg font-bold"
                  >
                    Claim your human status
                    <ArrowRight className="h-5 w-5" />
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
            <TiltingVideoCard />
          </div>
        </div>
      </div>
    </section>
  );
}
