"use client";

import { FolderOpen, Loader2, Users } from "lucide-react";

import { Button } from "@sassy/ui/button";
import { cn } from "@sassy/ui/utils";

// Sentinel value for "All Profiles" view
export const ALL_PROFILES_ID = "__all__";

interface ListInfo {
  id: string;
  name: string;
}

interface ListsTabProps {
  lists: ListInfo[];
  selectedListId: string | null;
  onSelectList: (listId: string) => void;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  isLoadingMore: boolean;
  totalProfilesCount?: number;
}

export function ListsTab({
  lists,
  selectedListId,
  onSelectList,
  isLoading,
  hasMore,
  onLoadMore,
  isLoadingMore,
  totalProfilesCount,
}: ListsTabProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        <p className="text-muted-foreground text-sm">Loading lists...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 p-4">
      {/* All Profiles - always show at top */}
      <button
        type="button"
        onClick={() => onSelectList(ALL_PROFILES_ID)}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
          selectedListId === ALL_PROFILES_ID
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted"
        )}
      >
        <Users className="h-4 w-4 flex-shrink-0" />
        <span className="truncate font-medium">All Profiles</span>
        {totalProfilesCount !== undefined && (
          <span className="text-muted-foreground ml-auto text-xs">
            {totalProfilesCount}
          </span>
        )}
      </button>

      {lists.length > 0 && (
        <>
          <p className="text-muted-foreground mb-2 mt-4 text-xs font-medium uppercase tracking-wide">
            Your Lists
          </p>
          {lists.map((list) => (
            <button
              key={list.id}
              type="button"
              onClick={() => onSelectList(list.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                selectedListId === list.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <FolderOpen className="h-4 w-4 flex-shrink-0" />
              <span className="truncate font-medium">{list.name}</span>
            </button>
          ))}
          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="mt-2"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Load more lists"
              )}
            </Button>
          )}
        </>
      )}

      {lists.length === 0 && (
        <div className="mt-4 flex flex-col items-center justify-center gap-2 py-8">
          <FolderOpen className="text-muted-foreground h-8 w-8" />
          <p className="text-muted-foreground text-center text-xs">
            No custom lists yet.
            <br />
            Save profiles from LinkedIn to create lists.
          </p>
        </div>
      )}
    </div>
  );
}
