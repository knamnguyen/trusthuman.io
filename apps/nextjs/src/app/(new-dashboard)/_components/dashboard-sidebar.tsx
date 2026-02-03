"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import {
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GiftIcon,
  HistoryIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UserRoundIcon,
  UsersIcon,
  UsersRoundIcon,
} from "lucide-react";

import { Button } from "@sassy/ui/button";
import { Label } from "@sassy/ui/label";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@sassy/ui/sidebar";
import { Switch } from "@sassy/ui/switch";

import { AccountSwitcher } from "./account-switcher";

/**
 * Toggle switch for hover-to-open setting.
 * Hidden when sidebar is collapsed (icon mode).
 */
function HoverOpenToggle() {
  const { hoverOpen, setHoverOpen } = useSidebar();

  return (
    <div className="flex items-center justify-between px-2 py-1.5 group-data-[collapsible=icon]:hidden">
      <Label
        htmlFor="hover-open"
        className="text-muted-foreground text-xs font-normal"
      >
        Hover to expand
      </Label>
      <Switch
        id="hover-open"
        checked={hoverOpen}
        onCheckedChange={setHoverOpen}
        className="scale-75"
      />
    </div>
  );
}

/**
 * Toggle button on sidebar edge to expand/collapse.
 * Always visible - shows chevron direction based on state.
 */
function SidebarToggleButton() {
  const { state, toggleSidebar } = useSidebar();
  const isExpanded = state === "expanded";

  return (
    <div className="absolute top-1/2 -right-3 z-20 -translate-y-1/2">
      <Button
        onClick={toggleSidebar}
        variant="outline"
        size="icon"
        className="h-6 w-6 rounded-full"
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        {isExpanded ? (
          <ChevronLeftIcon className="h-4 w-4" />
        ) : (
          <ChevronRightIcon className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export function DashboardSidebar() {
  const params = useParams<{ orgSlug?: string; accountSlug?: string }>();
  const { orgSlug, accountSlug } = params;

  const isInsideAccount = accountSlug !== undefined;

  const accountItems = useMemo(() => {
    if (!isInsideAccount) return [];

    return [
      {
        title: "Dashboard",
        url: `/${orgSlug}/${accountSlug}`,
        icon: LayoutDashboardIcon,
      },
      {
        title: "History",
        url: `/${orgSlug}/${accountSlug}/history`,
        icon: HistoryIcon,
      },
      {
        title: "Target List",
        url: `/${orgSlug}/${accountSlug}/target-list`,
        icon: UsersRoundIcon,
      },
      {
        title: "Personas",
        url: `/${orgSlug}/${accountSlug}/personas`,
        icon: UsersIcon,
      },
    ];
  }, [orgSlug, accountSlug, isInsideAccount]);

  const orgItems = useMemo(
    () => [
      {
        title: "Accounts",
        url: `/${orgSlug}/accounts`,
        icon: UserRoundIcon,
      },
      {
        title: "Earn Premium",
        url: `/${orgSlug}/earn-premium`,
        icon: GiftIcon,
      },
      {
        title: "Subscription",
        url: `/${orgSlug}/settings`,
        icon: SettingsIcon,
      },
    ],
    [orgSlug],
  );

  return (
    <Sidebar collapsible="icon" className="relative">
      {/* Toggle button on sidebar edge */}
      <SidebarToggleButton />

      {/* Organization Switcher - select which workspace/org to work in */}
      <div className="flex flex-col border-b p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-1">
        <OrganizationSwitcher
          hidePersonal={false}
          afterCreateOrganizationUrl="/{slug}/accounts"
          afterSelectOrganizationUrl="/{slug}/accounts"
          afterSelectPersonalUrl="/{slug}/accounts"
          appearance={{
            elements: {
              rootBox: "w-full group-data-[collapsible=icon]:w-auto",
              organizationSwitcherTrigger:
                "w-full justify-start group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center",
              organizationSwitcherTriggerIcon:
                "group-data-[collapsible=icon]:hidden",
              organizationPreviewTextContainer:
                "group-data-[collapsible=icon]:hidden",
            },
          }}
        />
      </div>

      {/* LinkedIn Account Switcher - select which LinkedIn account within the org */}
      <AccountSwitcher />

      <SidebarContent>
        {isInsideAccount ? (
          <>
            {/* Account-level navigation */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {accountItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
                          <item.icon />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Back to org link */}
            <SidebarGroup className="mt-auto">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link
                        href={`/${orgSlug}/accounts`}
                        className="text-muted-foreground"
                      >
                        <ArrowLeftIcon />
                        <span>Organization Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          /* Organization-level navigation (when not inside an account) */
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {orgItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {/* Hover-to-open toggle setting */}
        <HoverOpenToggle />

        {/* Separator - hidden when collapsed */}
        <div className="border-t group-data-[collapsible=icon]:hidden" />

        {/* User profile */}
        <SidebarMenu className="mb-2 ml-0 group-data-[state=expanded]:ml-2">
          <SidebarMenuItem>
            <UserButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
