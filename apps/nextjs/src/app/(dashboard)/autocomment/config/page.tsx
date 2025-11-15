import { env } from "~/env";
import { prefetch, trpc } from "~/trpc/server";
import { AutoCommentConfigurationForm } from "../_components/autocomment-configuration-form";

export async function AutoCommentConfigurationPage() {
  if (env.NODE_ENV === "production") {
    // prefetch only in prod, cause in dev hot reload is really slow with this
    await Promise.all([
      prefetch(trpc.autocomment.runs.infiniteQueryOptions()),
      prefetch(trpc.user.listLinkedInAccounts.infiniteQueryOptions()),
    ]);
  }

  return (
    <div className="px-4">
      <div className="mb-5 text-lg font-semibold">
        Auto commenting configuration
      </div>
      {/* <StartAutoCommentModal */}
      {/*   trigger={<Button variant="outline">Start Auto Commenting</Button>} */}
      {/* /> */}
      <AutoCommentConfigurationForm />
    </div>
  );
}

export default AutoCommentConfigurationPage;
