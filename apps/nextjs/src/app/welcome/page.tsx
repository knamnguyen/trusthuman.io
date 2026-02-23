import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { db } from "@sassy/db";

/**
 * Welcome page - redirects new users to their profile page
 * This is the landing page after signup
 */
export default async function WelcomePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get the user's TrustProfile to find their username
  const trustProfile = await db.trustProfile.findUnique({
    where: { userId: user.id },
    select: { username: true },
  });

  if (trustProfile?.username) {
    // Redirect to their profile page with a query param to show install modal
    redirect(`/${trustProfile.username}?welcome=true`);
  }

  // Fallback: if no profile yet (webhook delay), redirect to home
  // The webhook should have created it, but just in case
  redirect("/");
}
