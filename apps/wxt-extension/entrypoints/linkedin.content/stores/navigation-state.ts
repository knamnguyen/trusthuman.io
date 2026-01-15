import { browser } from "wxt/browser";

import type { PostLoadSettings } from "./settings-store";

/**
 * State saved before navigating to target list feed.
 * Used to restore settings and auto-resume loading after page reload.
 */
interface PendingNavigationState {
  /** Post load settings to restore */
  postLoadSettings: PostLoadSettings;
  /** Target draft count for Load Posts */
  targetDraftCount: number;
  /** Timestamp when saved (for expiry check) */
  savedAt: number;
}

const STORAGE_KEY = "pendingTargetListNavigation";
/** Max age in ms - expire after 30 seconds (navigation should be quick) */
const MAX_AGE_MS = 30_000;

/**
 * Save state before navigating to target list feed.
 * This allows us to restore settings and auto-resume after page reload.
 */
export async function savePendingNavigation(
  postLoadSettings: PostLoadSettings,
  targetDraftCount: number
): Promise<void> {
  const state: PendingNavigationState = {
    postLoadSettings,
    targetDraftCount,
    savedAt: Date.now(),
  };

  console.log("[NavigationState] Saving state:", state);
  console.log("[NavigationState] browser.storage.session available:", !!browser?.storage?.session);

  await browser.storage.session.set({ [STORAGE_KEY]: state });
  console.log("[NavigationState] Saved pending navigation state");
}

/**
 * Check for and consume pending navigation state.
 * Returns the state if valid, null otherwise.
 * Automatically clears the state after reading (one-time use).
 */
export async function consumePendingNavigation(): Promise<PendingNavigationState | null> {
  console.log("[NavigationState] Checking for pending navigation...");
  const result = await browser.storage.session.get(STORAGE_KEY);
  console.log("[NavigationState] Storage result:", result);
  const state = result[STORAGE_KEY] as PendingNavigationState | undefined;

  if (!state) {
    console.log("[NavigationState] No pending state found");
    return null;
  }

  // Clear immediately (one-time use)
  await browser.storage.session.remove(STORAGE_KEY);

  // Check if expired
  if (Date.now() - state.savedAt > MAX_AGE_MS) {
    console.log("[NavigationState] Pending navigation expired, ignoring");
    return null;
  }

  // Check if we're on the correct page (search results)
  if (!window.location.pathname.startsWith("/search/results/content")) {
    console.log("[NavigationState] Not on search page, ignoring pending navigation");
    return null;
  }

  console.log("[NavigationState] Found valid pending navigation state");
  return state;
}
