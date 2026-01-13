/**
 * Vanilla JS Sprite Animator
 *
 * Animates sprite sheets using CSS background-position.
 * No React dependencies - works with plain DOM elements.
 *
 * Based on the React SpriteAnimator component logic.
 */

export interface SpriteAnimatorConfig {
  /** URL to the sprite image */
  spriteUrl: string;
  /** Width of each frame in pixels (default: 65.9 for EngageKit sprites) */
  frameWidth?: number;
  /** Height of each frame in pixels (default: 65.9 for EngageKit sprites) */
  frameHeight?: number;
  /** Total number of frames in the sprite */
  frameCount: number;
  /** Frames per second */
  fps: number;
  /** Delay in milliseconds between animation cycles (default: 0) */
  delayBetweenCycles?: number;
  /** Display size in pixels (will scale the sprite) */
  size?: number;
}

/**
 * Creates an animated sprite element using vanilla JS.
 * Returns an object with the element and control methods.
 */
export function createSpriteAnimator(config: SpriteAnimatorConfig) {
  const {
    spriteUrl,
    frameWidth = 65.9,
    frameHeight = 65.9,
    frameCount,
    fps,
    delayBetweenCycles = 0,
    size = 24,
  } = config;

  // Calculate scale
  const scale = size / frameWidth;
  const scaledWidth = frameWidth * scale;
  const scaledHeight = frameHeight * scale;
  const bgWidth = frameCount * scaledWidth;
  const bgHeight = scaledHeight;

  // Create the sprite element
  const element = document.createElement("div");
  element.style.cssText = `
    width: ${scaledWidth}px;
    height: ${scaledHeight}px;
    background-image: url(${spriteUrl});
    background-position: 0 0;
    background-size: ${bgWidth}px ${bgHeight}px;
    background-repeat: no-repeat;
    display: block;
  `;

  let frame = 0;
  let intervalId: number | undefined;
  let timeoutId: number | undefined;
  let isPaused = false;
  let isDestroyed = false;

  const updatePosition = () => {
    if (isDestroyed) return;
    element.style.backgroundPosition = `-${frame * scaledWidth}px 0`;
  };

  const startAnimation = () => {
    if (isDestroyed || intervalId !== undefined) return;

    intervalId = window.setInterval(() => {
      if (isDestroyed) {
        stopAnimation();
        return;
      }

      if (isPaused) return;

      const nextFrame = frame + 1;
      if (nextFrame >= frameCount) {
        if (delayBetweenCycles > 0) {
          // Stay on last valid frame during pause, then restart after delay
          isPaused = true;
          timeoutId = window.setTimeout(() => {
            if (isDestroyed) return;
            isPaused = false;
            frame = 0;
            updatePosition();
          }, delayBetweenCycles);
          // Don't update position - stay on current (last valid) frame
          return;
        } else {
          frame = 0;
        }
      } else {
        frame = nextFrame;
      }
      updatePosition();
    }, 1000 / fps);
  };

  const stopAnimation = () => {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  const resetAnimation = () => {
    frame = 0;
    isPaused = false;
    updatePosition();
  };

  /**
   * Update the sprite configuration (e.g., switch between blink and breathe)
   */
  const updateConfig = (newConfig: Partial<SpriteAnimatorConfig>) => {
    if (isDestroyed) return;

    // Stop current animation
    stopAnimation();

    // Apply new config
    const newSpriteUrl = newConfig.spriteUrl ?? spriteUrl;
    const newFrameCount = newConfig.frameCount ?? frameCount;
    const newFps = newConfig.fps ?? fps;
    const newDelay = newConfig.delayBetweenCycles ?? delayBetweenCycles;
    const newSize = newConfig.size ?? size;

    // Recalculate dimensions
    const newScale = newSize / frameWidth;
    const newScaledWidth = frameWidth * newScale;
    const newScaledHeight = frameHeight * newScale;
    const newBgWidth = newFrameCount * newScaledWidth;
    const newBgHeight = newScaledHeight;

    // Update element styles
    element.style.width = `${newScaledWidth}px`;
    element.style.height = `${newScaledHeight}px`;
    element.style.backgroundImage = `url(${newSpriteUrl})`;
    element.style.backgroundSize = `${newBgWidth}px ${newBgHeight}px`;

    // Reset and restart with new config
    frame = 0;
    isPaused = false;
    updatePosition();

    // Create new animation loop with updated values
    const currentScaledWidth = newScaledWidth;
    const currentFrameCount = newFrameCount;
    const currentDelay = newDelay;

    intervalId = window.setInterval(() => {
      if (isDestroyed) {
        stopAnimation();
        return;
      }

      if (isPaused) return;

      const nextFrame = frame + 1;
      if (nextFrame >= currentFrameCount) {
        if (currentDelay > 0) {
          // Stay on last valid frame during pause
          isPaused = true;
          timeoutId = window.setTimeout(() => {
            if (isDestroyed) return;
            isPaused = false;
            frame = 0;
            element.style.backgroundPosition = `-${frame * currentScaledWidth}px 0`;
          }, currentDelay);
          // Don't update position - stay on current (last valid) frame
          return;
        } else {
          frame = 0;
        }
      } else {
        frame = nextFrame;
      }
      element.style.backgroundPosition = `-${frame * currentScaledWidth}px 0`;
    }, 1000 / newFps);
  };

  /**
   * Destroy the animator and clean up resources
   */
  const destroy = () => {
    isDestroyed = true;
    stopAnimation();
  };

  // Start animation immediately
  startAnimation();

  return {
    element,
    updateConfig,
    resetAnimation,
    destroy,
  };
}

/**
 * Preset configurations for EngageKit sprites
 */
export const SPRITE_PRESETS = {
  /** Blink animation - default state */
  blink: {
    frameCount: 3,
    fps: 6,
    delayBetweenCycles: 2000,
  },
  /** Breathe animation - loading state */
  breathe: {
    frameCount: 10,
    fps: 10,
    delayBetweenCycles: 0,
  },
} as const;
