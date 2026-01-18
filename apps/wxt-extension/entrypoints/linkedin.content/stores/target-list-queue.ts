/**
 * Target List Queue State Module
 *
 * Manages queue state for processing multiple target lists sequentially.
 * Queue state is stored in browser.storage.local so it:
 * - Persists across page reloads (survives navigation)
 * - Note: Using local instead of session because session storage
 *   has issues in content scripts (hangs on set/get operations)
 *
 * Processing flow:
 * 1. User selects multiple target lists and clicks "Load Posts"
 * 2. Queue is created with all lists + settings snapshot
 * 3. First tab opens with first list
 * 4. Auto-resume triggers, processes first list
 * 5. On completion, opens next tab with next list
 * 6. Repeat until all lists processed
 * 7. Tabs remain open for review
 */

import { browser } from "wxt/browser";

import { getTrpcClient } from "../../../lib/trpc/client";

const QUEUE_STORAGE_KEY = "engagekit-target-list-queue";

// =============================================================================
// TYPES
// =============================================================================

export interface TargetListQueueItem {
  targetListId: string;
  targetListUrns: string[];
  targetListName: string;
}

export interface PostLoadSettings {
  // Copy of PostLoadSettingDB fields needed for queue processing
  targetListEnabled: boolean;
  targetListIds: string[];
  timeFilterEnabled: boolean;
  minPostAge: number | null;
  skipFriendActivitiesEnabled: boolean;
  skipCompanyPagesEnabled: boolean;
  skipPromotedPostsEnabled: boolean;
  skipBlacklistEnabled: boolean;
  blacklistId: string | null;
  skipFirstDegree: boolean;
  skipSecondDegree: boolean;
  skipThirdDegree: boolean;
  skipFollowing: boolean;
}

/**
 * Snapshot of comment generation settings for queue processing.
 * Only includes fields needed for AI generation branching logic.
 */
export interface CommentGenerateSettings {
  dynamicChooseStyleEnabled: boolean;
  adjacentCommentsEnabled: boolean;
}

export interface TargetListQueueState {
  queue: TargetListQueueItem[];
  currentIndex: number;
  postLoadSettings: PostLoadSettings; // Settings snapshot for entire queue
  commentGenerateSettings?: CommentGenerateSettings; // AI generation settings snapshot
  targetDraftCount: number;
  createdAt: number;
}

// =============================================================================
// URN CACHE (in-memory, pre-fetched when user selects target lists)
// =============================================================================

/** Cache of pre-fetched URNs per target list */
interface UrnCacheEntry {
  urns: string[];
  listName: string;
  fetchedAt: number;
}

const urnCache = new Map<string, UrnCacheEntry>();

/** Cache TTL - 5 minutes (URNs don't change often) */
const URN_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Store pre-fetched URNs for a target list
 */
export function cacheTargetListUrns(
  listId: string,
  urns: string[],
  listName: string,
): void {
  urnCache.set(listId, {
    urns,
    listName,
    fetchedAt: Date.now(),
  });
  console.log(`[UrnCache] Cached ${urns.length} URNs for list "${listName}"`);
}

/**
 * Get cached URNs for a target list
 * Returns null if not cached or expired
 */
export function getCachedUrns(listId: string): UrnCacheEntry | null {
  const entry = urnCache.get(listId);

  if (!entry) {
    return null;
  }

  // Check if expired
  if (Date.now() - entry.fetchedAt > URN_CACHE_TTL_MS) {
    urnCache.delete(listId);
    console.log(`[UrnCache] Cache expired for list "${entry.listName}"`);
    return null;
  }

  return entry;
}

/**
 * Clear all cached URNs
 */
export function clearUrnCache(): void {
  urnCache.clear();
  console.log("[UrnCache] Cleared all cached URNs");
}

/**
 * Pre-fetch URNs for multiple target lists (fire-and-forget)
 * Called when settings load from DB to warm the cache
 *
 * @param listIds - Array of target list IDs to pre-fetch
 */
