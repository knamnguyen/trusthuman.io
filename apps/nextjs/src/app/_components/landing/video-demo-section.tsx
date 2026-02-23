"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { Button } from "@sassy/ui/button";

import { useTRPC } from "~/trpc/react";
import { AvatarBubbleGrid } from "./avatar-bubble-grid";

// Platform data with logos and API keys
const PLATFORMS = [
  { name: "LinkedIn", icon: "/icons/linkedin.svg", key: "linkedin" as const },
  { name: "X", icon: "/icons/x.svg", key: "x" as const },
  { name: "Facebook", icon: "/icons/facebook.svg", key: "facebook" as const },
];

// Mock avatar seeds for fallback
const MOCK_AVATAR_SEEDS = [
  "Felix", "Aneka", "Bailey", "Charlie", "Dana", "Elliott", "Frankie", "Gray",
  "Harper", "Indigo", "Jordan", "Kelly", "Leo", "Morgan", "Noah", "Olive",
  "Parker", "Quinn", "Riley", "Sam", "Taylor", "Uma", "Val", "Wren",
  "Xander", "Yuki", "Zara", "Alex", "Blake", "Casey", "Drew", "Eden",
  "Finn", "Gem", "Haven", "Iris", "Jade", "Kai", "Lark", "Mars",
];

// Fake bot numbers for each platform (for marketing effect)
const BOT_NUMBERS: Record<string, string> = {
  linkedin: "500M+",
  x: "1B+",
  facebook: "2B+",
};

// Platform Logo Row with bubble hover effect
interface PlatformLogoRowProps {
  platforms: typeof PLATFORMS;
  platformStats: Record<string, number> | undefined;
  onHover: (key: string | null) => void;
}

