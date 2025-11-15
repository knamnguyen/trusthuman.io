import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@sassy/ui/sidebar";

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
        <main className="flex flex-1 flex-col">
          <div className="px-2 py-1.5">
            <SidebarTrigger className="size-5" />
          </div>
          <div className="flex-1 px-2">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
