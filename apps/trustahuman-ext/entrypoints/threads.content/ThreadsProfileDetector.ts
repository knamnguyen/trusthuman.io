/**
 * Threads Profile Detector
 *
 * Extracts the logged-in user's profile from BarcelonaSharedData in page scripts
 * Content scripts run in an isolated world, so we parse the script tags directly
 */

export interface ThreadsProfile {
  username: string; // @handle without @
  displayName?: string;
  profileUrl: string;
  avatarUrl?: string;
  id?: string;
}

/**
 * Extract logged-in Threads user profile
 * Tries multiple methods since content scripts can't access page variables directly
 */
export function detectThreadsProfile(): ThreadsProfile | null {
  try {
    // Method 1: Extract from BarcelonaSharedData in script tags
    const profile = extractFromBarcelonaSharedData();
    if (profile) {
      console.log("TrustAHuman Threads: Found logged-in user from BarcelonaSharedData:", profile.username);
      return profile;
    }

    // Method 2: Fallback - try to find username in other JSON data
    const fallbackProfile = extractFromCurrentUserData();
    if (fallbackProfile) {
      console.log("TrustAHuman Threads: Found logged-in user from CurrentUserInitialData:", fallbackProfile.username);
      return fallbackProfile;
    }

    console.log("TrustAHuman Threads: Could not detect profile from any method");
    return null;
  } catch (err) {
    console.error("TrustAHuman Threads: Error detecting profile:", err);
    return null;
  }
}

/**
 * Extract profile from BarcelonaSharedData script tag
 * Format: "BarcelonaSharedData",[],{"device_id":"...","viewer":{"username":"engagekit_io",...}}
 */
function extractFromBarcelonaSharedData(): ThreadsProfile | null {
  const scripts = document.querySelectorAll('script[type="application/json"]');

  for (const script of scripts) {
    const content = script.textContent || "";

    // Check if this script contains BarcelonaSharedData
    if (content.includes("BarcelonaSharedData")) {
      // Extract viewer data using regex
      // Pattern: "viewer":{"fbid":"...","id":"...","username":"...",...}
      const viewerMatch = content.match(/"viewer"\s*:\s*\{[^}]*"username"\s*:\s*"([^"]+)"[^}]*"profile_picture_url"\s*:\s*"([^"]+)"/);

      if (viewerMatch) {
        const username = viewerMatch[1];
        const avatarUrl = viewerMatch[2].replace(/\\\//g, "/"); // Unescape forward slashes

        return {
          username,
          profileUrl: `https://www.threads.net/@${username}`,
          avatarUrl,
        };
      }

      // Try alternative order (profile_picture_url before username)
      const altMatch = content.match(/"viewer"\s*:\s*\{[^}]*"profile_picture_url"\s*:\s*"([^"]+)"[^}]*"username"\s*:\s*"([^"]+)"/);
      if (altMatch) {
        const avatarUrl = altMatch[1].replace(/\\\//g, "/");
        const username = altMatch[2];

        return {
          username,
          profileUrl: `https://www.threads.net/@${username}`,
          avatarUrl,
        };
      }

      // Just try to find username
      const usernameMatch = content.match(/"viewer"\s*:\s*\{[^}]*"username"\s*:\s*"([^"]+)"/);
      if (usernameMatch) {
        return {
          username: usernameMatch[1],
          profileUrl: `https://www.threads.net/@${usernameMatch[1]}`,
        };
      }
    }
  }

  return null;
}

/**
 * Fallback: Extract from CurrentUserInitialData if available
 */
function extractFromCurrentUserData(): ThreadsProfile | null {
  const scripts = document.querySelectorAll('script[type="application/json"]');

  for (const script of scripts) {
    const content = script.textContent || "";

    // Check if this script contains user data with IS_THREADS_USER flag
    if (content.includes("IS_THREADS_USER") && content.includes("NON_FACEBOOK_USER_ID")) {
      // This data doesn't have username directly, but we can use it to confirm logged in state
      // The username would need to come from BarcelonaSharedData
    }
  }

  return null;
}
