/**
 * Blacklist Cache - In-memory cache for blacklist profile URLs
 *
 * Pre-fetches and caches profile URLs when user selects a blacklist.
 * Used during Load Posts to filter out posts from blacklisted authors.
 *
 * Separate from target-list-queue.ts since blacklist is a distinct feature.
 */

import { getTrpcClient } from "../../../lib/trpc/client";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Cache TTL: 5 minutes (same as URN cache) */
const BLACKLIST_CACHE_TTL_MS = 5 * 60 * 1000;

// =============================================================================
// TYPES
// =============================================================================

/** Cache entry for a blacklist */
export interface BlacklistCacheEntry {
  profileUrls: string[];
  listName: string;
  fetchedAt: number;
}

// =============================================================================
// CACHE STATE
// =============================================================================

const blacklistCache = new Map<string, BlacklistCacheEntry>();

// =============================================================================
// CACHE FUNCTIONS
// =============================================================================

/**
 * Store pre-fetched profile URLs for a blacklist
 */
export function cacheBlacklistProfiles(
  listId: string,
  profileUrls: string[],
  listName: string,
): void {
  blacklistCache.set(listId, {
    profileUrls,
    listName,
    fetchedAt: Date.now(),
  });
  console.log(
    `[BlacklistCache] Cached ${profileUrls.length} profile URLs for blacklist "${listName}"`,
  );
}

/**
 * Get cached profile URLs for a blacklist
 * Returns null if not cached or expired
 */
export function getCachedBlacklist(
  listId: string,
): BlacklistCacheEntry | null {
  const entry = blacklistCache.get(listId);

  if (!entry) {
    console.log(`[BlacklistCache] No cache found for list ${listId}`);
    return null;
  }

  // Check if expired
  if (Date.now() - entry.fetchedAt > BLACKLIST_CACHE_TTL_MS) {
    blacklistCache.delete(listId);
    console.log(
      `[BlacklistCache] Cache expired for blacklist "${entry.listName}"`,
    );
    return null;
  }

  console.log(
    `[BlacklistCache] Using cached blacklist "${entry.listName}" with ${entry.profileUrls.length} profiles`,
  );
  return entry;
}

/**
 * Clear blacklist cache
 */
export function clearBlacklistCache(): void {
  blacklistCache.clear();
  console.log("[BlacklistCache] Cleared blacklist cache");
}

// =============================================================================
// PREFETCH FUNCTION
// =============================================================================

/**
 * Pre-fetch profile URLs for a blacklist (fire-and-forget)
 * Called when settings load from DB or when user selects a blacklist
 *
 * @param listId - Blacklist ID to pre-fetch
 */
export async function prefetchBlacklist(listId: string): Promise<void> {
  if (!listId) return;

  // Check if already cached
  if (getCachedBlacklist(listId)) {
    console.log("[BlacklistPrefetch] Blacklist already cached");
    return;
  }

  console.log(`[BlacklistPrefetch] Pre-fetching blacklist ${listId}...`);
  const trpcClient = getTrpcClient();

  try {
    // Fetch list info and profiles in parallel
    const [listsResponse, profilesResponse] = await Promise.all([
      trpcClient.targetList.findLists.query({}),
      trpcClient.targetList.getProfilesInList.query({ listId }),
    ]);

    const listInfo = listsResponse.data.find((l) => l.id === listId);
    const listName = listInfo?.name ?? "Unknown";

    // Extract profile URLs (NOT URNs - posts have profile URLs)
    // The field in TargetProfile is `linkedinUrl`
    const profileUrls = profilesResponse.data
      .map((p) => p.linkedinUrl)
      .filter((url): url is string => url !== null && url !== "");

    if (profileUrls.length > 0) {
      cacheBlacklistProfiles(listId, profileUrls, listName);
    } else {
      console.warn(
        `[BlacklistPrefetch] Blacklist "${listName}" has no profile URLs`,
      );
    }
  } catch (error) {
    // Non-critical - will fetch on-demand if needed
    console.warn("[BlacklistPrefetch] Failed to pre-fetch blacklist:", error);
  }
}
