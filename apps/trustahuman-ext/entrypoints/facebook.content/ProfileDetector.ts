/**
 * Facebook Profile Detector
 * Detects the logged-in user's profile from Facebook's embedded JSON data
 *
 * Facebook embeds user data in script tags with data-sjs attribute.
 * The logged-in user is identified by "snippet": "You" in the bootstrap_keywords data.
 */

export interface FacebookUserProfile {
  profileUrl: string;
  profileHandle: string; // username or user ID
  displayName: string | null;
  avatarUrl: string | null;
}

/**
 * Detect the currently logged-in user's profile
 */
export async function detectLoggedInProfile(): Promise<FacebookUserProfile | null> {
  try {
    // Method 1: Extract from embedded JSON in script tags (most reliable)
    const profileFromScript = detectFromScriptTags();
    if (profileFromScript) {
      console.log("TrustAHuman FB: Detected profile from script tags", profileFromScript);
      return profileFromScript;
    }

    console.warn("TrustAHuman FB: Could not detect logged-in profile");
    return null;
  } catch (err) {
    console.error("TrustAHuman FB: Error detecting profile", err);
    return null;
  }
}

/**
 * Extract logged-in user from Facebook's embedded JSON script tags.
 * Looks for script[data-sjs] containing bootstrap_keywords with "snippet": "You"
 */
function detectFromScriptTags(): FacebookUserProfile | null {
  // Find all script tags with data-sjs attribute (Facebook's data scripts)
  const scripts = document.querySelectorAll('script[data-sjs]');
  console.log(`TrustAHuman FB: Found ${scripts.length} data-sjs script tags`);

  for (const script of scripts) {
    const content = script.textContent;
    if (!content) continue;

    // Quick check if this script might contain user data
    if (!content.includes('"snippet":"You"') && !content.includes('"snippet": "You"')) {
      continue;
    }

    console.log("TrustAHuman FB: Found script with 'snippet: You', parsing...");

    try {
      // Parse the JSON
      const data = JSON.parse(content);

      // Navigate to find the user with snippet: "You"
      const userInfo = findUserWithSnippetYou(data);
      if (userInfo) {
        console.log("TrustAHuman FB: Extracted user info", userInfo);
        return userInfo;
      }
    } catch (e) {
      // JSON parse failed, try regex extraction as fallback
      console.log("TrustAHuman FB: JSON parse failed, trying regex...");
      const userInfo = extractUserWithRegex(content);
      if (userInfo) {
        console.log("TrustAHuman FB: Extracted user info via regex", userInfo);
        return userInfo;
      }
    }
  }

  return null;
}

/**
 * Recursively search JSON object for direct_nav_result with snippet: "You"
 */
function findUserWithSnippetYou(obj: unknown): FacebookUserProfile | null {
  if (!obj || typeof obj !== "object") return null;

  // Check if this is a direct_nav_result with snippet: "You"
  if (isDirectNavResult(obj) && obj.snippet === "You") {
    return extractProfileFromDirectNav(obj);
  }

  // Recursively search arrays and objects
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const result = findUserWithSnippetYou(item);
      if (result) return result;
    }
  } else {
    for (const value of Object.values(obj)) {
      const result = findUserWithSnippetYou(value);
      if (result) return result;
    }
  }

  return null;
}

interface DirectNavResult {
  ent_id?: string;
  img_url?: string;
  link_url?: string;
  entity_type?: string;
  snippet?: string;
  title?: string;
}

function isDirectNavResult(obj: unknown): obj is DirectNavResult {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "link_url" in obj &&
    "snippet" in obj
  );
}

function extractProfileFromDirectNav(nav: DirectNavResult): FacebookUserProfile {
  const linkUrl = nav.link_url || "";
  // Unescape the URL (Facebook escapes forward slashes)
  const profileUrl = linkUrl.replace(/\\\//g, "/");
  const profileHandle = extractHandleFromUrl(profileUrl);

  // Unescape avatar URL
  const avatarUrl = nav.img_url ? nav.img_url.replace(/\\\//g, "/") : null;

  return {
    profileUrl,
    profileHandle,
    displayName: nav.title || null,
    avatarUrl,
  };
}

/**
 * Fallback: Extract user info using regex when JSON parsing fails
 */
function extractUserWithRegex(content: string): FacebookUserProfile | null {
  // Look for the pattern: "snippet":"You" followed by nearby link_url, title, img_url
  // The structure is: direct_nav_result: { ent_id, img_url, link_url, entity_type, snippet, title }

  // Find a block that contains snippet: "You"
  const snippetYouMatch = content.match(
    /"direct_nav_result"\s*:\s*\{[^}]*"snippet"\s*:\s*"You"[^}]*\}/
  );

  if (!snippetYouMatch) {
    // Try alternate pattern - look backwards from "snippet":"You"
    const altMatch = content.match(
      /\{[^{}]*"link_url"\s*:\s*"([^"]+)"[^{}]*"snippet"\s*:\s*"You"[^{}]*"title"\s*:\s*"([^"]+)"[^{}]*\}/
    );
    if (altMatch) {
      const linkUrl = altMatch[1]!.replace(/\\\//g, "/");
      return {
        profileUrl: linkUrl,
        profileHandle: extractHandleFromUrl(linkUrl),
        displayName: altMatch[2] || null,
        avatarUrl: null,
      };
    }
    return null;
  }

  const block = snippetYouMatch[0];

  // Extract link_url
  const linkUrlMatch = block.match(/"link_url"\s*:\s*"([^"]+)"/);
  if (!linkUrlMatch) return null;

  const linkUrl = linkUrlMatch[1]!.replace(/\\\//g, "/");
  const profileHandle = extractHandleFromUrl(linkUrl);

  // Extract title (display name)
  const titleMatch = block.match(/"title"\s*:\s*"([^"]+)"/);
  const displayName = titleMatch?.[1] ?? null;

  // Extract img_url (avatar)
  const imgMatch = block.match(/"img_url"\s*:\s*"([^"]+)"/);
  const avatarUrl = imgMatch ? imgMatch[1]!.replace(/\\\//g, "/") : null;

  return {
    profileUrl: linkUrl,
    profileHandle,
    displayName,
    avatarUrl,
  };
}

function extractHandleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Handle formats:
    // /username
    // /profile.php?id=123456
    if (pathname.startsWith("/profile.php")) {
      const id = urlObj.searchParams.get("id");
      return id || "unknown";
    }

    // Remove leading slash and any trailing parts
    const parts = pathname.split("/").filter(Boolean);
    return parts[0] || "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Detect if we're currently on a profile page and get the profile URL
 */
export function detectCurrentProfileUrl(): string | null {
  const url = window.location.href;

  // Match profile URLs:
  // facebook.com/username
  // facebook.com/profile.php?id=123
  if (url.includes("facebook.com/profile.php")) {
    return url.split("?")[0] + "?" + new URL(url).searchParams.get("id");
  }

  // Check if it's a profile page (not feed, groups, etc.)
  const pathname = new URL(url).pathname;
  const nonProfilePaths = [
    "/",
    "/home",
    "/feed",
    "/groups",
    "/watch",
    "/marketplace",
    "/gaming",
    "/bookmarks",
    "/events",
    "/pages",
    "/messages",
    "/notifications",
  ];

  if (nonProfilePaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return null;
  }

  // Likely a profile page
  const match = pathname.match(/^\/([^/]+)\/?$/);
  if (match && match[1]) {
    return `https://www.facebook.com/${match[1]}`;
  }

  return null;
}
