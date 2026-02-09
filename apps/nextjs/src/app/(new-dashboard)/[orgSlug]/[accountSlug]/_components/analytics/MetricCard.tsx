"use client";

import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";

import { Card, CardTitle } from "@sassy/ui/card";
import { cn } from "@sassy/ui/utils";

export interface MetricCardProps {
  title: string;
  icon: LucideIcon;
  value?: number | null;
  percentageChange?: number | null;
  isLoading?: boolean;
  selected?: boolean;
  onClick?: () => void;
  color?: string;
}

function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return thousands % 1 === 0 ? `${thousands}k` : `${thousands.toFixed(1)}k`;
  }
  return value.toString();
}

function formatPercentageChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

export function MetricCard({
  title,
  icon: Icon,
  value,
  percentageChange,
  isLoading = false,
  selected = false,
  onClick,
  color,
}: MetricCardProps) {
  const selectedStyle = selected
    ? { borderColor: color, borderWidth: "2px" }
    : {};

  // Loading state
  if (isLoading && (value === null || value === undefined)) {
    return (
      <Card
        className="cursor-pointer p-3 transition-all hover:shadow-md"
        style={selectedStyle}
        onClick={onClick}
      >
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <CardTitle className="text-xs">Loading...</CardTitle>
        </div>
      </Card>
    );
  }

  // No data state
  if (value === null || value === undefined) {
    return (
      <Card
        className="cursor-pointer p-3 transition-all hover:shadow-md"
        style={selectedStyle}
        onClick={onClick}
      >
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
          <CardTitle className="truncate text-xs">{title}</CardTitle>
        </div>
        <div className="text-muted-foreground mt-2 text-center text-xs">
          No data
        </div>
      </Card>
    );
  }

  // Data state
  return (
    <Card
      className="cursor-pointer p-3 transition-all hover:shadow-md"
      style={selectedStyle}
      onClick={onClick}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
        <CardTitle className="truncate text-xs">{title}</CardTitle>
      </div>
      <div className="mt-2 text-center">
        <div className="text-2xl font-bold leading-none">
          {formatCompactNumber(value)}
        </div>
        {percentageChange !== null && percentageChange !== undefined && (
          <div
            className={cn(
              "mt-1 text-xs font-semibold",
              percentageChange > 0
                ? "text-green-600 dark:text-green-400"
                : percentageChange < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground",
            )}
          >
            {formatPercentageChange(percentageChange)}
          </div>
        )}
      </div>
    </Card>
  );
}
