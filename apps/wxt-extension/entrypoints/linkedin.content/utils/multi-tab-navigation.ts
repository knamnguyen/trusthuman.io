/**
 * Multi-Tab Navigation Handler
 *
 * Handles sequential processing of multiple queue items (target lists or discovery sets) in separate tabs.
 * Each item opens in a new tab, processes posts, then automatically opens the next tab.
 *
 * Flow:
 * 1. User selects multiple items and clicks "Load Posts"
 * 2. processQueue() creates queue state and opens first tab
 * 3. Auto-resume system detects queue state and processes first item
 * 4. On completion, continueQueueProcessing() opens next tab
 * 5. Repeat until all items processed
 * 6. Tabs remain open for review
 */

import { useAccountStore } from "../stores/account-store";
import { savePendingNavigation } from "../stores/navigation-state";
import type {
  CommentGenerateSettings,
  PostLoadSettings,
  QueueItem,
  QueueState,
} from "../stores/queue";
import {
  buildQueueItemUrl,
  clearQueueState,
  getNextQueueItem,
  getQueueItemName,
  isQueueComplete,
  loadQueueState,
  saveQueueState,
} from "../stores/queue";
import { openTabViaBackground } from "./open-tab-via-background";

/**
 * Start processing a queue of items in sequence.
 * Creates queue state and opens first tab.
 *
 * @param items - Array of queue items (target lists or discovery sets) to process
 * @param settings - Post load settings snapshot
 * @param targetDraftCount - Number of drafts to collect per item
 * @param commentGenerateSettings - Comment generation settings snapshot (for dynamic style)
 */
export async function processQueue(
  items: QueueItem[],
  settings: PostLoadSettings,
  targetDraftCount: number,
  commentGenerateSettings?: CommentGenerateSettings,
): Promise<void> {
  if (items.length === 0) {
    console.error("[MultiTabNav] No queue items provided");
    throw new Error("No queue items selected");
  }

  console.log("[MultiTabNav] Starting queue processing", {
    itemCount: items.length,
    targetDraftCount,
    dynamicStyleEnabled: commentGenerateSettings?.dynamicChooseStyleEnabled,
    itemTypes: items.map((i) => i.type),
  });

  // Create queue state
  const queueState: QueueState = {
    queue: items,
    currentIndex: 0,
    postLoadSettings: settings,
    commentGenerateSettings,
    targetDraftCount,
    createdAt: Date.now(),
  };

  // Save queue state to local storage
  console.log("[MultiTabNav] About to save queue state...");
  await saveQueueState(queueState);
  console.log("[MultiTabNav] Queue state saved successfully");

  // Get first item
  console.log("[MultiTabNav] Getting first queue item...");
  const firstItem = await getNextQueueItem();
  console.log(
    "[MultiTabNav] Got first queue item:",
    firstItem ? getQueueItemName(firstItem) : "null",
  );

  if (!firstItem) {
    console.error("[MultiTabNav] Failed to get first queue item");
    throw new Error("Failed to initialize queue");
  }

  // Build URL for first item
  const url = buildQueueItemUrl(firstItem);
  console.log("[MultiTabNav] Opening first tab", {
    itemName: getQueueItemName(firstItem),
    itemType: firstItem.type,
    url,
  });

  // Get account ID and profile URL from store to pass to new tab (so API calls work before store loads)
  const accountId = useAccountStore.getState().matchingAccount?.id;
  const currentUserProfileUrl =
    useAccountStore.getState().currentLinkedIn?.profileUrl ?? undefined;
  if (!accountId) {
    console.warn(
      "[MultiTabNav] No account ID available - API calls in new tab may fail until store loads",
    );
  }

  // Save pending navigation state so auto-resume triggers in the new tab
  await savePendingNavigation(
    settings,
    targetDraftCount,
    queueState,
    commentGenerateSettings,
    accountId,
    currentUserProfileUrl,
  );

  // Open via background script (bypasses popup blocker)
  await openTabViaBackground(url);

  console.log(
    "[MultiTabNav] First tab opened, auto-resume will handle processing",
  );
}

/**
 * Continue processing queue by opening next tab
 * Called after current item processing completes
 *
 * Returns true if next tab was opened, false if queue complete
 */
export async function continueQueueProcessing(): Promise<boolean> {
  console.log("[MultiTabNav] Checking for next queue item");

  // Check if queue is complete
  if (await isQueueComplete()) {
    console.log("[MultiTabNav] Queue complete, no more tabs to open");
    await clearQueueState();
    return false;
  }

  // Get next item
  const nextItem = await getNextQueueItem();

  if (!nextItem) {
    console.log("[MultiTabNav] No more items in queue");
    await clearQueueState();
    return false;
  }

  // Get current queue state for pending navigation
  const queueState = await loadQueueState();

  // Build URL for next item
  const url = buildQueueItemUrl(nextItem);
  console.log("[MultiTabNav] Opening next tab", {
    itemName: getQueueItemName(nextItem),
    itemType: nextItem.type,
    url,
  });

  // Get account ID and profile URL from store to pass to new tab
  const accountId = useAccountStore.getState().matchingAccount?.id;
  const currentUserProfileUrl =
    useAccountStore.getState().currentLinkedIn?.profileUrl ?? undefined;

  // Save pending navigation state so auto-resume triggers in the new tab
  if (queueState) {
    await savePendingNavigation(
      queueState.postLoadSettings,
      queueState.targetDraftCount,
      queueState,
      queueState.commentGenerateSettings,
      accountId,
      currentUserProfileUrl,
    );
  }

  await openTabViaBackground(url);

  console.log(
    "[MultiTabNav] Next tab opened, auto-resume will handle processing",
  );
  return true;
}
