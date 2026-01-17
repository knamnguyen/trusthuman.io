/**
 * Build Queue Items Utility
 *
 * Builds TargetListQueueItem[] from target list IDs by:
 * 1. Using cached URNs when available (from prefetch)
 * 2. Fetching uncached URNs from API
 * 3. Caching newly fetched URNs for future use
 *
 * Extracted from ComposeTab.handleStart to reduce component complexity.
 */

import type { TargetListQueueItem } from "../../stores/target-list-queue";
import { getTrpcClient } from "../../../../lib/trpc/client";
import {
  cacheTargetListUrns,
  getCachedUrns,
} from "../../stores/target-list-queue";

/**
 * Build queue items from target list IDs
 * Uses cache when available, fetches uncached lists from API
 *
 * @param targetListIds - Array of target list IDs to build queue from
 * @returns Array of queue items with URNs, or empty array if no valid lists
 */
export async function buildQueueItems(
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
        targetListId: listId,
        targetListUrns: cached.urns,
        targetListName: cached.listName,
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
          targetListId: listId!,
          targetListUrns: urns,
          targetListName: listName,
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
    const cached = cachedItems.find((item) => item.targetListId === listId);
    const fetched = fetchedItems.find((item) => item.targetListId === listId);
    if (cached) queueItems.push(cached);
    else if (fetched) queueItems.push(fetched);
  }

  console.log(`[buildQueueItems] Built ${queueItems.length} queue items`);
  return queueItems;
}
