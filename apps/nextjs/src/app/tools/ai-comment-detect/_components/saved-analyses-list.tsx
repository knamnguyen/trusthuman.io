"use client";

import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";
import { AnalysisCard } from "./analysis-card";

export function SavedAnalysesList() {
  const trpc = useTRPC();
  const { data: analyses, isLoading } = useQuery(
    trpc.commentAiDetector.list.queryOptions(),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="bg-muted/50 rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground text-sm">
          No saved analyses yet. Evaluate a comment to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your Saved Analyses</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {analyses.map((analysis) => (
          <AnalysisCard key={analysis.id} analysis={analysis} />
        ))}
      </div>
    </div>
  );
}
