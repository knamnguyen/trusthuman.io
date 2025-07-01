/**
 * Storage Service
 *
 * SERVICE CLASS - Handles all Chrome storage operations
 * - Manages commented authors with timestamps and duplicate tracking
 * - Handles post URN tracking for duplicate detection
 * - Manages counters and statistics persistence
 * - Provides data cleanup and maintenance operations
 * - Centralized storage logic separate from content script UI logic
 */

interface CommentedAuthorData {
  timestamp: number;
  count: number;
}

interface StorageCounters {
  totalAllTimeComments: number;
  totalTodayComments: number;
  postsSkippedDuplicate: number;
  recentAuthorsDetected: number;
  postsSkippedAlreadyCommented: number;
  duplicatePostsDetected: number;
  postsSkippedTimeFilter: number;
}

export class StorageService {
  /**
   * Get today's date string in YYYY-MM-DD format
   */
  static getTodayDateString(): string {
    return new Date().toISOString().split("T")[0]!;
  }

  /**
   * Load commented authors with timestamps from storage
   */
  static async loadCommentedAuthorsWithTimestamps(): Promise<
    Record<string, CommentedAuthorData>
  > {
    const result = await chrome.storage.local.get([
      "commentedAuthorsWithTimestamps",
    ]);
    return (
      (result.commentedAuthorsWithTimestamps as Record<
        string,
        CommentedAuthorData
      >) || {}
    );
  }

  /**
   * Save commented author with timestamp
   */
  static async saveCommentedAuthorWithTimestamp(
    authorName: string,
  ): Promise<void> {
    const authors = await this.loadCommentedAuthorsWithTimestamps();
    const now = Date.now();

    if (authors[authorName]) {
      authors[authorName].count += 1;
      authors[authorName].timestamp = now;
    } else {
      authors[authorName] = { timestamp: now, count: 1 };
    }

    await chrome.storage.local.set({ commentedAuthorsWithTimestamps: authors });
  }

  /**
   * Check if we've commented on this author recently (within duplicate window)
   */
  static async hasCommentedOnAuthorRecently(
    authorName: string,
    duplicateWindowHours: number,
  ): Promise<boolean> {
    const authors = await this.loadCommentedAuthorsWithTimestamps();
    const authorData = authors[authorName];

    if (!authorData) return false;

    const windowMs = duplicateWindowHours * 60 * 60 * 1000;
    const timeSinceComment = Date.now() - authorData.timestamp;

    return timeSinceComment < windowMs;
  }

  /**
   * Load today's commented authors (legacy format)
   */
  static async loadTodayCommentedAuthors(): Promise<string[]> {
    const today = this.getTodayDateString();
    const result = await chrome.storage.local.get([
      `commentedAuthors_${today}`,
    ]);
    return result[`commentedAuthors_${today}`] || [];
  }

  /**
   * Save commented author for today (legacy format)
   */
  static async saveCommentedAuthor(authorName: string): Promise<void> {
    const today = this.getTodayDateString();
    const authors = await this.loadTodayCommentedAuthors();

    if (!authors.includes(authorName)) {
      authors.push(authorName);
      await chrome.storage.local.set({
        [`commentedAuthors_${today}`]: authors,
      });
    }
  }

  /**
   * Load all counters from storage
   */
  static async loadCounters(): Promise<StorageCounters> {
    const result = await chrome.storage.local.get([
      "totalAllTimeComments",
      "totalTodayComments",
      "postsSkippedDuplicate",
      "recentAuthorsDetected",
      "postsSkippedAlreadyCommented",
      "duplicatePostsDetected",
      "postsSkippedTimeFilter",
    ]);

    return {
      totalAllTimeComments: result.totalAllTimeComments || 0,
      totalTodayComments: result.totalTodayComments || 0,
      postsSkippedDuplicate: result.postsSkippedDuplicate || 0,
      recentAuthorsDetected: result.recentAuthorsDetected || 0,
      postsSkippedAlreadyCommented: result.postsSkippedAlreadyCommented || 0,
      duplicatePostsDetected: result.duplicatePostsDetected || 0,
      postsSkippedTimeFilter: result.postsSkippedTimeFilter || 0,
    };
  }

  /**
   * Update comment counts after successful comment
   */
  static async updateCommentCounts(): Promise<void> {
    const counters = await this.loadCounters();

    counters.totalAllTimeComments += 1;
    counters.totalTodayComments += 1;

    await chrome.storage.local.set({
      totalAllTimeComments: counters.totalAllTimeComments,
      totalTodayComments: counters.totalTodayComments,
    });
  }

  /**
   * Increment specific counter
   */
  static async incrementCounter(
    counterName: keyof StorageCounters,
  ): Promise<void> {
    const result = await chrome.storage.local.get([counterName]);
    const currentValue = result[counterName] || 0;
    await chrome.storage.local.set({ [counterName]: currentValue + 1 });
  }

  /**
   * Load commented post URNs from storage
   */
  static async loadCommentedPostUrns(): Promise<string[]> {
    const result = await chrome.storage.local.get(["commentedPostUrns"]);
    return result.commentedPostUrns || [];
  }

  /**
   * Save commented post URN
   */
  static async saveCommentedPostUrn(urn: string): Promise<void> {
    const urns = await this.loadCommentedPostUrns();
    if (!urns.includes(urn)) {
      urns.push(urn);
      await chrome.storage.local.set({ commentedPostUrns: urns });
    }
  }

  /**
   * Check if post URN has been commented on
   */
  static async hasCommentedOnPost(urn: string): Promise<boolean> {
    const urns = await this.loadCommentedPostUrns();
    return urns.includes(urn);
  }

  /**
   * Clean up old data (remove entries older than specified days)
   */
  static async cleanupOldData(retentionDays: number = 30): Promise<void> {
    const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const authors = await this.loadCommentedAuthorsWithTimestamps();

    // Clean up old author entries
    const cleanedAuthors: Record<string, CommentedAuthorData> = {};
    for (const [authorName, data] of Object.entries(authors)) {
      if (data.timestamp > cutoffTime) {
        cleanedAuthors[authorName] = data;
      }
    }

    await chrome.storage.local.set({
      commentedAuthorsWithTimestamps: cleanedAuthors,
    });
  }

  /**
   * Get storage usage statistics
   */
  static async getStorageStats(): Promise<{ used: number; quota: number }> {
    return new Promise((resolve) => {
      chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
        resolve({
          used: bytesInUse,
          quota: chrome.storage.local.QUOTA_BYTES || 5242880, // 5MB default
        });
      });
    });
  }

  /**
   * Reset all counters to zero
   */
  static async resetAllCounters(): Promise<void> {
    await chrome.storage.local.set({
      totalAllTimeComments: 0,
      totalTodayComments: 0,
      postsSkippedDuplicate: 0,
      recentAuthorsDetected: 0,
      postsSkippedAlreadyCommented: 0,
      duplicatePostsDetected: 0,
      postsSkippedTimeFilter: 0,
    });
  }
}

export type { CommentedAuthorData, StorageCounters };
