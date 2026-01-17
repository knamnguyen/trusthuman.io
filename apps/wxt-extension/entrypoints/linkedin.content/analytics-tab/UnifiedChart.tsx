import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip } from "@sassy/ui/chart";

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
    // posts?: DataSnapshot<{ totalPosts: number; period: string }>[]; // COMMENTED OUT - Replaced with invite count
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
  // posts?: number; // COMMENTED OUT - Replaced with invite count
  inviteCount?: number;
  comments?: number;
  followers?: number;
  profileImpressions?: number;
  contentImpressions?: number;
}

const METRIC_CONFIGS: MetricConfig[] = [
  {
    id: "profileViews",
    label: "Profile Views",
    dataKey: "profileViews",
    color: "#1b9aaa", // Teal
    valueFormatter: (v) => `${v.toLocaleString()} views`,
  },
  // COMMENTED OUT - Replaced with invite count
  // {
  //   id: "posts",
  //   label: "Posts",
  //   dataKey: "posts",
  //   color: "#308169", // Green
  //   valueFormatter: (v) => `${v.toLocaleString()} posts`,
  // },
  {
    id: "inviteCount",
    label: "Invites",
    dataKey: "inviteCount",
    color: "#308169", // Green (reuse same color)
    valueFormatter: (v) => `${v.toLocaleString()} invites`,
  },
  {
    id: "comments",
    label: "Comments",
    dataKey: "comments",
    color: "#ffc63d", // Yellow
    valueFormatter: (v) => `${v.toLocaleString()} comments`,
  },
  {
    id: "followers",
    label: "Followers",
    dataKey: "followers",
    color: "#ed6b67", // Red/Coral
    valueFormatter: (v) => `${v.toLocaleString()} followers`,
  },
  {
    id: "profileImpressions",
    label: "Engage Reach",
    dataKey: "profileImpressions",
    color: "#e5496d", // Pink/Magenta
    valueFormatter: (v) => `${v.toLocaleString()} impressions`,
  },
  {
    id: "contentImpressions",
    label: "Content Reach",
    dataKey: "contentImpressions",
    color: "#8b5cf6", // Purple
    valueFormatter: (v) => `${v.toLocaleString()} impressions`,
  },
];

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Normalize timestamp to the nearest minute to group fetches together
 * This prevents misalignment when metrics are fetched a few seconds apart
 */
function normalizeTimestamp(timestamp: number): number {
  // Round to nearest minute (60000ms)
  return Math.round(timestamp / 60000) * 60000;
}

