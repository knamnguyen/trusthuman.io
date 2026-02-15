import { useCallback, useEffect, useRef, useState } from "react";

import { generateReply } from "../../utils/ai-reply";
import { postTweetViaDOM } from "../../utils/dom-reply";
import { navigateX } from "../../utils/navigate-x";
import { getCommunityTweets, getListTweets } from "../../utils/x-api";
import { useEngageRepliesStore } from "../stores/engage-replies-store";
import { useEngageSettingsStore } from "../stores/engage-settings-store";
import { useEngageSourcesStore } from "../stores/engage-sources-store";
import { useEngageTweetsStore } from "../stores/engage-tweets-store";
import {
  parseCommunityTweetsResponse,
  parseListTweetsResponse,
} from "../utils/parse-tweets";
import type { EngageTweetData } from "../utils/parse-tweets";
import { isPaused, recordSuccess, recordFailure } from "../../utils/send-guard";
import { hasCaption } from "../../utils/tweet-filters";
import { useReplyHistoryStore } from "../../utils/reply-history-store";

type EngageAutoRunStatus =
  | "idle"
  | "fetching"
  | "generating"
  | "sending"
  | "send-delay"
  | "waiting"
  | "source-delay"
  | "rate-limited";

interface EngageAutoRunState {
  isRunning: boolean;
  status: EngageAutoRunStatus;
  lastRunAt: number | null;
  nextRunAt: number | null;
  delayUntil: number | null;
  cycleCount: number;
  sentThisCycle: number;
  currentSourceIndex: number;
  totalSources: number;
  error: string | null;
}

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// === Auto-run state persistence helpers (for crash recovery) ===

async function saveAutoRunState(mentionsRunning?: boolean, engageRunning?: boolean): Promise<void> {
  try {
    await chrome.runtime.sendMessage({
      action: "save-auto-run-state",
      mentionsRunning,
      engageRunning,
    });
  } catch (err) {
    console.error("xBooster: Failed to save auto-run state:", err);
  }
}

async function getAutoRunState(): Promise<{ mentionsRunning: boolean; engageRunning: boolean } | null> {
  try {
    const response = await chrome.runtime.sendMessage({ action: "get-auto-run-state" });
    return response?.state ?? null;
  } catch (err) {
    console.error("xBooster: Failed to get auto-run state:", err);
    return null;
  }
}

