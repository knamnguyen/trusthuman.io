/**
 * Build Queue Items Utility
 *
 * Builds QueueItem[] from target list IDs or discovery set IDs by:
 * 1. Using cached data when available (from prefetch)
 * 2. Fetching uncached data from API
 * 3. Caching newly fetched data for future use
 */

import type {
  TargetListQueueItem,
  DiscoverySetQueueItem,
} from "../../stores/queue";
import { getTrpcClient } from "../../../../lib/trpc/client";
import { cacheTargetListUrns, getCachedUrns } from "../../stores/queue";

/**
 * Build target list queue items from target list IDs
 * Uses cache when available, fetches uncached lists from API
 *
 * @param targetListIds - Array of target list IDs to build queue from
 * @returns Array of target list queue items, or empty array if no valid lists
 */
export async function buildTargetListQueueItems(
  targetListIds: string[],
): Promise<TargetListQueueItem[]> {
  console.log(
    `[buildQueueItems] Building queue for ${targetListIds.length} target lists...`,
  );

  const trpcClient = getTrpcClient();

  // Check which lists have cached URNs and which need fetching
  const cachedItems: TargetListQueueItem[] = [];
  const uncachedListIds: string[] = [];

  for (const listId of targetListIds) {
    if (!listId) continue;
    const cached = getCachedUrns(listId);
    if (cached && cached.urns.length > 0) {
      console.log(
        `[buildQueueItems] Using cached URNs for "${cached.listName}": ${cached.urns.length} URNs`,
      );
      cachedItems.push({
        type: "targetList",
        id: listId,
        name: cached.listName,
        urns: cached.urns,
      });
    } else {
      uncachedListIds.push(listId);
    }
  }

  // Fetch any uncached lists
  let fetchedItems: TargetListQueueItem[] = [];
  if (uncachedListIds.length > 0) {
    console.log(
      `[buildQueueItems] Fetching URNs for ${uncachedListIds.length} uncached lists...`,
    );

    const [listsResponse, ...profilesResponses] = await Promise.all([
      trpcClient.targetList.findLists.query({}),
      ...uncachedListIds.map((listId) =>
        trpcClient.targetList.getProfilesInList.query({ listId }),
      ),
    ]);

    for (let i = 0; i < uncachedListIds.length; i++) {
      const listId = uncachedListIds[i];
      const profilesResponse = profilesResponses[i];

      const listInfo = listsResponse.data.find((l) => l.id === listId);
      const listName = listInfo?.name ?? `List ${i + 1}`;

      const urns: string[] = [];
      if (profilesResponse) {
        for (const profile of profilesResponse.data) {
          if (profile.profileUrn) {
            urns.push(profile.profileUrn);
          }
        }
      }

      if (urns.length > 0) {
        // Cache for future use
        cacheTargetListUrns(listId!, urns, listName);
        fetchedItems.push({
          type: "targetList",
          id: listId!,
          name: listName,
          urns,
        });
      } else {
        console.warn(
          `[buildQueueItems] Target list "${listName}" has no URNs, skipping`,
        );
      }
    }
  }

  // Combine cached and fetched items (maintain original order)
  const queueItems: TargetListQueueItem[] = [];
  for (const listId of targetListIds) {
    const cached = cachedItems.find((item) => item.id === listId);
    const fetched = fetchedItems.find((item) => item.id === listId);
    if (cached) queueItems.push(cached);
    else if (fetched) queueItems.push(fetched);
  }

  console.log(`[buildQueueItems] Built ${queueItems.length} target list queue items`);
  return queueItems;
}

/**
 * Build discovery set queue items from discovery set IDs
 * Fetches sets from API since discovery sets include all needed data
 *
 * @param discoverySetIds - Array of discovery set IDs to build queue from
 * @returns Array of discovery set queue items, or empty array if no valid sets
 */
export async function buildDiscoverySetQueueItems(
  discoverySetIds: string[],
): Promise<DiscoverySetQueueItem[]> {
  console.log(
    `[buildQueueItems] Building queue for ${discoverySetIds.length} discovery sets...`,
  );

  if (discoverySetIds.length === 0) {
    return [];
  }

  const trpcClient = getTrpcClient();

  try {
    // Fetch all discovery sets in one call
    const sets = await trpcClient.discoverySet.findByIds.query({
      ids: discoverySetIds,
    });

    if (sets.length === 0) {
      console.warn("[buildQueueItems] No discovery sets found for IDs:", discoverySetIds);
      return [];
    }

    // Convert to queue items (maintain order from input IDs)
    const queueItems: DiscoverySetQueueItem[] = [];

    for (const setId of discoverySetIds) {
      const set = sets.find((s) => s.id === setId);
      if (set) {
        console.log(`[buildQueueItems] Discovery set "${set.name}":`, {
          keywords: set.keywords,
          authorJobTitle: set.authorJobTitle,
          authorIndustries: set.authorIndustries,
          authorIndustriesLength: set.authorIndustries?.length,
        });
        queueItems.push({
          type: "discoverySet",
          id: set.id,
          name: set.name,
          keywords: set.keywords,
          keywordsMode: set.keywordsMode as "AND" | "OR",
          excluded: set.excluded,
          authorJobTitle: set.authorJobTitle ?? undefined,
          authorIndustries: set.authorIndustries,
        });
      } else {
        console.warn(`[buildQueueItems] Discovery set not found: ${setId}`);
      }
    }

    console.log(`[buildQueueItems] Built ${queueItems.length} discovery set queue items`);
    return queueItems;
  } catch (error) {
    console.error("[buildQueueItems] Failed to fetch discovery sets:", error);
    return [];
  }
}

// Legacy export for backward compatibility
export { buildTargetListQueueItems as buildQueueItems };
