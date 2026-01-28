"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { useTRPC } from "~/trpc/react";

export default function BillingReturnPage({
  searchParams,
}: {
  searchParams: { orgId?: string; success?: string; session_id?: string };
}) {
  const trpc = useTRPC();

  const organization = useQuery(
    trpc.organization.get.queryOptions(
      {
        id: searchParams.orgId ?? "",
      },
      {
        enabled: !!searchParams.orgId,
      },
    ),
  );

  const router = useRouter();

  useQuery(
    trpc.organization.subscription.capture.queryOptions(
      {
        sessionId: searchParams.session_id ?? "",
      },
      {
        enabled: !!searchParams.session_id,
      },
    ),
  );

  useEffect(() => {
    if (organization.data === undefined) {
      return;
    }

    // Redirect to current slug (handles org slug changes)
    router.replace(
      `/${organization.data.orgSlug}/settings${searchParams.success ? "?success=true" : ""}`,
    );
  }, [organization.data, router, searchParams.success]);

  if (!searchParams.orgId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">404 not found</h1>
          <p className="text-muted-foreground mt-2">
            No organization ID provided in the return URL.
          </p>
        </div>
      </div>
    );
  }

  if (organization.error) {
    if (organization.error.data?.code === "NOT_FOUND") {
      return (
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Organization not found</h1>
            <p className="text-muted-foreground mt-2">
              The organization could not be found.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Error</h1>
          <p className="text-muted-foreground mt-2">
            An unexpected error occurred: {organization.error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="text-primary h-10 w-10 animate-spin" />
        <div className="text-center">
          <h1 className="text-xl font-semibold">Returning to settings...</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Please wait while we redirect you.
          </p>
        </div>
      </div>
    </div>
  );
}
