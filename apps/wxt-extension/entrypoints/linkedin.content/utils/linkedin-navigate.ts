/**
 * LinkedIn SPA Navigation Utility
 *
 * Navigates within LinkedIn without triggering a full page reload.
 * This keeps content script UI (like the sidebar) intact.
 *
 * How it works:
 * - Uses history.pushState to update the URL
 * - Dispatches popstate event to trigger LinkedIn's internal router
 * - LinkedIn's React app handles the route change and updates content
 * - Our content script remains untouched
 */

/**
 * Navigate to a LinkedIn path without reloading the page.
 * Keeps the sidebar and other content script UI intact.
 *
 * @param path - The path to navigate to (e.g., "/feed/", "/in/username/")
 *               Can be a full URL or just the path
 *
 * @example
 * // Navigate to feed
 * navigateLinkedIn("/feed/");
 *
 * // Navigate to a profile
 * navigateLinkedIn("/in/williamhgates/");
 *
 * // Navigate to search
 * navigateLinkedIn("/search/results/people/?keywords=engineer");
 *
 * // Full URL also works
 * navigateLinkedIn("https://www.linkedin.com/in/someone/");
 */
export function navigateLinkedIn(path: string): void {
  // Extract path if full URL is provided
  let targetPath = path;

  if (path.startsWith("http")) {
    try {
      const url = new URL(path);
      // Only handle LinkedIn URLs
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

  console.log("[navigateLinkedIn] Navigating to:", targetPath);

  // Update URL without reload
  window.history.pushState({}, "", targetPath);

  // Trigger LinkedIn's router by dispatching popstate
  window.dispatchEvent(new PopStateEvent("popstate", { state: {} }));
}

/**
 * Create an onClick handler for navigation.
 * Useful for buttons and custom elements.
 *
 * @param path - The LinkedIn path to navigate to
 * @returns Click handler function
 *
 * @example
 * <button onClick={createNavigateHandler("/feed/")}>
 *   Go to Feed
 * </button>
 */
export function createNavigateHandler(
  path: string
): (e: React.MouseEvent) => void {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigateLinkedIn(path);
  };
}

/**
 * Props for elements that should navigate within LinkedIn
 */
export interface LinkedInLinkProps {
  href: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Create props for an anchor element that navigates within LinkedIn.
 * Spreads onto an <a> tag to make it navigate via SPA routing.
 *
 * @param href - The LinkedIn path to navigate to
 * @param additionalOnClick - Optional additional click handler
 * @returns Props to spread onto an anchor element
 *
 * @example
 * <a {...linkedInLinkProps("/in/username/")}>
 *   View Profile
 * </a>
 *
 * // With additional click handling
 * <a {...linkedInLinkProps("/feed/", () => trackClick())}>
 *   Go to Feed
 * </a>
 */
export function linkedInLinkProps(
  href: string,
  additionalOnClick?: () => void
): LinkedInLinkProps {
  return {
    href,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      additionalOnClick?.();
      navigateLinkedIn(href);
    },
  };
}
