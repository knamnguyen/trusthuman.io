"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { BrowserLiveviewDialog } from "~/_components/liveview-dialog";
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

  const [liveUrl, setLiveUrl] = useState(null);

  const runs = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.data) ?? [];
  }, [query.data]);

  return (
    <>
      <BrowserLiveviewDialog
        open={liveUrl !== null}
        onClose={() => {
          setLiveUrl(null);
        }}
        liveUrl={liveUrl}
      />
      <div className="space-y-4">
        {runs.length > 0 ? (
          runs.map((run) => (
            <div key={run.id}>
              <h3>Run ID: {run.id}</h3>
              <p>Started At: {new Date(run.startedAt).toLocaleString()}</p>
              <p>Status: {run.status}</p>
              <button>View session</button>
            </div>
          ))
        ) : (
          <div>No autocomment runs yet</div>
        )}
      </div>
    </>
  );
}
