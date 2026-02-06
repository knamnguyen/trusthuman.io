import { storage } from "wxt/storage";

export const DEFAULT_FOLLOWUP_INTERVAL_MINUTES = 15;
export const MIN_INTERVAL_MINUTES = 5;
export const MAX_INTERVAL_MINUTES = 60;

export const FOLLOWUP_AUTO_FETCH_DISABLED = 0;

export const FOLLOWUP_INTERVAL_OPTIONS = [0, 5, 15, 30, 60] as const;

export const FOLLOWUP_INTERVAL_KEY = "local:followup-auto-fetch-interval-minutes" as const;

/**
 * Get the configured auto-fetch interval in milliseconds
 * Returns Infinity if fetching is disabled (0)
 */
export async function getFollowUpIntervalMs(): Promise<number> {
  const minutes = await storage.getItem<number>(FOLLOWUP_INTERVAL_KEY);
  if (minutes === FOLLOWUP_AUTO_FETCH_DISABLED) return Infinity;
  return (minutes ?? DEFAULT_FOLLOWUP_INTERVAL_MINUTES) * 60 * 1000;
}

/**
 * Check if auto-fetch is disabled
 */
export async function isFollowUpAutoFetchDisabled(): Promise<boolean> {
  const minutes = await storage.getItem<number>(FOLLOWUP_INTERVAL_KEY);
  return minutes === FOLLOWUP_AUTO_FETCH_DISABLED;
}

/**
 * Get the configured auto-fetch interval in minutes
 */
export async function getFollowUpIntervalMinutes(): Promise<number> {
  const minutes = await storage.getItem<number>(FOLLOWUP_INTERVAL_KEY);
  return minutes ?? DEFAULT_FOLLOWUP_INTERVAL_MINUTES;
}

/**
 * Set the auto-fetch interval (clamped between min and max, or 0 to disable)
 */
export async function setFollowUpIntervalMinutes(minutes: number): Promise<void> {
  const value =
    minutes === FOLLOWUP_AUTO_FETCH_DISABLED
      ? FOLLOWUP_AUTO_FETCH_DISABLED
      : Math.max(MIN_INTERVAL_MINUTES, Math.min(MAX_INTERVAL_MINUTES, minutes));
  await storage.setItem(FOLLOWUP_INTERVAL_KEY, value);
  if (value === FOLLOWUP_AUTO_FETCH_DISABLED) {
    console.log("⚙️ Follow-Up auto-fetch disabled");
  } else {
    console.log(`⚙️ Follow-Up auto-fetch interval set to ${value} minutes`);
  }
}

/**
 * React hook helper: watch for interval changes
 */
export function watchFollowUpInterval(callback: (minutes: number) => void): () => void {
  return storage.watch<number>(FOLLOWUP_INTERVAL_KEY, (newValue) => {
    callback(newValue ?? DEFAULT_FOLLOWUP_INTERVAL_MINUTES);
  });
}
