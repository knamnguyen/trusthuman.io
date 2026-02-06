import { useEffect, useState } from "react";
import { RefreshCw, AtSign } from "lucide-react";
import { Button } from "@sassy/ui/button";
import { ScrollArea } from "@sassy/ui/scroll-area";
import { useMentions } from "./use-mentions";
import { MentionCard } from "./MentionCard";
import {
  DEFAULT_FOLLOWUP_INTERVAL_MINUTES,
  FOLLOWUP_INTERVAL_OPTIONS,
  getFollowUpIntervalMinutes,
  setFollowUpIntervalMinutes,
} from "./followup-auto-fetch-config";

export function FollowUpTab() {
  const { mentions, lastFetchTime, isLoading, error, refetch, removeMention } =
    useMentions();

  const [autoFetchIntervalMinutes, setAutoFetchInterval] = useState(
    DEFAULT_FOLLOWUP_INTERVAL_MINUTES
  );

  // Load saved interval on mount
  useEffect(() => {
    getFollowUpIntervalMinutes().then(setAutoFetchInterval);
  }, []);

  // Handle interval change
  const handleIntervalChange = async (minutes: number) => {
    setAutoFetchInterval(minutes);
    await setFollowUpIntervalMinutes(minutes);
  };

  return (
    <div id="ek-followup-tab" className="flex flex-col gap-4 px-4 h-full">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Mentions</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={refetch}
          disabled={isLoading}
          className="h-8 w-8 p-0"
          title="Refresh mentions"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Mentions List */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-3">
          {mentions.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <AtSign className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">
                No mentions yet. When someone tags you in a comment, it will
                appear here.
              </p>
            </div>
          ) : (
            mentions.map((mention) => (
              <MentionCard
                key={mention.entityUrn}
                mention={mention}
                onRemove={removeMention}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Auto-fetch Settings */}
      <div className="bg-muted/30 flex items-center justify-between rounded-lg border px-3 py-2">
        <span className="text-muted-foreground text-xs">Auto-fetch every:</span>
        <select
          value={autoFetchIntervalMinutes}
          onChange={(e) => handleIntervalChange(Number(e.target.value))}
          className="bg-background focus:ring-primary rounded border px-2 py-1 text-xs focus:ring-1 focus:outline-none"
        >
          {FOLLOWUP_INTERVAL_OPTIONS.map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes === 0
                ? "Stop fetching"
                : `${minutes} ${minutes === 1 ? "minute" : "minutes"}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
