"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";

export function TargetLists() {
  const trpc = useTRPC();

  const targetLists = useInfiniteQuery(
    trpc.targetList.findLists.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.next,
      },
    ),
  );

  if (targetLists.data === undefined) {
    return <div>Loading target lists...</div>;
  }

  if (targetLists.data.pages[0]?.data.length === 0) {
    return <div>No target lists found.</div>;
  }

  return (
    <div>
      <div>Target Lists:</div>
      <ul>
        {targetLists.data.pages.map((page) =>
          page.data.map((list) => <li key={list.id}>{list.name}</li>),
        )}
      </ul>
    </div>
  );
}
