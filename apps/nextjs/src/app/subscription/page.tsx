"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useOrganization,
  useOrganizationList,
  useUser,
} from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

/**
 * @deprecated This page redirects to the org settings page.
 * Billing is now handled at /[orgSlug]/settings
 */
export default function SubscriptionPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded: isUserLoaded } = useUser();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const { userMemberships, isLoaded: isListLoaded } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  // Redirect to org settings if user has an active org
  useEffect(() => {
    if (isOrgLoaded && organization?.slug) {
      router.replace(`/${organization.slug}/settings`);
    }
  }, [isOrgLoaded, organization?.slug, router]);

  // Show loading while checking auth/org state
  if (!isUserLoaded || !isOrgLoaded || !isListLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // Not signed in - prompt to sign in
  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              Please sign in to manage your subscription.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/sign-in")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Has active org - will redirect (show loading)
  if (organization?.slug) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // No active org - show org selector or prompt to create one
  const orgs = userMemberships?.data ?? [];

  if (orgs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create an organization</CardTitle>
            <CardDescription>
              You need to create an organization to manage billing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push("/create-organization")}
              className="w-full"
            >
              Create Organization
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Multiple orgs - let user select
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Select an organization</CardTitle>
          <CardDescription>
            Choose an organization to manage its billing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {orgs.map((membership) => (
            <Button
              key={membership.organization.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                router.push(`/${membership.organization.slug}/settings`)
              }
            >
              {membership.organization.name}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
