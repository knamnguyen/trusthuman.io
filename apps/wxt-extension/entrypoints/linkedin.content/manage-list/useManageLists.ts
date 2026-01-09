import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@sassy/ui/toast";

import { useTRPC } from "../../../lib/trpc/client";
import { useSavedProfileStore } from "../stores/saved-profile-store";

const ALL_LIST_NAME = "All";

/**
 * Hook that manages all list-related state, queries, and mutations.
 * Handles optimistic updates, cache management, and fast profile switching.
 * Automatically adds profiles to "All" list when selected.
 */
export function useManageLists() {
  const { selectedProfile } = useSavedProfileStore();
  const linkedinUrl = selectedProfile?.linkedinUrl;

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // UI state
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  // Track which URLs we've already auto-added to "All" list (avoid duplicate calls)
  const processedUrls = React.useRef<Set<string>>(new Set());

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

  // Query lists data (prefetched in SaveProfileButton for instant popover open)
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
            if (!old) return old;
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
          if (!old) return old;
          const now = new Date();
          return {
            ...old,
            lists: [
              {
                id: tempId,
                name: variables.name,
                createdAt: now,
                updatedAt: now,
                userId: "", // Placeholder, will be replaced on success
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
        if (!context) return;

        // Update cache: replace temp ID with real ID (using captured key)
        queryClient.setQueryData(
          context.capturedQueryKey,
          (old: typeof listsData) => {
            if (!old) return old;
            return {
              ...old,
              lists: old.lists.map((list) =>
                list.id === context.tempId ? { ...list, id: data.id } : list,
              ),
            };
          },
        );

        // Update selectedListIds: swap temp for real
        setSelectedListIds((prev) => {
          const next = new Set(prev);
          next.delete(context.tempId);
          next.add(data.id);
          return next;
        });
      },
      // On error, rollback to previous state
      onError: (_err, _variables, context) => {
        if (!context) return;

        // Restore previous cache data (using captured key)
        queryClient.setQueryData(context.capturedQueryKey, context.previousData);

        // Remove temp ID from selection
        setSelectedListIds((prev) => {
          const next = new Set(prev);
          next.delete(context.tempId);
          return next;
        });
      },
    }),
  );

  // Auto-add profile to "All" list mutation with optimistic update
  const ensureProfileInAllList = useMutation(
    trpc.targetList.ensureProfileInAllList.mutationOptions({
      onMutate: async (variables) => {
        // Capture query key at mutation time
        const capturedQueryKey =
          trpc.targetList.findListsWithProfileStatus.queryKey({
            linkedinUrl: variables.linkedinUrl,
          });

        // Snapshot previous value for rollback
        const previousData = queryClient.getQueryData(capturedQueryKey);

        // If no cache exists, skip optimistic update - let the query fetch real data
        // DON'T cancel queries here - we want the initial fetch to complete
        if (!previousData) {
          return { previousData: null, tempListId: null, capturedQueryKey };
        }

        // Only cancel queries when we have existing cache and want to do optimistic update
        await queryClient.cancelQueries({ queryKey: capturedQueryKey });

        // Generate temp ID for optimistic "All" list
        const tempListId = `temp-all-${Date.now()}`;
        const now = new Date();

        // Optimistically update cache (only when we have existing cache)
        let allListId: string | null = null;
        queryClient.setQueryData(capturedQueryKey, (old: typeof listsData) => {
          if (!old) return old;

          // Check if "All" list already exists
          const existingAllList = old.lists.find(
            (l) => l.name === ALL_LIST_NAME,
          );

          if (existingAllList) {
            allListId = existingAllList.id;
            // "All" list exists - just add to listIdsWithProfile if not already there
            const alreadyInList = old.listIdsWithProfile.includes(
              existingAllList.id,
            );
            if (alreadyInList) {
              return old; // No change needed
            }
            return {
              ...old,
              listIdsWithProfile: [
                existingAllList.id,
                ...old.listIdsWithProfile,
              ],
            };
          }

          // "All" list doesn't exist - add it optimistically
          allListId = tempListId;
          return {
            lists: [
              {
                id: tempListId,
                name: ALL_LIST_NAME,
                createdAt: now,
                updatedAt: now,
                userId: "",
              },
              ...old.lists,
            ],
            listIdsWithProfile: [tempListId, ...old.listIdsWithProfile],
          };
        });

        // Also optimistically update selectedListIds and initialListIds
        if (allListId) {
          setSelectedListIds((prev) => {
            if (prev.has(allListId!)) return prev;
            return new Set([allListId!, ...prev]);
          });
          setInitialListIds((prev) => {
            if (prev.has(allListId!)) return prev;
            return new Set([allListId!, ...prev]);
          });
        }

        return { previousData, tempListId, capturedQueryKey, allListId };
      },

      onSuccess: (data, _variables, context) => {
        if (!context) return;

        // If we skipped optimistic update (no previous cache), invalidate to ensure fresh data
        if (!context.tempListId) {
          void queryClient.invalidateQueries({
            queryKey: context.capturedQueryKey,
          });
          return;
        }

        // Update cache with real list data from server
        queryClient.setQueryData(
          context.capturedQueryKey,
          (old: typeof listsData) => {
            if (!old) return old;

            // Replace temp list with real list data
            const updatedLists = old.lists.map((list) =>
              list.id === context.tempListId ? data.list : list,
            );

            // If temp list wasn't in the array (list already existed), ensure real list is there
            if (!old.lists.some((l) => l.id === context.tempListId)) {
              const hasRealList = updatedLists.some(
                (l) => l.id === data.list.id,
              );
              if (!hasRealList) {
                updatedLists.unshift(data.list);
              }
            }

            // Update listIdsWithProfile: replace temp ID with real ID
            let updatedListIds = old.listIdsWithProfile.map((id) =>
              id === context.tempListId ? data.list.id : id,
            );

            // Ensure real list ID is in the array
            if (!updatedListIds.includes(data.list.id)) {
              updatedListIds = [data.list.id, ...updatedListIds];
            }

            return {
              lists: updatedLists,
              listIdsWithProfile: updatedListIds,
            };
          },
        );

        // Also swap temp ID with real ID in selectedListIds and initialListIds
        const tempId = context.tempListId;
        if (context.allListId === tempId && tempId) {
          setSelectedListIds((prev) => {
            if (!prev.has(tempId)) return prev;
            const next = new Set(prev);
            next.delete(tempId);
            next.add(data.list.id);
            return next;
          });
          setInitialListIds((prev) => {
            if (!prev.has(tempId)) return prev;
            const next = new Set(prev);
            next.delete(tempId);
            next.add(data.list.id);
            return next;
          });
        }
      },

      onError: (_err, _variables, context) => {
        if (!context?.previousData) return;

        // Rollback to previous state
        queryClient.setQueryData(context.capturedQueryKey, context.previousData);
      },
    }),
  );

  // Auto-add profile to "All" list when selectedProfile changes
  // Wait for query to have data first so we can do optimistic updates
  React.useEffect(() => {
    if (!linkedinUrl) return;
    if (!listsData) return; // Wait for query to complete first

    // Skip if we've already processed this URL in this session
    if (processedUrls.current.has(linkedinUrl)) return;

    // Mark as processed to avoid duplicate calls
    processedUrls.current.add(linkedinUrl);

    // Trigger mutation (now cache exists, so optimistic update will work)
    ensureProfileInAllList.mutate({ linkedinUrl });
  }, [linkedinUrl, listsData, ensureProfileInAllList]);

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
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && linkedinUrl) {
      // Compute diff
      const addToListIds = [...selectedListIds].filter(
        (id) => !initialListIds.has(id),
      );
      const removeFromListIds = [...initialListIds].filter(
        (id) => !selectedListIds.has(id),
      );

      // Only call API if there are changes
      if (addToListIds.length > 0 || removeFromListIds.length > 0) {
        updateProfileLists.mutate({
          linkedinUrl,
          addToListIds,
          removeFromListIds,
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

    addList.mutate({ name: searchValue.trim() });
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
