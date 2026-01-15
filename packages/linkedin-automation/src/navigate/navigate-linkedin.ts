/**
 * LinkedIn SPA Navigation Utility
 *
 * Navigates within LinkedIn without triggering a full page reload.
 * Works with both DOM v1 (traditional) and DOM v2 (React feed) because
 * it uses browser-level APIs that any SPA router must respect.
 *
 * How it works:
 * - Uses history.pushState to update the URL
 * - Dispatches popstate event to trigger LinkedIn's internal router
 * - LinkedIn's app handles the route change and updates content
 *
 * Usage in content scripts:
 *   import { navigateLinkedIn } from "@sassy/linkedin-automation/navigate/navigate-linkedin";
 *   navigateLinkedIn("/in/username/");
 *
 * Usage in Puppeteer:
 *   await page.evaluate((path) => {
 *     window.history.pushState({}, "", path);
 *     window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
 *   }, "/in/username/");
 */

/**
 * Navigate to a LinkedIn path without reloading the page.
 *
 * @param path - The path to navigate to (e.g., "/feed/", "/in/username/")
 *               Can be a full URL or just the path
 *
 * @example
 * navigateLinkedIn("/feed/");
 * navigateLinkedIn("/in/williamhgates/");
 * navigateLinkedIn("/search/results/people/?keywords=engineer");
 * navigateLinkedIn("https://www.linkedin.com/in/someone/");
 */
export function navigateLinkedIn(path: string): void {
  let targetPath = path;

  // Extract path if full URL is provided
  if (path.startsWith("http")) {
    try {
      const url = new URL(path);
      if (!url.hostname.includes("linkedin.com")) {
        console.warn(
          "[navigateLinkedIn] Non-LinkedIn URL, falling back to window.location",
          path
        );
        window.location.href = path;
        return;
      }
      targetPath = url.pathname + url.search + url.hash;
    } catch {
      console.error("[navigateLinkedIn] Invalid URL:", path);
      return;
    }
  }

  // Ensure path starts with /
  if (!targetPath.startsWith("/")) {
    targetPath = "/" + targetPath;
  }

  // Update URL without reload
  window.history.pushState({}, "", targetPath);

  // Trigger LinkedIn's router by dispatching popstate
  window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
}
