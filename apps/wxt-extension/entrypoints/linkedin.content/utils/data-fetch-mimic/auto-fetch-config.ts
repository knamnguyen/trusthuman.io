import { storage } from "wxt/storage";

// Default interval: 2 hours
export const DEFAULT_AUTO_FETCH_INTERVAL_HOURS = 2;
export const MIN_INTERVAL_HOURS = 1;
export const MAX_INTERVAL_HOURS = 24;

// Available interval options for the UI
export const INTERVAL_OPTIONS = [1, 2, 4, 8, 12, 24] as const;

// Storage keys
export const AUTO_FETCH_INTERVAL_KEY = "local:auto-fetch-interval-hours" as const;
export const UNIFIED_LAST_FETCH_KEY = "local:unified-last-fetch-time" as const;

/**
 * Get the configured auto-fetch interval in milliseconds
 */
export async function getAutoFetchIntervalMs(): Promise<number> {
  const hours = await storage.getItem<number>(AUTO_FETCH_INTERVAL_KEY);
  return (hours ?? DEFAULT_AUTO_FETCH_INTERVAL_HOURS) * 60 * 60 * 1000;
}

/**
 * Get the configured auto-fetch interval in hours
 */
export async function getAutoFetchIntervalHours(): Promise<number> {
  const hours = await storage.getItem<number>(AUTO_FETCH_INTERVAL_KEY);
  return hours ?? DEFAULT_AUTO_FETCH_INTERVAL_HOURS;
}

/**
 * Set the auto-fetch interval (clamped between min and max)
 */
export async function setAutoFetchIntervalHours(hours: number): Promise<void> {
  const clamped = Math.max(MIN_INTERVAL_HOURS, Math.min(MAX_INTERVAL_HOURS, hours));
  await storage.setItem(AUTO_FETCH_INTERVAL_KEY, clamped);
  console.log(`⚙️ Auto-fetch interval set to ${clamped} hours`);
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
