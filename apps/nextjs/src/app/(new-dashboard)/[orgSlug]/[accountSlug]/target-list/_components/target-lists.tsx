"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "lucide-react";

import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";
import { cn } from "@sassy/ui/utils";

import { useTRPC } from "~/trpc/react";
import { ALL_PROFILES_ID } from "./ListsTab";
import { ManageListButton } from "./ManageListButton";
import { SIDEBAR_TABS, TargetListSidebar } from "./TargetListSidebar";

interface TargetProfile {
  id: string;
  linkedinUrl: string;
  name: string | null;
  headline: string | null;
  photoUrl: string | null;
  profileUrn: string | null;
}

interface ListInfo {
  id: string;
  name: string;
}

export function TargetLists() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedTab, setSelectedTab] = useState<number>(SIDEBAR_TABS.LISTS);

  // Selection state - default to "All Profiles"
  const [selectedListId, setSelectedListId] = useState<string>(ALL_PROFILES_ID);
  const [selectedProfile, setSelectedProfile] = useState<TargetProfile | null>(
    null
  );

  const targetLists = useInfiniteQuery(
    trpc.targetList.findLists.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.next,
      }
    )
  );

  const allLists = targetLists.data?.pages.flatMap((p) => p.data) ?? [];

  // Prefetch profiles for all lists once lists are loaded
  useEffect(() => {
    if (allLists.length === 0) return;

    for (const list of allLists) {
      void queryClient.prefetchInfiniteQuery(
        trpc.targetList.getProfilesInList.infiniteQueryOptions(
          { listId: list.id },
          { getNextPageParam: (lastPage) => lastPage.next }
        )
      );
    }
  }, [allLists, queryClient, trpc]);

  // Handle profile selection - switch to Profile tab
  const handleSelectProfile = (profile: TargetProfile) => {
    setSelectedProfile(profile);
    setSelectedTab(SIDEBAR_TABS.PROFILE);
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
    }
  };

  // Handle list selection
  const handleSelectList = (listId: string) => {
    setSelectedListId(listId);
    // Clear selected profile when switching lists
    setSelectedProfile(null);
  };

  const isAllProfiles = selectedListId === ALL_PROFILES_ID;
  const selectedListName = isAllProfiles
    ? "All Profiles"
    : allLists.find((l) => l.id === selectedListId)?.name ?? "";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Target Lists</h1>
        <p className="text-muted-foreground text-sm">
          Viewing: {selectedListName}
        </p>
      </div>

      {/* Main layout with sidebar */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          {targetLists.isLoading ? (
            <div className="flex h-[400px] items-center justify-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : isAllProfiles ? (
            <AllProfilesGrid
              allLists={allLists}
              selectedProfileId={selectedProfile?.id ?? null}
              onSelectProfile={handleSelectProfile}
            />
          ) : (
            <ProfilesGrid
              listId={selectedListId}
              listName={selectedListName}
              allLists={allLists}
              selectedProfileId={selectedProfile?.id ?? null}
              onSelectProfile={handleSelectProfile}
            />
          )}
        </div>

        {/* Right Sidebar */}
        <TargetListSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        lists={allLists}
        selectedListId={selectedListId}
        onSelectList={handleSelectList}
        selectedProfile={selectedProfile}
        onClearProfile={() => setSelectedProfile(null)}
        isLoadingLists={targetLists.isLoading}
        hasMoreLists={targetLists.hasNextPage ?? false}
        onLoadMoreLists={() => targetLists.fetchNextPage()}
        isLoadingMoreLists={targetLists.isFetchingNextPage}
      />
      </div>
    </div>
  );
}

function AllProfilesGrid({
  allLists,
  selectedProfileId,
  onSelectProfile,
}: {
  allLists: ListInfo[];
  selectedProfileId: string | null;
  onSelectProfile: (profile: TargetProfile) => void;
}) {
  const trpc = useTRPC();

  const profiles = useInfiniteQuery(
    trpc.targetList.getAllProfiles.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.next,
      }
    )
  );

  const allProfiles = profiles.data?.pages.flatMap((p) => p.data) ?? [];

  if (profiles.isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Loading profiles...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">All Profiles</h2>
        <Badge variant="outline">{allProfiles.length} Profiles</Badge>
      </div>

      {allProfiles.length === 0 ? (
        <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">
            No profiles yet. Save profiles from LinkedIn to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allProfiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                listMemberships={profile.targetListProfiles.map(
                  (tlp) => tlp.list
                )}
                allLists={allLists}
                isSelected={selectedProfileId === profile.id}
                onSelect={() => onSelectProfile(profile)}
              />
            ))}
          </div>

          {profiles.hasNextPage && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => profiles.fetchNextPage()}
                disabled={profiles.isFetchingNextPage}
              >
                {profiles.isFetchingNextPage ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProfilesGrid({
  listId,
  listName,
  allLists,
  selectedProfileId,
  onSelectProfile,
}: {
  listId: string;
  listName: string;
  allLists: ListInfo[];
  selectedProfileId: string | null;
  onSelectProfile: (profile: TargetProfile) => void;
}) {
  const trpc = useTRPC();

  const profiles = useInfiniteQuery(
    trpc.targetList.getProfilesInList.infiniteQueryOptions(
      { listId },
      {
        getNextPageParam: (lastPage) => lastPage.next,
      }
    )
  );

  const allProfiles = profiles.data?.pages.flatMap((p) => p.data) ?? [];

  if (profiles.isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Loading profiles...</p>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allProfiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                listMemberships={profile.targetListProfiles.map(
                  (tlp) => tlp.list
                )}
                allLists={allLists}
                isSelected={selectedProfileId === profile.id}
                onSelect={() => onSelectProfile(profile)}
              />
            ))}
          </div>

          {profiles.hasNextPage && (
            <div className="mt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={() => profiles.fetchNextPage()}
                disabled={profiles.isFetchingNextPage}
              >
                {profiles.isFetchingNextPage ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface ProfileCardProps {
  profile: TargetProfile;
  listMemberships: ListInfo[];
  allLists: ListInfo[];
  isSelected: boolean;
  onSelect: () => void;
}

function ProfileCard({
  profile,
  allLists,
  listMemberships,
  isSelected,
  onSelect,
}: ProfileCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-primary ring-2"
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={profile.name ?? "Profile"}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
              <User className="text-muted-foreground h-6 w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-sm font-medium">
              {profile.name ?? "Unknown"}
            </CardTitle>
            {profile.headline && (
              <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                {profile.headline}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <a
          href={profile.linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mb-3 block truncate text-xs text-blue-600 hover:underline"
        >
          {profile.linkedinUrl} ↗
        </a>
        <div className="mb-3 flex flex-wrap gap-1">
          <span className="text-muted-foreground text-xs">Lists:</span>
          {listMemberships.map((list) => (
            <Badge key={list.id} variant="secondary" className="text-xs">
              {list.name}
            </Badge>
          ))}
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <ManageListButton
            linkedinUrl={profile.linkedinUrl}
            listMemberships={listMemberships}
            allLists={allLists}
          />
        </div>
      </CardContent>
    </Card>
  );
}
