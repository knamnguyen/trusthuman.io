import { TrendingUp } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip } from "@sassy/ui/chart";

import type { DataSnapshot } from "../utils/data-fetch-mimic/data-collector";
import type { ProfileViewData } from "../utils/data-fetch-mimic/linkedin-personal-profile-view-fetcher";

interface ProfileViewsChartProps {
  snapshots: DataSnapshot<ProfileViewData>[];
  compact?: boolean;
}

interface ChartDataPoint {
  timestamp: number;
  date: string;
  totalViews: number;
  change: number;
  dailyRate: number;
  daysElapsed: number;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const chartConfig = {
  totalViews: {
    label: "Total Views",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function ProfileViewsChart({
  snapshots,
  compact = false,
}: ProfileViewsChartProps) {
  // Show empty state if less than 2 snapshots
  if (snapshots.length < 2) {
    if (compact) {
      return (
        <div className="text-muted-foreground py-4 text-center text-xs">
          Collect more data to see trends
        </div>
      );
    }
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <CardTitle className="text-base">Growth Trend</CardTitle>
          </div>
          <CardDescription>
            Collect more data to see growth trends
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Transform snapshots into chart data (newest first -> oldest last for chronological chart)
  const chartData: ChartDataPoint[] = [...snapshots]
    .reverse()
    .map((snapshot, index, arr) => {
      const nextSnapshot = arr[index + 1];

      // Calculate metrics compared to next snapshot (chronologically)
      const changeSinceLastFetch = nextSnapshot
        ? snapshot.data.totalViews - nextSnapshot.data.totalViews
        : 0;

      const daysElapsed = nextSnapshot
        ? Math.max(
            (snapshot.timestamp - nextSnapshot.timestamp) /
              (1000 * 60 * 60 * 24),
            0.1,
          )
        : 0;

      const avgDailyRate =
        daysElapsed > 0 ? changeSinceLastFetch / daysElapsed : 0;

      return {
        timestamp: snapshot.timestamp,
        date: formatDate(snapshot.timestamp),
        totalViews: snapshot.data.totalViews,
        change: changeSinceLastFetch,
        dailyRate: avgDailyRate,
        daysElapsed,
      };
    });

  // Custom tooltip content
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;

    const data = payload[0].payload as ChartDataPoint;

    return (
      <div className="bg-background rounded-lg border p-3 shadow-md">
        <div className="mb-2 text-sm font-medium">
          {formatDate(data.timestamp)}
        </div>
        <div className="mb-2 text-2xl font-bold">
          {data.totalViews.toLocaleString()}
        </div>
        <div className="text-muted-foreground space-y-1 text-xs">
          <div>
            {data.change > 0 ? "+" : ""}
            {data.change.toLocaleString()} views since{" "}
            {formatTimeAgo(
              data.timestamp - data.daysElapsed * 24 * 60 * 60 * 1000,
            )}
          </div>
          <div>~{Math.abs(data.dailyRate).toFixed(1)} views/day avg</div>
        </div>
      </div>
    );
  };

  const chartComponent = (
    <ChartContainer
      config={chartConfig}
      className={compact ? "h-[150px] w-full" : "h-[200px] w-full"}
    >
      <LineChart
        data={chartData}
        margin={
          compact
            ? { top: 20, left: 0, right: 0, bottom: 0 }
            : { top: 20, left: 12, right: 12, bottom: 0 }
        }
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: compact ? 10 : 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={compact ? 8 : 8}
          width={compact ? 30 : undefined}
          domain={["auto", "auto"]}
          tickFormatter={(value) => value.toLocaleString()}
          tick={{ fontSize: compact ? 10 : 12 }}
        />
        <ChartTooltip content={<CustomTooltip />} />
        <Line
          dataKey="totalViews"
          type="monotone"
          stroke="hsl(var(--chart-1))"
          strokeWidth={compact ? 2 : 3}
          strokeOpacity={1}
          dot={{
            fill: "hsl(var(--chart-1))",
            stroke: "hsl(var(--background))",
            strokeWidth: 2,
            r: compact ? 3 : 5,
          }}
          activeDot={{
            r: compact ? 5 : 7,
            stroke: "hsl(var(--chart-1))",
            strokeWidth: 2,
          }}
          label={
            compact
              ? false
              : {
                  position: "top",
                  offset: 10,
                  formatter: (value: number) => value.toLocaleString(),
                  fontSize: 12,
                  fontWeight: 600,
                  fill: "hsl(var(--foreground))",
                }
          }
        />
      </LineChart>
    </ChartContainer>
  );

  if (compact) {
    return (
      <div>
        <div className="text-muted-foreground mb-2 text-xs">
          {snapshots.length} snapshots
        </div>
        {chartComponent}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <CardTitle className="text-base">Growth Trend</CardTitle>
        </div>
        <CardDescription>
          Profile views over {snapshots.length} snapshots
        </CardDescription>
      </CardHeader>
      <CardContent>{chartComponent}</CardContent>
    </Card>
  );
}
