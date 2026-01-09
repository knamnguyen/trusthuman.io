import { cookies } from "next/headers";

import { SidebarInset, SidebarProvider } from "@sassy/ui/sidebar";

import { DashboardSidebar } from "./_components/dashboard-sidebar";

export default async function NewDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read sidebar preferences from cookies for SSR
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  const defaultHoverOpen =
    cookieStore.get("sidebar_hover_open")?.value === "true";

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      defaultHoverOpen={defaultHoverOpen}
    >
      <DashboardSidebar />
      <SidebarInset>
        <main className="flex flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
