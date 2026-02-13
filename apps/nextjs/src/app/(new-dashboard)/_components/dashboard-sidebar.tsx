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
  SearchIcon,
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

  let prefix = `/${orgSlug}`;

  if (accountSlug !== undefined) {
    prefix += `/${accountSlug}`;
  }

  const sharedItems = useMemo(() => {
    return [
      {
        title: "Accounts",
        url: `${prefix}/accounts`,
        icon: UserRoundIcon,
      },
      {
        title: "Earn Premium",
        url: `${prefix}/earn-premium`,
        icon: GiftIcon,
      },
      {
        title: "Subscription",
        url: `${prefix}/settings`,
        icon: SettingsIcon,
      },
    ];
  }, [orgSlug, accountSlug, prefix]);

  const accountItems = useMemo(() => {
    let prefix = `/${orgSlug}`;

    if (accountSlug !== undefined) {
      prefix += `/${accountSlug}`;
    }

    const items = [];

    if (accountSlug !== undefined) {
      items.push();
    }

    return [
      {
        title: "Dashboard",
        url: `${prefix}`,
        icon: LayoutDashboardIcon,
      },
      {
        title: "History",
        url: `${prefix}/history`,
        icon: HistoryIcon,
      },
      {
        title: "Target List",
        url: `${prefix}/target-list`,
        icon: UsersRoundIcon,
      },
      {
        title: "Discovery Sets",
        url: `${prefix}/discovery-sets`,
        icon: SearchIcon,
      },
      {
        title: "Personas",
        url: `${prefix}/personas`,
        icon: UsersIcon,
      },
    ];
  }, [orgSlug, accountSlug, prefix]);

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
        {/* Account-level navigation */}
        {accountSlug !== undefined && (
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
        )}

        {/* Shared navigation items */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sharedItems.map((item) => (
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
