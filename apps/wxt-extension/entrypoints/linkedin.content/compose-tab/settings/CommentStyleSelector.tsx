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
 * Comment style selector for AI settings.
 * Shows a dropdown with search to select a SINGLE comment style.
 * Selected style appears at the top for easy viewing.
 *
 * Single-select with immediate update on selection.
 */
export function CommentStyleSelector() {
  const shadowRoot = useShadowRootStore((s) => s.shadowRoot);
  const trpc = useTRPC();

  // UI state
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // DB Settings store
  const commentGenerate = useSettingsDBStore((s) => s.commentGenerate);
  const isLoaded = useSettingsDBStore((s) => s.isLoaded);
  const updateCommentGenerate = useSettingsDBStore((s) => s.updateCommentGenerate);

  // Get saved style ID from DB
  const savedStyleId = commentGenerate?.commentStyleId ?? null;

  // Fetch all user's comment styles
  const { data: stylesData, isLoading: isLoadingStyles } = useQuery(
    trpc.persona.commentStyle.list.queryOptions(
      { cursor: undefined },
      {
        staleTime: 30 * 1000,
      }
    )
  );

  const styles = stylesData?.data ?? [];

  // Filter styles by search and move selected to top
  const sortedFilteredStyles = useMemo(() => {
    const filtered = styles.filter((style) =>
      style.name.toLowerCase().includes(searchValue.toLowerCase())
    );

    // Move selected style to the top
    if (savedStyleId) {
      const selectedIndex = filtered.findIndex((s) => s.id === savedStyleId);
      if (selectedIndex > 0) {
        const [selected] = filtered.splice(selectedIndex, 1);
        if (selected) {
          filtered.unshift(selected);
        }
      }
    }

    return filtered;
  }, [styles, searchValue, savedStyleId]);

  // Get selected style name for display
  const selectedStyleName = styles.find((s) => s.id === savedStyleId)?.name;

  // Handle selecting a style (single-select, immediate update)
  const handleSelectStyle = async (styleId: string) => {
    // Toggle off if clicking the same style
    const newStyleId = savedStyleId === styleId ? null : styleId;

    setOpen(false);
    setIsSaving(true);

    try {
      await updateCommentGenerate({ commentStyleId: newStyleId });
      console.log("[CommentStyleSelector] Saved style:", newStyleId);
    } catch (error) {
      console.error("[CommentStyleSelector] Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Clear selection
  const handleClear = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);

    try {
      await updateCommentGenerate({ commentStyleId: null });
      console.log("[CommentStyleSelector] Cleared style");
    } catch (error) {
      console.error("[CommentStyleSelector] Failed to clear:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading if settings haven't loaded yet
  const isLoading = !isLoaded || isLoadingStyles;

  // Check if no styles are available (after loading)
  const noStylesAvailable = !isLoading && styles.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal"
          disabled={isSaving || noStylesAvailable}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="truncate">Saving...</span>
            </>
          ) : noStylesAvailable ? (
            <span className="truncate text-muted-foreground">
              No styles available
            </span>
          ) : (
            <>
              <span className="truncate">
                {selectedStyleName ?? "Select a style..."}
              </span>
              <div className="flex items-center gap-1">
                {savedStyleId && (
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
            placeholder="Search styles..."
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

            {/* Empty state when no styles */}
            {!isLoading && styles.length === 0 && (
              <CommandEmpty>
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No comment styles yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create styles from the Personas page.
                  </p>
                </div>
              </CommandEmpty>
            )}

            {/* No search results */}
            {!isLoading &&
              styles.length > 0 &&
              sortedFilteredStyles.length === 0 && (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No matching styles found.
                </div>
              )}

            {/* Styles - single-select */}
            {!isLoading && sortedFilteredStyles.length > 0 && (
              <CommandGroup>
                {sortedFilteredStyles.map((style) => {
                  const isSelected = savedStyleId === style.id;
                  return (
                    <CommandItem
                      key={style.id}
                      value={style.name}
                      onSelect={() => handleSelectStyle(style.id)}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-full border",
                          isSelected
                            ? "border-pink-600 bg-pink-600 text-white"
                            : "border-gray-300"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{style.name}</span>
                        {style.description && (
                          <span className="text-xs text-muted-foreground truncate">
                            {style.description}
                          </span>
                        )}
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
  );
}
