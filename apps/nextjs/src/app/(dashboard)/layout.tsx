import { cache } from "react";

import { SidebarInset, SidebarProvider } from "@sassy/ui/sidebar";

import { LinkedInAccountProvider } from "~/hooks/use-current-linkedin-account-id";
import { getQueryClient, HydrateClient, trpc } from "~/trpc/server";
import { DashboardSidebar } from "./_components/dashboard-sidebar";

export const getFirstAccountId = cache(async () => {
  const queryClient = getQueryClient();
  const accounts = await queryClient.ensureInfiniteQueryData(
    trpc.account.list.infiniteQueryOptions({}),
  );

  const firstAccount = accounts.pages[0]?.data[0];

  return firstAccount;
});

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(trpc.user.me.queryOptions());
  const firstAccount = await getFirstAccountId();

  return (
    <HydrateClient>
      <LinkedInAccountProvider initialAccountId={firstAccount?.id}>
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
      </LinkedInAccountProvider>
    </HydrateClient>
  );
}
