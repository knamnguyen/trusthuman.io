"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@sassy/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";
import { cn } from "@sassy/ui/utils";

import { useTRPC } from "~/trpc/react";
import { ManageListButton } from "./ManageListButton";

export function TargetLists() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const targetLists = useInfiniteQuery(
    trpc.targetList.findLists.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.next,
      },
    ),
  );

  // Auto-select first list when data loads
  const allLists = targetLists.data?.pages.flatMap((p) => p.data) ?? [];

  // Prefetch profiles for all lists once lists are loaded
  useEffect(() => {
    if (allLists.length === 0) return;

    for (const list of allLists) {
      void queryClient.prefetchInfiniteQuery(
        trpc.targetList.findProfilesByListIdWithMembership.infiniteQueryOptions(
          { listId: list.id },
          { getNextPageParam: (lastPage) => lastPage.next },
        ),
      );
    }
  }, [allLists, queryClient, trpc]);
  const effectiveSelectedId =
    selectedListId ?? (allLists.length > 0 ? allLists[0]?.id : null);

  if (targetLists.isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        Loading target lists...
      </div>
    );
  }

  if (allLists.length === 0) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <p className="text-muted-foreground">
          No target lists found. Save profiles from LinkedIn to create lists.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Left Sidebar - Profile Lists */}
      <div className="w-64 flex-shrink-0">
        <div className="bg-card rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Profile Lists</h2>
          <div className="space-y-1">
            {allLists.map((list) => (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                  effectiveSelectedId === list.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                {list.name}
              </button>
            ))}
          </div>
          {targetLists.hasNextPage && (
            <button
              onClick={() => targetLists.fetchNextPage()}
              disabled={targetLists.isFetchingNextPage}
              className="text-muted-foreground hover:bg-muted mt-2 w-full rounded-md px-3 py-2 text-sm"
            >
              {targetLists.isFetchingNextPage ? "Loading..." : "Load more"}
            </button>
          )}
        </div>
      </div>

      {/* Right Side - Profiles Grid */}
      <div className="flex-1">
        {effectiveSelectedId ? (
          <ProfilesGrid
            listId={effectiveSelectedId}
            listName={
              allLists.find((l) => l.id === effectiveSelectedId)?.name ?? ""
            }
            allLists={allLists}
          />
        ) : (
          <div className="text-muted-foreground flex h-[400px] items-center justify-center">
            Select a list to view profiles
          </div>
        )}
      </div>
    </div>
  );
}

interface ListInfo {
  id: string;
  name: string;
}

function ProfilesGrid({
  listId,
  listName,
  allLists,
}: {
  listId: string;
  listName: string;
  allLists: ListInfo[];
}) {
  const trpc = useTRPC();

  const profiles = useInfiniteQuery(
    trpc.targetList.findProfilesByListIdWithMembership.infiniteQueryOptions(
      { listId },
      {
        getNextPageParam: (lastPage) => lastPage.next,
      },
    ),
  );

  const allProfiles = profiles.data?.pages.flatMap((p) => p.data) ?? [];

  if (profiles.isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        Loading profiles...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Profiles in "{listName}"</h2>
        <Badge variant="outline">{allProfiles.length} Profiles</Badge>
      </div>

      {allProfiles.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">No profiles in this list</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allProfiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                listMemberships={profile.targetListProfiles.map(
                  (tlp) => tlp.list,
                )}
                allLists={allLists}
              />
            ))}
          </div>

          {profiles.hasNextPage && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => profiles.fetchNextPage()}
                disabled={profiles.isFetchingNextPage}
                className="hover:bg-muted rounded-md border px-4 py-2 text-sm"
              >
                {profiles.isFetchingNextPage ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface ProfileCardProps {
  profile: {
    id: string;
    linkedinUrl: string;
  };
  listMemberships: ListInfo[];
  allLists: ListInfo[];
}

function ProfileCard({ profile, allLists, listMemberships }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          <a
            href={profile.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            View LinkedIn Profile ↗
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-2 truncate text-xs">
          {profile.linkedinUrl}
        </p>
        <div className="mb-3 flex flex-wrap gap-1">
          <span className="text-muted-foreground text-xs">Lists:</span>
          {listMemberships.map((list) => (
            <Badge key={list.id} variant="secondary" className="text-xs">
              {list.name}
            </Badge>
          ))}
        </div>
        <ManageListButton
          linkedinUrl={profile.linkedinUrl}
          listMemberships={listMemberships}
          allLists={allLists}
        />
      </CardContent>
    </Card>
  );
}
