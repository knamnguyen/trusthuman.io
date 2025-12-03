import { env } from "~/env";
import { prefetch, trpc } from "~/trpc/server";
import { TargetLists } from "./_components/target-lists";

async function Page() {
  if (env.NODE_ENV === "production") {
    // TODO: prefetch stuff here
    await Promise.all([
      prefetch(trpc.targetList.findLists.infiniteQueryOptions({})),
    ]);
  }

  return (
    <div>
      <TargetLists />
    </div>
  );
}

export default Page;
