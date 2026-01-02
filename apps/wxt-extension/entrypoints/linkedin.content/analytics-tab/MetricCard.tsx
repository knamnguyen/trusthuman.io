import { useState, ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  LucideIcon,
  RefreshCw,
} from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

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
  /** Optional chart component to show when toggled */
  chartComponent?: ReactNode;
  /** Whether chart can be toggled (auto-detects if chartComponent provided) */
  showChartToggle?: boolean;
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

/**
 * Reusable metric card component for displaying data with charts
 *
 * Handles common patterns:
 * - Loading states
 * - Error states
 * - No data state with optional fetch button
 * - Compact layout
 * - Refresh button
 * - Optional togglable chart
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="Profile Views"
 *   icon={BarChart3}
 *   description="in the past 90 days"
 *   value={1234}
 *   valueLabel="Total"
 *   lastUpdate={Date.now()}
 *   onRefresh={() => refetch()}
 *   chartComponent={<MyChart data={data} compact />}
 * />
 * ```
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
  chartComponent,
  showChartToggle = !!chartComponent,
}: MetricCardProps) {
  const [showChart, setShowChart] = useState(false);

  // Loading state (no data yet)
  if (isLoading && (value === null || value === undefined)) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <CardTitle className="text-sm">Loading...</CardTitle>
          </div>
        </CardHeader>
      </Card>
    );
  }

  // Error state (no data yet)
  if (error && (value === null || value === undefined)) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <CardTitle className="text-sm">{title}</CardTitle>
          </div>
          <CardDescription className="text-xs">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // No data state
  if (value === null || value === undefined) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <CardTitle className="text-sm">{title}</CardTitle>
          </div>
          <CardDescription className="text-xs">
            No data yet. Auto-fetches daily.
          </CardDescription>
        </CardHeader>
        {onRefresh && (
          <CardContent className="pb-3">
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
          </CardContent>
        )}
      </Card>
    );
  }

  // Data state
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <div>
              <CardTitle className="text-sm">{title}</CardTitle>
              {lastUpdate && (
                <CardDescription className="text-[10px] mt-0.5">
                  Updated {formatTimeAgo(lastUpdate)}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
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
            {showChartToggle && chartComponent && (
              <Button
                onClick={() => setShowChart(!showChart)}
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
              >
                {showChart ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {description && (
            <span className="text-xs text-muted-foreground font-normal">
              {valueLabel ? `${valueLabel.toLowerCase()} ${description}` : description}
            </span>
          )}
        </div>

        {showChart && chartComponent && (
          <div className="mt-3 pt-3 border-t">{chartComponent}</div>
        )}
      </CardContent>
    </Card>
  );
}
