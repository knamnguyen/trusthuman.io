import { SidebarInset, SidebarProvider } from "@sassy/ui/sidebar";

import { DashboardSidebar } from "./_components/dashboard-sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <DashboardSidebar />
      <SidebarInset>
        <main className="flex flex-1 flex-col py-3">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
