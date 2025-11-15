"use client";

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";

export function AutoCommentRunsList() {
  const trpc = useTRPC();
  const query = useInfiniteQuery(
    trpc.autocomment.runs.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.next,
      },
    ),
  );

  const runs = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.data) ?? [];
  }, [query.data]);

  return (
    <div className="space-y-4">
      {runs.length > 0 ? (
        runs.map((run) => (
          <div key={run.id}>
            <h3>Run ID: {run.id}</h3>
            <p>Started At: {new Date(run.startedAt).toLocaleString()}</p>
            <p>Status: {run.status}</p>
          </div>
        ))
      ) : (
        <div>No autocomment runs yet</div>
      )}
    </div>
  );
}
