import { useCallback, useEffect, useRef, useState } from "react";

import { useMentionsStore } from "../stores/mentions-store";
import { useRepliesStore } from "../stores/replies-store";
import { useSettingsStore } from "../stores/settings-store";
import { generateReply } from "../utils/ai-reply";
import { navigateX } from "../utils/navigate-x";
import {
  parseNotificationEntries,
  parseTweetDetail,
} from "../utils/parse-notifications";
import { fetchNotifications, getTweetDetail } from "../utils/x-api";
import { postTweetViaDOM } from "../utils/dom-reply";
import { isPaused, recordSuccess, recordFailure } from "../utils/send-guard";
import { hasCaption } from "../utils/tweet-filters";
import { useReplyHistoryStore } from "../utils/reply-history-store";

type AutoRunStatus = "idle" | "fetching" | "generating" | "sending" | "send-delay" | "waiting" | "rate-limited";

interface AutoRunState {
  isRunning: boolean;
  status: AutoRunStatus;
  lastRunAt: number | null;
  nextRunAt: number | null;
  delayUntil: number | null;
  cycleCount: number;
  sentThisCycle: number;
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

export function useAutoRun() {
  const [state, setState] = useState<AutoRunState>({
    isRunning: false,
    status: "idle",
    lastRunAt: null,
    nextRunAt: null,
    delayUntil: null,
    cycleCount: 0,
    sentThisCycle: 0,
    error: null,
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  const setStatus = useCallback(
    (status: AutoRunStatus, extra?: Partial<AutoRunState>) => {
      setState((prev) => ({ ...prev, status, ...extra }));
    },
    [],
  );

  const runCycle = useCallback(async () => {
    if (abortRef.current) return;

    const settings = useSettingsStore.getState().settings;
    const mentionsStore = useMentionsStore.getState();
    const repliesStore = useRepliesStore.getState();

    // Auto-prune old replied entries and history
    await repliesStore.pruneAlreadyReplied(settings.repliedRetentionDays);
    const historyStore = useReplyHistoryStore.getState();
    await historyStore.prune(settings.repliedRetentionDays);

    let sentCount = 0;

    try {
      // 1. Fetch notifications (with pagination, overfetch 4x to compensate for filtering)
      setStatus("fetching");
      const rawFetchCount = Math.min(settings.fetchCount * 4, 200);
      const fetchAbort = new AbortController();
      const notifResult = await fetchNotifications(rawFetchCount, fetchAbort.signal);
      if (!notifResult.success) throw new Error(notifResult.message);
      if (abortRef.current) return;

      const parsed = parseNotificationEntries(notifResult.data);
      mentionsStore.setMentions(parsed);

      // 2. Filter to actionable mentions (within max age, direct reply, not already replied, no existing replies)
      const maxAgeMs = settings.maxMentionAgeMinutes * 60 * 1000;
      const actionable = parsed.filter(
        (m) =>
          (!m.timestamp || Date.now() - new Date(m.timestamp).getTime() < maxAgeMs) &&
          m.conversationId === m.inReplyToStatusId &&
          !repliesStore.isAlreadyReplied(m.tweetId) &&
          (!settings.skipMentionsWithReplies || m.replyCount === 0) &&
          (!settings.skipNoCaption || hasCaption(m.text)),
      ).slice(0, settings.fetchCount);

      if (actionable.length === 0) {
        setStatus("waiting", {
          lastRunAt: Date.now(),
          sentThisCycle: 0,
          error: null,
        });
        return;
      }

      // 3. Fetch original tweet context (with caching)
      const uniqueConvIds = [
        ...new Set(actionable.map((m) => m.conversationId)),
      ];
      for (const convId of uniqueConvIds) {
        if (abortRef.current) return;
        if (mentionsStore.getCachedTweet(convId)) continue;
        const detailResult = await getTweetDetail(convId);
        if (detailResult.success && detailResult.data) {
          const tweet = parseTweetDetail(detailResult.data);
          if (tweet) mentionsStore.cacheOriginalTweet(convId, tweet);
        }
      }

      // 4. Generate AI replies (parallel)
      setStatus("generating");
      for (const mention of actionable) {
        repliesStore.setReply(mention.tweetId, {
          status: "generating",
          text: "",
        });
      }

      await Promise.all(
        actionable.map(async (mention) => {
          if (abortRef.current) return;
          const cached = mentionsStore.getCachedTweet(mention.conversationId);
          const originalText = cached?.text ?? mention.text;

          // Look up past interactions with this author
          const pastInteractions = useReplyHistoryStore
            .getState()
            .getByAuthor(mention.authorHandle);

          try {
            const text = await generateReply({
              originalTweetText: originalText,
              mentionText: mention.text,
              mentionAuthor: mention.authorName,
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
            repliesStore.setReply(mention.tweetId, { status: "ready", text });
          } catch (err) {
            repliesStore.setReply(mention.tweetId, {
              status: "error",
              error:
                err instanceof Error ? err.message : "Failed to generate reply",
            });
          }
        }),
      );

      // 5. Send replies with randomized delays (capped by maxSendsPerCycle)
      setStatus("sending");

      // Check if paused before sending
      if (isPaused()) {
        setStatus("rate-limited");
        return;
      }

      const setSendLock = (window as any).__xbooster_setSendLock as ((isActive: boolean) => void) | undefined;
      setSendLock?.(true);

      try {
        const sendableCount = Math.min(actionable.length, settings.maxSendsPerCycle);
        for (let i = 0; i < sendableCount; i++) {
          if (abortRef.current) return;

          const mention = actionable[i]!;
          const reply = useRepliesStore.getState().replies[mention.tweetId];
          if (!reply?.text.trim() || reply.status !== "ready") continue;

          repliesStore.setReply(mention.tweetId, { status: "sending" });

          // Navigate to tweet page for DOM manipulation
          const tweetPath = `/${mention.authorHandle}/status/${mention.tweetId}`;
          navigateX(tweetPath);
          await new Promise((r) => setTimeout(r, 2000));
          if (abortRef.current) return;

          // Use DOM manipulation instead of GraphQL API (mimic request) to avoid detection
          const result = await postTweetViaDOM(reply.text, "mention", {
            confirmByNavigation: settings.confirmTweetByNavigation,
            confirmWaitSeconds: settings.confirmWaitSeconds,
          });
          if (result.success) {
            repliesStore.markSent(mention.tweetId);
            recordSuccess(); // Reset failure counter
            sentCount++;

            // Save to conversation history
            const cached = mentionsStore.getCachedTweet(mention.conversationId);
            await useReplyHistoryStore.getState().addEntry({
              tweetId: mention.tweetId,
              repliedAt: Date.now(),
              authorHandle: mention.authorHandle,
              authorName: mention.authorName,
              theirText: mention.text,
              ourReply: reply.text,
              parentTweetText: cached?.text,
              mode: "MENTION",
            });
          } else {
            repliesStore.setReply(mention.tweetId, {
              status: "error",
              error: result.message ?? "Failed to send reply",
            });
            recordFailure(settings.failPauseMinutes, result.isRateLimit); // Increment failure counter

            // Check if now paused and break loop
            if (isPaused()) {
              setStatus("rate-limited");
              break;
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
      } finally {
        setSendLock?.(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("xBooster auto-run cycle error:", message);
      setState((prev) => ({ ...prev, error: message }));
    } finally {
      setState((prev) => ({
        ...prev,
        lastRunAt: Date.now(),
        sentThisCycle: sentCount,
        cycleCount: prev.cycleCount + 1,
      }));
    }
  }, [setStatus]);

  const scheduleNext = useCallback(() => {
    const settings = useSettingsStore.getState().settings;
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
    await saveAutoRunState(true, undefined);

    // Load settings and history if not loaded
    const settingsStore = useSettingsStore.getState();
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
    saveAutoRunState(false, undefined);
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
      if (savedState?.mentionsRunning) {
        console.log("xBooster: Auto-resuming mentions auto-run after crash recovery");
        start();
      }
    };
    checkAutoResume();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, start, stop };
}
