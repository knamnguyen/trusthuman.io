"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  SettingsIcon,
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

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: UserIcon,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: SettingsIcon,
  },
];

export function DashboardSidebar() {
  return (
    <Sidebar collapsible="icon" className="relative">
      <SidebarToggleButton />

      {/* Logo/Brand */}
      <div className="flex items-center border-b p-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold group-data-[collapsible=icon]:hidden">
            TrustHuman
          </span>
          <span className="hidden text-lg font-bold group-data-[collapsible=icon]:block">
            TH
          </span>
        </Link>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
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
        <HoverOpenToggle />
        <div className="border-t group-data-[collapsible=icon]:hidden" />
        <SidebarMenu className="mb-2 ml-0 group-data-[state=expanded]:ml-2">
          <SidebarMenuItem>
            <UserButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
