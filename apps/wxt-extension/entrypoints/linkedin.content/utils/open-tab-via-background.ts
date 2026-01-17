/**
 * Open Tab via Background Script
 *
 * Utility to open new tabs by sending a message to the background script.
 * This bypasses the popup blocker because chrome.tabs.create() is a privileged
 * API that doesn't require user gesture context.
 *
 * Use this instead of window.open() when opening tabs programmatically
 * (e.g., after async operations complete).
 */

/**
 * Open a new tab via the background script
 * Bypasses popup blocker by using chrome.tabs.create() instead of window.open()
 *
 * @param url - The URL to open in the new tab
 * @returns Promise that resolves with the tab ID, or rejects on error
 */
export async function openTabViaBackground(url: string): Promise<number> {
  console.log("[OpenTabViaBackground] Requesting tab open:", { url });

  try {
    const response = await browser.runtime.sendMessage({
      action: "openTargetListTab",
      url,
    });

    if (!response.success) {
      console.error("[OpenTabViaBackground] Failed to open tab:", response.error);
      throw new Error(response.error ?? "Failed to open tab");
    }

    console.log("[OpenTabViaBackground] Tab opened successfully:", {
      tabId: response.data?.tabId,
    });

    return response.data?.tabId ?? -1;
  } catch (error) {
    console.error("[OpenTabViaBackground] Error opening tab:", error);
    throw error;
  }
}