export async function prefetchUrnsForLists(listIds: string[]): Promise<void> {
  if (listIds.length === 0) return;

  // Filter to only uncached lists
  const uncachedIds = listIds.filter((id) => !getCachedUrns(id));

  if (uncachedIds.length === 0) {
    console.log("[QueuePrefetch] All URNs already cached");
    return;
  }

  console.log(
    `[QueuePrefetch] Pre-fetching URNs for ${uncachedIds.length} uncached lists...`,
  );
  const trpcClient = getTrpcClient();

  try {
    // Fetch list names and profiles in parallel
    const [listsResponse, ...profilesResponses] = await Promise.all([
      trpcClient.targetList.findLists.query({}),
      ...uncachedIds.map((id) =>
        trpcClient.targetList.getProfilesInList.query({ listId: id }),
      ),
    ]);

    // Cache results
    for (let i = 0; i < uncachedIds.length; i++) {
      const listId = uncachedIds[i];
      const profiles = profilesResponses[i];
      const listInfo = listsResponse.data.find((l) => l.id === listId);

      const urns =
        profiles?.data
          .map((p) => p.profileUrn)
          .filter((urn): urn is string => urn !== null) ?? [];

      if (listId && urns.length > 0) {
        cacheTargetListUrns(listId, urns, listInfo?.name ?? "Unknown");
      }
    }

    console.log(
      `[QueuePrefetch] Pre-fetched URNs for ${uncachedIds.length} lists`,
    );
  } catch (error) {
    // Non-critical - cache miss will trigger fetch later
    console.warn("[QueuePrefetch] Failed to pre-fetch URNs:", error);
  }
}

// =============================================================================
// QUEUE STATE MANAGEMENT
// =============================================================================

/**
 * Save queue state to session storage
 */
export async function saveQueueState(
  state: TargetListQueueState,
): Promise<void> {
  console.log("[QueueState] saveQueueState called with:", {
    queueLength: state.queue.length,
    currentIndex: state.currentIndex,
  });
  console.log("[QueueState] browser object:", typeof browser);
  console.log("[QueueState] browser.storage:", typeof browser?.storage);
  console.log("[QueueState] browser.storage.local:", typeof browser?.storage?.local);

  try {
    console.log("[QueueState] About to call browser.storage.local.set...");

    // Add timeout to detect if storage.local is hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Storage operation timed out after 5s")), 5000);
    });

    await Promise.race([
      browser.storage.local.set({ [QUEUE_STORAGE_KEY]: state }),
      timeoutPromise,
    ]);

    console.log("[QueueState] Saved queue state successfully");
  } catch (error) {
    console.error("[QueueState] Error saving queue state:", error);
    throw error;
  }
}

/** Queue timeout - 5 minutes (enough time for loading posts in each tab) */
const QUEUE_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Load queue state from local storage
 * Returns null if no queue exists or if expired
 */
export async function loadQueueState(): Promise<TargetListQueueState | null> {
  try {
    const result = await browser.storage.local.get(QUEUE_STORAGE_KEY);
    const state = result[QUEUE_STORAGE_KEY] as
      | TargetListQueueState
      | undefined;

    if (!state) {
      console.log("QueueState: No queue state found");
      return null;
    }

    // Check if state is expired (5 minute timeout per tab)
    const now = Date.now();
    const ageMs = now - state.createdAt;

    if (ageMs > QUEUE_TIMEOUT_MS) {
      console.log("QueueState: Queue state expired", { ageMs });
      await clearQueueState();
      return null;
    }

    console.log("QueueState: Loaded queue state", {
      queueLength: state.queue.length,
      currentIndex: state.currentIndex,
      ageMs,
    });

    return state;
  } catch (error) {
    console.error("QueueState: Error loading queue state", error);
    return null;
  }
}

/**
 * Clear queue state from session storage
 */
export async function clearQueueState(): Promise<void> {
  try {
    await browser.storage.local.remove(QUEUE_STORAGE_KEY);
    console.log("QueueState: Cleared queue state");
  } catch (error) {
    console.error("QueueState: Error clearing queue state", error);
  }
}

/**
 * Get next queue item and increment index
 * Returns null if queue is complete or no queue exists
 */
export async function getNextQueueItem(): Promise<TargetListQueueItem | null> {
  const state = await loadQueueState();

  if (!state) {
    return null;
  }

  // Check if queue is complete
  if (state.currentIndex >= state.queue.length) {
    console.log("QueueState: Queue complete, clearing");
    await clearQueueState();
    return null;
  }

  // Get current item
  const item = state.queue[state.currentIndex];

  if (!item) {
    console.error("QueueState: Invalid queue index", state.currentIndex);
    await clearQueueState();
    return null;
  }

  // Increment index for next call
  state.currentIndex += 1;

  // Reset createdAt to give fresh timeout window for next tab
  state.createdAt = Date.now();

  // Save updated state
  await saveQueueState(state);

  console.log("QueueState: Got next queue item", {
    index: state.currentIndex - 1,
    total: state.queue.length,
    listName: item.targetListName,
  });

  return item;
}

/**
 * Check if queue is complete
 */
export async function isQueueComplete(): Promise<boolean> {
  const state = await loadQueueState();

  if (!state) {
    return true; // No queue = complete
  }

  return state.currentIndex >= state.queue.length;
}
