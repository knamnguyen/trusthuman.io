"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown, Loader2, Plus } from "lucide-react";

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

import { useTRPC } from "~/trpc/react";

export function AccountSwitcher() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const params = useParams<{ orgSlug?: string; accountSlug?: string }>();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const trpc = useTRPC();

  // Get org context from URL params
  const urlOrgSlug = params.orgSlug;
  const orgSlug = urlOrgSlug ?? organization?.slug;

  // Note: Auto-switch org logic is centralized in OrgLayout
  // Only check if org is ready (matches URL or no URL constraint)
  const orgId = organization?.id;
  const isOrgReady =
    isOrgLoaded && (!urlOrgSlug || organization?.slug === urlOrgSlug);

  // Custom query key scoped to orgId - prevents stale data when switching orgs
  const accountsQuery = useQuery({
    ...trpc.account.listByOrg.queryOptions(),
    queryKey: [...trpc.account.listByOrg.queryKey(), { orgId }],
    enabled: isOrgReady && !!orgId,
  });

  const accounts = accountsQuery.data ?? [];
  const currentAccountSlug = params.accountSlug;

  // Find the active account
  const activeAccount = accounts.find(
    (a) => a.profileSlug === currentAccountSlug,
  );

  // Handle account selection - navigate to new URL
  const handleSelectAccount = (account: (typeof accounts)[number]) => {
    if (orgSlug && account.profileSlug) {
      router.push(`/${orgSlug}/${account.profileSlug}`);
    }
  };

  // Show skeleton while org loads, switches, or accounts fetch
  if (!isOrgReady || accountsQuery.isLoading) {
    return (
      <SidebarHeader>
        <Skeleton className="grid h-10 w-full place-items-center bg-gray-200">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </Skeleton>
      </SidebarHeader>
    );
  }

  if (accounts.length === 0) {
    return (
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href={orgSlug ? `/${orgSlug}/accounts` : "#"}>
                <div className="flex size-8 items-center justify-center rounded-lg border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="text-muted-foreground font-medium">
                    Add Account
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
    );
  }

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer transition-colors duration-200 hover:bg-gray-200"
              >
                <div className="grid aspect-square size-8 shrink-0 place-items-center rounded-lg bg-blue-600 font-medium text-white">
                  {activeAccount
                    ? (activeAccount.profileSlug ?? "?")
                        .slice(0, 2)
                        .toUpperCase()
                    : "?"}
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">
                    {activeAccount?.profileSlug ?? "Select Account"}
                  </span>
                  <span className="truncate text-xs">
                    {activeAccount?.status ?? "No account"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-muted-foreground text-xs">
                LinkedIn Accounts
              </DropdownMenuLabel>
              {accounts.map((account, index) => (
                <DropdownMenuItem
                  key={account.id}
                  onClick={() => handleSelectAccount(account)}
                  className="cursor-pointer gap-2 p-2"
                >
                  <div className="grid size-6 shrink-0 place-items-center rounded-md bg-blue-600 text-xs font-medium">
                    <span className="text-white">
                      {(account.profileSlug ?? "?").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  {account.profileSlug}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer gap-2 p-2">
                <Link
                  className="w-full"
                  href={orgSlug ? `/${orgSlug}/accounts` : "#"}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Plus className="size-4" />
                  </div>
                  <div className="text-muted-foreground font-medium">
                    Manage Accounts
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
