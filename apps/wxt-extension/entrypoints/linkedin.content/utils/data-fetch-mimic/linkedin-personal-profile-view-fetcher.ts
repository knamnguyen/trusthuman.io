import { storage } from "wxt/storage";

import { extractLinkedInProfileFromPage } from "../use-linkedin-profile";

interface LinkedInAuth {
  cookie: string;
  csrfToken: string;
  pageInstance?: string;
  track?: string;
}

export interface ProfileViewData {
  totalViews: number;
  period: string;
}

/**
 * Fetches profile view analytics from LinkedIn
 * Extracts view count and period from the analytics page HTML
 * NOTE: This fetches analytics for the CURRENTLY LOGGED IN user (based on auth cookies)
 */
export async function fetchProfileViews(): Promise<ProfileViewData | null> {
  // Extract current user's profile info for logging
  const currentProfile = extractLinkedInProfileFromPage();
  console.log("🔍 Fetching analytics for logged-in user:", {
    profileUrl: currentProfile.profileUrl,
    publicIdentifier: currentProfile.publicIdentifier,
    miniProfileId: currentProfile.miniProfileId,
  });

  const auth = await storage.getItem<LinkedInAuth>("local:auth");

  if (!auth || !auth.cookie || !auth.csrfToken) {
    console.error("❌ Missing Auth Headers. Please refresh page.");
    return null;
  }

  try {
    const response = await fetch(
      "https://www.linkedin.com/analytics/profile-views/",
      {
        method: "GET",
        headers: {
          "csrf-token": auth.csrfToken,
          cookie: auth.cookie,
          "x-li-page-instance":
            auth.pageInstance || "urn:li:page:d_flagship3_profile_view_base;0",
          "x-li-track": auth.track || "{}",
        },
      },
    );

    if (!response.ok) {
      console.error(
        "❌ Failed to fetch profile views:",
        response.status,
        response.statusText,
      );
      return null;
    }

    const html = await response.text();
    console.log("📄 Received HTML response, length:", html.length);

    // Debug: Check if key patterns exist
    console.log("🔍 Debug checks:");
    console.log(
      "  - Has &quot;description:",
      html.includes("&quot;description"),
    );
    console.log("  - Has Profile viewers:", html.includes("Profile viewers"));
    console.log("  - Has &quot;title:", html.includes("&quot;title"));
    console.log(
      "  - Has &quot;text &quot;:",
      html.includes("&quot;text &quot;"),
    );

    // Find sample of Profile viewers text
    const profileViewersIndex = html.indexOf("Profile viewers");
    if (profileViewersIndex !== -1) {
      const sample = html.substring(
        profileViewersIndex - 50,
        profileViewersIndex + 100,
      );
      console.log("  - Sample around 'Profile viewers':", sample);
    }

    // Parse HTML to extract view count and period
    // Pattern: &quot;description&quot;: ... &quot;text&quot;:&quot;Profile viewers in the past 90 days&quot; ... &quot;title&quot;: ... &quot;text&quot;:&quot;76&quot;
    // Note: Live response has no spaces in field names, different from sample file
    const viewPattern =
      /&quot;description&quot;:[\s\S]*?&quot;text&quot;:&quot;Profile\s+viewers?\s+in[\s\S]*?the\s+past\s+(\d+)\s+days&quot;[\s\S]*?&quot;title&quot;:[\s\S]*?&quot;text&quot;:&quot;(\d{1,3}(?:,\d{3})*)\s*&quot;/i;
    const viewCountMatch = html.match(viewPattern);

    if (viewCountMatch && viewCountMatch[1] && viewCountMatch[2]) {
      const period = `in the past ${viewCountMatch[1]} days`; // Capture group 1 is now the period
      const viewCount = viewCountMatch[2].replace(/,/g, ""); // Capture group 2 is now the view count
      const totalViews = parseInt(viewCount, 10);

      console.log("✅ Profile views fetched successfully:", {
        totalViews,
        period,
        for: currentProfile.publicIdentifier || "unknown",
        matchedPattern: "JSON title+description",
      });
      return { totalViews, period };
    }

    console.warn(
      "⚠️ Could not parse view count from HTML. Regex did not match.",
    );
    return null;
  } catch (error) {
    console.error("Error fetching profile views:", error);
    return null;
  }
}
