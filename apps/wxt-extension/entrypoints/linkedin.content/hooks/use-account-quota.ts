import { useTRPC } from "@/lib/trpc/client";
import { useQuery } from "@tanstack/react-query";

import { useAccountStore } from "../stores";

export function useAccountQuota() {
  const trpc = useTRPC();

  const account = useAccountStore((state) => state.matchingAccount);

  const quota = useQuery(trpc.aiComments.quota.queryOptions());

  useEffect(() => {
    // TODO: refetch/invalidate a whole lot of other things too when accoun changes
    void quota.refetch();
    // we need to refetch quota when account changes
  }, [account?.id]);

  return quota;
}
