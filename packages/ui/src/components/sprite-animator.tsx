"use client";

import { useEffect, useMemo, useState } from "react";

interface SpriteAnimatorProps {
  /** URL to the sprite image */
  sprite: string;
  /** Width of each frame in pixels */
  width: number;
  /** Height of each frame in pixels */
  height: number;
  /** Total number of frames in the sprite */
  frameCount: number;
  /** Frames per second (default: 12) */
  fps?: number;
  /** Whether to animate (default: true) */
  shouldAnimate?: boolean;
  /** Direction of sprite frames: "horizontal" or "vertical" (default: "horizontal") */
  direction?: "horizontal" | "vertical";
  /** Scale factor to resize the displayed sprite (default: 1) */
  scale?: number;
  /** Stop on last frame instead of looping (default: false) */
  stopLastFrame?: boolean;
  /** Delay in milliseconds between animation cycles (default: 0) */
  delayBetweenCycles?: number;
  /** Callback when animation completes one cycle */
  onEnd?: () => void;
  /** Additional className */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

/**
 * A sprite sheet animator component.
 * Displays frames from a sprite sheet image using CSS background-position animation.
 *
 * @example
 * ```tsx
 * <SpriteAnimator
 *   sprite="/path/to/sprite.png"
 *   width={100}
 *   height={100}
 *   frameCount={8}
 *   fps={12}
 * />
 * ```
 */
function SpriteAnimator({
  sprite,
  width,
  height,
  frameCount,
  fps = 12,
  shouldAnimate = true,
  direction = "horizontal",
  scale = 1,
  stopLastFrame = false,
  delayBetweenCycles = 0,
  onEnd,
  className,
  style,
}: SpriteAnimatorProps) {
  const [frame, setFrame] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!shouldAnimate) {
      setFrame(0);
      setIsPaused(false);
      return;
    }

    // If paused between cycles, wait for delay then resume
    if (isPaused && delayBetweenCycles > 0) {
      const timeout = setTimeout(() => {
        setIsPaused(false);
        setFrame(0);
      }, delayBetweenCycles);
      return () => clearTimeout(timeout);
    }

    const interval = setInterval(() => {
      setFrame((prev) => {
        const nextFrame = prev + 1;
        if (nextFrame >= frameCount) {
          onEnd?.();
          if (stopLastFrame) {
            clearInterval(interval);
            return prev;
          }
          // If there's a delay between cycles, pause instead of immediately restarting
          if (delayBetweenCycles > 0) {
            setIsPaused(true);
            return prev; // Stay on last frame during pause
          }
          return 0;
        }
        return nextFrame;
      });
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [
    shouldAnimate,
    frameCount,
    fps,
    stopLastFrame,
    delayBetweenCycles,
    onEnd,
    isPaused,
  ]);

  const backgroundPosition = useMemo(() => {
    if (direction === "horizontal") {
      return `-${frame * width * scale}px 0`;
    }
    return `0 -${frame * height * scale}px`;
  }, [frame, width, height, scale, direction]);

  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  // Calculate total sprite dimensions for background-size
  const bgWidth =
    direction === "horizontal" ? frameCount * scaledWidth : scaledWidth;
  const bgHeight =
    direction === "vertical" ? frameCount * scaledHeight : scaledHeight;

  return (
    <div
      className={className}
      style={{
        width: scaledWidth,
        height: scaledHeight,
        backgroundImage: `url(${sprite})`,
        backgroundPosition,
        backgroundSize: `${bgWidth}px ${bgHeight}px`,
        backgroundRepeat: "no-repeat",
        ...style,
      }}
    />
  );
}

/**
 * Hook version for more control over the sprite animation.
 * Returns CSS properties to apply to any element.
 *
 * @example
 * ```tsx
 * const spriteStyles = useSprite({
 *   sprite: "/path/to/sprite.png",
 *   width: 100,
 *   height: 100,
 *   frameCount: 8,
 * });
 *
 * return <div style={spriteStyles} />;
 * ```
 */
function useSprite({
  sprite,
  width,
  height,
  frameCount,
  fps = 12,
  shouldAnimate = true,
  direction = "horizontal",
  scale = 1,
  stopLastFrame = false,
  onEnd,
}: Omit<SpriteAnimatorProps, "className" | "style">): React.CSSProperties {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!shouldAnimate) {
      setFrame(0);
      return;
    }

    const interval = setInterval(() => {
      setFrame((prev) => {
        const nextFrame = prev + 1;
        if (nextFrame >= frameCount) {
          onEnd?.();
          if (stopLastFrame) {
            clearInterval(interval);
            return prev;
          }
          return 0;
        }
        return nextFrame;
      });
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [shouldAnimate, frameCount, fps, stopLastFrame, onEnd]);

  const backgroundPosition = useMemo(() => {
    if (direction === "horizontal") {
      return `-${frame * width * scale}px 0`;
    }
    return `0 -${frame * height * scale}px`;
  }, [frame, width, height, scale, direction]);

  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const bgWidth =
    direction === "horizontal" ? frameCount * scaledWidth : scaledWidth;
  const bgHeight =
    direction === "vertical" ? frameCount * scaledHeight : scaledHeight;

  return {
    width: scaledWidth,
    height: scaledHeight,
    backgroundImage: `url(${sprite})`,
    backgroundPosition,
    backgroundSize: `${bgWidth}px ${bgHeight}px`,
    backgroundRepeat: "no-repeat",
  };
}

export { SpriteAnimator, useSprite };
export type { SpriteAnimatorProps };
