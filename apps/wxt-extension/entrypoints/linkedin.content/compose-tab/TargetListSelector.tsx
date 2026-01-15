"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

import { useTRPC } from "../../../lib/trpc/client";
import { useShadowRootStore } from "../stores";
import { useSettingsStore } from "../stores/settings-store";

/**
 * Target list selector for settings.
 * Shows a dropdown with search to select a single target list.
 * Selected list appears at the top for easy viewing.
 */
export function TargetListSelector() {
  const shadowRoot = useShadowRootStore((s) => s.shadowRoot);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // UI state
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isFetchingUrns, setIsFetchingUrns] = useState(false);

  // Settings store
  const selectedTargetListId = useSettingsStore(
    (s) => s.postLoad.selectedTargetListId
  );
  const updatePostLoad = useSettingsStore((s) => s.updatePostLoad);

  // Fetch all user's target lists
  const { data: listsData, isLoading } = useQuery(
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

    // Move selected list to the top
    if (selectedTargetListId) {
      const selectedIndex = filtered.findIndex(
        (l) => l.id === selectedTargetListId
      );
      if (selectedIndex > 0) {
        const [selected] = filtered.splice(selectedIndex, 1);
        if (selected) {
          filtered.unshift(selected);
        }
      }
    }

    return filtered;
  }, [lists, searchValue, selectedTargetListId]);

  // Get selected list name for display
  const selectedListName = lists.find(
    (l) => l.id === selectedTargetListId
  )?.name;

  const handleSelectList = async (listId: string) => {
    // Toggle off if clicking the same list
    if (selectedTargetListId === listId) {
      updatePostLoad("selectedTargetListId", null);
      updatePostLoad("selectedTargetListUrns", []);
      setOpen(false);
      return;
    }

    // Select new list and fetch URNs
    updatePostLoad("selectedTargetListId", listId);
    setOpen(false);
    setIsFetchingUrns(true);

    try {
      // Fetch profiles for the selected list (first page = up to 25)
      const profiles = await queryClient.fetchQuery(
        trpc.targetList.getProfilesInList.queryOptions({ listId })
      );

      // Extract URNs, filter out nulls, limit to 25
      const urns = profiles.data
        .map((p) => p.profileUrn)
        .filter((urn): urn is string => urn !== null && urn !== undefined)
        .slice(0, 25);

      console.log("[TargetListSelector] Fetched profiles:", profiles.data.length);
      console.log("[TargetListSelector] URNs found:", urns);

      updatePostLoad("selectedTargetListUrns", urns);
    } catch (error) {
      console.error("[TargetListSelector] Failed to fetch URNs:", error);
      updatePostLoad("selectedTargetListUrns", []);
    } finally {
      setIsFetchingUrns(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal"
          disabled={isFetchingUrns}
        >
          {isFetchingUrns ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="truncate">Loading profiles...</span>
            </>
          ) : (
            <>
              <span className="truncate">
                {selectedListName ?? "Select a target list..."}
              </span>
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

            {/* Lists */}
            {!isLoading && sortedFilteredLists.length > 0 && (
              <CommandGroup>
                {sortedFilteredLists.map((list) => {
                  const isSelected = selectedTargetListId === list.id;
                  return (
                    <CommandItem
                      key={list.id}
                      value={list.name}
                      onSelect={() => handleSelectList(list.id)}
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
