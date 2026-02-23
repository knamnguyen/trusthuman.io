/**
 * X/Twitter Profile Detector
 *
 * Extracts the logged-in user's profile from window.__INITIAL_STATE__
 * Content scripts run in an isolated world, so we need to inject a script
 * into the page context to access the window object.
 */

export interface XProfile {
  screenName: string; // @handle without @
  displayName?: string;
  profileUrl: string;
  avatarUrl?: string;
}

/**
 * Extract logged-in X user profile
 * Tries multiple methods since content scripts can't access page variables directly
 */
export function detectXProfile(): XProfile | null {
  try {
    // Method 1: Inject script to read __INITIAL_STATE__ from page context
    const screenName = extractFromPageContext();
    if (screenName) {
      console.log("TrustAHuman X: Found logged-in user from __INITIAL_STATE__:", screenName);
      return {
        screenName,
        profileUrl: `https://x.com/${screenName}`,
      };
    }

    // Method 2: Fallback - extract from avatar container in DOM
    const avatarProfile = detectXProfileFromAvatar();
    if (avatarProfile) {
      console.log("TrustAHuman X: Found logged-in user from avatar container:", avatarProfile);
      return {
        screenName: avatarProfile,
        profileUrl: `https://x.com/${avatarProfile}`,
      };
    }

    console.log("TrustAHuman X: Could not detect profile from any method");
    return null;
  } catch (err) {
    console.error("TrustAHuman X: Error detecting profile:", err);
    return null;
  }
}

/**
 * Extract screen_name from __INITIAL_STATE__ script tag using regex
 * The script tag content is still accessible, we just need to find the screen_name value
 */
function extractFromPageContext(): string | null {
  const scripts = document.querySelectorAll("script");

  for (const script of scripts) {
    const content = script.textContent || "";

    // Check if this script contains __INITIAL_STATE__
    if (content.includes("__INITIAL_STATE__")) {
      // Use regex to find screen_name in the settings.remote.settings path
      // Format: screen_name: "engagekit_io" or "screen_name": "engagekit_io"
      const match = content.match(/["']?screen_name["']?\s*:\s*["']([^"']+)["']/);

      if (match?.[1]) {
        console.log("TrustAHuman X: Found screen_name via regex:", match[1]);
        return match[1];
      }
    }
  }

  return null;
}

/**
 * Alternative: Extract from UserAvatar-Container-{handle} element
 * This is available when the user's avatar is visible on the page (e.g., in compose box)
 */
export function detectXProfileFromAvatar(): string | null {
  // Look for avatar containers with dynamic handle
  const avatarContainers = document.querySelectorAll('[data-testid^="UserAvatar-Container-"]');
  for (const container of avatarContainers) {
    const testId = container.getAttribute("data-testid");
    if (testId) {
      const handle = testId.replace("UserAvatar-Container-", "");
      if (handle) {
        return handle;
      }
    }
  }
  return null;
}
