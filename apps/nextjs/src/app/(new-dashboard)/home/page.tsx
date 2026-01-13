import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

async function HomePage() {
  const user = await auth();

  // should technically never happen bcs this page is protected by middleware
  if (!user.isAuthenticated) {
    return redirect("/");
  }

  // should technically never happen because we've enabled clerk org access only
  if (!user.orgId) {
    return redirect("/");
  }

  return redirect(`/${user.orgSlug}`);
}

export default HomePage;
