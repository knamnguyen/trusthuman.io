"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface Avatar {
  src: string;
  alt: string;
  href?: string;
  onClick?: () => void;
  isMock?: boolean;
}

interface AvatarBubbleGridProps {
  avatars: Avatar[];
  columns?: number;
  avatarSize?: number;
  gap?: number;
  className?: string;
}

export function AvatarBubbleGrid({
  avatars,
  columns = 10,
  avatarSize = 56,
  gap = 16,
  className = "",
}: AvatarBubbleGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [closestIndex, setClosestIndex] = useState<number | null>(null);
  const avatarRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [avatarCenters, setAvatarCenters] = useState<{ x: number; y: number }[]>([]);

  // Calculate avatar centers on mount and resize
  useEffect(() => {
    const updateCenters = () => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const centers = avatarRefs.current.map((ref) => {
        if (!ref) return { x: 0, y: 0 };
        const rect = ref.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2 - containerRect.left,
          y: rect.top + rect.height / 2 - containerRect.top,
        };
      });
      setAvatarCenters(centers);
    };

    updateCenters();
    // Small delay to ensure layout is complete
    const timer = setTimeout(updateCenters, 100);
    window.addEventListener("resize", updateCenters);
    return () => {
      window.removeEventListener("resize", updateCenters);
      clearTimeout(timer);
    };
  }, [avatars.length]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || avatarCenters.length === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    // Find the closest avatar to the cursor
    let minDist = Infinity;
    let closest = null;

    avatarCenters.forEach((center, index) => {
      const dx = x - center.x;
      const dy = y - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist && dist < avatarSize * 0.8) {
        minDist = dist;
        closest = index;
      }
    });

    setClosestIndex(closest);
  }, [avatarCenters, avatarSize]);

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
    setClosestIndex(null);
  }, []);

  // Calculate animation values for each avatar
  const getAvatarAnimateProps = useCallback(
    (index: number) => {
      const baseOpacity = 0.75;

      if (!mousePos || avatarCenters.length === 0) {
        return {
          scale: 1,
          x: 0,
          y: 0,
          opacity: baseOpacity,
          zIndex: 1,
        };
      }

      const center = avatarCenters[index];
      if (!center) {
        return {
          scale: 1,
          x: 0,
          y: 0,
          opacity: baseOpacity,
          zIndex: 1,
        };
      }

      // If this is the closest (hovered) avatar - scale up, don't move
      if (index === closestIndex) {
        return {
          scale: 1.45,
          x: 0,
          y: 0,
          opacity: 1,
          zIndex: 50,
        };
      }

      // For other avatars, calculate distance from the HOVERED avatar
      const hoveredCenter = closestIndex !== null ? avatarCenters[closestIndex] : mousePos;

      if (!hoveredCenter) {
        return {
          scale: 1,
          x: 0,
          y: 0,
          opacity: baseOpacity,
          zIndex: 1,
        };
      }

      const dx = center.x - hoveredCenter.x;
      const dy = center.y - hoveredCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Effect radius
      const innerRadius = avatarSize + gap;
      const outerRadius = (avatarSize + gap) * 2.8;

      if (distance > outerRadius) {
        return {
          scale: 1,
          x: 0,
          y: 0,
          opacity: baseOpacity * 0.9,
          zIndex: 1,
        };
      }

      // Normalize distance for smooth falloff
      const normalizedDist = Math.max(0, distance / outerRadius);
      const easedFalloff = 1 - Math.pow(normalizedDist, 2);

      // Push direction - away from hovered avatar
      const angle = Math.atan2(dy, dx);

      // Push strength
      let pushStrength = 0;
      if (distance < innerRadius) {
        pushStrength = easedFalloff * (avatarSize * 0.35);
      } else {
        pushStrength = easedFalloff * (avatarSize * 0.2);
      }

      const translateX = Math.cos(angle) * pushStrength;
      const translateY = Math.sin(angle) * pushStrength;

      // Scale and opacity
      const scale = 1 + easedFalloff * 0.15;
      const opacity = baseOpacity + easedFalloff * 0.25;
      const zIndex = Math.round(10 + easedFalloff * 20);

      return {
        scale,
        x: translateX,
        y: translateY,
        opacity,
        zIndex,
      };
    },
    [mousePos, avatarCenters, closestIndex, avatarSize, gap],
  );

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="grid justify-start"
        style={{
          gridTemplateColumns: `repeat(${columns}, ${avatarSize}px)`,
          gap: `${gap}px`,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {avatars.map((avatar, index) => {
          const animateProps = getAvatarAnimateProps(index);

          return (
            <div
              key={index}
              ref={(el) => { avatarRefs.current[index] = el; }}
              className="relative flex items-center justify-center"
              style={{
                width: avatarSize,
                height: avatarSize,
              }}
            >
              <motion.div
                className="absolute rounded-full overflow-hidden border-2 border-background cursor-pointer"
                style={{
                  width: avatarSize,
                  height: avatarSize,
                }}
                animate={animateProps}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                  mass: 0.8,
                }}
              >
                {avatar.href ? (
                  <a href={avatar.href} className="block w-full h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatar.src}
                      alt={avatar.alt}
                      className="h-full w-full object-cover"
                    />
                  </a>
                ) : avatar.onClick ? (
                  <button onClick={avatar.onClick} className="w-full h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatar.src}
                      alt={avatar.alt}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={avatar.src}
                    alt={avatar.alt}
                    className="h-full w-full object-cover"
                  />
                )}
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
