import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function EarnPremiumPageRedirect() {
  const { orgSlug } = await auth();

  if (orgSlug) {
    redirect(`/${orgSlug}/earn-premium`);
  }

  redirect(`/home`);
}
