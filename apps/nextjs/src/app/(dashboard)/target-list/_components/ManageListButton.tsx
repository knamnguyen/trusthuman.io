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

import { useManageLists } from "./use-manage-lists";

interface ListInfo {
  id: string;
  name: string;
}

interface ManageListButtonProps {
  linkedinUrl: string;
  listMemberships: ListInfo[];
  allLists: ListInfo[];
  className?: string;
}

export function ManageListButton({
  linkedinUrl,
  listMemberships,
  allLists,
  className,
}: ManageListButtonProps) {
  const {
    open,
    handleOpenChange,
    searchValue,
    setSearchValue,
    lists,
    filteredLists,
    exactMatchExists,
    selectedListIds,
    handleToggleList,
    handleCreateList,
    isCreating,
    isSaving,
  } = useManageLists({ linkedinUrl, listMemberships, allLists });

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-1", className)}>
          {isSaving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          Lists
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
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
            {/* Empty state when no lists */}
            {lists.length === 0 && !searchValue && (
              <CommandEmpty>No lists yet. Create one below.</CommandEmpty>
            )}

            {/* Filtered lists */}
            {filteredLists.length > 0 && (
              <CommandGroup heading="Select lists">
                {filteredLists.map((list) => {
                  const isSelected = selectedListIds.has(list.id);
                  const isTemp = list.id.startsWith("temp-");
                  return (
                    <CommandItem
                      key={list.id}
                      value={list.name}
                      onSelect={() => !isTemp && handleToggleList(list.id)}
                      className={cn(
                        "cursor-pointer",
                        isTemp && "opacity-50",
                      )}
                      disabled={isTemp}
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded border",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/30",
                        )}
                      >
                        {isTemp ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          isSelected && <Check className="h-3 w-3" />
                        )}
                      </div>
                      <span className="truncate">{list.name}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* Create option - only show if search value exists and no exact match */}
            {searchValue.trim() && !exactMatchExists && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleCreateList}
                  disabled={isCreating}
                  className="cursor-pointer text-primary"
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

            {/* No results message */}
            {searchValue &&
              filteredLists.length === 0 &&
              lists.length > 0 && (
                <div className="text-muted-foreground py-2 text-center text-sm">
                  No matching lists found.
                </div>
              )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
