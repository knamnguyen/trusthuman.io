"use client";

import { ChevronLeft, ChevronRight, List, User } from "lucide-react";

import { Button } from "@sassy/ui/button";
import { ExpandableTabs } from "@sassy/ui/expandable-tabs";
import { cn } from "@sassy/ui/utils";

import { ListsTab } from "./ListsTab";
import { ProfileTab } from "./ProfileTab";

function ToggleButton({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      onClick={onToggle}
      variant="primary"
      size="icon"
      className="z-10"
      aria-label={isOpen ? "Close panel" : "Open panel"}
      title={isOpen ? "Close panel" : "Open panel"}
    >
      {isOpen ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
    </Button>
  );
}

const SIDEBAR_TABS = {
  LISTS: 0,
  PROFILE: 1,
} as const;

const tabs = [
  { title: "Lists", icon: List },
  { title: "Profile", icon: User },
];

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

interface TargetListSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedTab: number;
  onTabChange: (tab: number) => void;
  lists: ListInfo[];
  selectedListId: string | null;
  onSelectList: (listId: string) => void;
  selectedProfile: TargetProfile | null;
  onClearProfile: () => void;
  isLoadingLists: boolean;
  hasMoreLists: boolean;
  onLoadMoreLists: () => void;
  isLoadingMoreLists: boolean;
}

export function TargetListSidebar({
  isOpen,
  onToggle,
  selectedTab,
  onTabChange,
  lists,
  selectedListId,
  onSelectList,
  selectedProfile,
  onClearProfile,
  isLoadingLists,
  hasMoreLists,
  onLoadMoreLists,
  isLoadingMoreLists,
}: TargetListSidebarProps) {
  return (
    <div
      className={cn(
        "bg-background relative flex h-full flex-col border-l transition-all duration-200",
        isOpen ? "w-[400px]" : "w-0"
      )}
    >
      {/* Toggle button attached to left edge */}
      <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2">
        <ToggleButton isOpen={isOpen} onToggle={onToggle} />
      </div>

      {/* Sidebar content - only visible when open */}
      {isOpen && (
        <>
          <div className="border-b p-4">
            <div className="flex justify-center">
              <ExpandableTabs
                tabs={tabs}
                value={selectedTab}
                onChange={onTabChange}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {selectedTab === SIDEBAR_TABS.LISTS && (
              <ListsTab
                lists={lists}
                selectedListId={selectedListId}
                onSelectList={onSelectList}
                isLoading={isLoadingLists}
                hasMore={hasMoreLists}
                onLoadMore={onLoadMoreLists}
                isLoadingMore={isLoadingMoreLists}
              />
            )}
            {selectedTab === SIDEBAR_TABS.PROFILE && (
              <ProfileTab profile={selectedProfile} onClear={onClearProfile} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

export { SIDEBAR_TABS };
