import { env } from "~/env";
import { prefetch, trpc } from "~/trpc/server";
import { BlacklistedProfileList } from "./_components/blacklist";

async function Page() {
  if (env.NODE_ENV === "production") {
    // TODO: prefetch stuff here
    await Promise.all([
      prefetch(
        trpc.blacklist.findBlacklistedProfiles.infiniteQueryOptions(
          {},
          {
            getNextPageParam: (lastPage) => lastPage.next,
          },
        ),
      ),
    ]);
  }

  return (
    <div>
      <BlacklistedProfileList />
    </div>
  );
}

export default Page;
