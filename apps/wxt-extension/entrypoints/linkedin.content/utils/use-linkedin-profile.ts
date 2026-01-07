/**
 * LinkedIn Profile Extraction
 *
 * Extracts LinkedIn profile information from the page's embedded data.
 * LinkedIn includes user profile data in <code> tags within the page HTML.
 *
 * Returns:
 * - profileUrl: Public LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)
 * - profileUrn: LinkedIn internal profile URN ID (e.g., ACoAADnB9GgBHY72WrXA0hUz4IY8FAfYcrrSd0o)
 * - profileSlug: Username/slug from the profile URL (e.g., "username")
 */

import { useEffect, useState } from "react";

export interface LinkedInProfile {
  profileUrl: string | null;
  profileUrn: string | null;
  profileSlug: string | null;
}

/**
 * Extract LinkedIn profile from page DOM
 * Standalone function that can be used outside of React hooks
 */
export function extractLinkedInProfileFromPage(): LinkedInProfile {
  console.log(
    "extractLinkedInProfileFromPage: Extracting LinkedIn profile from page...",
  );

  const codeEls = document.querySelectorAll("code");

  for (const el of codeEls) {
    const text = el.textContent?.trim();
    if (!text || !text.includes("com.linkedin.voyager.common.Me")) continue;

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      continue;
    }

    if (json?.data?.["$type"] !== "com.linkedin.voyager.common.Me") continue;

    // URN of the miniProfile from the Me object
    const miniProfileUrn = json.data["*miniProfile"];

    // Find the miniProfile object
    const miniProfile = json.included?.find(
      (item: { entityUrn: string }) => item.entityUrn === miniProfileUrn,
    );
    if (!miniProfile) continue;

    const profileSlug = miniProfile.publicIdentifier;
    const profileUrl = profileSlug
      ? `https://www.linkedin.com/in/${profileSlug}`
      : null;

    // Full URN, e.g. "urn:li:fs_miniProfile:ACoAADnB9GgBHY72WrXA0hUz4IY8FAfYcrrSd0o"
    const fullMiniProfileUrn = miniProfile.entityUrn;

    // Extract just the ID part after the last colon: "ACoAADnB9GgBHY72WrXA0hUz4IY8FAfYcrrSd0o"
    const profileUrn = fullMiniProfileUrn.split(":").pop() ?? null;

    console.log("extractLinkedInProfileFromPage: Profile found:", {
      profileUrl,
      profileUrn,
      profileSlug,
    });

    return {
      profileUrl,
      profileUrn,
      profileSlug,
    };
  }

  console.log("extractLinkedInProfileFromPage: No profile data found on page");
  return {
    profileUrl: null,
    profileUrn: null,
    profileSlug: null,
  };
}

/**
 * React hook for LinkedIn profile extraction
 * Uses the standalone extraction function internally
 */
export const useLinkedInProfile = () => {
  const [profile, setProfile] = useState<LinkedInProfile>({
    profileUrl: null,
    profileUrn: null,
    profileSlug: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const extracted = extractLinkedInProfileFromPage();
    setProfile(extracted);
    setIsLoaded(true);
  }, []);

  return {
    ...profile,
    isLoaded,
  };
};
