"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@sassy/ui/dropdown-menu";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@sassy/ui/sidebar";
import { Skeleton } from "@sassy/ui/skeleton";

import { useCurrentLinkedInAccountId } from "~/hooks/use-current-linkedin-account-id";
import { useTRPC } from "~/trpc/react";

export function AccountSwitcher() {
  const { isMobile } = useSidebar();
  const { accountId, setAccountId } = useCurrentLinkedInAccountId();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  const accountsQuery = useInfiniteQuery(
    trpc.user.listLinkedInAccounts.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.next,
      },
    ),
  );

  const activeAccount = useQuery(
    trpc.user.getLinkedInAccount.queryOptions(
      {
        accountId: accountId ?? "",
      },
      {
        enabled: !!accountId,
      },
    ),
  );

  const accounts = useMemo(
    () => accountsQuery.data?.pages.flatMap((page) => page.data) ?? null,
    [accountsQuery.data],
  );

  useEffect(() => {
    if (accountId === null) {
      const firstAccount = accounts?.[0];
      if (firstAccount !== undefined) {
        setAccountId(firstAccount.id);
        queryClient.setQueryData(
          trpc.user.getLinkedInAccount.queryKey({
            accountId: firstAccount.id,
          }),
          firstAccount,
        );
      }
    }
  }, [accounts, accountId, setAccountId, queryClient]);

  if (activeAccount.data === null || activeAccount.data === undefined) {
    return null;
  }

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent group data-[state=open]:text-sidebar-accent-foreground cursor-pointer transition-all duration-200 hover:bg-gray-200"
              >
                <div className="bg-sidebar-primary text-sidebar-primary-foreground -ml-2 flex aspect-square size-8 items-center justify-center rounded-lg group-data-[state=expanded]:ml-0">
                  <div className="grid aspect-square w-full place-items-center rounded-md bg-blue-600 font-medium text-white">
                    <span>
                      {(
                        activeAccount.data.name ??
                        activeAccount.data.email.split("@")[0]
                      )?.slice(0, 2)}
                    </span>
                  </div>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {activeAccount.data.name ??
                      activeAccount.data.email.split("@")[0]}
                  </span>
                  <span className="truncate text-xs">Premium</span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                Accounts
              </DropdownMenuLabel>
              {accounts === null ? (
                <Skeleton className="h-7 w-full" />
              ) : (
                accounts.map((account, index) => (
                  <DropdownMenuItem
                    key={account.id}
                    onClick={() => {
                      queryClient.setQueryData(
                        trpc.user.getLinkedInAccount.queryKey({
                          accountId: account.id,
                        }),
                        account,
                      );
                      setAccountId(account.id);
                    }}
                    className="cursor-pointer gap-2 p-2"
                  >
                    <div className="grid size-6 shrink-0 place-items-center rounded-md bg-blue-600 text-xs font-medium">
                      <span className="text-white">
                        {(account.name ?? account.email.split("@")[0])?.slice(
                          0,
                          2,
                        )}
                      </span>
                    </div>
                    {account.name ?? account.email.split("@")[0]}
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer gap-2 p-2">
                <Link className="w-full" href="/seats/new">
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Plus className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">
                    Add Account
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
