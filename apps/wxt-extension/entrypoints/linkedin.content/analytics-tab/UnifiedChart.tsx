import { useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip } from "@sassy/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@sassy/ui/tabs";

import type { DataSnapshot } from "../utils/data-fetch-mimic/data-collector";

export interface MetricConfig {
  id: string;
  label: string;
  dataKey: string;
  color: string;
  valueFormatter?: (value: number) => string;
}

interface UnifiedChartProps {
  snapshots: {
    profileViews?: DataSnapshot<{ totalViews: number; period: string }>[];
    inviteCount?: DataSnapshot<{ totalInvites: number }>[];
    comments?: DataSnapshot<{ totalComments: number; period: string }>[];
    followers?: DataSnapshot<{ totalFollowers: number }>[];
    profileImpressions?: DataSnapshot<{ totalImpressions: number; period: string }>[];
    contentImpressions?: DataSnapshot<{ totalImpressions: number; period: string }>[];
  };
  selectedMetrics: Set<string>;
}

interface ChartDataPoint {
  timestamp: number;
  date: string;
  profileViews?: number;
  inviteCount?: number;
  comments?: number;
  followers?: number;
  profileImpressions?: number;
  contentImpressions?: number;
}

type ViewMode = "absolute" | "delta";
type TimeRange = "7d" | "2w" | "4w" | "3m" | "1y" | "all";

export const TIME_RANGE_OPTIONS: { value: TimeRange; label: string; days: number }[] = [
  { value: "7d", label: "7D", days: 7 },
  { value: "2w", label: "2W", days: 14 },
  { value: "4w", label: "4W", days: 28 },
  { value: "3m", label: "3M", days: 90 },
  { value: "1y", label: "1Y", days: 365 },
  { value: "all", label: "All", days: Infinity },
];

