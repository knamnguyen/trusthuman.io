import { storage } from "wxt/storage";

import { createAccountUtilities } from "@sassy/linkedin-automation/account/create-account-utilities";

interface LinkedInAuth {
  cookie: string;
  csrfToken: string;
  pageInstance?: string;
  track?: string;
}

export interface FollowersData {
  totalFollowers: number;
}

/**
 * Fetches followers count from LinkedIn
 * NOTE: This fetches analytics for the CURRENTLY LOGGED IN user (based on auth cookies)
 */
export async function fetchFollowers(): Promise<FollowersData | null> {
  const currentProfile = createAccountUtilities().extractCurrentProfile();
  console.log("🔍 Fetching followers for logged-in user:", {
    profileUrl: currentProfile.profileUrl,
    profileSlug: currentProfile.profileSlug,
  });

  const auth = await storage.getItem<LinkedInAuth>("local:auth");

  if (!auth || !auth.cookie || !auth.csrfToken) {
    console.error("❌ Missing Auth Headers. Please refresh page.");
    return null;
  }

  try {
    const response = await fetch(
      "https://www.linkedin.com/analytics/creator/audience/",
      {
        method: "GET",
        headers: {
          "csrf-token": auth.csrfToken,
          cookie: auth.cookie,
        },
      },
    );

    if (!response.ok) {
      console.error(
        "❌ Failed to fetch followers:",
        response.status,
        response.statusText,
      );
      return null;
    }

    const html = await response.text();

    // Pattern: "description":"Total followers" ... "title":"6,777"
    const followersPattern =
      /&quot;description&quot;:[\s\S]*?&quot;text&quot;:&quot;Total\s+followers&quot;[\s\S]*?&quot;title&quot;:[\s\S]*?&quot;text&quot;:&quot;(\d{1,3}(?:,\d{3})*)\s*&quot;/i;
    const followersMatch = html.match(followersPattern);

    if (followersMatch && followersMatch[1]) {
      const followersCount = followersMatch[1].replace(/,/g, "");
      const totalFollowers = parseInt(followersCount, 10);

      console.log("✅ Followers fetched successfully:", {
        totalFollowers,
        for: currentProfile.profileSlug || "unknown",
      });
      return { totalFollowers };
    }

    console.warn(
      "⚠️ Could not parse followers count from HTML. Regex did not match.",
    );
    return null;
  } catch (error) {
    console.error("Error fetching followers:", error);
    return null;
  }
}
