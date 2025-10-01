import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import { isFeatureEnabled } from "@sassy/feature-flags";

import { SeatsList } from "./_components/seats-list";

async function Page() {
  const user = await currentUser();

  if (user === null) return redirect("/");

  if (
    user.primaryEmailAddress?.emailAddress === undefined ||
    !isFeatureEnabled(
      "linkedin-browser-mode",
      user.primaryEmailAddress.emailAddress,
    )
  ) {
    return redirect("/");
  }

  return (
    <div className="min-h-dvh bg-zinc-50 text-black">
      <SeatsList />
    </div>
  );
}

export default Page;
