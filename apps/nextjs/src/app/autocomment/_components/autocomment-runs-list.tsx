import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { trpc } from "~/trpc/server";

export function AutoCommentRunsList() {
  const query = useInfiniteQuery(trpc.autocomment.runs.infiniteQueryOptions());

  const runs = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.data) ?? [];
  }, [query.data]);

  return (
    <div className="space-y-4">
      {runs.map((run) => (
        <div key={run.id}>
          <h3>Run ID: {run.id}</h3>
          <p>Started At: {new Date(run.startedAt).toLocaleString()}</p>
          <p>Status: {run.status}</p>
        </div>
      ))}
    </div>
  );
}
