import { browser } from "wxt/browser";

import type {
  CommentGenerateSettings,
  PostLoadSettings,
  TargetListQueueState,
} from "./target-list-queue";

/**
 * State saved before navigating to target list feed.
 * Used to restore settings and auto-resume loading after page reload.
 *
 * Supports two types:
 * - 'single': Single target list navigation (legacy)
 * - 'queue': Multiple target lists processed sequentially
 */

// Re-export for convenience
export type { CommentGenerateSettings as CommentGenerateSettingsSnapshot };

// Legacy type (for backward compatibility)
interface PendingNavigationStateLegacy {
  /** Post load settings to restore */
  postLoadSettings: PostLoadSettings;
  /** Target draft count for Load Posts */
  targetDraftCount: number;
  /** Timestamp when saved (for expiry check) */
  savedAt: number;
}

// New type (supports both single and queue)
export interface PendingNavigationState {
  /** Type of navigation */
  type: "single" | "queue";
  /** Post load settings to restore */
  postLoadSettings: PostLoadSettings;
  /** Target draft count for Load Posts */
  targetDraftCount: number;
  /** Timestamp when saved (for expiry check) */
  savedAt: number;
  /** Queue state (only for type === 'queue') */
  queueState?: TargetListQueueState;
  /** Comment generation settings snapshot (for dynamic style branching) */
  commentGenerateSettings?: CommentGenerateSettings;
  /** Account ID from the originating tab (for API requests in new tab before store loads) */
  accountId?: string;
  /** Current user's LinkedIn profile URL (for skipIfUserCommented filter) */
  currentUserProfileUrl?: string;
}

const STORAGE_KEY = "pendingTargetListNavigation";
/** Max age in ms - expire after 30 seconds (navigation should be quick) */
const MAX_AGE_MS = 30_000;

/**
 * Save state before navigating to target list feed (single navigation)
 * This allows us to restore settings and auto-resume after page reload.
 */
export async function savePendingNavigation(
  postLoadSettings: PostLoadSettings,
  targetDraftCount: number,
  queueState?: TargetListQueueState,
  commentGenerateSettings?: CommentGenerateSettings,
  accountId?: string,
  currentUserProfileUrl?: string,
): Promise<void> {
  const state: PendingNavigationState = {
    type: queueState ? "queue" : "single",
    postLoadSettings,
    targetDraftCount,
    savedAt: Date.now(),
    queueState,
    commentGenerateSettings,
    accountId,
    currentUserProfileUrl,
  };

  console.log("[NavigationState] Saving state:", {
    type: state.type,
    hasQueue: !!queueState,
    hasDynamicStyle: commentGenerateSettings?.dynamicChooseStyleEnabled,
    accountId: accountId ? "present" : "missing",
    currentUserProfileUrl: currentUserProfileUrl ? "present" : "missing",
  });
  console.log(
    "[NavigationState] browser.storage.local available:",
    !!browser?.storage?.local,
  );

  await browser.storage.local.set({ [STORAGE_KEY]: state });
  console.log("[NavigationState] Saved pending navigation state");
}

/**
 * Check for and consume pending navigation state.
 * Returns the state if valid, null otherwise.
 * Automatically clears the state after reading (one-time use).
 */
export async function consumePendingNavigation(): Promise<PendingNavigationState | null> {
  console.log("[NavigationState] Checking for pending navigation...");
  const result = await browser.storage.local.get(STORAGE_KEY);
  console.log("[NavigationState] Storage result:", result);
  const state = result[STORAGE_KEY] as
    | PendingNavigationState
    | PendingNavigationStateLegacy
    | undefined;

  if (!state) {
    console.log("[NavigationState] No pending state found");
    return null;
  }

  // Clear immediately (one-time use)
  await browser.storage.local.remove(STORAGE_KEY);

  // Check if expired
  if (Date.now() - state.savedAt > MAX_AGE_MS) {
    console.log("[NavigationState] Pending navigation expired, ignoring");
    return null;
  }

  // Check if we're on the correct page (search results)
  if (!window.location.pathname.startsWith("/search/results/content")) {
    console.log(
      "[NavigationState] Not on search page, ignoring pending navigation",
    );
    return null;
  }

  // Upgrade legacy format to new format
  if (!("type" in state)) {
    console.log("[NavigationState] Upgrading legacy format to new format");
    const upgraded: PendingNavigationState = {
      type: "single",
      postLoadSettings: state.postLoadSettings,
      targetDraftCount: state.targetDraftCount,
      savedAt: state.savedAt,
    };
    return upgraded;
  }

  console.log("[NavigationState] Found valid pending navigation state", {
    type: state.type,
  });
  return state;
}
