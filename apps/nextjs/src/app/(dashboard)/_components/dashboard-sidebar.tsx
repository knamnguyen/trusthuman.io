"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { useSuspenseQuery } from "@tanstack/react-query";
import {
  BanIcon,
  BotIcon,
  ChevronRight,
  UserIcon,
  UsersRoundIcon,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@sassy/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@sassy/ui/sidebar";

import { useTRPC } from "~/trpc/react";
import { AccountSwitcher } from "./account-switcher";

// Menu items.
const items = [
  {
    title: "Autocommenting",
    url: "#",
    icon: BotIcon,
    defaultOpen: true,
    children: [
      {
        title: "Runs",
        url: "/autocomment",
      },
      {
        title: "Configure",
        url: "/autocomment/config",
      },
      {
        title: "Comment Styles",
        url: "/autocomment/comment-style",
      },
    ],
  },
  {
    title: "Accounts",
    url: "/seats",
    icon: UserIcon,
    children: [
      {
        title: "All accounts",
        url: "/seats",
      },
      {
        title: "Add account",
        url: "/seats/new",
      },
    ],
  },
  {
    title: "Target Lists",
    url: "/target-list",
    icon: UsersRoundIcon,
  },
  {
    title: "Blacklist",
    url: "/blacklist",
    icon: BanIcon,
  },
];

export function DashboardSidebar() {
  const trpc = useTRPC();
  const me = useSuspenseQuery(trpc.user.me.queryOptions());

  return (
    <Sidebar collapsible="icon">
      <AccountSwitcher />
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Profiles</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) =>
                item.children !== undefined ? (
                  <Collapsible
                    key={item.title}
                    asChild
                    defaultOpen={item.defaultOpen}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <item.icon />
                          <span className="font-medium">{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.children.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link href={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url}>
                        <item.icon />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu className="mb-2 ml-0 group-data-[state=expanded]:ml-2">
          <SidebarMenuItem className="flex items-center gap-2">
            <UserButton />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">
                {me.data.firstName ?? me.data.primaryEmailAddress}
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
