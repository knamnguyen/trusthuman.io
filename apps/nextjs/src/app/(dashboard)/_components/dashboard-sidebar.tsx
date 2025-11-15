import Link from "next/link";
import { BanIcon, BotIcon, UserIcon, UsersRoundIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@sassy/ui/sidebar";

import { AccountSwitcher } from "./account-switcher";

// Menu items.
const items = [
  {
    title: "Autocommenting",
    url: "/autocomment",
    icon: BotIcon,
  },
  {
    title: "Accounts",
    url: "/seats",
    icon: UserIcon,
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
  return (
    <Sidebar collapsible="icon">
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
    </Sidebar>
  );
}
