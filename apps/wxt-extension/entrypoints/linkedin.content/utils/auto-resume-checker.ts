/**
 * Auto-Resume System
 *
 * Handles automatic resumption of "Load Posts" after page navigation.
 * Waits for all required stores to be ready before triggering.
 *
 * Dependencies (all must be ready):
 * 1. Auth store: User authentication confirmed
 * 2. Account store: Account data loaded
 * 3. Settings DB store: Settings fetched from server
 *
 * Flow:
 * 1. Page loads (after target list navigation)
 * 2. Wait for all stores to be ready (max 30 seconds)
 * 3. Check for pending navigation state
 * 4. Restore settings and trigger Load Posts
 * 5. If queue: Continue to next tab after completion
 */

import { useAuthStore } from "../../../lib/auth-store";
import { useAccountStore } from "../stores/account-store";
import { consumePendingNavigation } from "../stores/navigation-state";
import { useSettingsDBStore } from "../stores/settings-db-store";
import { continueQueueProcessing } from "./multi-tab-navigation";

const POLL_INTERVAL_MS = 100;
const TIMEOUT_MS = 30_000;

/**
 * Wait for all required stores to be ready
 * Returns true when ready, throws error if timeout
 */
export async function waitForStoresReady(): Promise<void> {
  console.log("[AutoResume] Waiting for stores to be ready...");

  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      // Check timeout
      if (elapsed > TIMEOUT_MS) {
        clearInterval(checkInterval);
        console.error("[AutoResume] Timeout waiting for stores");
        reject(new Error("Timeout waiting for stores to be ready"));
        return;
      }

      // Check all store ready flags
      const authLoaded = useAuthStore.getState().isLoaded;
      const accountLoaded = useAccountStore.getState().isLoaded;
      const settingsLoaded = useSettingsDBStore.getState().isLoaded;

      console.log("[AutoResume] Store status", {
        authLoaded,
        accountLoaded,
        settingsLoaded,
        elapsed: `${elapsed}ms`,
      });

      // All ready?
      if (authLoaded && accountLoaded && settingsLoaded) {
        clearInterval(checkInterval);
        console.log("[AutoResume] All stores ready", { elapsed: `${elapsed}ms` });
        resolve();
      }
    }, POLL_INTERVAL_MS);
  });
}

/**
 * Check for pending navigation and resume Load Posts if found
 * This is the main entry point called from content script initialization
 *
 * @param triggerLoadPosts - Callback to trigger Load Posts with restored settings
 * @returns true if auto-resume was triggered, false otherwise
 */
export async function checkAndResumeLoadPosts(
  triggerLoadPosts: (targetDraftCount: number) => Promise<void>,
): Promise<boolean> {
  console.log("[AutoResume] Starting auto-resume check");

  try {
    // Wait for all stores to be ready
    await waitForStoresReady();

    // Check for pending navigation state
    const navigationState = await consumePendingNavigation();

    if (!navigationState) {
      console.log("[AutoResume] No pending navigation, skipping auto-resume");
      return false;
    }

    console.log("[AutoResume] Found pending navigation", {
      type: navigationState.type,
    });

    // Restore settings to settings-db-store
    // (Settings are restored to DB store, not old settings-store)
    const { postLoadSettings, targetDraftCount } = navigationState;
    const settingsStore = useSettingsDBStore.getState();

    // Update postLoad settings
    await settingsStore.updatePostLoad(postLoadSettings);

    console.log("[AutoResume] Restored settings, triggering Load Posts", {
      targetDraftCount,
    });

    // Trigger Load Posts with restored settings
    await triggerLoadPosts(targetDraftCount);

    console.log("[AutoResume] Load Posts completed");

    // If this was part of a queue, continue to next tab
    if (navigationState.type === "queue") {
      console.log("[AutoResume] Queue processing, checking for next tab");
      const hasNext = await continueQueueProcessing();

      if (hasNext) {
        console.log("[AutoResume] Opened next tab in queue");
      } else {
        console.log("[AutoResume] Queue complete");
      }
    }

    return true;
  } catch (error) {
    console.error("[AutoResume] Error during auto-resume", error);
    return false;
  }
}
