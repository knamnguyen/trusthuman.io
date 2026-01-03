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
   * Build storage key with optional account ID
   * Format: local:{baseKey} or local:{baseKey}-{accountId}
   */
  private buildStorageKey(accountId?: string | null): string {
    if (accountId) {
      return `local:${this.config.storageKey}-${accountId}`;
    }
    return `local:${this.config.storageKey}`;
  }

  /**
   * Auto-collect data if enough time has passed since last fetch
   * Returns true if data was collected, false if rate-limited or failed
   *
   * @param accountId - Optional account identifier for account-specific storage
   */
  async autoCollect(accountId?: string | null): Promise<boolean> {
    try {
      if (!accountId) {
        console.warn(`⚠️ No account ID provided for ${this.config.storageKey}, skipping auto-collect`);
        return false;
      }

      const history = await this.getHistory(accountId);
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
      await this.saveSnapshot(data, accountId);
      return true;
    } catch (error) {
      console.error("❌ Error during auto-collect:", error);
      return false;
    }
  }

  /**
   * Get complete history from storage
   *
   * @param accountId - Optional account identifier for account-specific storage
   */
  async getHistory(accountId?: string | null): Promise<DataHistory<T>> {
    const storageKey = this.buildStorageKey(accountId);
    const stored = await storage.getItem<DataHistory<T>>(storageKey);

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
   *
   * @param data - The data to save
   * @param accountId - Optional account identifier for account-specific storage
   * @param metadata - Optional metadata to attach to the snapshot
   */
  async saveSnapshot(
    data: T,
    accountId?: string | null,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const history = await this.getHistory(accountId);
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

    const storageKey = this.buildStorageKey(accountId);
    await storage.setItem(storageKey, updatedHistory);
    console.log(`✅ Snapshot saved to ${storageKey}`);
  }

  /**
   * Manually trigger a fetch (ignores rate limiting)
   *
   * @param accountId - Optional account identifier for account-specific storage
   */
  async manualFetch(accountId?: string | null): Promise<T | null> {
    const data = await this.fetchFn();
    if (data) {
      await this.saveSnapshot(data, accountId, { manual: true });
    }
    return data;
  }

  /**
   * Clear all history for a specific account
   *
   * @param accountId - Optional account identifier for account-specific storage
   */
  async clearHistory(accountId?: string | null): Promise<void> {
    const storageKey = this.buildStorageKey(accountId);
    await storage.removeItem(storageKey);
    console.log(`🗑️ Cleared history for ${storageKey}`);
  }
}
