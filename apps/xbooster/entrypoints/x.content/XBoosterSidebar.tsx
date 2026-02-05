import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Play,
  RefreshCw,
  Send,
  Settings,
  Square,
  Zap,
} from "lucide-react";

import { Button } from "@sassy/ui/button";
import { SheetContent, SheetHeader, SheetTitle } from "@sassy/ui/sheet";

import { ToggleButton } from "./_components/ToggleButton";
import { MentionCard } from "./_components/MentionCard";
import { SettingsSheet } from "./_components/SettingsSheet";
import { useMentionsStore } from "./stores/mentions-store";
import { useRepliesStore } from "./stores/replies-store";
import { useSettingsStore } from "./stores/settings-store";
import { useShadowRootStore } from "./stores/shadow-root-store";
import { fetchNotifications, getTweetDetail } from "./utils/x-api";
import { postTweetViaDOM } from "./utils/dom-reply";
import {
  parseNotificationEntries,
  parseTweetDetail,
} from "./utils/parse-notifications";
import { generateReply } from "./utils/ai-reply";
import { navigateX } from "./utils/navigate-x";
import { useAutoRun } from "./hooks/use-auto-run";
import type { MentionData } from "./stores/mentions-store";

interface XBoosterSidebarProps {
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  idle: "Idle",
  fetching: "Fetching mentions...",
  generating: "Generating replies...",
  sending: "Sending replies...",
  waiting: "Waiting for next cycle...",
};

