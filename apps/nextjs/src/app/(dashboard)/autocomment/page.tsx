"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircleIcon } from "lucide-react";

import { Button } from "@sassy/ui/button";
import { toast } from "@sassy/ui/toast";

import { useCurrentLinkedInAccountId } from "~/hooks/use-current-linkedin-account-id";
import { useTRPC } from "~/trpc/react";
import { AutoCommentRunsList } from "./_components/autocomment-runs-list";

export function AutoCommentPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const autocomment = useMutation(
    trpc.autocomment.start.mutationOptions({
      onSuccess(data) {
        if (data.status === "success") {
          // can optimize this nextime to just add the new run to the front of the the list
          // for now just invalidate the whole list cause aint got time for that
          void queryClient.invalidateQueries({
            queryKey: trpc.autocomment.runs.infiniteQueryKey(),
          });
        }
      },
      onError(error) {
        toast.error(`Error starting autocommenting: ${error.message}`);
      },
    }),
  );

  const { accountId } = useCurrentLinkedInAccountId();

  const account = useQuery(
    trpc.account.get.queryOptions({ id: accountId ?? "" }),
  );

  if (accountId === null) {
    return (
      <div>
        Please select or <Link href="/seats/new">register an account</Link> to
        start autocommenting.
      </div>
    );
  }

  const startAutoCommenting = async (accountId: string) => {
    const result = await autocomment.mutateAsync({ accountId });
    if (result.status === "error") {
      toast.error(`Error starting autocommenting: ${result.message}`);
      return;
    }
    toast.success("Autocommenting started successfully");
  };

  return (
    <div className="px-4">
      <div className="flex justify-between py-2">
        <div className="text-lg font-semibold">Auto commenting runs</div>
        <div>
          {account.data && account.data.isRunning && (
            <span className="text-xs text-gray-500">
              Autocommenting is currently running
            </span>
          )}
          <Button
            disabled={!account.data || account.data.isRunning}
            onClick={() => startAutoCommenting(accountId)}
          >
            {autocomment.isPending ? (
              <LoaderCircleIcon className="size-4 animate-spin" />
            ) : (
              "Start new session"
            )}
          </Button>
        </div>
      </div>
      <AutoCommentRunsList />
    </div>
  );
}

export default AutoCommentPage;