export function UnifiedChart({ snapshots, selectedMetrics }: UnifiedChartProps) {
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

  // Find all unique timestamps across all selected metrics
  // Normalize timestamps to prevent misalignment from fetches a few seconds apart
  const allTimestamps = new Set<number>();

  if (selectedMetrics.has("profileViews") && snapshots.profileViews) {
    snapshots.profileViews.forEach((s) => allTimestamps.add(normalizeTimestamp(s.timestamp)));
  }
  // COMMENTED OUT - Replaced with invite count
  // if (selectedMetrics.has("posts") && snapshots.posts) {
  //   snapshots.posts.forEach((s) => allTimestamps.add(normalizeTimestamp(s.timestamp)));
  // }
  if (selectedMetrics.has("inviteCount") && snapshots.inviteCount) {
    snapshots.inviteCount.forEach((s) => allTimestamps.add(normalizeTimestamp(s.timestamp)));
  }
  if (selectedMetrics.has("comments") && snapshots.comments) {
    snapshots.comments.forEach((s) => allTimestamps.add(normalizeTimestamp(s.timestamp)));
  }
  if (selectedMetrics.has("followers") && snapshots.followers) {
    snapshots.followers.forEach((s) => allTimestamps.add(normalizeTimestamp(s.timestamp)));
  }
  if (selectedMetrics.has("profileImpressions") && snapshots.profileImpressions) {
    snapshots.profileImpressions.forEach((s) => allTimestamps.add(normalizeTimestamp(s.timestamp)));
  }
  if (selectedMetrics.has("contentImpressions") && snapshots.contentImpressions) {
    snapshots.contentImpressions.forEach((s) => allTimestamps.add(normalizeTimestamp(s.timestamp)));
  }

  // Convert to sorted array (oldest to newest for chronological chart)
  const timestamps = Array.from(allTimestamps).sort((a, b) => a - b);

  // Debug logging
  console.log("📊 UnifiedChart: Unique normalized timestamps:", timestamps.map((t) => ({
    timestamp: t,
    date: formatDate(t),
    readable: new Date(t).toISOString(),
  })));

  // Build chart data by merging all metrics at each normalized timestamp
  const chartData: ChartDataPoint[] = timestamps.map((normalizedTimestamp) => {
    const dataPoint: ChartDataPoint = {
      timestamp: normalizedTimestamp,
      date: formatDate(normalizedTimestamp),
    };

    if (selectedMetrics.has("profileViews") && snapshots.profileViews) {
      const snapshot = snapshots.profileViews.find((s) => normalizeTimestamp(s.timestamp) === normalizedTimestamp);
      if (snapshot) dataPoint.profileViews = snapshot.data.totalViews;
    }

    // COMMENTED OUT - Replaced with invite count
    // if (selectedMetrics.has("posts") && snapshots.posts) {
    //   const snapshot = snapshots.posts.find((s) => normalizeTimestamp(s.timestamp) === normalizedTimestamp);
    //   if (snapshot) dataPoint.posts = snapshot.data.totalPosts;
    // }

    if (selectedMetrics.has("inviteCount") && snapshots.inviteCount) {
      const snapshot = snapshots.inviteCount.find((s) => normalizeTimestamp(s.timestamp) === normalizedTimestamp);
      if (snapshot) dataPoint.inviteCount = snapshot.data.totalInvites;
    }

    if (selectedMetrics.has("comments") && snapshots.comments) {
      const snapshot = snapshots.comments.find((s) => normalizeTimestamp(s.timestamp) === normalizedTimestamp);
      if (snapshot) dataPoint.comments = snapshot.data.totalComments;
    }

    if (selectedMetrics.has("followers") && snapshots.followers) {
      const snapshot = snapshots.followers.find((s) => normalizeTimestamp(s.timestamp) === normalizedTimestamp);
      if (snapshot) dataPoint.followers = snapshot.data.totalFollowers;
    }

    if (selectedMetrics.has("profileImpressions") && snapshots.profileImpressions) {
      const snapshot = snapshots.profileImpressions.find((s) => normalizeTimestamp(s.timestamp) === normalizedTimestamp);
      if (snapshot) dataPoint.profileImpressions = snapshot.data.totalImpressions;
    }

    if (selectedMetrics.has("contentImpressions") && snapshots.contentImpressions) {
      const snapshot = snapshots.contentImpressions.find((s) => normalizeTimestamp(s.timestamp) === normalizedTimestamp);
      if (snapshot) dataPoint.contentImpressions = snapshot.data.totalImpressions;
    }

    return dataPoint;
  });

  // Custom tooltip showing all selected metrics with deltas and time since last fetch
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload as ChartDataPoint;

    // Find the index of the current data point
    const currentIndex = chartData.findIndex((d) => d.timestamp === data.timestamp);
    const previousData = currentIndex > 0 ? chartData[currentIndex - 1] : null;

    // Calculate time since previous snapshot
    const timeSincePrevious = previousData
      ? data.timestamp - previousData.timestamp
      : null;

    const formatTimeSince = (ms: number | null) => {
      if (!ms) return null;
      const minutes = Math.floor(ms / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return "just now";
    };

    return (
      <div className="bg-background rounded-lg border p-3 shadow-md">
        <div className="mb-2 text-sm font-medium">{formatDate(data.timestamp)}</div>
        <div className="space-y-1">
          {METRIC_CONFIGS.filter((m) => selectedMetrics.has(m.id)).map((metric) => {
            const value = data[metric.dataKey as keyof ChartDataPoint];
            if (value === undefined) return null;

            // Calculate delta from previous data point
            const previousValue = previousData?.[metric.dataKey as keyof ChartDataPoint];
            const delta = previousValue !== undefined ? (value as number) - (previousValue as number) : null;
            const deltaText = delta !== null
              ? delta > 0
                ? `+${delta}`
                : delta < 0
                ? `${delta}`
                : "±0"
              : null;

            return (
              <div key={metric.id} className="flex items-center gap-2 text-xs">
                <div
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: metric.color }}
                />
                {deltaText && (
                  <span className={`font-medium ${delta! > 0 ? "text-green-600 dark:text-green-400" : delta! < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
                    {deltaText}
                  </span>
                )}
                <span className="text-muted-foreground">{metric.label}:</span>
                <span className="font-medium">
                  {metric.valueFormatter ? metric.valueFormatter(value as number) : value}
                </span>
              </div>
            );
          })}
        </div>
        {timeSincePrevious && (
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
            Since last fetch: {formatTimeSince(timeSincePrevious)}
          </div>
        )}
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
        <CardTitle className="text-base">Analytics Trends</CardTitle>
        <CardDescription>
          {selectedMetrics.size} metric{selectedMetrics.size > 1 ? "s" : ""} selected
        </CardDescription>
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
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.toLocaleString()}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip content={<CustomTooltip />} />
            {METRIC_CONFIGS.filter((m) => selectedMetrics.has(m.id)).map((metric) => (
              <Line
                key={metric.id}
                dataKey={metric.dataKey}
                type="monotone"
                stroke={metric.color}
                strokeWidth={2}
                dot={{ fill: metric.color, r: 4 }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
