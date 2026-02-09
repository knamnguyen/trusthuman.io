"use client";

import { useMemo, useState } from "react";
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

export type TimeRange = "7d" | "14d" | "30d" | "90d" | "all";

export const TIME_RANGE_OPTIONS: { value: TimeRange; label: string; days: number }[] = [
  { value: "7d", label: "7D", days: 7 },
  { value: "14d", label: "2W", days: 14 },
  { value: "30d", label: "1M", days: 30 },
  { value: "90d", label: "3M", days: 90 },
  { value: "all", label: "All", days: Infinity },
];

export const METRIC_CONFIGS = [
  { id: "profileViews", label: "Profile Views", dataKey: "profileViews", color: "#1b9aaa" },
  { id: "invites", label: "Invites", dataKey: "invites", color: "#308169" },
  { id: "comments", label: "Comments", dataKey: "comments", color: "#ffc63d" },
  { id: "followers", label: "Followers", dataKey: "followers", color: "#ed6b67" },
  { id: "engageReach", label: "Engage Reach", dataKey: "engageReach", color: "#e5496d" },
  { id: "contentReach", label: "Content Reach", dataKey: "contentReach", color: "#8b5cf6" },
] as const;

interface AnalyticsRecord {
  id: string;
  date: Date | string;
  followers: number;
  invites: number;
  comments: number;
  contentReach: number;
  profileViews: number;
  engageReach: number;
}

interface ChartDataPoint {
  date: string;
  timestamp: number;
  followers?: number;
  invites?: number;
  comments?: number;
  contentReach?: number;
  profileViews?: number;
  engageReach?: number;
}

type ViewMode = "delta" | "absolute";

interface AnalyticsChartProps {
  records: AnalyticsRecord[];
  selectedMetrics: Set<string>;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AnalyticsChart({
  records,
  selectedMetrics,
  timeRange,
  onTimeRangeChange,
}: AnalyticsChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("delta");

  // Filter records by time range and build chart data
  const { chartData, absoluteData } = useMemo(() => {
    if (records.length === 0) {
      return { chartData: [], absoluteData: [] };
    }

    const now = Date.now();
    const timeRangeConfig = TIME_RANGE_OPTIONS.find((t) => t.value === timeRange)!;
    const cutoffDate = timeRange === "all"
      ? 0
      : now - timeRangeConfig.days * 24 * 60 * 60 * 1000;

    // Filter and sort records
    const filteredRecords = records
      .filter((r) => {
        const recordTime = new Date(r.date).getTime();
        return recordTime >= cutoffDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Build absolute data
    const absolute: ChartDataPoint[] = filteredRecords.map((r) => ({
      date: formatDate(r.date),
      timestamp: new Date(r.date).getTime(),
      followers: r.followers,
      invites: r.invites,
      comments: r.comments,
      contentReach: r.contentReach,
      profileViews: r.profileViews,
      engageReach: r.engageReach,
    }));

    // Build delta data (change from previous day)
    const delta: ChartDataPoint[] = absolute.slice(1).map((current, index) => {
      const previous = absolute[index]!;
      return {
        date: current.date,
        timestamp: current.timestamp,
        followers: (current.followers ?? 0) - (previous.followers ?? 0),
        invites: (current.invites ?? 0) - (previous.invites ?? 0),
        comments: (current.comments ?? 0) - (previous.comments ?? 0),
        contentReach: (current.contentReach ?? 0) - (previous.contentReach ?? 0),
        profileViews: (current.profileViews ?? 0) - (previous.profileViews ?? 0),
        engageReach: (current.engageReach ?? 0) - (previous.engageReach ?? 0),
      };
    });

    return {
      chartData: viewMode === "absolute" ? absolute : delta,
      absoluteData: absolute,
    };
  }, [records, timeRange, viewMode]);

  // Show empty state if no metrics selected
  if (selectedMetrics.size === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Analytics Trends</CardTitle>
          <CardDescription>Select metrics above to display on the chart</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Analytics Trends</CardTitle>
          <CardDescription>No data available for the selected time range</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload as ChartDataPoint;
    const absoluteIndex = absoluteData.findIndex((d) => d.timestamp === data.timestamp);
    const absoluteValues = absoluteIndex >= 0 ? absoluteData[absoluteIndex] : null;

    if (viewMode === "delta") {
      return (
        <div className="bg-background rounded-lg border p-3 shadow-md">
          <div className="mb-2 text-sm font-medium">{data.date}</div>
          <div className="space-y-1">
            {METRIC_CONFIGS.filter((m) => selectedMetrics.has(m.id)).map((metric) => {
              const delta = data[metric.dataKey as keyof ChartDataPoint] as number | undefined;
              const absoluteValue = absoluteValues?.[metric.dataKey as keyof ChartDataPoint] as number | undefined;

              if (delta === undefined) return null;

              const deltaText = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "±0";

              return (
                <div key={metric.id} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: metric.color }}
                  />
                  <span
                    className={`font-medium ${delta > 0 ? "text-green-600 dark:text-green-400" : delta < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}
                  >
                    {deltaText}
                  </span>
                  <span className="text-muted-foreground">{metric.label}:</span>
                  <span className="font-medium">
                    {absoluteValue !== undefined ? absoluteValue.toLocaleString() : "N/A"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-muted-foreground mt-2 border-t pt-2 text-xs">
            Daily change from previous day
          </div>
        </div>
      );
    }

    // Absolute mode tooltip
    return (
      <div className="bg-background rounded-lg border p-3 shadow-md">
        <div className="mb-2 text-sm font-medium">{data.date}</div>
        <div className="space-y-1">
          {METRIC_CONFIGS.filter((m) => selectedMetrics.has(m.id)).map((metric) => {
            const value = data[metric.dataKey as keyof ChartDataPoint] as number | undefined;
            if (value === undefined) return null;

            return (
              <div key={metric.id} className="flex items-center gap-2 text-xs">
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: metric.color }}
                />
                <span className="text-muted-foreground">{metric.label}:</span>
                <span className="font-medium">{value.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const chartConfig: ChartConfig = METRIC_CONFIGS.reduce((acc, metric) => {
    acc[metric.dataKey] = {
      label: metric.label,
      color: metric.color,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card>
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">
              {viewMode === "delta" ? "Daily Changes" : "Analytics Trends"}
            </CardTitle>
            <CardDescription className="text-xs">
              {selectedMetrics.size} metric{selectedMetrics.size > 1 ? "s" : ""} ·{" "}
              {chartData.length} day{chartData.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
        </div>
        {/* Controls row */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {/* Time range buttons */}
          <div className="flex items-center gap-1">
            {TIME_RANGE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                onClick={() => onTimeRangeChange(option.value)}
                variant={timeRange === option.value ? "secondary" : "ghost"}
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
              <TabsTrigger value="delta" className="px-2 py-1 text-xs">
                Change
              </TabsTrigger>
              <TabsTrigger value="absolute" className="px-2 py-1 text-xs">
                Total
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="pb-3 pt-0">
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart data={chartData} margin={{ top: 10, left: 12, right: 12, bottom: 0 }}>
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