function PlatformLogoRow({ platforms, platformStats, onHover }: PlatformLogoRowProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [logoCenters, setLogoCenters] = useState<{ x: number; y: number }[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [closestIndex, setClosestIndex] = useState<number | null>(null);

  const logoSize = 64; // h-16 w-16
  const gap = 48; // gap between logos

  // Calculate logo centers on mount and resize
  useEffect(() => {
    const updateCenters = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const centers = logoRefs.current.map((ref) => {
        if (!ref) return { x: 0, y: 0 };
        const rect = ref.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top,
        };
      });
      setLogoCenters(centers);
    };

    updateCenters();
    const timer = setTimeout(updateCenters, 100);
    window.addEventListener("resize", updateCenters);
    return () => {
      window.removeEventListener("resize", updateCenters);
      clearTimeout(timer);
    };
  }, [platforms.length]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!containerRef.current || logoCenters.length === 0) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMousePos({ x, y });

      // Find the closest logo to the cursor
      let minDist = Infinity;
      let closest: number | null = null;

      logoCenters.forEach((center, index) => {
        const dx = x - center.x;
        const dy = y - center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist && dist < logoSize * 1.2) {
          minDist = dist;
          closest = index;
        }
      });

      setClosestIndex(closest);
      onHover(closest !== null ? platforms[closest]?.key ?? null : null);
    },
    [logoCenters, logoSize, onHover, platforms]
  );

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
    setClosestIndex(null);
    // Reset to first platform (LinkedIn) instead of null to keep dynamic text
    onHover("linkedin");
  }, [onHover]);

  // Calculate transform for each logo based on mouse distance
  const getLogoStyle = useCallback(
    (index: number) => {
      if (!mousePos || logoCenters.length === 0) {
        return {
          transform: "scale(1) translate(0px, 0px)",
          opacity: 1,
        };
      }

      const center = logoCenters[index];
      if (!center) {
        return {
          transform: "scale(1) translate(0px, 0px)",
          opacity: 1,
        };
      }

      // If this is the closest (hovered) logo - scale up, don't move
      if (index === closestIndex) {
        return {
          transform: "scale(1.4) translate(0px, 0px)",
          opacity: 1,
        };
      }

      // For other logos, calculate distance from the HOVERED logo
      const hoveredCenter = closestIndex !== null ? logoCenters[closestIndex] : mousePos;

      if (!hoveredCenter) {
        return {
          transform: "scale(1) translate(0px, 0px)",
          opacity: 1,
        };
      }

      const dx = center.x - hoveredCenter.x;
      const dy = center.y - hoveredCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Effect radius
      const innerRadius = logoSize + gap;
      const outerRadius = (logoSize + gap) * 2.5;

      if (distance > outerRadius) {
        return {
          transform: "scale(1) translate(0px, 0px)",
          opacity: 0.5,
        };
      }

      // Normalize distance for smooth falloff
      const normalizedDist = Math.max(0, distance / outerRadius);
      const easedFalloff = 1 - Math.pow(normalizedDist, 2);

      // Push direction - away from hovered logo
      const angle = Math.atan2(dy, dx);

      // Push strength
      let pushStrength = 0;
      if (distance < innerRadius) {
        pushStrength = easedFalloff * (logoSize * 0.3);
      } else {
        pushStrength = easedFalloff * (logoSize * 0.15);
      }

      const translateX = Math.cos(angle) * pushStrength;
      const translateY = Math.sin(angle) * pushStrength;

      // Scale - slight scale up for nearby logos
      const scale = 1 + easedFalloff * 0.1;
      const opacity = 0.5 + easedFalloff * 0.5;

      return {
        transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
        opacity,
      };
    },
    [mousePos, logoCenters, closestIndex, logoSize, gap]
  );

  return (
    <div
      ref={containerRef}
      className="flex w-full items-center justify-between px-4"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {platforms.map((platform, index) => {
        const count = platformStats?.[platform.key] ?? 0;
        const style = getLogoStyle(index);

        return (
          <div
            key={platform.name}
            ref={(el) => {
              logoRefs.current[index] = el;
            }}
            className="flex flex-col items-center gap-3"
          >
            <div
              style={{
                transform: style.transform,
                opacity: style.opacity,
                transition:
                  "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease-out",
                willChange: "transform, opacity",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={platform.icon}
                alt={platform.name}
                className="h-16 w-16"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <span
              className="text-lg font-bold text-primary transition-opacity duration-200"
              style={{ opacity: style.opacity }}
            >
              {count.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function VideoDemoSection() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const trpc = useTRPC();
  const [username, setUsername] = useState("");
  // Default to first platform (LinkedIn) to always show dynamic text
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>("linkedin");

  const { data: stats } = useQuery({
    ...trpc.trustProfile.getStats.queryOptions(),
    refetchInterval: 30000,
  });

  // Get per-platform stats
  const { data: platformStats } = useQuery({
    ...trpc.trustProfile.getPlatformStats.queryOptions(),
    refetchInterval: 30000,
  });

  // Get current user's profile if signed in
  const { data: myProfile } = useQuery({
    ...trpc.trustProfile.getMyProfile.queryOptions(),
    enabled: isSignedIn,
  });

  // Get leaderboard for real users
  const { data: leaderboardData } = useQuery({
    ...trpc.trustProfile.getLeaderboard.queryOptions({ limit: 40, offset: 0 }),
  });

  const handleGoClick = () => {
    if (isSignedIn && myProfile?.username) {
      // Navigate to their profile page
      router.push(`/${myProfile.username}`);
    }
    // If not signed in, the SignInButton wrapper handles it
  };

  // Build avatar list: real users first, then mock avatars to fill to 40
  const avatars = useMemo(() => {
    const realUsers = leaderboardData?.users ?? [];
    const totalNeeded = 40;

    // Map real users to avatar format
    const realAvatars = realUsers.map((user) => ({
      src: user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
      alt: user.displayName || user.username,
      href: `/${user.username}`,
      isMock: false,
    }));

    // Fill remaining with mock avatars
    const mockCount = Math.max(0, totalNeeded - realAvatars.length);
    const mockAvatars = MOCK_AVATAR_SEEDS.slice(0, mockCount).map((seed) => ({
      src: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
      alt: `Join TrustHuman`,
      isMock: true,
    }));

    return [...realAvatars, ...mockAvatars];
  }, [leaderboardData?.users]);

  // Get hovered platform info
  const hoveredPlatformData = hoveredPlatform
    ? PLATFORMS.find((p) => p.key === hoveredPlatform)
    : null;

  return (
    <section id="claim-section" className="bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Dynamic Section Title - Smooth transitions */}
        <div className="mb-10 text-center">
          <div className="relative h-[2.5em] sm:h-[2em]">
            {PLATFORMS.map((platform) => (
              <h2
                key={platform.key}
                className="text-foreground absolute inset-0 text-3xl font-bold tracking-tight transition-all duration-300 ease-out sm:text-4xl"
                style={{
                  opacity: hoveredPlatform === platform.key ? 1 : 0,
                  transform: hoveredPlatform === platform.key
                    ? "translateY(0) scale(1)"
                    : "translateY(10px) scale(0.95)",
                  pointerEvents: hoveredPlatform === platform.key ? "auto" : "none",
                }}
              >
                There are{" "}
                <span className="text-primary">{BOT_NUMBERS[platform.key]}</span> bots on{" "}
                <span className="text-primary">{platform.name}</span>.
              </h2>
            ))}
          </div>
          <h2 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl">
            Show you are a human on
          </h2>
        </div>

        {/* Platform Logos - Full width row with bubble hover effect */}
        <div className="mb-16">
          <PlatformLogoRow
            platforms={PLATFORMS}
            platformStats={platformStats}
            onHover={setHoveredPlatform}
          />
        </div>

        {/* Stats Counter - Above avatars */}
        {stats && (
          <div className="mb-8 text-center">
            <p className="text-muted-foreground text-lg">
              Join{" "}
              <span className="text-foreground text-2xl font-bold">
                {stats.totalHumans > 0
                  ? stats.totalHumans.toLocaleString()
                  : "???"}
              </span>{" "}
              with a TrustHuman profile and{" "}
              <span className="text-foreground text-2xl font-bold">
                {stats.totalVerifications > 0
                  ? stats.totalVerifications.toLocaleString()
                  : "0"}
              </span>{" "}
              verified activities
            </p>
          </div>
        )}

        {/* Avatar Bubble Grid - Real users + mock fallbacks */}
        <div className="mb-12 flex justify-center">
          <AvatarBubbleGrid
            avatars={avatars}
            columns={10}
            avatarSize={52}
            gap={14}
          />
        </div>

        {/* Username Input - Centered */}
        <div className="mx-auto max-w-md">
          <div className="border-border bg-background focus-within:ring-primary/20 focus-within:border-primary flex items-center rounded-xl border px-4 py-3 transition-colors focus-within:ring-2">
            <span className="text-foreground text-sm font-semibold">
              trusthuman.io/
            </span>
            <input
              type="text"
              placeholder={myProfile?.username || "username"}
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (isSignedIn && myProfile?.username) {
                    handleGoClick();
                  } else {
                    const btn = document.getElementById("username-claim-btn");
                    btn?.click();
                  }
                }
              }}
              className="text-foreground placeholder:text-muted-foreground/50 min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
            />
            {isSignedIn && myProfile?.username ? (
              <Button
                id="username-claim-btn"
                size="sm"
                variant="primary"
                className="ml-2 rounded-lg"
                onClick={handleGoClick}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <SignInButton
                mode="modal"
                forceRedirectUrl={
                  username ? `/welcome?username=${username}` : "/welcome"
                }
              >
                <Button
                  id="username-claim-btn"
                  size="sm"
                  variant="primary"
                  className="ml-2 rounded-lg"
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </SignInButton>
            )}
          </div>
          <p className="text-muted-foreground mt-2 text-center text-xs">
            {isSignedIn && myProfile?.username
              ? "View your profile"
              : "Claim your username before it's too late!"}
          </p>
        </div>
      </div>
    </section>
  );
}
