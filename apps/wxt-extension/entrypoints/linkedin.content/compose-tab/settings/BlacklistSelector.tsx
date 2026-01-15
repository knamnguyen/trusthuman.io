"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Loader2, X } from "lucide-react";

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

/**
 * Blacklist selector for settings.
 * Shows a dropdown with search to select a SINGLE target list as blacklist.
 * Selected list appears at the top for easy viewing.
 *
 * Single-select with immediate update on selection.
 */
export function BlacklistSelector() {
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

  // Get saved blacklist ID from DB
  const savedBlacklistId = postLoad?.blacklistId ?? null;

  // Fetch all user's target lists (reusing same endpoint as target list selector)
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

    // Move selected list to the top
    if (savedBlacklistId) {
      const selectedIndex = filtered.findIndex((l) => l.id === savedBlacklistId);
      if (selectedIndex > 0) {
        const [selected] = filtered.splice(selectedIndex, 1);
        if (selected) {
          filtered.unshift(selected);
        }
      }
    }

    return filtered;
  }, [lists, searchValue, savedBlacklistId]);

  // Get selected list name for display
  const selectedListName = lists.find((l) => l.id === savedBlacklistId)?.name;

  // Handle selecting a list (single-select, immediate update)
  const handleSelectList = async (listId: string) => {
    // Toggle off if clicking the same list
    const newBlacklistId = savedBlacklistId === listId ? null : listId;

    setOpen(false);
    setIsSaving(true);

    try {
      await updatePostLoad({ blacklistId: newBlacklistId });
      console.log("[BlacklistSelector] Saved blacklist:", newBlacklistId);
    } catch (error) {
      console.error("[BlacklistSelector] Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Clear selection
  const handleClear = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);

    try {
      await updatePostLoad({ blacklistId: null });
      console.log("[BlacklistSelector] Cleared blacklist");
    } catch (error) {
      console.error("[BlacklistSelector] Failed to clear:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading if settings haven't loaded yet
  const isLoading = !isLoaded || isLoadingLists;

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
              <span className="truncate">
                {selectedListName ?? "Select a blacklist..."}
              </span>
              <div className="flex items-center gap-1">
                {savedBlacklistId && (
                  <X
                    className="h-4 w-4 opacity-50 hover:opacity-100"
                    onClick={handleClear}
                  />
                )}
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </div>
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
                    No lists available.
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

            {/* Lists - single-select */}
            {!isLoading && sortedFilteredLists.length > 0 && (
              <CommandGroup>
                {sortedFilteredLists.map((list) => {
                  const isSelected = savedBlacklistId === list.id;
                  return (
                    <CommandItem
                      key={list.id}
                      value={list.name}
                      onSelect={() => handleSelectList(list.id)}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-full border",
                          isSelected
                            ? "border-red-600 bg-red-600 text-white"
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
