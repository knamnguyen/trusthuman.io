import { storage } from "wxt/storage";

// Default interval: 2 hours
export const DEFAULT_AUTO_FETCH_INTERVAL_HOURS = 2;
export const MIN_INTERVAL_HOURS = 1;
export const MAX_INTERVAL_HOURS = 24;

// Special value to indicate fetching is disabled
export const AUTO_FETCH_DISABLED = 0;

// Available interval options for the UI (0 = disabled/stop fetching)
export const INTERVAL_OPTIONS = [0, 1, 2, 4, 8, 12, 24] as const;

// Storage keys
export const AUTO_FETCH_INTERVAL_KEY = "local:auto-fetch-interval-hours" as const;
export const UNIFIED_LAST_FETCH_KEY = "local:unified-last-fetch-time" as const;

/**
 * Get the configured auto-fetch interval in milliseconds
 * Returns Infinity if fetching is disabled (0)
 */
export async function getAutoFetchIntervalMs(): Promise<number> {
  const hours = await storage.getItem<number>(AUTO_FETCH_INTERVAL_KEY);
  if (hours === AUTO_FETCH_DISABLED) return Infinity;
  return (hours ?? DEFAULT_AUTO_FETCH_INTERVAL_HOURS) * 60 * 60 * 1000;
}

/**
 * Check if auto-fetch is disabled
 */
export async function isAutoFetchDisabled(): Promise<boolean> {
  const hours = await storage.getItem<number>(AUTO_FETCH_INTERVAL_KEY);
  return hours === AUTO_FETCH_DISABLED;
}

/**
 * Get the configured auto-fetch interval in hours
 */
export async function getAutoFetchIntervalHours(): Promise<number> {
  const hours = await storage.getItem<number>(AUTO_FETCH_INTERVAL_KEY);
  return hours ?? DEFAULT_AUTO_FETCH_INTERVAL_HOURS;
}

/**
 * Set the auto-fetch interval (clamped between min and max, or 0 to disable)
 */
export async function setAutoFetchIntervalHours(hours: number): Promise<void> {
  // Allow 0 (disabled), otherwise clamp between min and max
  const value = hours === AUTO_FETCH_DISABLED
    ? AUTO_FETCH_DISABLED
    : Math.max(MIN_INTERVAL_HOURS, Math.min(MAX_INTERVAL_HOURS, hours));
  await storage.setItem(AUTO_FETCH_INTERVAL_KEY, value);
  if (value === AUTO_FETCH_DISABLED) {
    console.log(`⚙️ Auto-fetch disabled`);
  } else {
    console.log(`⚙️ Auto-fetch interval set to ${value} hours`);
  }
}

/**
 * Get the timestamp of the last unified fetch
 */
export async function getLastUnifiedFetchTime(): Promise<number | null> {
  return storage.getItem<number>(UNIFIED_LAST_FETCH_KEY);
}

/**
 * Set the timestamp of the last unified fetch
 */
export async function setLastUnifiedFetchTime(timestamp: number): Promise<void> {
  await storage.setItem(UNIFIED_LAST_FETCH_KEY, timestamp);
}

/**
 * React hook helper: watch for interval changes
 */
export function watchAutoFetchInterval(callback: (hours: number) => void): () => void {
  return storage.watch<number>(AUTO_FETCH_INTERVAL_KEY, (newValue) => {
    callback(newValue ?? DEFAULT_AUTO_FETCH_INTERVAL_HOURS);
  });
}
