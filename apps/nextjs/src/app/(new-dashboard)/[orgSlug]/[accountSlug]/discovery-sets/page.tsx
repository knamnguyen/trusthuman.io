"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Loader2, Plus, Search } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@sassy/ui/dialog";
import { toast } from "@sassy/ui/toast";

import type { DiscoverySet } from "./_components/DiscoverySetCard";
import { useTRPC } from "~/trpc/react";
import { DiscoverySetCard } from "./_components/DiscoverySetCard";
import { DiscoverySetSidebar } from "./_components/DiscoverySetSidebar";

export default function DiscoverySetsPage() {
  const { accountSlug } = useParams<{ accountSlug: string }>();
  const trpc = useTRPC();

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<"create" | "edit" | null>(
    null,
  );
  const [selectedSet, setSelectedSet] = useState<DiscoverySet | null>(null);

  // Delete confirmation state
  const [setToDelete, setSetToDelete] = useState<DiscoverySet | null>(null);

  const discoverySets = useInfiniteQuery(
    trpc.discoverySet.list.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.next,
      },
    ),
  );

  const allSets = discoverySets.data?.pages.flatMap((p) => p.data) ?? [];

  // Handle set card click - open edit sidebar
  const handleSelectSet = (set: DiscoverySet) => {
    setSelectedSet(set);
    setSidebarMode("edit");
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
    }
  };

  // Handle create button click - open create sidebar
  const handleCreateClick = () => {
    setSelectedSet(null);
    setSidebarMode("create");
    setIsSidebarOpen(true);
  };

  // Handle sidebar close
  const handleCloseSidebar = () => {
    setSidebarMode(null);
    setSelectedSet(null);
  };

  // Handle delete request from sidebar
  const handleDeleteRequest = (set: DiscoverySet) => {
    setSetToDelete(set);
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Discovery Sets</h1>
          <p className="text-muted-foreground text-sm">
            LinkedIn search configurations for {accountSlug}
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Create Discovery Set
        </Button>
      </div>

      {/* Main layout with sidebar */}
      <div className="relative flex min-h-0 flex-1">
        {/* Main Content - scrolls independently */}
        <div className="flex-1 overflow-y-auto p-6">
          {discoverySets.isLoading ? (
            <div className="flex h-[400px] items-center justify-center">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : allSets.length === 0 ? (
            <EmptyState onCreateClick={handleCreateClick} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {allSets.map((set) => (
                  <DiscoverySetCard
                    key={set.id}
                    set={set}
                    isSelected={selectedSet?.id === set.id}
                    onSelect={() => handleSelectSet(set)}
                  />
                ))}
              </div>

              {discoverySets.hasNextPage && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => discoverySets.fetchNextPage()}
                    disabled={discoverySets.isFetchingNextPage}
                  >
                    {discoverySets.isFetchingNextPage ? "Loading..." : "Load more"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar */}
        <DiscoverySetSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          mode={sidebarMode}
          selectedSet={selectedSet}
          onClose={handleCloseSidebar}
          onDelete={handleDeleteRequest}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        set={setToDelete}
        onClose={() => setSetToDelete(null)}
        onDeleted={handleCloseSidebar}
      />
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex h-[400px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed">
      <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
        <Search className="text-muted-foreground h-8 w-8" />
      </div>
      <div className="text-center">
        <p className="text-muted-foreground mb-1">No discovery sets yet</p>
        <p className="text-muted-foreground mb-4 text-sm">
          Create discovery sets to save LinkedIn search configurations
        </p>
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Create your first discovery set
        </Button>
      </div>
    </div>
  );
}

function DeleteConfirmationDialog({
  set,
  onClose,
  onDeleted,
}: {
  set: DiscoverySet | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deleteSet = useMutation(
    trpc.discoverySet.delete.mutationOptions({
      async onSuccess(data) {
        if (data.status === "error") {
          toast.error(data.message);
          return;
        }
        toast.success("Discovery set deleted successfully");
        onClose();
        onDeleted();
        await queryClient.invalidateQueries({
          queryKey: trpc.discoverySet.list.infiniteQueryKey(),
        });
      },
    }),
  );

  return (
    <Dialog open={set !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete "{set?.name}"?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            discovery set.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleteSet.isPending}
            onClick={() => {
              if (set) {
                deleteSet.mutate({ id: set.id });
              }
            }}
          >
            {deleteSet.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
