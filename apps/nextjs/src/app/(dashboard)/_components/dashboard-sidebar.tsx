"use client";

import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HistoryIcon,
  SettingsIcon,
  UsersIcon,
  UsersRoundIcon,
  UserIcon,
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

import { useTRPC } from "~/trpc/react";
import { AccountSwitcher } from "./account-switcher";

// Menu items.
const items = [
  {
    title: "History",
    url: "/history",
    icon: HistoryIcon,
  },
  {
    title: "Target list",
    url: "/target-list",
    icon: UsersRoundIcon,
  },
  {
    title: "Personas",
    url: "/personas",
    icon: UsersIcon,
  },
  {
    title: "Run Settings",
    url: "/run-settings",
    icon: SettingsIcon,
  },
  {
    title: "Accounts",
    url: "/org-accounts",
    icon: UserIcon,
  },
];

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
        className="text-xs font-normal text-muted-foreground"
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
    <div className="absolute -right-3 top-1/2 z-20 -translate-y-1/2">
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
  const trpc = useTRPC();
  const me = useQuery(trpc.user.me.queryOptions());

  return (
    <Sidebar collapsible="icon" className="relative">
      {/* Toggle button on sidebar edge */}
      <SidebarToggleButton />

      {/* Organization Switcher - select which workspace/org to work in */}
      <div className="flex flex-col border-b p-2 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-1">
        <OrganizationSwitcher
          hidePersonal={false}
          afterCreateOrganizationUrl="/seats"
          afterSelectOrganizationUrl="/seats"
          afterSelectPersonalUrl="/seats"
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
        <SidebarGroup>
          {/* <SidebarGroupLabel>Profiles</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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
          <SidebarMenuItem className="flex items-center gap-2">
            <UserButton />
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">
                {me.data?.firstName ?? me.data?.primaryEmailAddress}
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