export function useEngageAutoRun() {
  const [state, setState] = useState<EngageAutoRunState>({
    isRunning: false,
    status: "idle",
    lastRunAt: null,
    nextRunAt: null,
    delayUntil: null,
    cycleCount: 0,
    sentThisCycle: 0,
    currentSourceIndex: 0,
    totalSources: 0,
    error: null,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  const setStatus = useCallback(
    (status: EngageAutoRunStatus, extra?: Partial<EngageAutoRunState>) => {
      setState((prev) => ({ ...prev, status, ...extra }));
    },
    [],
  );

  /**
   * Process a single source: fetch → filter → generate → send.
   * Returns the number of replies successfully sent.
   */
  const processSource = useCallback(
    async (
      source: { id: string; type: "list" | "community"; url: string },
      sourceIndex: number,
      totalSources: number,
    ): Promise<number> => {
      if (abortRef.current) return 0;

      const settings = useEngageSettingsStore.getState().settings;
      const repliesStore = useEngageRepliesStore.getState();
      const tweetsStore = useEngageTweetsStore.getState();

      setState((prev) => ({
        ...prev,
        currentSourceIndex: sourceIndex,
        totalSources,
      }));

      // 1. Fetch tweets from this source (with pagination, overfetch 4x to compensate for filtering)
      setStatus("fetching");
      const rawFetchCount = Math.min(settings.fetchCount * 4, 200);
      const fetchAbort = new AbortController();
      let result: { success: boolean; data?: unknown; message?: string };
      if (source.type === "list") {
        result = await getListTweets(source.id, rawFetchCount, fetchAbort.signal);
      } else {
        result = await getCommunityTweets(source.id, rawFetchCount, fetchAbort.signal);
      }

      if (!result.success) {
        console.warn(
          `xBooster: Failed to fetch from ${source.type} ${source.id}: ${result.message}`,
        );
        return 0;
      }

      let parsed: EngageTweetData[];
      if (source.type === "list") {
        parsed = parseListTweetsResponse(result.data, source.id);
      } else {
        parsed = parseCommunityTweetsResponse(result.data, source.id);
      }

      if (abortRef.current) return 0;

      // Merge into tweets store
      tweetsStore.addTweets(parsed);

      // 2. Filter actionable tweets: within max age, not already replied, skip with replies (capped to target)
      const maxAgeMs = settings.maxTweetAgeMinutes * 60 * 1000;
      const actionable = parsed.filter((tweet) => {
        if (tweet.timestamp) {
          const tweetAge = Date.now() - new Date(tweet.timestamp).getTime();
          if (tweetAge > maxAgeMs) return false;
        }
        if (repliesStore.isAlreadyReplied(tweet.tweetId)) return false;
        if (settings.skipTweetsWithReplies && tweet.replyCount > 0) return false;
        if (settings.skipNoCaption && !hasCaption(tweet.text)) return false;
        return true;
      }).slice(0, settings.fetchCount);

      if (actionable.length === 0) return 0;

      // 3. Generate AI replies (parallel)
      setStatus("generating");
      for (const tweet of actionable) {
        repliesStore.setReply(tweet.tweetId, {
          status: "generating",
          text: "",
        });
      }

      await Promise.all(
        actionable.map(async (tweet) => {
          if (abortRef.current) return;

          // Look up past interactions with this author
          const pastInteractions = useReplyHistoryStore
            .getState()
            .getByAuthor(tweet.authorHandle);

          try {
            const text = await generateReply({
              originalTweetText: tweet.text,
              mentionText: "",
              mentionAuthor: tweet.authorName,
              customPrompt: settings.customPrompt,
              maxWordsMin: settings.maxWordsMin,
              maxWordsMax: settings.maxWordsMax,
              conversationHistory: pastInteractions.length > 0
                ? pastInteractions.map((h) => ({
                    theirText: h.theirText,
                    ourReply: h.ourReply,
                  }))
                : undefined,
            });
            repliesStore.setReply(tweet.tweetId, { status: "ready", text });
          } catch (err) {
            repliesStore.setReply(tweet.tweetId, {
              status: "error",
              error:
                err instanceof Error ? err.message : "Failed to generate reply",
            });
          }
        }),
      );

      // 4. Send replies (capped by maxSendsPerSource)
      setStatus("sending");
      let sentCount = 0;

      // Check if paused before sending
      if (isPaused()) {
        setStatus("rate-limited");
        return sentCount;
      }

      const setSendLock = (window as any).__xbooster_setSendLock as ((isActive: boolean) => void) | undefined;
      setSendLock?.(true);

      try {
        const sendableCount = Math.min(
          actionable.length,
          settings.maxSendsPerSource,
        );

        for (let i = 0; i < sendableCount; i++) {
          if (abortRef.current) return sentCount;

          const tweet = actionable[i]!;
          const reply =
            useEngageRepliesStore.getState().replies[tweet.tweetId];
          if (!reply?.text.trim() || reply.status !== "ready") continue;

          repliesStore.setReply(tweet.tweetId, { status: "sending" });

          // Navigate to tweet page for DOM manipulation
          navigateX(tweet.url);
          await new Promise((r) => setTimeout(r, 2000));
          if (abortRef.current) return sentCount;

          // Use DOM manipulation to post reply (target first reply button for original tweets)
          const sendResult = await postTweetViaDOM(reply.text, "original", {
            confirmByNavigation: settings.confirmTweetByNavigation,
            confirmWaitSeconds: settings.confirmWaitSeconds,
          });
          if (sendResult.success) {
            repliesStore.markSent(tweet.tweetId);
            recordSuccess(); // Reset failure counter
            sentCount++;

            // Save to conversation history
            await useReplyHistoryStore.getState().addEntry({
              tweetId: tweet.tweetId,
              repliedAt: Date.now(),
              authorHandle: tweet.authorHandle,
              authorName: tweet.authorName,
              theirText: tweet.text,
              ourReply: reply.text,
              mode: "ENGAGE",
            });
          } else {
            repliesStore.setReply(tweet.tweetId, {
              status: "error",
              error: sendResult.message ?? "Failed to send reply",
            });
            recordFailure(settings.failPauseMinutes, sendResult.isRateLimit); // Increment failure counter

            // Check if now paused and exit
            if (isPaused()) {
              setStatus("rate-limited");
              return sentCount;
            }
          }

          // Random delay between sends (skip after last)
          if (i < sendableCount - 1) {
            const delay =
              randomBetween(settings.sendDelayMin, settings.sendDelayMax) * 60 * 1000;
            setState((prev) => ({ ...prev, status: "send-delay", delayUntil: Date.now() + delay }));
            await new Promise((r) => setTimeout(r, delay));
            setState((prev) => ({ ...prev, status: "sending", delayUntil: null }));
          }
        }

        return sentCount;
      } finally {
        setSendLock?.(false);
      }
    },
    [setStatus],
  );

  /**
   * Run one full cycle: iterate through all active sources sequentially,
   * processing each one (fetch→generate→send) with a configurable delay
   * between sources.
   */
  const runCycle = useCallback(async () => {
    if (abortRef.current) return;

    const settings = useEngageSettingsStore.getState().settings;
    const sourcesStore = useEngageSourcesStore.getState();
    const repliesStore = useEngageRepliesStore.getState();
    const tweetsStore = useEngageTweetsStore.getState();

    // Auto-prune old replied entries and history
    await repliesStore.pruneAlreadyReplied(settings.repliedRetentionDays);
    const historyStore = useReplyHistoryStore.getState();
    await historyStore.prune(settings.repliedRetentionDays);

    // Clear old tweets at start of cycle
    tweetsStore.setTweets([]);

    let totalSent = 0;
    const activeSources = sourcesStore.getActiveSources();

    if (activeSources.length === 0) {
      setStatus("waiting", {
        lastRunAt: Date.now(),
        sentThisCycle: 0,
        error: null,
      });
      return;
    }

    try {
      for (let i = 0; i < activeSources.length; i++) {
        if (abortRef.current) return;

        const source = activeSources[i]!;
        const sent = await processSource(source, i, activeSources.length);
        totalSent += sent;

        // Delay between sources (skip after last)
        if (i < activeSources.length - 1 && !abortRef.current) {
          const delayMs =
            randomBetween(settings.sourceDelayMin, settings.sourceDelayMax) *
            60 *
            1000;
          setState((prev) => ({ ...prev, status: "source-delay", delayUntil: Date.now() + delayMs }));
          await new Promise((r) => setTimeout(r, delayMs));
          setState((prev) => ({ ...prev, delayUntil: null }));
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("xBooster engage auto-run cycle error:", message);
      setState((prev) => ({ ...prev, error: message }));
    } finally {
      setState((prev) => ({
        ...prev,
        lastRunAt: Date.now(),
        sentThisCycle: totalSent,
        cycleCount: prev.cycleCount + 1,
      }));
    }
  }, [setStatus, processSource]);

  const scheduleNext = useCallback(() => {
    const settings = useEngageSettingsStore.getState().settings;
    const delayMs =
      randomBetween(settings.fetchIntervalMin, settings.fetchIntervalMax) *
      60 *
      1000;
    const nextRunAt = Date.now() + delayMs;

    setState((prev) => ({ ...prev, status: "waiting", nextRunAt, delayUntil: nextRunAt }));

    timeoutRef.current = setTimeout(async () => {
      if (abortRef.current) return;
      setState((prev) => ({ ...prev, delayUntil: null }));
      await runCycle();
      if (!abortRef.current) scheduleNext();
    }, delayMs);
  }, [runCycle]);

  const start = useCallback(async () => {
    abortRef.current = false;
    setState((prev) => ({
      ...prev,
      isRunning: true,
      error: null,
      cycleCount: 0,
    }));

    // Save state for crash recovery
    await saveAutoRunState(undefined, true);

    // Load settings and history if not loaded
    const settingsStore = useEngageSettingsStore.getState();
    if (!settingsStore.isLoaded) await settingsStore.loadSettings();
    const histStore = useReplyHistoryStore.getState();
    if (!histStore.isLoaded) await histStore.load();

    // Run first cycle immediately
    await runCycle();
    if (!abortRef.current) scheduleNext();
  }, [runCycle, scheduleNext]);

  const stop = useCallback(() => {
    abortRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isRunning: false,
      status: "idle",
      nextRunAt: null,
      delayUntil: null,
    }));

    // Clear state for crash recovery
    saveAutoRunState(undefined, false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Auto-resume on mount if was running before crash
  useEffect(() => {
    const checkAutoResume = async () => {
      const savedState = await getAutoRunState();
      if (savedState?.engageRunning) {
        console.log("xBooster: Auto-resuming engage auto-run after crash recovery");
        start();
      }
    };
    checkAutoResume();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, start, stop };
}
