"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Skeleton } from "@sassy/ui/skeleton";

import { useAccountStore } from "~/stores/zustand-store";
import { useTRPC } from "~/trpc/react";

export default function AccountLayout({ children }: { children: ReactNode }) {
  const { orgSlug, accountSlug } = useParams<{
    orgSlug: string;
    accountSlug: string;
  }>();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const setAccount = useAccountStore((s) => s.setAccount);
  const prevAccountSlugRef = useRef<string | null>(null);

  const {
    data: account,
    isLoading,
    isError,
  } = useQuery(trpc.account.getBySlug.queryOptions({ slug: accountSlug }));

  // Invalidate account-related queries when switching accounts
  useEffect(() => {
    if (prevAccountSlugRef.current !== null && prevAccountSlugRef.current !== accountSlug) {
      // Account changed - invalidate queries that depend on account context
      void queryClient.invalidateQueries();
    }
    prevAccountSlugRef.current = accountSlug;
  }, [accountSlug, queryClient]);

  useEffect(() => {
    if (account) {
      setAccount(account.id, accountSlug);
    } else if (!isLoading && (isError || !account)) {
      router.replace(`/${orgSlug}/accounts`);
    }
  }, [account, isLoading, isError, accountSlug, orgSlug, router, setAccount]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!account) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
