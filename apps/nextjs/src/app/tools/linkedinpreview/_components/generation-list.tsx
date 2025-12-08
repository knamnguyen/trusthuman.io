"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { GenerationCard } from "./generation-card";

export function GenerationList() {
  const trpc = useTRPC();
  const { data: generations, isLoading } = useQuery(
    trpc.linkedInPreview.list.queryOptions()
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!generations || generations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No saved previews yet. Create your first one above!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {generations.map((generation: any) => (
        <GenerationCard key={generation.id} generation={generation} />
      ))}
    </div>
  );
}
