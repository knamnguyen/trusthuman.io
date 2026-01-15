import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";

interface ListInfo {
  id: string;
  name: string;
}

interface UseManageListsProps {
  linkedinUrl: string;
  /** Current list memberships from the profile card */
  listMemberships: ListInfo[];
  /** All available lists (from findLists query) */
  allLists: ListInfo[];
}

/**
 * Hook for managing a profile's list memberships.
 * Uses existing data from props (instant open) and invalidates cache on save.
 */
export function useManageLists({
  linkedinUrl,
  listMemberships,
  allLists,
}: UseManageListsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // UI state
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Local state for selected list IDs
  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(
    () => new Set(listMemberships.map((m) => m.id)),
  );

  // Track initial state to compute diff on close
  const [initialListIds, setInitialListIds] = useState<Set<string>>(
    () => new Set(listMemberships.map((m) => m.id)),
  );

  // Track if popover is open to avoid syncing while user is editing
  const isOpenRef = useRef(false);

  // Track pending list creation promises so we can await them before saving
  const pendingListCreations = useRef<Promise<unknown>[]>([]);

  // Track temp→real ID mapping (updated synchronously in onSuccess)
  // This solves the stale closure problem where React state updates are async
  const tempToRealIdMap = useRef<Map<string, string>>(new Map());

  // Sync local state when listMemberships prop changes (e.g., after cache invalidation)
  // Only sync when popover is closed to avoid overwriting user's pending changes
  useEffect(() => {
    if (isOpenRef.current) return; // Don't sync while user is editing

    const newIds = new Set(listMemberships.map((m) => m.id));
    setSelectedListIds(newIds);
    setInitialListIds(newIds);
    // Using JSON.stringify for stable dependency on array content
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(listMemberships.map((m) => m.id))]);

  // Update profile lists mutation
  const updateProfileLists = useMutation(
    trpc.targetList.updateProfileLists.mutationOptions({
      onSuccess: () => {
        // Invalidate all getProfilesInList queries to refresh badges
        void queryClient.invalidateQueries({
          queryKey: [["targetList", "getProfilesInList"]],
        });

        // Also invalidate findLists in case a new list was created
        void queryClient.invalidateQueries({
          queryKey: [["targetList", "findLists"]],
        });
      },
    }),
  );

  // Create new list mutation with optimistic update
  const addList = useMutation(
    trpc.targetList.addList.mutationOptions({
      onMutate: async (variables) => {
        // Generate temp ID for instant feedback
        const tempId = `temp-${Date.now()}`;

        // Optimistically select the new list
        setSelectedListIds((prev) => new Set([...prev, tempId]));

        return { tempId, name: variables.name };
      },
      onSuccess: (data, _variables, context) => {
        if (!context || data.status !== "success") return;

        // Store mapping synchronously (before React state updates)
        // This is critical for handleOpenChange to resolve IDs correctly
        tempToRealIdMap.current.set(context.tempId, data.id);

        // Swap temp ID with real ID
        setSelectedListIds((prev) => {
          const next = new Set(prev);
          next.delete(context.tempId);
          next.add(data.id);
          return next;
        });

        // Invalidate findLists to show new list in sidebar
        void queryClient.invalidateQueries({
          queryKey: [["targetList", "findLists"]],
        });
      },
      onError: (_err, _variables, context) => {
        if (!context) return;

        // Remove temp ID on error
        setSelectedListIds((prev) => {
          const next = new Set(prev);
          next.delete(context.tempId);
          return next;
        });
      },
    }),
  );

  // Handle popover close - save changes
  const handleOpenChange = async (isOpen: boolean) => {
    isOpenRef.current = isOpen;

    if (!isOpen) {
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
        });

        // Update initial state optimistically
        setInitialListIds(new Set(resolvedSelectedIds));
      }

      // Reset search
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
  // Combine real lists with any temp lists being created
  const tempLists = [...selectedListIds]
    .filter((id) => id.startsWith("temp-"))
    .map((id) => ({
      id,
      name: addList.variables?.name ?? "Creating...",
    }));

  const combinedLists = [...allLists, ...tempLists];

  const filteredLists = combinedLists.filter((list) =>
    list.name.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const exactMatchExists = combinedLists.some(
    (list) => list.name.toLowerCase() === searchValue.toLowerCase(),
  );

  return {
    // Popover state
    open,
    handleOpenChange,

    // Search
    searchValue,
    setSearchValue,

    // Lists data
    lists: combinedLists,
    filteredLists,
    exactMatchExists,

    // Selection
    selectedListIds,
    handleToggleList,

    // Create list
    handleCreateList,
    isCreating: addList.isPending,
    isSaving: updateProfileLists.isPending,
  };
}
