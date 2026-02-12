/**
 * Multi-Tab Navigation Handler
 *
 * Handles sequential processing of multiple target lists in separate tabs.
 * Each list opens in a new tab, processes posts, then automatically opens the next tab.
 *
 * Flow:
 * 1. User selects multiple target lists and clicks "Load Posts"
 * 2. processTargetListQueue() creates queue state and opens first tab
 * 3. Auto-resume system detects queue state and processes first list
 * 4. On completion, continueQueueProcessing() opens next tab
 * 5. Repeat until all lists processed
 * 6. Tabs remain open for review
 */

import { buildListFeedUrl } from "@sassy/linkedin-automation/navigate/build-list-feed-url";

import { useAccountStore } from "../stores/account-store";
import { savePendingNavigation } from "../stores/navigation-state";
import type {
  CommentGenerateSettings,
  PostLoadSettings,
  TargetListQueueItem,
  TargetListQueueState,
} from "../stores/target-list-queue";
import {
  clearQueueState,
  getNextQueueItem,
  isQueueComplete,
  loadQueueState,
  saveQueueState,
} from "../stores/target-list-queue";
import { openTabViaBackground } from "./open-tab-via-background";

/**
 * Start processing multiple target lists in sequence
 * Creates queue state and opens first tab
 *
 * @param selectedLists - Array of target lists to process
 * @param settings - Post load settings snapshot
 * @param targetDraftCount - Number of drafts to collect per list
 * @param commentGenerateSettings - Comment generation settings snapshot (for dynamic style)
 */
export async function processTargetListQueue(
  selectedLists: TargetListQueueItem[],
  settings: PostLoadSettings,
  targetDraftCount: number,
  commentGenerateSettings?: CommentGenerateSettings,
): Promise<void> {
  if (selectedLists.length === 0) {
    console.error("[MultiTabNav] No target lists provided");
    throw new Error("No target lists selected");
  }

  console.log("[MultiTabNav] Starting queue processing", {
    listCount: selectedLists.length,
    targetDraftCount,
    dynamicStyleEnabled: commentGenerateSettings?.dynamicChooseStyleEnabled,
  });

  // Create queue state
  const queueState: TargetListQueueState = {
    queue: selectedLists,
    currentIndex: 0,
    postLoadSettings: settings,
    commentGenerateSettings,
    targetDraftCount,
    createdAt: Date.now(),
  };

  // Save queue state to session storage
  console.log("[MultiTabNav] About to save queue state...");
  await saveQueueState(queueState);
  console.log("[MultiTabNav] Queue state saved successfully");

  // Get first item
  console.log("[MultiTabNav] Getting first queue item...");
  const firstItem = await getNextQueueItem();
  console.log("[MultiTabNav] Got first queue item:", firstItem ? firstItem.targetListName : "null");

  if (!firstItem) {
    console.error("[MultiTabNav] Failed to get first queue item");
    throw new Error("Failed to initialize queue");
  }

  // Open first tab with first list feed URL
  const feedUrl = buildListFeedUrl(firstItem.targetListUrns);
  console.log("[MultiTabNav] Opening first tab", {
    listName: firstItem.targetListName,
    urnCount: firstItem.targetListUrns.length,
    url: feedUrl,
  });

  // Get account ID and profile URL from store to pass to new tab (so API calls work before store loads)
  const accountId = useAccountStore.getState().matchingAccount?.id;
  const currentUserProfileUrl = useAccountStore.getState().currentLinkedIn?.profileUrl ?? undefined;
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
  await openTabViaBackground(feedUrl);

  console.log("[MultiTabNav] First tab opened, auto-resume will handle processing");
}

/**
 * Continue processing queue by opening next tab
 * Called after current list processing completes
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

  // Open next tab via background script (bypasses popup blocker)
  const feedUrl = buildListFeedUrl(nextItem.targetListUrns);
  console.log("[MultiTabNav] Opening next tab", {
    listName: nextItem.targetListName,
    urnCount: nextItem.targetListUrns.length,
    url: feedUrl,
  });

  // Get account ID and profile URL from store to pass to new tab
  const accountId = useAccountStore.getState().matchingAccount?.id;
  const currentUserProfileUrl = useAccountStore.getState().currentLinkedIn?.profileUrl ?? undefined;

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

  await openTabViaBackground(feedUrl);

  console.log("[MultiTabNav] Next tab opened, auto-resume will handle processing");
  return true;
}
