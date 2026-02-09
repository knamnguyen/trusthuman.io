"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Eye,
  Mail,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@sassy/ui/card";
import { Skeleton } from "@sassy/ui/skeleton";

import { useTRPC } from "~/trpc/react";

import { AnalyticsChart, METRIC_CONFIGS, TimeRange } from "./AnalyticsChart";
import { MetricCard } from "./MetricCard";

const METRIC_ICONS = {
  profileViews: BarChart3,
  invites: Mail,
  comments: MessageSquare,
  followers: Users,
  engageReach: Eye,
  contentReach: TrendingUp,
} as const;

export function AnalyticsSection() {
  const trpc = useTRPC();

  // Fetch analytics data (default 90 days)
  const { data, isLoading, error } = useQuery(
    trpc.analytics.getDailyAnalytics.queryOptions({ days: 90 }),
  );

  // Selection state for metrics to display on chart
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(
    new Set(["profileViews", "invites", "comments"]),
  );

  // Time range for chart
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  // Toggle metric selection
  const toggleMetric = (metricId: string) => {
    setSelectedMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(metricId)) {
        next.delete(metricId);
      } else {
        next.add(metricId);
      }
      return next;
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Analytics</h2>
          <p className="text-muted-foreground text-sm">
            LinkedIn account metrics synced from extension
          </p>
        </div>
        <div className="flex gap-3">
          <div className="grid w-64 shrink-0 grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-[280px] flex-1 rounded-lg" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Analytics</CardTitle>
          <CardDescription className="text-destructive">
            Failed to load analytics: {error.message}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // No data state
  if (!data || data.records.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Analytics</CardTitle>
          <CardDescription>
            No analytics data yet. Install the EngageKit extension and sync your
            LinkedIn analytics to see metrics here.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { records, percentageChanges, latest } = data;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Analytics</h2>
        <p className="text-muted-foreground text-sm">
          Click metrics to toggle on chart
        </p>
      </div>

      {/* Horizontal layout: cards left, chart right */}
      <div className="flex flex-col gap-3 lg:flex-row">
        {/* Metric cards - 2 columns x 3 rows */}
        <div className="grid w-full grid-cols-3 gap-2 lg:w-64 lg:shrink-0 lg:grid-cols-2">
          {METRIC_CONFIGS.map((metric) => {
            const Icon = METRIC_ICONS[metric.id as keyof typeof METRIC_ICONS];
            const value = latest?.[metric.dataKey as keyof typeof latest] as number | undefined;
            const change = percentageChanges?.[metric.dataKey as keyof typeof percentageChanges] as number | undefined;

            return (
              <MetricCard
                key={metric.id}
                title={metric.label}
                icon={Icon}
                value={value}
                percentageChange={change}
                selected={selectedMetrics.has(metric.id)}
                onClick={() => toggleMetric(metric.id)}
                color={metric.color}
              />
            );
          })}
        </div>

        {/* Analytics chart - takes remaining width */}
        <div className="min-w-0 flex-1">
          <AnalyticsChart
            records={records}
            selectedMetrics={selectedMetrics}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />
        </div>
      </div>
    </div>
  );
}