export function XBoosterSidebar({ onClose }: XBoosterSidebarProps) {
  const shadowRoot = useShadowRootStore((s) => s.shadowRoot);
  const {
    mentions,
    isLoading,
    error,
    setMentions,
    setLoading,
    setError,
    cacheOriginalTweet,
    getCachedTweet,
    originalTweetCache,
  } = useMentionsStore();
  const {
    replies,
    setReply,
    updateReplyText,
    markSent,
    isAlreadyReplied,
    loadAlreadyReplied,
    pruneAlreadyReplied,
  } = useRepliesStore();
  const { settings, loadSettings, isLoaded: settingsLoaded } = useSettingsStore();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const autoRun = useAutoRun();

  // Load already-replied IDs and settings on mount
  useEffect(() => {
    loadAlreadyReplied();
    loadSettings();
  }, [loadAlreadyReplied, loadSettings]);

  // Auto-prune on mount once settings are loaded
  useEffect(() => {
    if (settingsLoaded) {
      pruneAlreadyReplied(settings.repliedRetentionDays);
    }
  }, [settingsLoaded, settings.repliedRetentionDays, pruneAlreadyReplied]);

  // Filter mentions: within max age, conversation matches reply-to, not already replied
  const maxAgeMs = settings.maxMentionAgeMinutes * 60 * 1000;
  const isMentionFresh = (timestamp: string) => {
    if (!timestamp) return true; // if no timestamp, don't filter out
    return Date.now() - new Date(timestamp).getTime() < maxAgeMs;
  };

  const filteredMentions = mentions.filter(
    (m) =>
      isMentionFresh(m.timestamp) &&
      m.conversationId === m.inReplyToStatusId &&
      !isAlreadyReplied(m.tweetId),
  );

  // Count pending replies that can be sent
  const pendingSendCount = filteredMentions.filter(
    (m) => replies[m.tweetId]?.status === "ready" && replies[m.tweetId]?.text.trim(),
  ).length;

  const handleGenerateReply = useCallback(
    async (mention: (typeof mentions)[0], originalText: string) => {
      setReply(mention.tweetId, { status: "generating", text: "" });
      try {
        const text = await generateReply({
          originalTweetText: originalText,
          mentionText: mention.text,
          mentionAuthor: mention.authorName,
          customPrompt: settings.customPrompt,
          maxWordsMin: settings.maxWordsMin,
          maxWordsMax: settings.maxWordsMax,
        });
        setReply(mention.tweetId, { status: "ready", text });
      } catch (err) {
        setReply(mention.tweetId, {
          status: "error",
          error: err instanceof Error ? err.message : "Failed to generate reply",
        });
      }
    },
    [setReply, settings.customPrompt, settings.maxWordsMin, settings.maxWordsMax],
  );

  const handleFetchMentions = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Read settings fresh from store to avoid stale closures
    const currentSettings = useSettingsStore.getState().settings;
    const currentMaxAgeMs = currentSettings.maxMentionAgeMinutes * 60 * 1000;
    const isFresh = (timestamp: string) => {
      if (!timestamp) return true;
      return Date.now() - new Date(timestamp).getTime() < currentMaxAgeMs;
    };

    try {
      // 1. Fetch notifications
      const notifResult = await fetchNotifications();
      if (!notifResult.success) throw new Error(notifResult.message);

      const parsed = parseNotificationEntries(notifResult.data);
      setMentions(parsed);

      // 2. Fetch original tweets (with caching) — only for actionable mentions
      const actionable = parsed.filter(
        (m) =>
          isFresh(m.timestamp) &&
          m.conversationId === m.inReplyToStatusId &&
          !isAlreadyReplied(m.tweetId),
      );

      const uniqueConversationIds = [
        ...new Set(actionable.map((m) => m.conversationId)),
      ];

      for (const convId of uniqueConversationIds) {
        if (getCachedTweet(convId)) continue;

        const detailResult = await getTweetDetail(convId);
        if (detailResult.success && detailResult.data) {
          const tweet = parseTweetDetail(detailResult.data);
          if (tweet) {
            cacheOriginalTweet(convId, tweet);
          }
        }
      }

      // 3. Auto-generate AI replies only for actionable mentions
      const mentionsToReply = actionable;

      for (const mention of mentionsToReply) {
        const cached = getCachedTweet(mention.conversationId);
        const originalText = cached?.text ?? mention.text;
        await handleGenerateReply(mention, originalText);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch mentions");
    } finally {
      setLoading(false);
    }
  }, [
    setLoading,
    setError,
    setMentions,
    isAlreadyReplied,
    getCachedTweet,
    cacheOriginalTweet,
    handleGenerateReply,
  ]);

  const handleSendReply = useCallback(
    async (mention: MentionData) => {
      const reply = replies[mention.tweetId];
      if (!reply?.text.trim()) return;

      setReply(mention.tweetId, { status: "sending" });

      // Navigate to the mention's tweet page first
      const tweetPath = `/${mention.authorHandle}/status/${mention.tweetId}`;
      navigateX(tweetPath);
      await new Promise((r) => setTimeout(r, 2000));

      // Use DOM manipulation instead of GraphQL API (mimic request) to avoid detection
      const result = await postTweetViaDOM(reply.text);
      // const result = await postTweet(reply.text, mention.tweetId);
      if (result.success) {
        markSent(mention.tweetId);
      } else {
        setReply(mention.tweetId, {
          status: "error",
          error: result.message ?? "Failed to send reply",
        });
      }
    },
    [replies, setReply, markSent],
  );

  const handleSendAll = useCallback(async () => {
    const toSend = filteredMentions.filter(
      (m) => replies[m.tweetId]?.status === "ready" && replies[m.tweetId]?.text.trim(),
    );

    for (const mention of toSend) {
      await handleSendReply(mention);
      // 2-second delay between sends to avoid rate limits
      if (toSend.indexOf(mention) < toSend.length - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }, [filteredMentions, replies, handleSendReply]);

  return (
    <SheetContent
      side="right"
      className="z-[9999] w-[380px] min-w-[380px] gap-0"
      portalContainer={shadowRoot}
    >
      {/* Close button */}
      <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2">
        <ToggleButton isOpen={true} onToggle={onClose} />
      </div>

      {/* Settings sheet — positioned at sidebar's left edge */}
      <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-[380px] -translate-x-full overflow-hidden">
        <SettingsSheet
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>

      <SheetHeader>
        <div className="flex items-center justify-between">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4 text-primary" />
            xBooster
          </SheetTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSettingsOpen(!settingsOpen)}
              title="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFetchMentions}
              disabled={isLoading || autoRun.isRunning}
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
              disabled={pendingSendCount === 0 || isLoading || autoRun.isRunning}
              className="h-7 gap-1 text-xs"
            >
              <Send className="h-3 w-3" />
              ({pendingSendCount})
            </Button>
          </div>
        </div>
      </SheetHeader>

      {/* Auto-run controls */}
      <div className="border-b px-3 py-2">
        <div className="flex items-center justify-between">
          <Button
            variant={autoRun.isRunning ? "destructive" : "primary"}
            size="sm"
            onClick={autoRun.isRunning ? autoRun.stop : autoRun.start}
            disabled={isLoading}
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

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {error && (
          <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {!isLoading && mentions.length === 0 && !error && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Click &quot;Fetch&quot; or &quot;Start Auto-Run&quot; to load mentions
          </div>
        )}

        {isLoading && mentions.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading mentions...
          </div>
        )}

        {filteredMentions.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {filteredMentions.length} of {mentions.length} mentions (filtered)
          </div>
        )}

        {filteredMentions.map((mention) => (
          <MentionCard
            key={mention.tweetId}
            mention={mention}
            originalTweet={originalTweetCache[mention.conversationId]}
            reply={replies[mention.tweetId]}
            onTextChange={(text) => updateReplyText(mention.tweetId, text)}
            onRegenerate={() => {
              const cached = getCachedTweet(mention.conversationId);
              handleGenerateReply(mention, cached?.text ?? mention.text);
            }}
            onSend={() => handleSendReply(mention)}
          />
        ))}

        {mentions.length > 0 && filteredMentions.length === 0 && (
          <div className="py-4 text-center text-xs text-muted-foreground">
            All mentions are either already replied to, have existing replies, or
            are not direct replies to tweets.
          </div>
        )}
      </div>
    </SheetContent>
  );
}
