import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Play,
  RefreshCw,
  Send,
  Square,
} from "lucide-react";

import { Button } from "@sassy/ui/button";

import { generateReply } from "../utils/ai-reply";
import { postTweetViaDOM } from "../utils/dom-reply";
import { navigateX } from "../utils/navigate-x";
import { getCommunityTweets, getListTweets } from "../utils/x-api";
import { useEngageAutoRun } from "./hooks/use-engage-auto-run";
import { useEngageRepliesStore } from "./stores/engage-replies-store";
import { useEngageSettingsStore } from "./stores/engage-settings-store";
import { useEngageSourcesStore } from "./stores/engage-sources-store";
import { useEngageTweetsStore } from "./stores/engage-tweets-store";
import { TweetCard } from "./TweetCard";
import {
  parseCommunityTweetsResponse,
  parseListTweetsResponse,
} from "./utils/parse-tweets";
import type { EngageTweetData } from "./utils/parse-tweets";

const STATUS_LABELS: Record<string, string> = {
  idle: "Idle",
  fetching: "Fetching tweets...",
  generating: "Generating replies...",
  sending: "Sending replies...",
  "source-delay": "Waiting before next source...",
  waiting: "Waiting for next cycle...",
};

export function EngageTab() {
  const {
    tweets,
    isLoading,
    error,
    setLoading,
    setError,
    addTweets,
    setTweets,
  } = useEngageTweetsStore();
  const {
    replies,
    setReply,
    updateReplyText,
    markSent,
    isAlreadyReplied,
    loadAlreadyReplied,
    pruneAlreadyReplied,
  } = useEngageRepliesStore();
  const {
    settings,
    loadSettings,
    isLoaded: settingsLoaded,
  } = useEngageSettingsStore();
  const { sources, loadSources } = useEngageSourcesStore();

  const [sourceErrors, setSourceErrors] = useState<string[]>([]);

  const autoRun = useEngageAutoRun();

  // Load persisted data on mount
  useEffect(() => {
    loadAlreadyReplied();
    loadSettings();
    loadSources();
  }, [loadAlreadyReplied, loadSettings, loadSources]);

  // Auto-prune on mount once settings are loaded
  useEffect(() => {
    if (settingsLoaded) {
      pruneAlreadyReplied(settings.repliedRetentionDays);
    }
  }, [settingsLoaded, settings.repliedRetentionDays, pruneAlreadyReplied]);

  // Filter tweets: within max age, not already replied
  const maxAgeMs = settings.maxTweetAgeMinutes * 60 * 1000;
  const isTweetFresh = (timestamp: string) => {
    if (!timestamp) return true;
    return Date.now() - new Date(timestamp).getTime() < maxAgeMs;
  };

  const filteredTweets = tweets.filter(
    (t) => isTweetFresh(t.timestamp) && !isAlreadyReplied(t.tweetId),
  );

  // Count pending replies that can be sent
  const pendingSendCount = filteredTweets.filter(
    (t) =>
      replies[t.tweetId]?.status === "ready" &&
      replies[t.tweetId]?.text.trim(),
  ).length;

  const handleGenerateReply = useCallback(
    async (tweet: EngageTweetData) => {
      setReply(tweet.tweetId, { status: "generating", text: "" });
      try {
        const text = await generateReply({
          originalTweetText: tweet.text,
          mentionText: "",
          mentionAuthor: tweet.authorName,
          customPrompt: settings.customPrompt,
          maxWordsMin: settings.maxWordsMin,
          maxWordsMax: settings.maxWordsMax,
        });
        setReply(tweet.tweetId, { status: "ready", text });
      } catch (err) {
        setReply(tweet.tweetId, {
          status: "error",
          error:
            err instanceof Error ? err.message : "Failed to generate reply",
        });
      }
    },
    [setReply, settings.customPrompt, settings.maxWordsMin, settings.maxWordsMax],
  );

  const handleFetchTweets = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSourceErrors([]);

    const currentSettings = useEngageSettingsStore.getState().settings;
    const currentSources = useEngageSourcesStore.getState().getActiveSources();
    const repliesState = useEngageRepliesStore.getState();

    const currentMaxAgeMs = currentSettings.maxTweetAgeMinutes * 60 * 1000;
    const isFresh = (timestamp: string) => {
      if (!timestamp) return true;
      return Date.now() - new Date(timestamp).getTime() < currentMaxAgeMs;
    };

    try {
      const allTweets: EngageTweetData[] = [];
      const perSourceErrors: string[] = [];

      for (const source of currentSources) {
        let result: { success: boolean; data?: unknown; message?: string };
        if (source.type === "list") {
          result = await getListTweets(source.id, currentSettings.fetchCount);
        } else {
          result = await getCommunityTweets(
            source.id,
            currentSettings.fetchCount,
          );
        }

        if (!result.success) {
          const errMsg = `${source.type} ${source.id}: ${result.message ?? "Unknown error"}`;
          console.warn(`xBooster: Failed to fetch from ${errMsg}`);
          perSourceErrors.push(errMsg);
          continue;
        }

        let parsed: EngageTweetData[];
        if (source.type === "list") {
          parsed = parseListTweetsResponse(result.data, source.id);
        } else {
          parsed = parseCommunityTweetsResponse(result.data, source.id);
        }

        allTweets.push(...parsed);

        // Delay between source fetches to avoid rapid-fire requests
        if (currentSources.indexOf(source) < currentSources.length - 1) {
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      if (perSourceErrors.length > 0) {
        setSourceErrors(perSourceErrors);
      }

      // Dedupe
      const seen = new Set<string>();
      const deduped = allTweets.filter((t) => {
        if (seen.has(t.tweetId)) return false;
        seen.add(t.tweetId);
        return true;
      });

      setTweets(deduped);

      // Auto-generate AI replies for actionable tweets (parallel)
      const actionable = deduped.filter(
        (t) =>
          isFresh(t.timestamp) &&
          !repliesState.isAlreadyReplied(t.tweetId),
      );

      await Promise.all(actionable.map((tweet) => handleGenerateReply(tweet)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tweets");
    } finally {
      setLoading(false);
    }
  }, [
    setLoading,
    setError,
    setTweets,
    handleGenerateReply,
  ]);

  const handleSendReply = useCallback(
    async (tweet: EngageTweetData) => {
      const reply = replies[tweet.tweetId];
      if (!reply?.text.trim()) return;

      setReply(tweet.tweetId, { status: "sending" });

      // Navigate to the tweet page
      navigateX(tweet.url);
      await new Promise((r) => setTimeout(r, 2000));

      // Use DOM manipulation to post reply (target first reply button for original tweets)
      const result = await postTweetViaDOM(reply.text, "original");
      if (result.success) {
        markSent(tweet.tweetId);
      } else {
        setReply(tweet.tweetId, {
          status: "error",
          error: result.message ?? "Failed to send reply",
        });
      }
    },
    [replies, setReply, markSent],
  );

  const handleSendAll = useCallback(async () => {
    const toSend = filteredTweets.filter(
      (t) =>
        replies[t.tweetId]?.status === "ready" &&
        replies[t.tweetId]?.text.trim(),
    );

    for (let i = 0; i < toSend.length; i++) {
      const tweet = toSend[i]!;
      await handleSendReply(tweet);
      // 2-second delay between sends to avoid rate limits
      if (i < toSend.length - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }, [filteredTweets, replies, handleSendReply]);

  return (
    <>
      {/* Action buttons + Auto-run controls */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleFetchTweets}
            disabled={isLoading || autoRun.isRunning || sources.length === 0}
            className="h-7 gap-1 text-xs"
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Fetch
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSendAll}
            disabled={
              pendingSendCount === 0 || isLoading || autoRun.isRunning
            }
            className="h-7 gap-1 text-xs"
          >
            <Send className="h-3 w-3" />
            ({pendingSendCount})
          </Button>
        </div>
      </div>

      {/* Auto-run controls */}
      <div className="border-b px-3 py-2">
        <div className="flex items-center justify-between">
          <Button
            variant={autoRun.isRunning ? "destructive" : "primary"}
            size="sm"
            onClick={autoRun.isRunning ? autoRun.stop : autoRun.start}
            disabled={isLoading || sources.length === 0}
            className="h-7 gap-1 text-xs"
          >
            {autoRun.isRunning ? (
              <Square className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            {autoRun.isRunning ? "Stop" : "Start Auto-Run"}
          </Button>
          <div className="text-right text-[10px] text-muted-foreground">
            {autoRun.isRunning && (
              <div>{STATUS_LABELS[autoRun.status] ?? autoRun.status}</div>
            )}
            {autoRun.isRunning &&
              autoRun.totalSources > 0 &&
              autoRun.status !== "waiting" && (
                <div>
                  Source {autoRun.currentSourceIndex + 1}/{autoRun.totalSources}
                </div>
              )}
            {autoRun.isRunning && autoRun.cycleCount > 0 && (
              <div>
                Cycle {autoRun.cycleCount} · {autoRun.sentThisCycle} sent
              </div>
            )}
            {autoRun.isRunning && autoRun.nextRunAt && (
              <div>
                Next in{" "}
                {Math.max(
                  0,
                  Math.round((autoRun.nextRunAt - Date.now()) / 60000),
                )}
                m
              </div>
            )}
          </div>
        </div>
        {autoRun.error && (
          <div className="mt-1 text-[10px] text-destructive">
            {autoRun.error}
          </div>
        )}
      </div>

      {/* Scrollable tweet list */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {error && (
          <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {sourceErrors.length > 0 && (
          <div className="rounded-md bg-yellow-500/10 p-2 text-xs text-yellow-700 dark:text-yellow-400">
            <div className="mb-1 flex items-center gap-1 font-medium">
              <AlertTriangle className="h-3 w-3" />
              Some sources failed to fetch:
            </div>
            <ul className="list-inside list-disc space-y-0.5">
              {sourceErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {sources.length === 0 && !isLoading && !error && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Add a list or community URL to get started
          </div>
        )}

        {sources.length > 0 &&
          !isLoading &&
          tweets.length === 0 &&
          !error && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Click &quot;Fetch&quot; or &quot;Start Auto-Run&quot; to load
              tweets
            </div>
          )}

        {isLoading && tweets.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading tweets...
          </div>
        )}

        {filteredTweets.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {filteredTweets.length} of {tweets.length} tweets (filtered)
          </div>
        )}

        {filteredTweets.map((tweet) => (
          <TweetCard
            key={tweet.tweetId}
            tweet={tweet}
            reply={replies[tweet.tweetId]}
            onTextChange={(text) => updateReplyText(tweet.tweetId, text)}
            onRegenerate={() => handleGenerateReply(tweet)}
            onSend={() => handleSendReply(tweet)}
          />
        ))}

        {tweets.length > 0 && filteredTweets.length === 0 && (
          <div className="py-4 text-center text-xs text-muted-foreground">
            All tweets are either already replied to or too old.
          </div>
        )}
      </div>
    </>
  );
}
