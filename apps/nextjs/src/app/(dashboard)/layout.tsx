import { SidebarInset, SidebarProvider } from "@sassy/ui/sidebar";

import { getQueryClient, HydrateClient, trpc } from "~/trpc/server";
import { DashboardSidebar } from "./_components/dashboard-sidebar";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(trpc.user.me.queryOptions());

  return (
    <HydrateClient>
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
          <main className="flex flex-1 flex-col">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </HydrateClient>
  );
}
