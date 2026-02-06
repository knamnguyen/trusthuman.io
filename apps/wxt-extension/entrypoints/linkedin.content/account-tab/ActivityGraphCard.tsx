import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";

import {
  analyzeFairUse,
  getWarmUpGuidance,
  type FairUseAnalysis,
} from "./fair-use-score";
import {
  useCommentHistory,
  type CommentHistoryData,
  type DaysOption,
} from "./use-comment-history";

// ============================================================================
// Simple Bar Graph Component
// ============================================================================

function SimpleBarGraph({
  data,
  analysis,
}: {
  data: CommentHistoryData;
  analysis: FairUseAnalysis;
}) {
  const [hoveredBar, setHoveredBar] = useState<{
    date: string;
    count: number;
  } | null>(null);

  const counts = Object.entries(data.dailyCounts).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const maxCount = Math.max(...counts.map(([, count]) => count), 1);
  const totalDays = counts.length;

  // Show label every N days based on total days
  const labelInterval = totalDays <= 14 ? 2 : totalDays <= 30 ? 5 : 10;

  // Use recommended max for color thresholds
  const { recommendedRange } = analysis;
  const greenThreshold = recommendedRange.max;
  const yellowThreshold = recommendedRange.max * 1.3;

  return (
    <div className="space-y-2">
      {/* Hover info display */}
      <div className="flex h-6 items-center justify-center">
        {hoveredBar ? (
          <span className="text-sm font-medium">
            {new Date(hoveredBar.date + "T00:00:00").toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric" },
            )}
            : <strong>{hoveredBar.count}</strong> comments
            {hoveredBar.count > yellowThreshold && (
              <span className="ml-1 text-red-600">(high!)</span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">
            Hover over bars to see details
          </span>
        )}
      </div>

      {/* Bar graph */}
      <div
        className="flex items-end justify-between gap-[2px]"
        style={{ height: "100px" }}
      >
        {counts.map(([date, count]) => {
          const heightPercent = (count / maxCount) * 100;
          // Color based on recommended range
          const barColor =
            count <= greenThreshold
              ? "bg-green-500"
              : count <= yellowThreshold
                ? "bg-yellow-500"
                : "bg-red-500";

          return (
            <div
              key={date}
              className="flex min-w-0 flex-1 cursor-pointer items-end justify-center"
              style={{ height: "100%" }}
              onMouseEnter={() => setHoveredBar({ date, count })}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div
                className={`w-full ${barColor} rounded-t transition-all hover:opacity-70`}
                style={{ height: `${Math.max(heightPercent, 3)}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Date labels - show only every N days */}
      <div className="flex justify-between text-[9px]">
        {counts.map(([date], index) => {
          const showLabel =
            index === 0 ||
            index === counts.length - 1 ||
            index % labelInterval === 0;
          return (
            <div key={date} className="min-w-0 flex-1 text-center">
              {showLabel && (
                <span className="text-muted-foreground">
                  {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Fair Use Score Display Component (New Algorithm)
// ============================================================================

function FairUseScoreDisplay({ analysis }: { analysis: FairUseAnalysis }) {
  const [showDetails, setShowDetails] = useState(false);

  const scoreConfig = {
    safe: {
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      icon: CheckCircle,
    },
    warning: {
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      icon: AlertTriangle,
    },
    danger: {
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      icon: AlertCircle,
    },
  };

  const config = scoreConfig[analysis.score];
  const Icon = config.icon;
  const guidance = getWarmUpGuidance(analysis.phase);

  // Phase display names
  const phaseLabels: Record<string, string> = {
    dormant: "Dormant",
    returning: "Returning",
    warming: "Warming Up",
    growing: "Growing",
    established: "Established",
    power_user: "Power User",
  };

  return (
    <div
      className={`mt-4 rounded-lg border p-4 ${config.bgColor} ${config.borderColor}`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${config.color}`} />
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-1 flex items-center gap-2 flex-wrap">
            <span className={`font-semibold ${config.color}`}>
              Fair Use Score
            </span>
            <Badge
              variant={
                analysis.score === "safe"
                  ? "default"
                  : analysis.score === "warning"
                    ? "secondary"
                    : "destructive"
              }
            >
              {analysis.score.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {phaseLabels[analysis.phase]}
            </Badge>
          </div>

          {/* Main message */}
          <p className="text-muted-foreground mb-2 text-sm">{analysis.message}</p>

          {/* Key metrics */}
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span>
              Recent Avg: <strong>{analysis.recentAverage}</strong>/day
            </span>
            <span>
              Max: <strong>{analysis.maxDaily}</strong>
            </span>
            <span>
              Safe Range:{" "}
              <strong>
                {analysis.recommendedRange.min}-{analysis.recommendedRange.max}
              </strong>
              /day
            </span>
          </div>

          {/* Warnings */}
          {analysis.warnings.length > 0 && (
            <div className="mt-3 space-y-1">
              {analysis.warnings.map((warning, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-amber-700"
                >
                  <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}

          {/* Expandable details */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="h-3 w-3" />
            <span>{showDetails ? "Hide" : "Show"} warm-up guidance</span>
            {showDetails ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {showDetails && (
            <div className="mt-2 rounded bg-white/50 p-3 text-xs">
              <p className="font-medium mb-2">
                Recommended warm-up for {phaseLabels[analysis.phase]} accounts:
              </p>
              <ul className="space-y-1 text-muted-foreground">
                {guidance.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {analysis.consecutiveActiveDays > 0 && (
                <p className="mt-2 text-muted-foreground">
                  You've been active for{" "}
                  <strong>{analysis.consecutiveActiveDays}</strong> consecutive
                  days.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main ActivityGraphCard Component
// ============================================================================

const DAYS_OPTIONS: { value: DaysOption; label: string }[] = [
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 60, label: "60 days" },
];

export function ActivityGraphCard() {
  const [selectedDays, setSelectedDays] = useState<DaysOption>(30);
  const { data, isLoading, error, fetchWithDays, lastFetchTime, fromCache } =
    useCommentHistory();

  const handleFetch = () => {
    fetchWithDays(selectedDays);
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDays = Number(e.target.value) as DaysOption;
    setSelectedDays(newDays);
    // Auto-fetch when changing days if we have data
    if (data) {
      fetchWithDays(newDays);
    }
  };

  // Analyze the data with new algorithm
  const analysis = data ? analyzeFairUse(data.dailyCounts) : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Activity Graph</CardTitle>
            {lastFetchTime && (
              <p className="text-muted-foreground text-[10px] mt-0.5">
                {fromCache ? "From cache • " : ""}
                Last updated:{" "}
                {new Date(lastFetchTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedDays}
              onChange={handleDaysChange}
              disabled={isLoading}
              className="bg-background focus:ring-primary rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1"
            >
              {DAYS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFetch}
              disabled={isLoading}
              className="h-8 w-8 p-0"
              title="Fetch comment history"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Idle state */}
        {!data && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <RefreshCw className="text-muted-foreground mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              Select a time period and click refresh to load your activity
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="text-muted-foreground mb-2 h-8 w-8 animate-spin" />
            <p className="text-muted-foreground text-sm">
              Fetching {selectedDays}-day comment history...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
            <p className="mb-3 text-sm text-red-600">{error.message}</p>
            <Button variant="outline" size="sm" onClick={handleFetch}>
              Retry
            </Button>
          </div>
        )}

        {/* Loaded state */}
        {data && analysis && !isLoading && (
          <>
            <SimpleBarGraph data={data} analysis={analysis} />
            <FairUseScoreDisplay analysis={analysis} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
