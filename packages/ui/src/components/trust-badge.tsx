"use client";

import * as React from "react";
import { useRef, useState } from "react";

import { cn } from "@sassy/ui/utils";

/**
 * Converts a number to its ordinal form (1st, 2nd, 3rd, 14th, etc.)
 */
function toOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  const index = (v - 20) % 10;
  return n + (s[index] ?? s[v] ?? s[0] ?? "th");
}

export interface TrustBadgeProps {
  /** Human number (e.g., 14 for "14th real human") */
  humanNumber: number;
  /** Total verified activities count */
  totalVerified: number;
  /** Username for link (optional - if provided, badge becomes clickable) */
  username?: string;
  /** Variant: 'full' shows complete badge, 'compact' is minimal */
  variant?: "full" | "compact";
  /** URL for the Triss logo image */
  logoUrl?: string;
  /** URL for user avatar (replaces logo if provided) */
  avatarUrl?: string;
  /** Base URL for trusthuman.io (defaults to https://trusthuman.io) */
  baseUrl?: string;
  /** Additional CSS classes */
  className?: string;
  /** Enable 3D tilt effect on hover */
  tiltEffect?: boolean;
  /** Hide the orange verified count section */
  hideVerifiedCount?: boolean;
}

/**
 * TrustBadge - Displays a user's TrustHuman verification badge
 *
 * Design specs:
 * - Colors: green #469d3e, background #fbf6e5, accent #ffb74a
 * - Shows: Triss logo, human number (ordinal), total verified count
 * - Clickable → links to trusthuman.io/[username]
 */
export function TrustBadge({
  humanNumber,
  totalVerified,
  username,
  variant = "full",
  logoUrl = "/trusthuman-logo.svg",
  avatarUrl,
  baseUrl = "https://trusthuman.io",
  className,
  tiltEffect = false,
  hideVerifiedCount = false,
}: TrustBadgeProps) {
  const ordinalNumber = toOrdinal(humanNumber);
  const badgeRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState(
    "perspective(1000px) rotateX(0deg) rotateY(0deg)"
  );
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltEffect || !badgeRef.current) return;

    const rect = badgeRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * -10;

    setTransform(
      `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
    );
  };

  const handleMouseEnter = () => {
    if (tiltEffect) setIsHovering(true);
  };

  const handleMouseLeave = () => {
    if (tiltEffect) {
      setIsHovering(false);
      setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)");
    }
  };

  const badgeContent = (
    <div
      ref={badgeRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        // Base styles - use flex instead of inline-flex to support w-full
        "flex items-center gap-4 rounded-2xl border-2 border-[#1a1a1a] px-4 py-1",
        // Background
        "bg-[#fbf6e5]",
        // Hover state if clickable (no shadow)
        username && "cursor-pointer",
        className,
      )}
      style={
        tiltEffect
          ? {
              transform,
              transition: isHovering
                ? "transform 0.1s ease-out"
                : "transform 0.3s ease-out",
              transformStyle: "preserve-3d" as const,
            }
          : undefined
      }
    >
      {/* Logo or Avatar */}
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username || "User"}
          className={cn(
            "shrink-0 rounded-full object-cover",
            variant === "full" ? "h-14 w-14" : "h-8 w-8",
          )}
        />
      ) : (
        <img
          src={logoUrl}
          alt="TrustHuman"
          className={cn(
            "shrink-0 object-contain",
            variant === "full" ? "h-14 w-14" : "h-8 w-8",
          )}
        />
      )}

      {/* Text content */}
      <div className="flex flex-col items-start whitespace-nowrap">
        {variant === "full" ? (
          <>
            {/* "@username | 14th real human on" - smaller, all bold */}
            <span className="text-[10px] leading-tight font-bold text-[#1a1a1a]">
              {username && (
                <>
                  <span>@{username}</span>
                  <span className="mx-1">|</span>
                </>
              )}
              <span className="text-[#469d3e]">{ordinalNumber}</span> real human on
            </span>
            {/* "TrustHuman.io" - larger */}
            <span className="text-lg leading-tight font-bold">
              <span className="text-[#469d3e]">Trust</span>
              <span className="text-[#1a1a1a]">Human.io</span>
            </span>
          </>
        ) : (
          <span className="text-sm font-semibold text-[#1a1a1a]">
            <span className="text-[#469d3e]">Human</span> #{humanNumber}
          </span>
        )}
      </div>

      {/* Verified count with arrow - centered vertically */}
      {!hideVerifiedCount && (
        <div className="flex shrink-0 flex-col items-center justify-center gap-1 self-center">
          {/* Arrow with curved edges */}
          <svg
            width="18"
            height="14"
            viewBox="0 0 18 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-[#ffb74a]"
          >
            <path
              d="M9 0C9 0 9.5 0 10 0.8L17 12C17.3 12.5 17.2 13 16.8 13.3C16.5 13.5 16.2 13.5 15.8 13.5H2.2C1.8 13.5 1.5 13.5 1.2 13.3C0.8 13 0.7 12.5 1 12L8 0.8C8.5 0 9 0 9 0Z"
              fill="currentColor"
            />
          </svg>
          <span className="text-xl leading-none font-bold text-[#ffb74a]">
            {totalVerified}
          </span>
        </div>
      )}
    </div>
  );

  // If username provided, wrap in link
  if (username) {
    return (
      <a
        href={`${baseUrl}/${username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block shrink-0 no-underline"
      >
        {badgeContent}
      </a>
    );
  }

  return badgeContent;
}

export default TrustBadge;
