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
import { fetchNotifications, getTweetDetail, postTweet } from "../utils/x-api";

type AutoRunStatus = "idle" | "fetching" | "generating" | "sending" | "waiting";

interface AutoRunState {
  isRunning: boolean;
  status: AutoRunStatus;
  lastRunAt: number | null;
  nextRunAt: number | null;
  cycleCount: number;
  sentThisCycle: number;
  error: string | null;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function useAutoRun() {
  const [state, setState] = useState<AutoRunState>({
    isRunning: false,
    status: "idle",
    lastRunAt: null,
    nextRunAt: null,
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

    // Auto-prune old replied entries
    await repliesStore.pruneAlreadyReplied(settings.repliedRetentionDays);

    let sentCount = 0;

    try {
      // 1. Fetch notifications
      setStatus("fetching");
      const notifResult = await fetchNotifications(settings.fetchCount);
      if (!notifResult.success) throw new Error(notifResult.message);
      if (abortRef.current) return;

      const parsed = parseNotificationEntries(notifResult.data);
      mentionsStore.setMentions(parsed);

      // 2. Filter to actionable mentions
      const actionable = parsed.filter(
        (m) =>
          m.replyCount === 0 &&
          m.conversationId === m.inReplyToStatusId &&
          !repliesStore.isAlreadyReplied(m.tweetId),
      );

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

      // 4. Generate AI replies
      setStatus("generating");
      for (const mention of actionable) {
        if (abortRef.current) return;
        const cached = mentionsStore.getCachedTweet(mention.conversationId);
        const originalText = cached?.text ?? mention.text;

        repliesStore.setReply(mention.tweetId, {
          status: "generating",
          text: "",
        });

        try {
          const text = await generateReply({
            originalTweetText: originalText,
            mentionText: mention.text,
            mentionAuthor: mention.authorName,
            customPrompt: settings.customPrompt,
            maxWordsMin: settings.maxWordsMin,
            maxWordsMax: settings.maxWordsMax,
          });
          repliesStore.setReply(mention.tweetId, { status: "ready", text });
        } catch (err) {
          repliesStore.setReply(mention.tweetId, {
            status: "error",
            error:
              err instanceof Error ? err.message : "Failed to generate reply",
          });
        }
      }

      // 5. Send replies with randomized delays (capped by maxSendsPerCycle)
      setStatus("sending");
      const sendableCount = Math.min(actionable.length, settings.maxSendsPerCycle);
      for (let i = 0; i < sendableCount; i++) {
        if (abortRef.current) return;

        const mention = actionable[i]!;
        const reply = useRepliesStore.getState().replies[mention.tweetId];
        if (!reply?.text.trim() || reply.status !== "ready") continue;

        repliesStore.setReply(mention.tweetId, { status: "sending" });

        // Navigate to tweet page for context
        const tweetPath = `/${mention.authorHandle}/status/${mention.tweetId}`;
        navigateX(tweetPath);
        await new Promise((r) => setTimeout(r, 1500));
        if (abortRef.current) return;

        const result = await postTweet(reply.text, mention.tweetId);
        if (result.success) {
          repliesStore.markSent(mention.tweetId);
          sentCount++;
        } else {
          repliesStore.setReply(mention.tweetId, {
            status: "error",
            error: result.message ?? "Failed to send reply",
          });
        }

        // Random delay between sends (skip after last)
        if (i < sendableCount - 1) {
          const delay =
            randomBetween(settings.sendDelayMin, settings.sendDelayMax) * 1000;
          await new Promise((r) => setTimeout(r, delay));
        }
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

    setState((prev) => ({ ...prev, status: "waiting", nextRunAt }));

    timeoutRef.current = setTimeout(async () => {
      if (abortRef.current) return;
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

    // Load settings if not loaded
    const settingsStore = useSettingsStore.getState();
    if (!settingsStore.isLoaded) await settingsStore.loadSettings();

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
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { ...state, start, stop };
}
