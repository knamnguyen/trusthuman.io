import { env } from "~/env";
import { prefetch, trpc } from "~/trpc/server";

async function Page() {
  if (env.NODE_ENV === "production") {
    // TODO: prefetch stuff here
    await Promise.all([
      prefetch(trpc.autocomment.listCommentStyles.infiniteQueryOptions({})),
    ]);
  }

  return (
    <div>
      <TargetLists />
    </div>
  );
}

export default Page;
