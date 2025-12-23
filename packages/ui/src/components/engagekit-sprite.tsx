"use client";

import { SpriteAnimator } from "./sprite-animator";

interface EngageKitSpriteProps {
  /** URL to the engagekit sprite asset */
  spriteUrl: string;
  /** Whether to animate (default: true) */
  shouldAnimate?: boolean;
  /** Size of the displayed sprite (default: 40) */
  size?: number;
  /** Frames per second override (default: 1) */
  fps?: number;
  /** Number of frames override (default: 6) */
  frameCount?: number;
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
 * EngageKit loading sprite animation component.
 * Pre-configured with the engagekit-sprite-loading.svg dimensions and frame count.
 *
 * @example
 * // In browser extension
 * const spriteUrl = chrome.runtime.getURL("/engagekit-sprite-loading.svg");
 * <EngageKitSprite spriteUrl={spriteUrl} />
 *
 * @example
 * // In Next.js
 * <EngageKitSprite spriteUrl="/engagekit-sprite-loading.svg" />
 *
 * @example
 * // Custom size
 * <EngageKitSprite spriteUrl={spriteUrl} size={24} />
 *
 * @example
 * // Controlled animation
 * <EngageKitSprite spriteUrl={spriteUrl} shouldAnimate={isLoading} />
 */
function EngageKitSprite({
  spriteUrl,
  shouldAnimate = true,
  size = 40,
  fps = 6,
  frameCount = 6,
  stopLastFrame = false,
  delayBetweenCycles = 0,
  onEnd,
  className,
  style,
}: EngageKitSpriteProps) {
  // Calculate scale based on desired size
  const scale = size / 65.9;

  return (
    <SpriteAnimator
      sprite={spriteUrl}
      width={65.9}
      height={65.9}
      frameCount={frameCount}
      fps={fps}
      scale={scale}
      shouldAnimate={shouldAnimate}
      stopLastFrame={stopLastFrame}
      delayBetweenCycles={delayBetweenCycles}
      onEnd={onEnd}
      className={className}
      style={style}
    />
  );
}

export { EngageKitSprite };
export type { EngageKitSpriteProps };
