/**
 * Extract Current Profile - DOM v1 (legacy)
 *
 * LinkedIn includes user profile data in <code> tags within the main page HTML.
 * Searches for JSON containing "com.linkedin.voyager.common.Me" type.
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
 * Extract current logged-in LinkedIn profile from page DOM.
 * Searches <code> tags in the main document for profile JSON data.
 */
export function extractCurrentProfile(): LinkedInProfile {
  const codeEls = document.querySelectorAll<HTMLElement>("code");
  return searchCodeElements(codeEls) ?? NULL_PROFILE;
}

/**
 * Async version - for v1, data is already in document so no waiting needed.
 */
export async function extractCurrentProfileAsync(): Promise<LinkedInProfile> {
  return extractCurrentProfile();
}