const METRIC_CONFIGS: MetricConfig[] = [
  {
    id: "profileViews",
    label: "Profile Views",
    dataKey: "profileViews",
    color: "#1b9aaa",
    valueFormatter: (v) => `${v.toLocaleString()} views`,
  },
  {
    id: "inviteCount",
    label: "Invites",
    dataKey: "inviteCount",
    color: "#308169",
    valueFormatter: (v) => `${v.toLocaleString()} invites`,
  },
  {
    id: "comments",
    label: "Comments",
    dataKey: "comments",
    color: "#ffc63d",
    valueFormatter: (v) => `${v.toLocaleString()} comments`,
  },
  {
    id: "followers",
    label: "Followers",
    dataKey: "followers",
    color: "#ed6b67",
    valueFormatter: (v) => `${v.toLocaleString()} followers`,
  },
  {
    id: "profileImpressions",
    label: "Engage Reach",
    dataKey: "profileImpressions",
    color: "#e5496d",
    valueFormatter: (v) => `${v.toLocaleString()} impressions`,
  },
  {
    id: "contentImpressions",
    label: "Content Reach",
    dataKey: "contentImpressions",
    color: "#8b5cf6",
    valueFormatter: (v) => `${v.toLocaleString()} impressions`,
  },
];

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDayStart(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function aggregateByDay<T>(
  snapshots: DataSnapshot<T>[] | undefined,
  getValue: (data: T) => number
): Map<number, number> {
  const dailyData = new Map<number, { value: number; timestamp: number }>();

  if (!snapshots) return new Map();

  for (const snapshot of snapshots) {
    const dayStart = getDayStart(snapshot.timestamp);
    const existing = dailyData.get(dayStart);

    if (!existing || snapshot.timestamp > existing.timestamp) {
      dailyData.set(dayStart, {
        value: getValue(snapshot.data),
        timestamp: snapshot.timestamp,
      });
    }
  }

  const result = new Map<number, number>();
  for (const [day, data] of dailyData) {
    result.set(day, data.value);
  }
  return result;
}

function generateDayRange(minTimestamp: number, maxTimestamp: number): number[] {
  const days: number[] = [];
  const start = getDayStart(minTimestamp);
  const end = getDayStart(maxTimestamp);

  let current = start;
  while (current <= end) {
    days.push(current);
    current += 24 * 60 * 60 * 1000;
  }

  return days;
}

export type { TimeRange };

interface UnifiedChartPropsExtended extends UnifiedChartProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export function UnifiedChart({ snapshots, selectedMetrics, timeRange, onTimeRangeChange }: UnifiedChartPropsExtended) {
  const [viewMode, setViewMode] = useState<ViewMode>("delta");

  // Show empty state if no metrics selected
  if (selectedMetrics.size === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Analytics Trends</CardTitle>
          <CardDescription>
            Select metrics above to display on the chart
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Aggregate all metrics by day
  const dailyProfileViews = selectedMetrics.has("profileViews")
    ? aggregateByDay(snapshots.profileViews, (d) => d.totalViews)
    : new Map<number, number>();
  const dailyInviteCount = selectedMetrics.has("inviteCount")
    ? aggregateByDay(snapshots.inviteCount, (d) => d.totalInvites)
    : new Map<number, number>();
  const dailyComments = selectedMetrics.has("comments")
    ? aggregateByDay(snapshots.comments, (d) => d.totalComments)
    : new Map<number, number>();
  const dailyFollowers = selectedMetrics.has("followers")
    ? aggregateByDay(snapshots.followers, (d) => d.totalFollowers)
    : new Map<number, number>();
  const dailyProfileImpressions = selectedMetrics.has("profileImpressions")
    ? aggregateByDay(snapshots.profileImpressions, (d) => d.totalImpressions)
    : new Map<number, number>();
  const dailyContentImpressions = selectedMetrics.has("contentImpressions")
    ? aggregateByDay(snapshots.contentImpressions, (d) => d.totalImpressions)
    : new Map<number, number>();

  // Find all days with data
  const allDaysWithData = new Set<number>();
  dailyProfileViews.forEach((_, day) => allDaysWithData.add(day));
  dailyInviteCount.forEach((_, day) => allDaysWithData.add(day));
  dailyComments.forEach((_, day) => allDaysWithData.add(day));
  dailyFollowers.forEach((_, day) => allDaysWithData.add(day));
  dailyProfileImpressions.forEach((_, day) => allDaysWithData.add(day));
  dailyContentImpressions.forEach((_, day) => allDaysWithData.add(day));

  const sortedDaysWithData = Array.from(allDaysWithData).sort((a, b) => a - b);

  if (sortedDaysWithData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Analytics Trends</CardTitle>
          <CardDescription>No data available yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Apply time range filter
  const now = Date.now();
  const timeRangeConfig = TIME_RANGE_OPTIONS.find((t) => t.value === timeRange)!;
  const cutoffDate = timeRange === "all"
    ? sortedDaysWithData[0]!
    : getDayStart(now - timeRangeConfig.days * 24 * 60 * 60 * 1000);

  const lastDay = sortedDaysWithData[sortedDaysWithData.length - 1]!;
  const firstDay = Math.max(sortedDaysWithData[0]!, cutoffDate);

  // Generate all days in range
  const allDays = generateDayRange(firstDay, lastDay);

  // Build absolute data with carry-forward
  const lastKnownValues: Record<string, number> = {};
  const absoluteData: ChartDataPoint[] = allDays.map((dayStart) => {
    const dataPoint: ChartDataPoint = {
      timestamp: dayStart,
      date: formatDate(dayStart),
    };

    if (dailyProfileViews.has(dayStart)) {
      lastKnownValues.profileViews = dailyProfileViews.get(dayStart)!;
    }
    if (lastKnownValues.profileViews !== undefined) {
      dataPoint.profileViews = lastKnownValues.profileViews;
    }

    if (dailyInviteCount.has(dayStart)) {
      lastKnownValues.inviteCount = dailyInviteCount.get(dayStart)!;
    }
    if (lastKnownValues.inviteCount !== undefined) {
      dataPoint.inviteCount = lastKnownValues.inviteCount;
    }

    if (dailyComments.has(dayStart)) {
      lastKnownValues.comments = dailyComments.get(dayStart)!;
    }
    if (lastKnownValues.comments !== undefined) {
      dataPoint.comments = lastKnownValues.comments;
    }

    if (dailyFollowers.has(dayStart)) {
      lastKnownValues.followers = dailyFollowers.get(dayStart)!;
    }
    if (lastKnownValues.followers !== undefined) {
      dataPoint.followers = lastKnownValues.followers;
    }

    if (dailyProfileImpressions.has(dayStart)) {
      lastKnownValues.profileImpressions = dailyProfileImpressions.get(dayStart)!;
    }
    if (lastKnownValues.profileImpressions !== undefined) {
      dataPoint.profileImpressions = lastKnownValues.profileImpressions;
    }

    if (dailyContentImpressions.has(dayStart)) {
      lastKnownValues.contentImpressions = dailyContentImpressions.get(dayStart)!;
    }
    if (lastKnownValues.contentImpressions !== undefined) {
      dataPoint.contentImpressions = lastKnownValues.contentImpressions;
    }

    return dataPoint;
  });

  // Build delta data (change from previous day)
  const deltaData: ChartDataPoint[] = absoluteData.slice(1).map((current, index) => {
    const previous = absoluteData[index];
    const dataPoint: ChartDataPoint = {
      timestamp: current.timestamp,
      date: current.date,
    };

    if (current.profileViews !== undefined && previous?.profileViews !== undefined) {
      dataPoint.profileViews = current.profileViews - previous.profileViews;
    }
    if (current.inviteCount !== undefined && previous?.inviteCount !== undefined) {
      dataPoint.inviteCount = current.inviteCount - previous.inviteCount;
    }
    if (current.comments !== undefined && previous?.comments !== undefined) {
      dataPoint.comments = current.comments - previous.comments;
    }
    if (current.followers !== undefined && previous?.followers !== undefined) {
      dataPoint.followers = current.followers - previous.followers;
    }
    if (current.profileImpressions !== undefined && previous?.profileImpressions !== undefined) {
      dataPoint.profileImpressions = current.profileImpressions - previous.profileImpressions;
    }
    if (current.contentImpressions !== undefined && previous?.contentImpressions !== undefined) {
      dataPoint.contentImpressions = current.contentImpressions - previous.contentImpressions;
    }

    return dataPoint;
  });

  // Select data based on view mode
  const chartData = viewMode === "absolute" ? absoluteData : deltaData;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload as ChartDataPoint;

    if (viewMode === "delta") {
      const absoluteIndex = absoluteData.findIndex((d) => d.timestamp === data.timestamp);
      const absoluteValues = absoluteIndex >= 0 ? absoluteData[absoluteIndex] : null;

      return (
        <div className="bg-background rounded-lg border p-3 shadow-md">
          <div className="mb-2 text-sm font-medium">{formatDate(data.timestamp)}</div>
          <div className="space-y-1">
            {METRIC_CONFIGS.filter((m) => selectedMetrics.has(m.id)).map((metric) => {
              const delta = data[metric.dataKey as keyof ChartDataPoint] as number | undefined;
              const absoluteValue = absoluteValues?.[metric.dataKey as keyof ChartDataPoint] as number | undefined;

              if (delta === undefined) return null;

              const deltaText = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "±0";

              return (
                <div key={metric.id} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: metric.color }}
                  />
                  <span className={`font-medium ${delta > 0 ? "text-green-600 dark:text-green-400" : delta < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                    {deltaText}
                  </span>
                  <span className="text-muted-foreground">{metric.label}:</span>
                  <span className="font-medium">
                    {absoluteValue !== undefined
                      ? (metric.valueFormatter ? metric.valueFormatter(absoluteValue) : absoluteValue)
                      : "N/A"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
            Daily change from previous day
          </div>
        </div>
      );
    }

    // Absolute mode tooltip
    return (
      <div className="bg-background rounded-lg border p-3 shadow-md">
        <div className="mb-2 text-sm font-medium">{formatDate(data.timestamp)}</div>
        <div className="space-y-1">
          {METRIC_CONFIGS.filter((m) => selectedMetrics.has(m.id)).map((metric) => {
            const value = data[metric.dataKey as keyof ChartDataPoint] as number | undefined;
            if (value === undefined) return null;

            return (
              <div key={metric.id} className="flex items-center gap-2 text-xs">
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: metric.color }}
                />
                <span className="text-muted-foreground">{metric.label}:</span>
                <span className="font-medium">
                  {metric.valueFormatter ? metric.valueFormatter(value) : value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const chartConfig = METRIC_CONFIGS.reduce((acc, metric) => {
    acc[metric.dataKey] = {
      label: metric.label,
      color: metric.color,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {viewMode === "delta" ? "Daily Changes" : "Analytics Trends"}
            </CardTitle>
            <CardDescription>
              {selectedMetrics.size} metric{selectedMetrics.size > 1 ? "s" : ""} · {chartData.length} day{chartData.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
        </div>
        {/* Controls row */}
        <div className="flex items-center justify-between gap-2 mt-3">
          {/* Time range buttons */}
          <div className="flex items-center gap-1">
            {TIME_RANGE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                onClick={() => onTimeRangeChange(option.value)}
                variant={timeRange === option.value ? "primary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
          {/* View mode toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="delta" className="text-xs px-2 py-1">
                Change
              </TabsTrigger>
              <TabsTrigger value="absolute" className="text-xs px-2 py-1">
                Total
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={chartData} margin={{ top: 20, left: 12, right: 12, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.toLocaleString()}
              tick={{ fontSize: 10 }}
            />
            <ChartTooltip content={<CustomTooltip />} />
            {METRIC_CONFIGS.filter((m) => selectedMetrics.has(m.id)).map((metric) => (
              <Line
                key={metric.id}
                dataKey={metric.dataKey}
                type="monotone"
                stroke={metric.color}
                strokeWidth={2}
                dot={{ fill: metric.color, r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
