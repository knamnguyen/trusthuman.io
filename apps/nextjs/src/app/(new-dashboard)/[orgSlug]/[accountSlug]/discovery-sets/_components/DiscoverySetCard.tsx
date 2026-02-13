"use client";

import { Search } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";
import { cn } from "@sassy/ui/utils";

export interface DiscoverySet {
  id: string;
  name: string;
  keywords: string[];
  keywordsMode: string;
  excluded: string[];
  authorJobTitle: string | null;
  authorIndustries: string[];
  createdAt: Date;
}

interface DiscoverySetCardProps {
  set: DiscoverySet;
  isSelected: boolean;
  onSelect: () => void;
}

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function DiscoverySetCard({
  set,
  isSelected,
  onSelect,
}: DiscoverySetCardProps) {
  const keywordsSummary =
    set.keywords.length > 0
      ? set.keywords.slice(0, 3).join(", ") +
        (set.keywords.length > 3 ? ` +${set.keywords.length - 3} more` : "")
      : "No keywords";

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-primary ring-2",
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
            <Search className="text-primary h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-sm font-medium">
              {set.name}
            </CardTitle>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Created {shortDateFormatter.format(set.createdAt)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Keywords:</span>
            <span className="truncate">{keywordsSummary}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Mode:</span>
            <span className="bg-muted rounded px-1.5 py-0.5 text-xs font-medium">
              {set.keywordsMode}
            </span>
          </div>
          {set.authorIndustries.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Industries:</span>
              <span>{set.authorIndustries.length} selected</span>
            </div>
          )}
          {set.authorJobTitle && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Job Title:</span>
              <span className="truncate">{set.authorJobTitle}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
