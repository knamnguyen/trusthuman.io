"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, ExternalLink, Loader2 } from "lucide-react";

import { buildDiscoverySearchUrl } from "@sassy/linkedin-automation/navigate/build-discovery-search-url";
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

import { getTrpcClient, useTRPC } from "../../../../lib/trpc/client";
import { useShadowRootStore } from "../../stores";
import { useSettingsDBStore } from "../../stores/settings-db-store";

// Default for when settings haven't loaded yet
const DEFAULT_DISCOVERY_SET_IDS: string[] = [];

/**
 * Discovery Set selector for settings.
 * Shows a dropdown with search to select multiple discovery sets.
 * Selected sets appear at the top for easy viewing.
 * Preview button opens LinkedIn search URLs in new tabs.
 *
 * Multi-select with batched updates:
 * - Clicking items toggles local selection state (no API calls)
 * - When popover closes, changes are committed to DB
 */
export function DiscoverySetSelector() {
  const shadowRoot = useShadowRootStore((s) => s.shadowRoot);
  const trpc = useTRPC();

  // UI state
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isOpeningPreview, setIsOpeningPreview] = useState(false);

  // DB Settings store
  const postLoad = useSettingsDBStore((s) => s.postLoad);
  const isLoaded = useSettingsDBStore((s) => s.isLoaded);
  const updatePostLoad = useSettingsDBStore((s) => s.updatePostLoad);

  // Get saved discovery set IDs from DB (or default if not loaded)
  const savedDiscoverySetIds =
    postLoad?.discoverySetIds ?? DEFAULT_DISCOVERY_SET_IDS;

  // Local state for pending selections (only used while popover is open)
  const [pendingSelections, setPendingSelections] = useState<string[]>([]);

  // Sync local state with saved state when popover opens
  useEffect(() => {
    if (open) {
      setPendingSelections(savedDiscoverySetIds);
    }
  }, [open, savedDiscoverySetIds]);

  // Fetch all user's discovery sets
  const { data: setsData, isLoading: isLoadingSets } = useQuery(
    trpc.discoverySet.list.queryOptions(
      { cursor: undefined },
      {
        staleTime: 30 * 1000,
      },
    ),
  );

  const sets = setsData?.data ?? [];

  // Filter sets by search and move selected to top
  const sortedFilteredSets = useMemo(() => {
    const filtered = sets.filter((set) =>
      set.name.toLowerCase().includes(searchValue.toLowerCase()),
    );

    // Move selected sets to the top
    if (pendingSelections.length > 0) {
      const selected: typeof filtered = [];
      const notSelected: typeof filtered = [];

      filtered.forEach((set) => {
        if (pendingSelections.includes(set.id)) {
          selected.push(set);
        } else {
          notSelected.push(set);
        }
      });

      return [...selected, ...notSelected];
    }

    return filtered;
  }, [sets, searchValue, pendingSelections]);

  // Get display text for button
  const getDisplayText = () => {
    if (savedDiscoverySetIds.length === 0) {
      return "Select discovery sets...";
    }
    if (savedDiscoverySetIds.length === 1) {
      const set = sets.find((s) => s.id === savedDiscoverySetIds[0]);
      return set?.name ?? "1 set selected";
    }
    return `${savedDiscoverySetIds.length} sets selected`;
  };

  // Toggle a set in local selection (no API call)
  const handleToggleSet = (setId: string) => {
    setPendingSelections((prev) => {
      if (prev.includes(setId)) {
        return prev.filter((id) => id !== setId);
      }
      return [...prev, setId];
    });
  };

  // Commit changes to DB when popover closes
  const handleOpenChange = async (newOpen: boolean) => {
    if (!newOpen && open) {
      // Popover is closing - check if selections changed
      const hasChanges =
        pendingSelections.length !== savedDiscoverySetIds.length ||
        pendingSelections.some((id) => !savedDiscoverySetIds.includes(id));

      if (hasChanges) {
        setIsSaving(true);
        try {
          await updatePostLoad({ discoverySetIds: pendingSelections });
          console.log(
            "[DiscoverySetSelector] Saved discovery sets:",
            pendingSelections,
          );
        } catch (error) {
          console.error("[DiscoverySetSelector] Failed to save:", error);
          // Revert local state on error
          setPendingSelections(savedDiscoverySetIds);
        } finally {
          setIsSaving(false);
        }
      }
    }
    setOpen(newOpen);
  };

  // Show loading if settings haven't loaded yet
  const isLoading = !isLoaded || isLoadingSets;

  /**
   * Opens preview tabs for each selected discovery set.
   * Each tab shows the LinkedIn search for that set's parameters.
   * Uses cached data from the list query when available, avoiding extra API calls.
   */
  const handleOpenPreview = async () => {
    if (savedDiscoverySetIds.length === 0) return;

    setIsOpeningPreview(true);

    try {
      // Use already-fetched sets from list query (cached by react-query)
      // This avoids an extra findByIds API call
      const selectedSets = sets.filter((set) =>
        savedDiscoverySetIds.includes(set.id),
      );

      // Fallback to API if any sets missing from cache (edge case: list hasn't loaded yet)
      let setsToOpen = selectedSets;
      if (selectedSets.length < savedDiscoverySetIds.length) {
        console.log(
          "[DiscoverySetSelector] Some sets not in cache, fetching from API",
        );
        const trpcClient = getTrpcClient();
        setsToOpen = await trpcClient.discoverySet.findByIds.query({
          ids: savedDiscoverySetIds,
        });
      }

      // Open a tab for each set
      for (const set of setsToOpen) {
        const url = buildDiscoverySearchUrl({
          keywords: set.keywords,
          keywordsMode: set.keywordsMode as "AND" | "OR",
          excluded: set.excluded,
          authorJobTitle: set.authorJobTitle ?? undefined,
          authorIndustries: set.authorIndustries,
        });

        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("[DiscoverySetSelector] Failed to open preview:", error);
    } finally {
      setIsOpeningPreview(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between text-left font-normal"
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
              placeholder="Search sets..."
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

              {/* Empty state when no sets */}
              {!isLoading && sets.length === 0 && (
                <CommandEmpty>
                  <div className="py-4 text-center">
                    <p className="text-muted-foreground text-sm">
                      No discovery sets yet.
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Create sets from the dashboard.
                    </p>
                  </div>
                </CommandEmpty>
              )}

              {/* No search results */}
              {!isLoading &&
                sets.length > 0 &&
                sortedFilteredSets.length === 0 && (
                  <div className="text-muted-foreground py-4 text-center text-sm">
                    No matching sets found.
                  </div>
                )}

              {/* Sets - multi-select */}
              {!isLoading && sortedFilteredSets.length > 0 && (
                <CommandGroup>
                  {sortedFilteredSets.map((set) => {
                    const isSelected = pendingSelections.includes(set.id);
                    return (
                      <CommandItem
                        key={set.id}
                        value={set.name}
                        onSelect={() => handleToggleSet(set.id)}
                        className="cursor-pointer"
                      >
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded border",
                            isSelected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-gray-300",
                          )}
                        >
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="truncate">{set.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {set.keywords.length} keywords
                            {set.authorIndustries.length > 0 &&
                              ` · ${set.authorIndustries.length} industries`}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Preview button - opens each selected set in a new tab */}
      {savedDiscoverySetIds.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpenPreview}
          disabled={isOpeningPreview}
          title="Preview selected sets in new tabs"
          className="shrink-0"
        >
          {isOpeningPreview ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ExternalLink className="mr-1 h-3 w-3" />
              Preview
            </>
          )}
        </Button>
      )}
    </div>
  );
}
