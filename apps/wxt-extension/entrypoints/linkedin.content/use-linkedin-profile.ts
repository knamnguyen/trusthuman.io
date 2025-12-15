/**
 * useLinkedInProfile Hook
 *
 * Extracts LinkedIn profile information from the page's embedded data.
 * LinkedIn includes user profile data in <code> tags within the page HTML.
 *
 * Returns:
 * - profileUrl: Public LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)
 * - miniProfileId: LinkedIn internal profile ID (e.g., ACoAADnB9GgBHY72WrXA0hUz4IY8FAfYcrrSd0o)
 * - publicIdentifier: Username from the profile URL (e.g., "username")
 */

import { useEffect, useState } from "react";

interface LinkedInProfile {
  profileUrl: string | null;
  miniProfileId: string | null;
  publicIdentifier: string | null;
}

export const useLinkedInProfile = () => {
  const [profile, setProfile] = useState<LinkedInProfile>({
    profileUrl: null,
    miniProfileId: null,
    publicIdentifier: null,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const extractProfile = () => {
      console.log("useLinkedInProfile: Extracting LinkedIn profile from page...");

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
          (item: any) => item.entityUrn === miniProfileUrn
        );
        if (!miniProfile) continue;

        const publicIdentifier = miniProfile.publicIdentifier;
        const profileUrl = publicIdentifier
          ? `https://www.linkedin.com/in/${publicIdentifier}`
          : null;

        // Full URN, e.g. "urn:li:fs_miniProfile:ACoAADnB9GgBHY72WrXA0hUz4IY8FAfYcrrSd0o"
        const fullMiniProfileUrn = miniProfile.entityUrn;

        // Extract just the ID part after the last colon: "ACoAADnB9GgBHY72WrXA0hUz4IY8FAfYcrrSd0o"
        const miniProfileId = fullMiniProfileUrn.split(":").pop();

        console.log("useLinkedInProfile: Profile found:", {
          profileUrl,
          miniProfileId,
          publicIdentifier,
        });

        setProfile({
          profileUrl,
          miniProfileId,
          publicIdentifier,
        });
        setIsLoaded(true);
        return;
      }

      console.log("useLinkedInProfile: No profile data found on page");
      setIsLoaded(true);
    };

    // Try to extract immediately
    extractProfile();

    // Also listen for DOM changes (in case LinkedIn loads data dynamically)
    const observer = new MutationObserver(() => {
      if (!profile.miniProfileId) {
        extractProfile();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return {
    ...profile,
    isLoaded,
  };
};
