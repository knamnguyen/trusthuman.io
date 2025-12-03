"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";

export function CommentStyleList() {
  const trpc = useTRPC();

  const commentStyles = useInfiniteQuery(
    trpc.autocomment.listCommentStyles.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.next,
      },
    ),
  );

  if (commentStyles.data === undefined) {
    return <div>Loading comment styles...</div>;
  }

  if (commentStyles.data.pages[0]?.data.length === 0) {
    return <div>No comment styles found.</div>;
  }

  return (
    <div>
      <div>Comment Styles:</div>
      <ul>
        {commentStyles.data.pages.map((page) =>
          page.data.map((style) => <li key={style.id}>{style.name}</li>),
        )}
      </ul>
    </div>
  );
}
