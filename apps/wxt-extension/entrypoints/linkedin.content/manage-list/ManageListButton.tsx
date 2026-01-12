"use client";

import { Check, Loader2, Plus, X } from "lucide-react";

import { Badge } from "@sassy/ui/badge";
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

import { useShadowRootStore } from "../stores";
import { useManageLists } from "./useManageLists";

interface ManageListButtonProps {
  className?: string;
}

export function ManageListButton({ className }: ManageListButtonProps) {
  const shadowRoot = useShadowRootStore((s) => s.shadowRoot);

  const {
    linkedinUrl,
    open,
    handleOpenChange,
    searchValue,
    setSearchValue,
    lists,
    filteredLists,
    isLoadingLists,
    exactMatchExists,
    selectedListIds,
    handleToggleList,
    handleCreateList,
    isCreating,
  } = useManageLists();

  // Don't render if no profile selected
  if (!linkedinUrl) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button className={className}>
          <Plus className="h-4 w-4" />
          Manage Lists
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[10000] w-60 p-0" align="start" container={shadowRoot}>
        <Command shouldFilter={false}>
          {/* Selected lists display */}
          {selectedListIds.size > 0 && (
            <div className="flex flex-wrap gap-1.5 border-b p-2">
              {[...selectedListIds].map((listId) => {
                const list = lists.find((l) => l.id === listId);
                if (!list) return null;
                return (
                  <Badge
                    key={list.id}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {list.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleList(list.id);
                      }}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Search input */}
          <CommandInput
            placeholder="Search or create list..."
            value={searchValue}
            onValueChange={setSearchValue}
          />

          <CommandList>
            {/* Loading state */}
            {isLoadingLists && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}

            {/* Empty state when no lists */}
            {!isLoadingLists && lists.length === 0 && !searchValue && (
              <CommandEmpty>No lists yet. Create one below.</CommandEmpty>
            )}

            {/* Filtered lists */}
            {!isLoadingLists && filteredLists.length > 0 && (
              <CommandGroup heading="Select lists">
                {filteredLists.map((list) => {
                  const isSelected = selectedListIds.has(list.id);
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
                            : "border-gray-300",
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

            {/* Create option - only show if search value exists and no exact match */}
            {searchValue.trim() && !exactMatchExists && !isLoadingLists && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleCreateList}
                  disabled={isCreating}
                  className="cursor-pointer text-blue-600"
                >
                  {isCreating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Create{" "}
                  <Badge variant="outline" className="ml-1 font-normal">
                    {searchValue}
                  </Badge>
                </CommandItem>
              </CommandGroup>
            )}

            {/* No results message when searching but no matches */}
            {!isLoadingLists &&
              searchValue &&
              filteredLists.length === 0 &&
              lists.length > 0 && (
                <div className="py-2 text-center text-sm text-gray-500">
                  No matching lists found.
                </div>
              )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
