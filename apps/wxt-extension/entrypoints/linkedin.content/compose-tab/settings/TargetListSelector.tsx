"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Loader2 } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@sassy/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@sassy/ui/popover";
import { cn } from "@sassy/ui/utils";

import { useTRPC } from "../../../../lib/trpc/client";
import { useShadowRootStore } from "../../stores";
import { useSettingsDBStore } from "../../stores/settings-db-store";
import { prefetchUrnsForLists } from "../../stores/target-list-queue";

// Default for when settings haven't loaded yet
const DEFAULT_TARGET_LIST_IDS: string[] = [];

/**
 * Target list selector for settings.
 * Shows a dropdown with search to select multiple target lists.
 * Selected lists appear at the top for easy viewing.
 *
 * Multi-select with batched updates:
 * - Clicking items toggles local selection state (no API calls)
 * - When popover closes, changes are committed to DB
 */
export function TargetListSelector() {
  const shadowRoot = useShadowRootStore((s) => s.shadowRoot);
  const trpc = useTRPC();

  // UI state
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // DB Settings store
  const postLoad = useSettingsDBStore((s) => s.postLoad);
  const isLoaded = useSettingsDBStore((s) => s.isLoaded);
  const updatePostLoad = useSettingsDBStore((s) => s.updatePostLoad);

  // Get saved target list IDs from DB (or default if not loaded)
  const savedTargetListIds = postLoad?.targetListIds ?? DEFAULT_TARGET_LIST_IDS;

  // Local state for pending selections (only used while popover is open)
  const [pendingSelections, setPendingSelections] = useState<string[]>([]);

  // Sync local state with saved state when popover opens
  useEffect(() => {
    if (open) {
      setPendingSelections(savedTargetListIds);
    }
  }, [open, savedTargetListIds]);

  // Fetch all user's target lists
  const { data: listsData, isLoading: isLoadingLists } = useQuery(
    trpc.targetList.findLists.queryOptions(
      { cursor: undefined },
      {
        staleTime: 30 * 1000,
      }
    )
  );

  const lists = listsData?.data ?? [];

  // Filter lists by search and move selected to top
  const sortedFilteredLists = useMemo(() => {
    const filtered = lists.filter((list) =>
      list.name.toLowerCase().includes(searchValue.toLowerCase())
    );

    // Move selected lists to the top
    if (pendingSelections.length > 0) {
      const selected: typeof filtered = [];
      const notSelected: typeof filtered = [];

      filtered.forEach((list) => {
        if (pendingSelections.includes(list.id)) {
          selected.push(list);
        } else {
          notSelected.push(list);
        }
      });

      return [...selected, ...notSelected];
    }

    return filtered;
  }, [lists, searchValue, pendingSelections]);

  // Get display text for button
  const getDisplayText = () => {
    if (savedTargetListIds.length === 0) {
      return "Select target lists...";
    }
    if (savedTargetListIds.length === 1) {
      const list = lists.find((l) => l.id === savedTargetListIds[0]);
      return list?.name ?? "1 list selected";
    }
    return `${savedTargetListIds.length} lists selected`;
  };

  // Toggle a list in local selection (no API call)
  const handleToggleList = (listId: string) => {
    setPendingSelections((prev) => {
      if (prev.includes(listId)) {
        return prev.filter((id) => id !== listId);
      }
      return [...prev, listId];
    });
  };

  // Commit changes to DB when popover closes
  const handleOpenChange = async (newOpen: boolean) => {
    if (!newOpen && open) {
      // Popover is closing - check if selections changed
      const hasChanges =
        pendingSelections.length !== savedTargetListIds.length ||
        pendingSelections.some((id) => !savedTargetListIds.includes(id));

      if (hasChanges) {
        setIsSaving(true);
        try {
          await updatePostLoad({ targetListIds: pendingSelections });
          console.log("[TargetListSelector] Saved target lists:", pendingSelections);

          // Find newly added lists (not in previous selection)
          const newlyAddedIds = pendingSelections.filter(
            (id) => !savedTargetListIds.includes(id)
          );

          // Pre-fetch URNs only for newly added lists (fire-and-forget)
          // Existing lists were already pre-fetched when settings loaded
          if (newlyAddedIds.length > 0) {
            console.log(`[TargetListSelector] Pre-fetching URNs for ${newlyAddedIds.length} newly added lists`);
            void prefetchUrnsForLists(newlyAddedIds);
          }
        } catch (error) {
          console.error("[TargetListSelector] Failed to save:", error);
          // Revert local state on error
          setPendingSelections(savedTargetListIds);
        } finally {
          setIsSaving(false);
        }
      }
      // No changes = no pre-fetch needed (already cached from settings load)
    }
    setOpen(newOpen);
  };

  // Show loading if settings haven't loaded yet
  const isLoading = !isLoaded || isLoadingLists;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="truncate">Saving...</span>
            </>
          ) : (
            <>
              <span className="truncate">{getDisplayText()}</span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="z-[10000] w-[280px] p-0"
        align="start"
        container={shadowRoot}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search lists..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}

            {/* Empty state when no lists */}
            {!isLoading && lists.length === 0 && (
              <CommandEmpty>
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No target lists yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create lists from profile pages.
                  </p>
                </div>
              </CommandEmpty>
            )}

            {/* No search results */}
            {!isLoading &&
              lists.length > 0 &&
              sortedFilteredLists.length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No matching lists found.
                </div>
              )}

            {/* Lists - multi-select */}
            {!isLoading && sortedFilteredLists.length > 0 && (
              <CommandGroup>
                {sortedFilteredLists.map((list) => {
                  const isSelected = pendingSelections.includes(list.id);
                  return (
                    <CommandItem
                      key={list.id}
                      value={list.name}
                      onSelect={() => handleToggleList(list.id)}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded border",
                          isSelected
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-gray-300"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span className="truncate">{list.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
