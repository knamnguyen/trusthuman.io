"use client";

import { useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { toast } from "@sassy/ui/toast";

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

  const [selectedRun, setSelectedRun] = useState<{
    liveUrl: string;
    id: string;
  } | null>(null);

  const queryClient = useQueryClient();

  const stopSession = useMutation(
    trpc.autocomment.stop.mutationOptions({
      onSuccess(data) {
        if (data.status === "error") {
          toast.error(`Error stopping autocommenting: ${data.message}`);
          return;
        }

        toast.success("Autocommenting stopped successfully");
        queryClient.invalidateQueries({
          queryKey: trpc.autocomment.runs.infiniteQueryKey(),
        });
      },
    }),
  );

  const runs = useMemo(() => {
    return query.data?.pages.flatMap((page) => page.data) ?? [];
  }, [query.data]);

  return (
    <>
      <BrowserLiveviewDialog
        open={selectedRun !== null}
        onClose={() => {
          setSelectedRun(null);
        }}
        liveUrl={selectedRun?.liveUrl ?? null}
      />
      <div className="space-y-4">
        {runs.length > 0 ? (
          runs.map((run) => (
            <div key={run.id}>
              <h3>Run ID: {run.id}</h3>
              <p>Started At: {new Date(run.startedAt).toLocaleString()}</p>
              <p>Status: {run.status}</p>
              <button onClick={() => setSelectedRun(run)}>View session</button>
              <button
                onClick={() => stopSession.mutate({ autoCommentRunId: run.id })}
              >
                Stop session
              </button>
            </div>
          ))
        ) : (
          <div>No autocomment runs yet</div>
        )}
      </div>
    </>
  );
}
