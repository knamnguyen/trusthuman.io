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
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get the user's TrustProfile to find their username
  let trustProfile = await db.trustProfile.findUnique({
    where: { userId: user.id },
    select: { username: true },
  });

  // If no profile exists yet (webhook race condition), create one now
  if (!trustProfile) {
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
  }

  if (trustProfile?.username) {
    // Redirect to their profile page with a query param to show install modal
    redirect(`/${trustProfile.username}?welcome=true`);
  }

  // This should never happen now, but just in case
  redirect("/");
}
