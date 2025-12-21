"use client";

import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { GenerationCard } from "./generation-card";

export function GenerationList() {
  const trpc = useTRPC();
  const { data: generations, isLoading } = useQuery(
    trpc.linkedInPreview.list.queryOptions(),
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!generations || generations.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        No saved previews yet. Create your first one above!
      </div>
    );
  }

  return (
    // <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5">
    <div className="flex snap-x flex-row gap-4 overflow-x-auto pb-4">
      {generations.map((generation: any) => (
        <GenerationCard key={generation.id} generation={generation} />
      ))}
    </div>
  );
}
