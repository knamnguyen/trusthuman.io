import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

async function OrgSlugHomePage() {
  const user = await auth();

  // technically shouldnt happen bcs this page is protected by middleware
  if (!user.isAuthenticated) {
    return redirect("/");
  }

  // technically shouldnt happen because we've enabled clerk org access only
  if (!user.orgId) {
    return redirect("/");
  }

  // get cookies to see if we have a persisted account slug to redirect to
  // if not, redirect to accounts list
  const cookie = await cookies();

  const savedAccountSlug = cookie.get("account_slug")?.value;

  if (savedAccountSlug !== undefined) {
    return redirect(`/${user.orgSlug}/${savedAccountSlug}`);
  }

  return redirect(`/${user.orgSlug}/accounts`);
}

export default OrgSlugHomePage;
