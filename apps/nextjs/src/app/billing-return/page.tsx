"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { useTRPC } from "~/trpc/react";

export default function BillingReturnPage({
  searchParams,
}: {
  searchParams: Promise<{
    orgId?: string;
    success?: string;
    session_id?: string;
  }>;
}) {
  const params = use(searchParams);
  const trpc = useTRPC();

  const organization = useQuery(
    trpc.organization.get.queryOptions(
      {
        id: params.orgId ?? "",
      },
      {
        enabled: !!params.orgId,
      },
    ),
  );

  const router = useRouter();

  const capture = useQuery(
    trpc.organization.subscription.capture.queryOptions(
      {
        sessionId: params.session_id ?? "",
      },
      {
        enabled: !!params.session_id,
      },
    ),
  );

  useEffect(() => {
    // wait till capture either succeeds or fails and org is loaded
    if (
      organization.data === undefined ||
      (capture.data === undefined && capture.error === null)
    ) {
      return;
    }

    // Redirect to current slug (handles org slug changes)
    router.replace(
      `/${organization.data.orgSlug}/settings${params.success ? "?success=true" : ""}`,
    );
  }, [organization.data, router, params.success, capture.data, capture.error]);

  if (!params.orgId) {
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
