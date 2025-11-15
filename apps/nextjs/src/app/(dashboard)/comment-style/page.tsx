import { env } from "~/env";
import { prefetch, trpc } from "~/trpc/server";
import { CommentStyleList } from "./_components/comment-style-list";

async function Page() {
  if (env.NODE_ENV === "production") {
    // TODO: prefetch stuff here
    await Promise.all([
      prefetch(trpc.autocomment.listCommentStyles.infiniteQueryOptions({})),
    ]);
  }

  return (
    <div>
      <CommentStyleList />
    </div>
  );
}

export default Page;
