import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function AccountsPageRedireect() {
  const { orgSlug } = await auth();

  if (orgSlug) {
    redirect(`/${orgSlug}/accounts`);
  }

  redirect(`/home`);
}
