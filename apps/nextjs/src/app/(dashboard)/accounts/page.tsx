import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import { EngageKitSprite } from "@sassy/ui/components/engagekit-sprite";
import { Switch } from "@sassy/ui/switch";

import { OrgAccountsTest } from "./_components/org-accounts-test";

async function Page() {
  const user = await currentUser();

  if (user === null) return redirect("/");

  return (
    <div className="min-h-dvh bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Organization Accounts Test
        </h1>
        <p className="mb-6 text-gray-600">
          Test page for multi-tenant LinkedIn account management
        </p>
        <OrgAccountsTest />
      </div>
    </div>
  );
}

export default Page;
