"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";

import { Skeleton } from "@sassy/ui/skeleton";

import { useAccountStore } from "~/stores/zustand-store";

export default function OrgLayout({ children }: { children: ReactNode }) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization, isLoaded } = useOrganization();
  const {
    userMemberships,
    setActive,
    isLoaded: isListLoaded,
  } = useOrganizationList({
    userMemberships: { infinite: true },
  });
  const clearAccount = useAccountStore((s) => s.clearAccount);
  const switchingOrgRef = useRef(false);
  const prevOrgIdRef = useRef<string | null>(null);

  // Clear account from Zustand when navigating to org-level pages
  useEffect(() => {
    clearAccount();
  }, [clearAccount]);

  // Invalidate all queries when org changes to prevent stale data
  useEffect(() => {
    const currentOrgId = organization?.id ?? null;

    // Only invalidate when switching FROM one valid org TO another valid org
    // Skip if either is null (Clerk sets org to null during transitions)
    if (
      prevOrgIdRef.current !== null &&
      currentOrgId !== null &&
      prevOrgIdRef.current !== currentOrgId
    ) {
      console.log("[OrgLayout] Org switched, invalidating queries:", {
        from: prevOrgIdRef.current,
        to: currentOrgId,
      });
      void queryClient.invalidateQueries();
    }

    // Only update ref when we have a valid org (don't track null states)
    if (currentOrgId !== null) {
      prevOrgIdRef.current = currentOrgId;
    }
  }, [organization?.id, queryClient]);

  // Auto-switch to org matching URL slug
  useEffect(() => {
    if (!isLoaded || !isListLoaded || switchingOrgRef.current) return;

    // If current org matches URL, we're good
    if (organization?.slug === orgSlug) return;

    // Wait for membership data to be populated before making decisions
    // isListLoaded can be true while data is still empty during initial load
    if (userMemberships.isLoading) return;

    // Find the org matching the URL slug
    const targetOrg = userMemberships.data.find(
      (membership) => membership.organization.slug === orgSlug,
    );

    if (targetOrg) {
      // Switch to the org that matches the URL
      switchingOrgRef.current = true;
      void setActive({ organization: targetOrg.organization.id }).finally(
        () => {
          switchingOrgRef.current = false;
        },
      );
    } else if (organization?.slug) {
      // User doesn't have access to this org, redirect to their current org
      router.replace(`/${organization.slug}/accounts`);
    }
  }, [
    isLoaded,
    isListLoaded,
    organization,
    orgSlug,
    userMemberships,
    setActive,
    router,
  ]);

  if (!isLoaded || !isListLoaded || userMemberships.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (organization?.slug !== orgSlug) {
    // Still switching or will redirect
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  return <>{children}</>;
}
