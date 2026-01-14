import { storage } from "wxt/storage";

import { createAccountUtilities } from "@sassy/linkedin-automation/account/create-account-utilities";

interface LinkedInAuth {
  cookie: string;
  csrfToken: string;
  pageInstance?: string;
  track?: string;
}

export interface ContentImpressionsData {
  totalImpressions: number;
  period: string;
}

/**
 * Fetches content impressions from LinkedIn
 * NOTE: This fetches analytics for the CURRENTLY LOGGED IN user (based on auth cookies)
 */
export async function fetchContentImpressions(): Promise<ContentImpressionsData | null> {
  const currentProfile = createAccountUtilities().extractCurrentProfile();
  console.log("🔍 Fetching content impressions for logged-in user:", {
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
      "https://www.linkedin.com/analytics/creator/content/",
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
        "❌ Failed to fetch content impressions:",
        response.status,
        response.statusText,
      );
      return null;
    }

    const html = await response.text();

    // Pattern: "description":"Impressions" + "title":"2,110"
    // Looking for the one with "vs. prior 7 days" context
    const impressionsPattern =
      /&quot;valuePercentageDescription&quot;:&quot;vs\.\s+prior\s+7\s+days&quot;[\s\S]*?&quot;description&quot;:[\s\S]*?&quot;text&quot;:&quot;Impressions&quot;[\s\S]*?&quot;title&quot;:[\s\S]*?&quot;text&quot;:&quot;(\d{1,3}(?:,\d{3})*)\s*&quot;/i;
    const impressionsMatch = html.match(impressionsPattern);

    if (impressionsMatch && impressionsMatch[1]) {
      const impressionsCount = impressionsMatch[1].replace(/,/g, "");
      const totalImpressions = parseInt(impressionsCount, 10);
      const period = "in the last 7 days";

      console.log("✅ Content impressions fetched successfully:", {
        totalImpressions,
        period,
        for: currentProfile.profileSlug || "unknown",
      });
      return { totalImpressions, period };
    }

    console.warn(
      "⚠️ Could not parse content impressions from HTML. Regex did not match.",
    );
    return null;
  } catch (error) {
    console.error("Error fetching content impressions:", error);
    return null;
  }
}
