/**
 * Extract Current Profile - DOM v2 (React SSR + SDUI)
 *
 * In the new DOM, profile data is stored in a <code> tag inside
 * an iframe with data-testid="interop-iframe" and src containing "/preload/".
 *
 * Falls back to main document search if iframe not found or inaccessible.
 */

import type { LinkedInProfile } from "../types";

const NULL_PROFILE: LinkedInProfile = {
  profileUrl: null,
  profileUrn: null,
  profileSlug: null,
};

/**
 * Parse profile from JSON data found in <code> tag.
 */
function parseProfileFromJson(json: {
  data?: { $type?: string; "*miniProfile"?: string };
  included?: Array<{ entityUrn?: string; publicIdentifier?: string }>;
}): LinkedInProfile | null {
  if (json?.data?.["$type"] !== "com.linkedin.voyager.common.Me") {
    return null;
  }

  const miniProfileUrn = json.data["*miniProfile"];
  const miniProfile = json.included?.find(
    (item) => item.entityUrn === miniProfileUrn,
  );

  if (!miniProfile) return null;

  const profileSlug = miniProfile.publicIdentifier ?? null;
  const profileUrl = profileSlug
    ? `https://www.linkedin.com/in/${profileSlug}`
    : null;

  const fullUrn = miniProfile.entityUrn;
  const profileUrn = fullUrn?.split(":").pop() ?? null;

  return { profileUrl, profileUrn, profileSlug };
}

/**
 * Search for profile in a collection of <code> elements.
 */
function searchCodeElements(
  codeEls: NodeListOf<HTMLElement> | HTMLElement[],
): LinkedInProfile | null {
  for (const el of codeEls) {
    const text = el.textContent?.trim();
    if (!text || !text.includes("com.linkedin.voyager.common.Me")) continue;

    try {
      const json = JSON.parse(text);
      const profile = parseProfileFromJson(json);
      if (profile) return profile;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Try to extract profile from the interop iframe.
 */
function extractFromIframe(): LinkedInProfile | null {
  try {
    // Try multiple iframe selectors
    const iframe =
      document.querySelector<HTMLIFrameElement>(
        'iframe[data-testid="interop-iframe"]',
      ) ||
      document.querySelector<HTMLIFrameElement>(
        'iframe[src*="/preload/"]',
      );

    if (!iframe) return null;

    // Access iframe content (same-origin only)
    const iframeDoc = iframe.contentDocument;
    if (!iframeDoc) return null;

    const codeEls = iframeDoc.querySelectorAll<HTMLElement>("code");
    return searchCodeElements(codeEls);
  } catch {
    // SecurityError if cross-origin, or other access issues
    return null;
  }
}

/**
 * Extract current logged-in LinkedIn profile from page DOM (sync).
 * First tries iframe (new DOM), then falls back to main document (legacy).
 */
export function extractCurrentProfile(): LinkedInProfile {
  // Try iframe first (new DOM structure)
  const iframeProfile = extractFromIframe();
  if (iframeProfile) return iframeProfile;

  // Fallback to main document
  const codeEls = document.querySelectorAll<HTMLElement>("code");
  return searchCodeElements(codeEls) ?? NULL_PROFILE;
}

/**
 * Wait for the interop iframe to load and extract profile.
 */
function waitForIframe(timeoutMs: number): Promise<LinkedInProfile | null> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const pollInterval = 200;

    const check = () => {
      // Try to extract from iframe
      const profile = extractFromIframe();
      if (profile) {
        resolve(profile);
        return;
      }

      // Check timeout
      if (Date.now() - startTime >= timeoutMs) {
        resolve(null);
        return;
      }

      // Keep polling
      setTimeout(check, pollInterval);
    };

    check();
  });
}

/**
 * Extract current logged-in LinkedIn profile (async with retry).
 * Waits for iframe to load, with timeout.
 */
export async function extractCurrentProfileAsync(
  timeoutMs = 5000
): Promise<LinkedInProfile> {
  // First try sync extraction
  const syncResult = extractCurrentProfile();
  if (syncResult.profileSlug) {
    return syncResult;
  }

  // Wait for iframe to load
  const iframeProfile = await waitForIframe(timeoutMs);
  if (iframeProfile) {
    return iframeProfile;
  }

  // Final fallback - try main document again
  const codeEls = document.querySelectorAll<HTMLElement>("code");
  return searchCodeElements(codeEls) ?? NULL_PROFILE;
}
