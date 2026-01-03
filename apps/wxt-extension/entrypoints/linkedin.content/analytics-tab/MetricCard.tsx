import { Loader2, LucideIcon, RefreshCw } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import { cn } from "@sassy/ui/utils";

export interface MetricCardProps {
  /** Card title */
  title: string;
  /** Icon component */
  icon: LucideIcon;
  /** Description text (e.g., "in the past 90 days") */
  description?: string;
  /** Main metric value */
  value?: string | number | null;
  /** Label for the metric (e.g., "Total") */
  valueLabel?: string;
  /** Last update timestamp in milliseconds */
  lastUpdate?: number | null;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
  /** Refresh callback */
  onRefresh?: () => void;
  /** Whether this metric is selected for the chart */
  selected?: boolean;
  /** Compact mode for grid layout */
  compact?: boolean;
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
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

/**
 * Reusable metric card component for displaying analytics data
 *
 * Handles common patterns:
 * - Loading states
 * - Error states
 * - No data state with optional fetch button
 * - Compact layout for grid display
 * - Selection state for chart filtering
 */
export function MetricCard({
  title,
  icon: Icon,
  description,
  value,
  valueLabel = "Total",
  lastUpdate,
  isLoading = false,
  error = null,
  onRefresh,
  selected = false,
  compact = false,
}: MetricCardProps) {
  // Loading state (no data yet)
  if (isLoading && (value === null || value === undefined)) {
    return (
      <Card
        className={cn(
          compact && "aspect-square",
          selected && "bg-accent ring-2 ring-ring",
        )}
      >
        <div className={cn("flex items-center gap-2", compact ? "h-full p-3" : "p-4")}>
          <Loader2 className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4", "animate-spin")} />
          <CardTitle className={cn(compact ? "text-xs" : "text-sm")}>Loading...</CardTitle>
        </div>
      </Card>
    );
  }

  // Error state (no data yet)
  if (error && (value === null || value === undefined)) {
    return (
      <Card
        className={cn(
          compact && "aspect-square",
          selected && "bg-accent ring-2 ring-ring",
        )}
      >
        <div className={cn("flex flex-col", compact ? "h-full p-3" : "p-4")}>
          <div className="flex items-center gap-1.5 mb-1">
            <Icon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
            <CardTitle className={cn(compact ? "text-xs" : "text-sm")}>{title}</CardTitle>
          </div>
          <CardDescription className={cn(compact ? "text-[10px]" : "text-xs")}>{error}</CardDescription>
        </div>
      </Card>
    );
  }

  // No data state
  if (value === null || value === undefined) {
    return (
      <Card
        className={cn(
          compact && "aspect-square",
          selected && "bg-accent ring-2 ring-ring",
        )}
      >
        <div className={cn("flex flex-col", compact ? "h-full p-3" : "p-4")}>
          <div className="flex items-center gap-1.5 mb-1">
            <Icon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
            <CardTitle className={cn(compact ? "text-xs" : "text-sm")}>{title}</CardTitle>
          </div>
          <CardDescription className={cn(compact ? "text-[10px]" : "text-xs")}>
            No data yet.
          </CardDescription>
          {onRefresh && !compact && (
            <div className="mt-3">
              <Button onClick={onRefresh} size="sm" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Fetch Now
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Data state - compact mode (grid)
  if (compact) {
    return (
      <Card
        className={cn(
          "aspect-square transition-all",
          selected ? "bg-accent ring-2 ring-ring" : "",
        )}
      >
        <div className="flex h-full flex-col p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <CardTitle className="text-xs truncate">{title}</CardTitle>
          </div>
          {lastUpdate && (
            <p className="text-muted-foreground mb-auto text-[9px]">
              {formatTimeAgo(lastUpdate)}
            </p>
          )}
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-3xl font-bold leading-none">
              {typeof value === "number" ? formatCompactNumber(value) : value}
            </div>
            {description && (
              <div className="text-muted-foreground mt-1.5 text-[10px] text-center leading-tight">
                {description.replace(/in the (past|last) /i, "")}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Data state - full mode
  return (
    <Card className={cn(selected && "ring-primary bg-primary/5 ring-2")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <div>
              <CardTitle className="text-sm">{title}</CardTitle>
              {lastUpdate && (
                <CardDescription className="mt-0.5 text-[10px]">
                  Updated {formatTimeAgo(lastUpdate)}
                </CardDescription>
              )}
            </div>
          </div>
          {onRefresh && (
            <Button
              onClick={onRefresh}
              size="sm"
              variant="ghost"
              disabled={isLoading}
              className="h-7 w-7 p-0"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {description && (
            <span className="text-muted-foreground text-xs font-normal">
              {valueLabel
                ? `${valueLabel.toLowerCase()} ${description}`
                : description}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
