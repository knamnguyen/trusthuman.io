import { storage } from "wxt/storage";

import { createAccountUtilities } from "@sassy/linkedin-automation/account/create-account-utilities";

interface LinkedInAuth {
  cookie: string;
  csrfToken: string;
  pageInstance?: string;
  track?: string;
}

export interface DashboardActivityData {
  posts: number;
  comments: number;
  period: string; // "in the last 7 days"
}

/**
 * Fetches dashboard activity metrics from LinkedIn
 * Extracts weekly post and comment counts from the dashboard page HTML
 * NOTE: This fetches analytics for the CURRENTLY LOGGED IN user (based on auth cookies)
 */
export async function fetchDashboardActivity(): Promise<DashboardActivityData | null> {
  // Extract current user's profile info for logging
  const currentProfile = createAccountUtilities().extractCurrentProfile();
  console.log("🔍 Fetching dashboard activity for logged-in user:", {
    profileUrl: currentProfile.profileUrl,
    profileSlug: currentProfile.profileSlug,
    profileUrn: currentProfile.profileUrn,
  });

  const auth = await storage.getItem<LinkedInAuth>("local:auth");

  if (!auth || !auth.cookie || !auth.csrfToken) {
    console.error("❌ Missing Auth Headers. Please refresh page.");
    return null;
  }

  try {
    const response = await fetch("https://www.linkedin.com/dashboard/", {
      method: "GET",
      headers: {
        "csrf-token": auth.csrfToken,
        cookie: auth.cookie,
        "x-li-page-instance":
          auth.pageInstance || "urn:li:page:d_flagship3_profile_view_base;0",
        "x-li-track": auth.track || "{}",
      },
    });

    if (!response.ok) {
      console.error(
        "❌ Failed to fetch dashboard activity:",
        response.status,
        response.statusText,
      );
      return null;
    }

    const html = await response.text();
    console.log("📄 Received HTML response, length:", html.length);

    // Debug: Check if key patterns exist
    console.log("🔍 Debug checks:");
    console.log("  - Has weeklyActivityType:", html.includes("weeklyActivityType"));
    console.log("  - Has POSTS:", html.includes("&quot;POSTS"));
    console.log("  - Has COMMENTS:", html.includes("&quot;COMMENTS"));

    // Parse HTML to extract posts and comments counts
    // Pattern for posts: &quot;weeklyActivityType&quot;:&quot;POSTS&quot;,&quot;value&quot;:0
    // Pattern for comments: &quot;weeklyActivityType&quot;:&quot;COMMENTS&quot;,&quot;value&quot;:0

    const postsPattern =
      /&quot;weeklyActivityType\s*&quot;:\s*&quot;POSTS\s*&quot;,\s*&quot;value\s*&quot;:(\d+)/i;
    const commentsPattern =
      /&quot;weeklyActivityType\s*&quot;:\s*&quot;COMMENTS\s*&quot;,\s*&quot;value\s*&quot;:(\d+)/i;

    const postsMatch = html.match(postsPattern);
    const commentsMatch = html.match(commentsPattern);

    if (postsMatch && commentsMatch) {
      const posts = parseInt(postsMatch[1], 10);
      const comments = parseInt(commentsMatch[1], 10);
      const period = "in the last 7 days"; // Dashboard shows weekly metrics

      console.log("✅ Dashboard activity fetched successfully:", {
        posts,
        comments,
        period,
        for: currentProfile.profileSlug || "unknown",
      });

      return { posts, comments, period };
    }

    console.warn(
      "⚠️ Could not parse activity counts from HTML. Regex did not match.",
    );
    console.log("  - Posts match:", postsMatch ? "found" : "not found");
    console.log("  - Comments match:", commentsMatch ? "found" : "not found");

    return null;
  } catch (error) {
    console.error("Error fetching dashboard activity:", error);
    return null;
  }
}
