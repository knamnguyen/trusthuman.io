import { storage } from "wxt/storage";

import { createAccountUtilities } from "@sassy/linkedin-automation/account/create-account-utilities";

interface LinkedInAuth {
  cookie: string;
  csrfToken: string;
  pageInstance?: string;
  track?: string;
}

export interface InviteCountData {
  totalInvites: number;
}

/**
 * Fetches invite count from LinkedIn
 * NOTE: This fetches analytics for the CURRENTLY LOGGED IN user (based on auth cookies)
 */
export async function fetchInviteCount(): Promise<InviteCountData | null> {
  const currentProfile = createAccountUtilities().extractCurrentProfile();
  console.log("🔍 Fetching invite count for logged-in user:", {
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
      "https://www.linkedin.com/mynetwork/grow/",
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
        "❌ Failed to fetch invite count:",
        response.status,
        response.statusText,
      );
      return null;
    }

    const html = await response.text();

    // Pattern: pendingInvitationsCount ... "intValue":1681
    // Note: In HTML response, quotes are escaped with backslashes
    const invitePattern = /pendingInvitationsCount.*?\\"intValue\\":(\d+)/;
    const inviteMatch = html.match(invitePattern);

    if (inviteMatch && inviteMatch[1]) {
      const totalInvites = parseInt(inviteMatch[1], 10);

      console.log("✅ Invite count fetched successfully:", {
        totalInvites,
        for: currentProfile.profileSlug || "unknown",
      });
      return { totalInvites };
    }

    console.warn(
      "⚠️ Could not parse invite count from HTML. Regex did not match.",
    );
    return null;
  } catch (error) {
    console.error("Error fetching invite count:", error);
    return null;
  }
}
