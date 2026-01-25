"use client";

import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";
import { Skeleton } from "@sassy/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@sassy/ui/tooltip";

import { useAchievementsStore } from "~/stores/zustand-store";

// Color bins for heat map intensity
function getHeatMapColor(count: number): string {
  if (count === 0) return "#fbf6e5"; // card bg (no activity)
  if (count <= 2) return "rgba(27, 154, 170, 0.2)"; // 20% chart-1
  if (count <= 5) return "rgba(27, 154, 170, 0.4)"; // 40% chart-1
  if (count <= 9) return "rgba(27, 154, 170, 0.7)"; // 70% chart-1
  return "#1b9aaa"; // 100% chart-1 (10+ comments)
}

// Get days from Jan 1, 2026 to today (or 365 days, whichever is less)
function getYear2026Days(): Date[] {
  const days: Date[] = [];
  const startDate = new Date("2026-01-01");
  const today = new Date();

  // Calculate days from start of year to today
  const daysSinceStart = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalDays = Math.min(daysSinceStart + 1, 365);

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    days.push(date);
  }

  return days;
}

// Format date to YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Format date for tooltip
function formatTooltipDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

// Get day of week label
function getDayLabel(dayIndex: number): string {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days[dayIndex] ?? "";
}

// Get month label for a given week
function getMonthLabel(weekIndex: number, days: Date[]): string | null {
  const firstDayOfWeek = days[weekIndex * 7];
  if (!firstDayOfWeek) return null;

  const month = firstDayOfWeek.getMonth();
  const prevWeekFirstDay = days[(weekIndex - 1) * 7];
  const prevMonth = prevWeekFirstDay?.getMonth();

  // Only show month label if it's the first week of a new month
  if (weekIndex === 0 || month !== prevMonth) {
    return new Intl.DateTimeFormat("en-US", { month: "short" }).format(
      firstDayOfWeek
    );
  }

  return null;
}

interface HeatMapGridProps {
  activityData: Array<{ date: string; count: number }>;
  showFullYear?: boolean; // true for desktop, false for mobile (last 180 days)
}

function HeatMapGrid({ activityData, showFullYear = true }: HeatMapGridProps) {
  const allDays = useMemo(() => {
    const yearDays = getYear2026Days();
    // For mobile, show only last 180 days
    return showFullYear ? yearDays : yearDays.slice(-180);
  }, [showFullYear]);

  // Build lookup map for O(1) access
  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    activityData.forEach((item) => {
      map.set(item.date, item.count);
    });
    return map;
  }, [activityData]);

  // Group days into weeks (7 days each)
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      result.push(allDays.slice(i, i + 7));
    }
    return result;
  }, [allDays]);

  const cellSize = 12; // px
  const gap = 2; // px

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        {/* Month labels */}
        <div className="mb-2 flex" style={{ marginLeft: "32px" }}>
          {weeks.map((week, weekIndex) => {
            const label = getMonthLabel(weekIndex, allDays);
            return (
              <div
                key={weekIndex}
                style={{
                  width: `${cellSize}px`,
                  marginRight: `${gap}px`,
                }}
                className="text-xs font-medium"
              >
                {label}
              </div>
            );
          })}
        </div>

        {/* Grid container */}
        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col justify-around pr-2" style={{ width: "30px" }}>
            {[0, 2, 4, 6].map((dayIndex) => (
              <div
                key={dayIndex}
                className="text-muted-foreground text-xs"
                style={{ height: `${cellSize}px`, lineHeight: `${cellSize}px` }}
              >
                {getDayLabel(dayIndex)}
              </div>
            ))}
          </div>

          {/* Heat map grid */}
          <div className="flex gap-[2px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[2px]">
                {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                  const date = week[dayOfWeek];
                  if (!date) {
                    // Empty cell for incomplete weeks
                    return (
                      <div
                        key={dayOfWeek}
                        style={{
                          width: `${cellSize}px`,
                          height: `${cellSize}px`,
                        }}
                      />
                    );
                  }

                  const dateStr = formatDate(date);
                  const count = activityMap.get(dateStr) ?? 0;
                  const color = getHeatMapColor(count);

                  return (
                    <Tooltip key={dayOfWeek} delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div
                          style={{
                            width: `${cellSize}px`,
                            height: `${cellSize}px`,
                            backgroundColor: color,
                          }}
                          className="cursor-default rounded-sm border border-black/10"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {formatTooltipDate(date)} •{" "}
                          {count === 0 ? "No activity" : `${count} cmts`}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Less</span>
          <div className="flex gap-1">
            {[0, 1, 3, 6, 10].map((count) => (
              <div
                key={count}
                style={{
                  width: "12px",
                  height: "12px",
                  backgroundColor: getHeatMapColor(count),
                }}
                className="rounded-sm border border-black/10"
              />
            ))}
          </div>
          <span className="text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}

export function ActivityHeatMapCard() {
  const activityData = useAchievementsStore((s) => s.activityData);
  const isLoading = useAchievementsStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle>Activity Heat Map</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!activityData || activityData.length === 0) {
    return (
      <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle>Activity Heat Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-32 items-center justify-center text-sm">
            No activity data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <CardHeader>
        <CardTitle>Activity Heat Map</CardTitle>
        <p className="text-muted-foreground text-xs">
          2026 commenting activity (year to date)
        </p>
      </CardHeader>
      <CardContent>
        {/* Desktop: Full year */}
        <div className="hidden lg:block">
          <HeatMapGrid activityData={activityData} showFullYear={true} />
        </div>

        {/* Mobile: Last 180 days */}
        <div className="lg:hidden">
          <HeatMapGrid activityData={activityData} showFullYear={false} />
        </div>
      </CardContent>
    </Card>
  );
}
