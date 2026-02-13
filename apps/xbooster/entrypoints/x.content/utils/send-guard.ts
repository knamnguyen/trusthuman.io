/**
 * Shared send guard for tracking consecutive failures across both auto-run hooks.
 * Automatically pauses sending after 3 consecutive failures for a configurable duration.
 */

let consecutiveFailures = 0;
let pausedUntil: number | null = null;

/**
 * Record a successful send. Resets the consecutive failure counter.
 */
export function recordSuccess(): void {
  consecutiveFailures = 0;
}

/**
 * Record a failed send. Increments counter and pauses after 3 failures.
 * @param pauseMinutes - How many minutes to pause (from settings). Defaults to 60.
 */
export function recordFailure(pauseMinutes: number = 60): void {
  consecutiveFailures++;

  if (consecutiveFailures >= 3) {
    const pauseMs = pauseMinutes * 60 * 1000;
    pausedUntil = Date.now() + pauseMs;
    console.warn(
      `xBooster: 3 consecutive failures detected. Pausing all sends for ${pauseMinutes} minutes until ${new Date(pausedUntil).toLocaleTimeString()}`
    );
  }
}

/**
 * Check if sending is currently paused due to consecutive failures.
 */
export function isPaused(): boolean {
  if (pausedUntil === null) return false;

  const now = Date.now();
  if (now >= pausedUntil) {
    // Pause expired, auto-reset
    pausedUntil = null;
    consecutiveFailures = 0;
    console.log('xBooster: Send pause expired. Resuming normal operation.');
    return false;
  }

  return true;
}

/**
 * Get the timestamp when the pause will expire, or null if not paused.
 */
export function getPausedUntil(): number | null {
  return pausedUntil;
}

/**
 * Manually reset the pause state and failure counter.
 */
export function resetPause(): void {
  pausedUntil = null;
  consecutiveFailures = 0;
  console.log('xBooster: Send guard reset manually.');
}
