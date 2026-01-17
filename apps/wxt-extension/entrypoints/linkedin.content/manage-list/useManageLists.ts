import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "@sassy/ui/toast";

import { useTRPC } from "../../../lib/trpc/client";
import { useSavedProfileStore } from "../save-profile/saved-profile-store";

/**
 * Hook that manages all list-related state, queries, and mutations.
 * Handles optimistic updates, cache management, and fast profile switching.
 */
export function useManageLists() {
  const { selectedProfile } = useSavedProfileStore();
  const linkedinUrl = selectedProfile?.profileUrl;

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // UI state
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Track pending list creation promises so we can await them before saving
  const pendingListCreations = React.useRef<Promise<unknown>[]>([]);

  // Track temp→real ID mapping (updated synchronously in onSuccess)
  // This solves the stale closure problem where React state updates are async
  const tempToRealIdMap = React.useRef<Map<string, string>>(new Map());

  // Local state for selected list IDs (toggled by user)
  const [selectedListIds, setSelectedListIds] = React.useState<Set<string>>(
    new Set(),
  );
  // Track initial state to compute diff on close
  const [initialListIds, setInitialListIds] = React.useState<Set<string>>(
    new Set(),
  );

  // Query key for cache updates
  const queryKey = trpc.targetList.findListsWithProfileStatus.queryKey({
    linkedinUrl: linkedinUrl ?? "",
  });

  // Query lists data (prefetched in useSaveProfileButtons for instant popover open)
  const { data: listsData, isLoading: isLoadingLists } = useQuery(
    trpc.targetList.findListsWithProfileStatus.queryOptions(
      { linkedinUrl: linkedinUrl ?? "" },
      {
        enabled: !!linkedinUrl,
        // Keep data fresh for 30s so re-opening popover is instant
        staleTime: 30 * 1000,
      },
    ),
  );

  // Update profile lists mutation (batch save on popover close)
  const updateProfileLists = useMutation(
    trpc.targetList.updateProfileLists.mutationOptions({
      // Capture values at mutation time (before user might switch profiles)
      onMutate: (variables) => {
        const capturedQueryKey =
          trpc.targetList.findListsWithProfileStatus.queryKey({
            linkedinUrl: variables.linkedinUrl,
          });
        // Filter out temp IDs in case of race with addList
        const capturedListIds = [...selectedListIds].filter(
          (id) => !id.startsWith("temp-"),
        );
        return { capturedQueryKey, capturedListIds };
      },
      onSuccess: (_data, _variables, context) => {
        if (!context) return;

        // Update initial state
        setInitialListIds(new Set(context.capturedListIds));

        // Update cache for the correct profile (using captured query key)
        queryClient.setQueryData(
          context.capturedQueryKey,
          (old: typeof listsData) => {
            if (!old || !old.lists) return old;
            return {
              ...old,
              listIdsWithProfile: context.capturedListIds,
            };
          },
        );
      },
      onError: () => {
        toast.error("Failed to save list changes", {
          description: "Please try again.",
        });
      },
    }),
  );

  // Create new list mutation with instant optimistic update
  const addList = useMutation(
    trpc.targetList.addList.mutationOptions({
      // Called BEFORE the mutation - update UI instantly
      onMutate: async (variables) => {
        // Capture queryKey at mutation time (before profile might switch)
        const capturedQueryKey = queryKey;

        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: capturedQueryKey });

        // Snapshot previous value for rollback
        const previousData = queryClient.getQueryData(capturedQueryKey);

        // Generate temp ID
        const tempId = `temp-${Date.now()}`;

        // Optimistically add the new list to cache
        queryClient.setQueryData(capturedQueryKey, (old: typeof listsData) => {
          if (!old || !old.lists) return old;
          const now = new Date();
          return {
            ...old,
            lists: [
              {
                id: tempId,
                name: variables.name,
                createdAt: now,
                updatedAt: now,
                accountId: "",
                status: "COMPLETED" as const,
              },
              ...old.lists,
            ],
          };
        });

        // Optimistically select the new list
        setSelectedListIds((prev) => new Set([...prev, tempId]));

        // Return context for rollback and ID swap
        return { previousData, tempId, capturedQueryKey };
      },
      // On success, swap temp ID with real ID
      onSuccess: (data, _variables, context) => {
        if (!context || !data.id) return;

        // Store mapping synchronously (before React state updates)
        // This is critical for handleOpenChange to resolve IDs correctly
        tempToRealIdMap.current.set(context.tempId, data.id);

        // Update cache: replace temp ID with real ID (using captured key)
        queryClient.setQueryData(
          context.capturedQueryKey,
          (old: typeof listsData) => {
            if (!old || !old.lists) return old;
            return {
              ...old,
              lists: old.lists.map((list) =>
                list.id === context.tempId ? { ...list, id: data.id! } : list,
              ),
            };
          },
        );

        // Update selectedListIds: swap temp for real
        setSelectedListIds((prev) => {
          const next = new Set(prev);
          next.delete(context.tempId);
          next.add(data.id!);
          return next;
        });
      },
      // On error, rollback to previous state
      onError: (_err, _variables, context) => {
        if (!context) return;

        // Restore previous cache data (using captured key)
        queryClient.setQueryData(
          context.capturedQueryKey,
          context.previousData,
        );

        // Remove temp ID from selection
        setSelectedListIds((prev) => {
          const next = new Set(prev);
          next.delete(context.tempId);
          return next;
        });
      },
    }),
  );

  // Track which profile we've synced state for (avoid re-syncing on cache updates from our own mutations)
  const lastSyncedUrl = React.useRef<string | null>(null);

  // Sync local state only when profile changes or initial data loads
  // Don't re-sync when our mutations update the cache (would overwrite pending user changes)
  React.useEffect(() => {
    if (!listsData?.listIdsWithProfile || !linkedinUrl) return;

    // Only sync once per profile, not on every cache update
    if (linkedinUrl === lastSyncedUrl.current) return;

    const ids = new Set(listsData.listIdsWithProfile);
    setSelectedListIds(ids);
    setInitialListIds(ids);
    lastSyncedUrl.current = linkedinUrl;
  }, [listsData?.listIdsWithProfile, linkedinUrl]);

  // Handle popover close - save changes
  const handleOpenChange = async (isOpen: boolean) => {
    if (!isOpen && linkedinUrl) {
      // Wait for any pending list creations to complete
      if (pendingListCreations.current.length > 0) {
        await Promise.allSettled(pendingListCreations.current);
        pendingListCreations.current = [];
      }

      // Resolve temp IDs to real IDs using the mapping
      // (React state might still have temp IDs due to async state updates)
      const resolveId = (id: string) => tempToRealIdMap.current.get(id) ?? id;
      const resolvedSelectedIds = [...selectedListIds].map(resolveId);

      // Compute diff with resolved IDs
      const addToListIds = resolvedSelectedIds.filter(
        (id) => !initialListIds.has(id),
      );
      const removeFromListIds = [...initialListIds].filter(
        (id) => !resolvedSelectedIds.includes(id),
      );

      // Clear the mapping after use
      tempToRealIdMap.current.clear();

      // Only call API if there are changes
      if (addToListIds.length > 0 || removeFromListIds.length > 0) {
        updateProfileLists.mutate({
          linkedinUrl,
          addToListIds,
          removeFromListIds,
          // Pass profile data for quick display in target list UI
          profileData: selectedProfile
            ? {
                name: selectedProfile.name,
                profileSlug: selectedProfile.profileSlug,
                profileUrn: selectedProfile.profileUrn,
                headline: selectedProfile.headline,
                photoUrl: selectedProfile.photoUrl,
              }
            : undefined,
        });
      }
    }

    // Reset search on close
    if (!isOpen) {
      setSearchValue("");
    }

    setOpen(isOpen);
  };

  const handleToggleList = (listId: string) => {
    setSelectedListIds((prev) => {
      const next = new Set(prev);
      if (next.has(listId)) {
        next.delete(listId);
      } else {
        next.add(listId);
      }
      return next;
    });
  };

  const handleCreateList = () => {
    if (!searchValue.trim()) return;

    // Use mutateAsync and track the promise so we can await it before saving
    const promise = addList.mutateAsync({ name: searchValue.trim() });
    pendingListCreations.current.push(promise);

    // Clean up promise from tracking when it completes
    void promise.finally(() => {
      pendingListCreations.current = pendingListCreations.current.filter(
        (p) => p !== promise,
      );
    });

    setSearchValue("");
  };

  // Derived state
  const lists = listsData?.lists ?? [];
  const filteredLists = lists.filter((list) =>
    list.name.toLowerCase().includes(searchValue.toLowerCase()),
  );
  const exactMatchExists = lists.some(
    (list) => list.name.toLowerCase() === searchValue.toLowerCase(),
  );
  const isCreating = addList.isPending;

  return {
    // Profile
    linkedinUrl,

    // Popover state
    open,
    handleOpenChange,

    // Search
    searchValue,
    setSearchValue,

    // Lists data
    lists,
    filteredLists,
    isLoadingLists,
    exactMatchExists,

    // Selection
    selectedListIds,
    handleToggleList,

    // Create list
    handleCreateList,
    isCreating,
  };
}
