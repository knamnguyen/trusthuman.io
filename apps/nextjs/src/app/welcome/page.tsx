import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@sassy/db";

/**
 * Generate a unique username from Clerk user data
 */
function generateUsername(user: { username?: string | null; firstName?: string | null; lastName?: string | null; id: string }): string {
  // Try Clerk username first
  if (user.username) {
    return user.username.toLowerCase().replace(/[^a-z0-9_]/g, "");
  }

  // Try first name + last name
  if (user.firstName || user.lastName) {
    const name = `${user.firstName || ""}${user.lastName || ""}`.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (name.length >= 3) {
      return name;
    }
  }

  // Fallback to human + random suffix
  return `human_${user.id.slice(-8)}`;
}

/**
 * Welcome page - redirects new users to their profile page
 * This is the landing page after signup
 *
 * Handles the race condition where user lands here before the Clerk webhook
 * has created their TrustProfile by creating it on-demand if needed.
 */
export default async function WelcomePage() {
  console.log("[WelcomePage] Starting...");

  const user = await currentUser();
  console.log("[WelcomePage] currentUser:", user ? { id: user.id, username: user.username, firstName: user.firstName } : "null");

  if (!user) {
    console.log("[WelcomePage] No user, redirecting to /");
    redirect("/");
  }

  // Get the user's TrustProfile to find their username
  let trustProfile = await db.trustProfile.findUnique({
    where: { userId: user.id },
    select: { username: true },
  });
  console.log("[WelcomePage] Existing trustProfile:", trustProfile);

  // If no profile exists yet (webhook race condition), create one now
  if (!trustProfile) {
    console.log("[WelcomePage] No profile found, creating one...");
    const baseUsername = generateUsername(user);

    // Ensure username is unique by adding suffix if needed
    let username = baseUsername;
    let suffix = 1;
    while (await db.trustProfile.findUnique({ where: { username } })) {
      username = `${baseUsername}${suffix}`;
      suffix++;
    }

    // Get next human number
    const count = await db.trustProfile.count();
    const humanNumber = count + 1;

    // Create the profile
    try {
      trustProfile = await db.trustProfile.create({
        data: {
          userId: user.id,
          username,
          displayName: user.firstName
            ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
            : username,
          avatarUrl: user.imageUrl,
          humanNumber,
        },
        select: { username: true },
      });
      console.log("[WelcomePage] Created new profile:", trustProfile);
    } catch (error) {
      console.error("[WelcomePage] Error creating profile:", error);
      // Profile might have been created by webhook in the meantime, try fetching again
      trustProfile = await db.trustProfile.findUnique({
        where: { userId: user.id },
        select: { username: true },
      });
      console.log("[WelcomePage] Re-fetched profile after error:", trustProfile);
    }
  }

  if (trustProfile?.username) {
    console.log("[WelcomePage] Redirecting to profile:", trustProfile.username);
    redirect(`/${trustProfile.username}?welcome=true`);
  }

  // This should never happen now, but just in case
  console.log("[WelcomePage] No profile username, redirecting to /");
  redirect("/");
}
