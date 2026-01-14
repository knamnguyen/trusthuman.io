import { storage } from "wxt/storage";

import { createAccountUtilities } from "@sassy/linkedin-automation/account/create-account-utilities";

interface LinkedInAuth {
  cookie: string;
  csrfToken: string;
  pageInstance?: string;
  track?: string;
}

export interface ProfileImpressionsData {
  totalImpressions: number;
  period: string;
}

/**
 * Fetches profile impressions (appearances) from LinkedIn
 * NOTE: This fetches analytics for the CURRENTLY LOGGED IN user (based on auth cookies)
 */
export async function fetchProfileImpressions(): Promise<ProfileImpressionsData | null> {
  const currentProfile = createAccountUtilities().extractCurrentProfile();
  console.log("🔍 Fetching profile impressions for logged-in user:", {
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
      "https://www.linkedin.com/analytics/search-appearances/",
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
        "❌ Failed to fetch profile impressions:",
        response.status,
        response.statusText,
      );
      return null;
    }

    const html = await response.text();

    // Pattern: "valuePercentageDescription ":"past 7 days" + "description ":"All appearances " + "title ":"35,172 "
    // Note: LinkedIn HTML has spaces before closing quotes in field names
    const impressionsPattern =
      /&quot;valuePercentageDescription\s*&quot;:\s*&quot;past\s+7\s+days&quot;[\s\S]*?&quot;description\s*&quot;:[\s\S]*?&quot;text\s*&quot;:\s*&quot;All\s+appearances\s*&quot;[\s\S]*?&quot;title\s*&quot;:[\s\S]*?&quot;text\s*&quot;:\s*&quot;(\d{1,3}(?:,\d{3})*)\s*&quot;/i;
    const impressionsMatch = html.match(impressionsPattern);

    if (impressionsMatch && impressionsMatch[1]) {
      const impressionsCount = impressionsMatch[1].replace(/,/g, "");
      const totalImpressions = parseInt(impressionsCount, 10);
      const period = "in the past 7 days";

      console.log("✅ Profile impressions fetched successfully:", {
        totalImpressions,
        period,
        for: currentProfile.profileSlug || "unknown",
      });
      return { totalImpressions, period };
    }

    console.warn(
      "⚠️ Could not parse profile impressions from HTML. Regex did not match.",
    );
    return null;
  } catch (error) {
    console.error("Error fetching profile impressions:", error);
    return null;
  }
}
