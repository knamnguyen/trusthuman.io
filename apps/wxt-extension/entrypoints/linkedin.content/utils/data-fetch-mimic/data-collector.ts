import { storage } from "wxt/storage";

export interface DataSnapshot<T> {
  data: T;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface DataHistory<T> {
  snapshots: DataSnapshot<T>[];
  lastFetchTime: number | null;
}

export interface CollectorConfig {
  storageKey: string;
  maxSnapshots: number;
  minIntervalMs: number;
}

/**
 * Generic data collector that manages periodic fetching and history storage
 *
 * Features:
 * - Rate limiting (minimum interval between fetches)
 * - History management (keeps last N snapshots)
 * - Automatic storage persistence
 * - Generic type support for any data shape
 */
export class DataCollector<T> {
  private config: CollectorConfig;
  private fetchFn: () => Promise<T | null>;

  constructor(
    config: CollectorConfig,
    fetchFn: () => Promise<T | null>
  ) {
    this.config = config;
    this.fetchFn = fetchFn;
  }

  /**
   * Auto-collect data if enough time has passed since last fetch
   * Returns true if data was collected, false if rate-limited or failed
   */
  async autoCollect(): Promise<boolean> {
    try {
      const history = await this.getHistory();
      const now = Date.now();

      // Check rate limit
      if (history.lastFetchTime) {
        const timeSinceLastFetch = now - history.lastFetchTime;
        if (timeSinceLastFetch < this.config.minIntervalMs) {
          console.log(
            `⏱️ Rate limited: ${Math.round((this.config.minIntervalMs - timeSinceLastFetch) / 1000 / 60)} minutes until next fetch`
          );
          return false;
        }
      }

      // Fetch new data
      const data = await this.fetchFn();
      if (!data) {
        console.warn("⚠️ Fetch returned null, skipping snapshot");
        return false;
      }

      // Save snapshot
      await this.saveSnapshot(data);
      return true;
    } catch (error) {
      console.error("❌ Error during auto-collect:", error);
      return false;
    }
  }

  /**
   * Get complete history from storage
   */
  async getHistory(): Promise<DataHistory<T>> {
    const stored = await storage.getItem<DataHistory<T>>(
      `local:${this.config.storageKey}`
    );

    return (
      stored || {
        snapshots: [],
        lastFetchTime: null,
      }
    );
  }

  /**
   * Save a new snapshot to history
   * Automatically manages max snapshots limit (keeps most recent)
   */
  async saveSnapshot(
    data: T,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const history = await this.getHistory();
    const now = Date.now();

    const newSnapshot: DataSnapshot<T> = {
      data,
      timestamp: now,
      metadata,
    };

    // Add new snapshot and keep only the most recent maxSnapshots
    const updatedSnapshots = [newSnapshot, ...history.snapshots].slice(
      0,
      this.config.maxSnapshots
    );

    const updatedHistory: DataHistory<T> = {
      snapshots: updatedSnapshots,
      lastFetchTime: now,
    };

    await storage.setItem(`local:${this.config.storageKey}`, updatedHistory);
    console.log(`✅ Snapshot saved to ${this.config.storageKey}`);
  }

  /**
   * Manually trigger a fetch (ignores rate limiting)
   */
  async manualFetch(): Promise<T | null> {
    const data = await this.fetchFn();
    if (data) {
      await this.saveSnapshot(data, { manual: true });
    }
    return data;
  }

  /**
   * Clear all history
   */
  async clearHistory(): Promise<void> {
    await storage.removeItem(`local:${this.config.storageKey}`);
    console.log(`🗑️ Cleared history for ${this.config.storageKey}`);
  }
}
