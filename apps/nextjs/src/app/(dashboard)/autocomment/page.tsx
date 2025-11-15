import { env } from "~/env";
import { prefetch, trpc } from "~/trpc/server";
import { AutoCommentRunsList } from "./_components/autocomment-runs-list";

export async function AutoCommentPage() {
  if (env.NODE_ENV === "production") {
    // prefetch only in prod, cause in dev hot reload is really slow with this
    await Promise.all([
      prefetch(trpc.autocomment.runs.infiniteQueryOptions()),
      prefetch(trpc.user.listLinkedInAccounts.infiniteQueryOptions()),
    ]);
  }

  return (
    <div className="px-4">
      <AutoCommentRunsList />
    </div>
  );
}

export default AutoCommentPage;
