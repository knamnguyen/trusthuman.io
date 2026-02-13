/**
 * Queue State Module
 *
 * Manages queue state for processing multiple items (target lists or discovery sets) sequentially.
 * Queue state is stored in browser.storage.local so it:
 * - Persists across page reloads (survives navigation)
 * - Note: Using local instead of session because session storage
 *   has issues in content scripts (hangs on set/get operations)
 *
 * Processing flow:
 * 1. User selects multiple items and clicks "Load Posts"
 * 2. Queue is created with all items + settings snapshot
 * 3. First tab opens with first item
 * 4. Auto-resume triggers, processes first item
 * 5. On completion, opens next tab with next item
 * 6. Repeat until all items processed
 * 7. Tabs remain open for review
 */

import { browser } from "wxt/browser";

import type {
  PostLoadSettingsPartial,
  CommentGenerateSetting,
} from "@sassy/db/schema-validators";

import { buildDiscoverySearchUrl } from "@sassy/linkedin-automation/navigate/build-discovery-search-url";
import { buildListFeedUrl } from "@sassy/linkedin-automation/navigate/build-list-feed-url";

import { getTrpcClient } from "../../../lib/trpc/client";

const QUEUE_STORAGE_KEY = "engagekit-queue";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Target List queue item - processes posts from a specific list of profiles
 */
export interface TargetListQueueItem {
  type: "targetList";
  id: string;
  name: string;
  urns: string[];
}

/**
 * Discovery Set queue item - processes posts from a LinkedIn search
 */
export interface DiscoverySetQueueItem {
  type: "discoverySet";
  id: string;
  name: string;
  keywords: string[];
  keywordsMode: "AND" | "OR";
  excluded: string[];
  authorJobTitle?: string;
  authorIndustries: string[];
}

/**
 * Union type for all queue item types.
 * Add new item types here for future extensibility.
 */
export type QueueItem = TargetListQueueItem | DiscoverySetQueueItem;

/**
 * PostLoadSettings for queue processing (omits DB-only fields)
 * Re-exported from @sassy/db/schema-validators for convenience
 */
export type PostLoadSettings = PostLoadSettingsPartial;

/**
 * Snapshot of comment generation settings for queue processing.
 * Includes all fields needed for AI generation in new tabs without waiting for DB store.
 * - dynamicChooseStyleEnabled: whether AI picks styles dynamically
 * - adjacentCommentsEnabled: whether to include adjacent comments as context
 * - commentStyleId: the selected style ID for static mode (when dynamic is disabled)
 */
export type CommentGenerateSettings = Pick<
  CommentGenerateSetting,
  "dynamicChooseStyleEnabled" | "adjacentCommentsEnabled" | "commentStyleId"
>;

/**
 * Queue state stored in browser.storage.local
 */
export interface QueueState {
  queue: QueueItem[];
  currentIndex: number;
  postLoadSettings: PostLoadSettings;
  commentGenerateSettings?: CommentGenerateSettings;
  targetDraftCount: number;
  createdAt: number;
}

// =============================================================================
// QUEUE ITEM HELPERS
// =============================================================================

/**
 * Build the LinkedIn URL for a queue item based on its type.
 * This is the URL that will be opened in a new tab.
 */
export function buildQueueItemUrl(item: QueueItem): string {
  switch (item.type) {
    case "targetList":
      return buildListFeedUrl(item.urns);
    case "discoverySet":
      return buildDiscoverySearchUrl({
        keywords: item.keywords,
        keywordsMode: item.keywordsMode,
        excluded: item.excluded,
        authorJobTitle: item.authorJobTitle,
        authorIndustries: item.authorIndustries,
      });
    default: {
      // TypeScript exhaustiveness check - will error if a type is not handled
      const _exhaustiveCheck: never = item;
      throw new Error(`Unknown queue item type: ${(_exhaustiveCheck as QueueItem).type}`);
    }
  }
}

/**
 * Get the display name for a queue item (for progress UI)
 */
export function getQueueItemName(item: QueueItem): string {
  return item.name;
}

/**
 * Get a debug description of a queue item
 */
export function getQueueItemDescription(item: QueueItem): string {
  switch (item.type) {
    case "targetList":
      return `Target List "${item.name}" (${item.urns.length} profiles)`;
    case "discoverySet":
      return `Discovery Set "${item.name}" (${item.keywords.length} keywords)`;
    default:
      return `Unknown item "${(item as QueueItem).name}"`;
  }
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
 * Save queue state to local storage
 */
export async function saveQueueState(state: QueueState): Promise<void> {
  console.log("[QueueState] saveQueueState called with:", {
    queueLength: state.queue.length,
    currentIndex: state.currentIndex,
  });

  try {
    // Add timeout to detect if storage.local is hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Storage operation timed out after 5s")),
        5000,
      );
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
export async function loadQueueState(): Promise<QueueState | null> {
  try {
    const result = await browser.storage.local.get(QUEUE_STORAGE_KEY);
    const state = result[QUEUE_STORAGE_KEY] as QueueState | undefined;

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
 * Clear queue state from local storage
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
export async function getNextQueueItem(): Promise<QueueItem | null> {
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
    itemName: getQueueItemName(item),
    itemType: item.type,
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
