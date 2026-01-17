"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Loader2, Plus, User } from "lucide-react";

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

import type { Persona } from "./_components/PersonaCard";
import { useTRPC } from "~/trpc/react";
import { PersonaCard } from "./_components/PersonaCard";
import { PersonaSidebar } from "./_components/PersonaSidebar";

export default function PersonasPage() {
  const { accountSlug } = useParams<{ accountSlug: string }>();
  const trpc = useTRPC();

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<"create" | "edit" | null>(
    null,
  );
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);

  // Delete confirmation state
  const [personaToDelete, setPersonaToDelete] = useState<Persona | null>(null);

  const personas = useInfiniteQuery(
    trpc.persona.commentStyle.list.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.next,
      },
    ),
  );

  const allPersonas = personas.data?.pages.flatMap((p) => p.data) ?? [];

  // Handle persona card click - open edit sidebar
  const handleSelectPersona = (persona: Persona) => {
    setSelectedPersona(persona);
    setSidebarMode("edit");
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
    }
  };

  // Handle create button click - open create sidebar
  const handleCreateClick = () => {
    setSelectedPersona(null);
    setSidebarMode("create");
    setIsSidebarOpen(true);
  };

  // Handle sidebar close
  const handleCloseSidebar = () => {
    setSidebarMode(null);
    setSelectedPersona(null);
  };

  // Handle delete request from sidebar
  const handleDeleteRequest = (persona: Persona) => {
    setPersonaToDelete(persona);
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Personas</h1>
          <p className="text-muted-foreground text-sm">
            AI personas for {accountSlug}
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Create Persona
        </Button>
      </div>

      {/* Main layout with sidebar */}
      <div className="relative flex min-h-0 flex-1">
        {/* Main Content - scrolls independently */}
        <div className="flex-1 overflow-y-auto p-6">
          {personas.isLoading ? (
            <div className="flex h-[400px] items-center justify-center">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : allPersonas.length === 0 ? (
            <EmptyState onCreateClick={handleCreateClick} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {allPersonas.map((persona) => (
                  <PersonaCard
                    key={persona.id}
                    persona={persona}
                    isSelected={selectedPersona?.id === persona.id}
                    onSelect={() => handleSelectPersona(persona)}
                  />
                ))}
              </div>

              {personas.hasNextPage && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => personas.fetchNextPage()}
                    disabled={personas.isFetchingNextPage}
                  >
                    {personas.isFetchingNextPage ? "Loading..." : "Load more"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sidebar */}
        <PersonaSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          mode={sidebarMode}
          selectedPersona={selectedPersona}
          onClose={handleCloseSidebar}
          onDelete={handleDeleteRequest}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        persona={personaToDelete}
        onClose={() => setPersonaToDelete(null)}
        onDeleted={handleCloseSidebar}
      />
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex h-[400px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed">
      <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
        <User className="text-muted-foreground h-8 w-8" />
      </div>
      <div className="text-center">
        <p className="text-muted-foreground mb-1">No personas yet</p>
        <p className="text-muted-foreground mb-4 text-sm">
          Create personas to customize AI comment generation
        </p>
        <Button onClick={onCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          Create your first persona
        </Button>
      </div>
    </div>
  );
}

function DeleteConfirmationDialog({
  persona,
  onClose,
  onDeleted,
}: {
  persona: Persona | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const deletePersona = useMutation(
    trpc.persona.commentStyle.delete.mutationOptions({
      async onSuccess(data) {
        if (data.status === "error") {
          toast.error(data.message);
          return;
        }
        toast.success("Persona deleted successfully");
        onClose();
        onDeleted();
        await queryClient.invalidateQueries({
          queryKey: trpc.persona.commentStyle.list.infiniteQueryKey(),
        });
      },
    }),
  );

  return (
    <Dialog open={persona !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete "{persona?.name}"?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the
            persona.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deletePersona.isPending}
            onClick={() => {
              if (persona) {
                deletePersona.mutate({ id: persona.id });
              }
            }}
          >
            {deletePersona.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
