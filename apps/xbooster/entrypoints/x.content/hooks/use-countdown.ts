import { useEffect, useState } from "react";

/**
 * Returns a live seconds countdown to the given target timestamp.
 * Returns null if targetMs is null or already passed.
 * Ticks every second.
 */
export function useCountdown(targetMs: number | null): number | null {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(() => {
    if (!targetMs) return null;
    const diff = Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
    return diff > 0 ? diff : null;
  });

  useEffect(() => {
    if (!targetMs) {
      setSecondsLeft(null);
      return;
    }

    const update = () => {
      const diff = Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
      setSecondsLeft(diff > 0 ? diff : null);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetMs]);

  return secondsLeft;
}

/**
 * Format seconds into a human-readable string.
 * e.g. 125 → "2m 5s", 45 → "45s", 3661 → "61m 1s"
 */
export function formatCountdown(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}
