import { Button } from "@sassy/ui/button";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { AutoCommentRunsList } from "./_components/autocomment-runs-list";
import { StartAutoCommentModal } from "./_components/start-autocomment-modal";

export async function AutoCommentPage() {
  await prefetch(trpc.autocomment.runs.infiniteQueryOptions());

  return (
    <HydrateClient>
      <StartAutoCommentModal trigger={<Button>Start Auto Commenting</Button>} />
      <AutoCommentRunsList />
    </HydrateClient>
  );
}

export default AutoCommentPage;
