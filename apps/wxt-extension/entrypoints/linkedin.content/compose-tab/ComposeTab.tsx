import { useCallback, useEffect, useState } from "react";
import {
  Edit3,
  Feather,
  Loader2,
  Send,
  Settings,
  Sparkles,
  Square,
  Trash2,
} from "lucide-react";
import { useShallow } from "zustand/shallow";

import { posthog } from "@/lib/posthog";
import { Button } from "@sassy/ui/button";
import { TooltipWithDialog } from "@sassy/ui/components/tooltip-with-dialog";

import { useShadowRootStore } from "../stores";
import { useComposeStore } from "../stores/compose-store";
import { ComposeCard } from "./ComposeCard";
import { useAutoResume } from "./hooks/useAutoResume";
import { useLoadPosts } from "./hooks/useLoadPosts";
import { useSubmitBatch } from "./hooks/useSubmitBatch";
import { PostPreviewSheet } from "./PostPreviewSheet";
import { SettingsSheet } from "./settings/SettingsSheet";
import { SettingsTags } from "./settings/SettingsTags";

export function ComposeTab() {
  // DEBUG: Track renders
  console.log("[ComposeTab] Render");

  // Shadow root for tooltip/dialog portals
  const shadowRoot = useShadowRootStore((s) => s.shadowRoot);

  // Local UI state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [targetDraftCount, setTargetDraftCount] = useState<number>(10);

  // Custom hooks for complex logic
  const { handleSubmitAll, handleGenerationComplete, isSubmitting } =
    useSubmitBatch();
  const { handleStart, handleStop, isLoading, loadingProgress, scrollProgress } =
    useLoadPosts(targetDraftCount, handleGenerationComplete);
  const { queueProgress, isAutoResumeLoading, autoResumeScrollProgress } = useAutoResume(handleGenerationComplete);

  // Subscribe to isUserEditing for paused indicator
  const isUserEditing = useComposeStore((state) => state.isUserEditing);
  // Subscribe to isEngageButtonGenerating for conflict handling
  const isEngageButtonGenerating = useComposeStore(
    (state) => state.isEngageButtonGenerating,
  );
  const clearAllCards = useComposeStore((state) => state.clearAllCards);


  // Use separate subscriptions for different concerns to minimize re-renders
  // Card IDs for rendering the list - only changes when cards are added/removed
  const cardIds = useComposeStore(
    useShallow((state) => {
      // console.log(
      //   "[ComposeTab] cardIds selector called, count:",
      //   state.cards.length,
      // );
      return state.cards.map((c) => c.id);
    }),
  );
  // Single-post card IDs (from EngageButton) for different styling
  const singlePostCardIds = useComposeStore((state) => state.singlePostCardIds);

  // Check if we have cards from each source (for mutual exclusivity)
  const hasEngageButtonCards = singlePostCardIds.length > 0;
  const hasLoadPostsCards = cardIds.some(
    (id) => !singlePostCardIds.includes(id),
  );

  // Stats for display - uses shallow comparison
  const { generatingCount, draftCount, sentCount } = useComposeStore(
    useShallow((state) => ({
      generatingCount: state.cards.filter((c) => c.isGenerating).length,
      draftCount: state.cards.filter(
        (c) => c.status === "draft" && !c.isGenerating,
      ).length,
      sentCount: state.cards.filter((c) => c.status === "sent").length,
    })),
  );

  // Actions
  const setPreviewingCard = useComposeStore((state) => state.setPreviewingCard);
  const previewingCardId = useComposeStore((state) => state.previewingCardId);

  // Conflict flags - disable certain actions when others are running
  const isAnyGenerating = isLoading || isEngageButtonGenerating || isAutoResumeLoading;

  // Ensure only one sub-sidebar open at a time: close settings when post preview opens
  useEffect(() => {
    if (previewingCardId) {
      setSettingsOpen(false);
    }
  }, [previewingCardId]);

  // Handler to open settings (closes post preview first)
  const handleOpenSettings = useCallback(() => {
    setPreviewingCard(null);
    setSettingsOpen(true);
  }, [setPreviewingCard]);

  // Close settings sheet when starting load
  const handleStartWithCloseSettings = useCallback(() => {
    setSettingsOpen(false);

    // Track Load Posts start
    posthog.capture("extension:load_posts:v1:begin", {
      target_draft_count: targetDraftCount,
      has_load_posts_cards: hasLoadPostsCards,
      has_engage_button_cards: hasEngageButtonCards,
    });

    handleStart();
  }, [handleStart, targetDraftCount, hasLoadPostsCards, hasEngageButtonCards]);

  return (
    <div id="ek-compose-tab" className="bg-background flex flex-col gap-3 px-4">
      {/* Sticky Compact Header */}
      <div className="bg-background sticky top-0 z-10 -mx-4 border-b px-4 py-2">
        {/* Row 1: Title + Settings Icon */}
        <div className="mb-2 flex items-center justify-between border-b pb-2">
          <TooltipWithDialog
            tooltipContent={
              <p className="text-sm">
                Load posts from your feed and generate AI comments.
              </p>
            }
            buttonText="Watch tutorial"
            dialogTitle="How to use Compose"
            dialogDescription="Learn how to efficiently engage with posts using EngageKit."
            dialogContent={
              <div className="flex flex-col gap-4">
                <div className="bg-muted flex aspect-video w-full items-center justify-center rounded-lg">
                  <span className="text-muted-foreground text-sm">
                    Tutorial video coming soon
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>1. Load Posts:</strong> Click "Load Posts" to
                    collect posts from your current feed.
                  </p>
                  <p>
                    <strong>2. Configure Settings:</strong> Use the settings
                    icon to customize filters and AI behavior.
                  </p>
                  <p>
                    <strong>3. Review & Edit:</strong> Review AI-generated
                    comments and edit as needed.
                  </p>
                  <p>
                    <strong>4. Submit:</strong> Submit comments individually or
                    use "Submit All" for batch posting.
                  </p>
                </div>
              </div>
            }
            tooltipSide="bottom"
            portalContainer={shadowRoot}
            dialogClassName="max-w-md"
          >
            <div className="flex cursor-help items-center gap-2">
              <Feather className="h-3.5 w-3.5" />
              <span className="text-sm font-medium">Compose</span>
            </div>
          </TooltipWithDialog>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 shrink-0 p-0"
            onClick={handleOpenSettings}
            title="Open settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Queue Progress Banner (only shown during queue processing) */}
        {queueProgress && (
          <div className="mb-2 rounded-md bg-blue-50 px-3 py-2 text-xs">
            <div className="font-medium text-blue-700">
              Loading list {queueProgress.currentIndex}/
              {queueProgress.totalLists}
            </div>
            <div className="truncate text-blue-600">
              {queueProgress.currentListName}
            </div>
          </div>
        )}

        {/* Row 2: Settings Tags */}
        <div className="mb-2 overflow-x-auto">
          <SettingsTags />
        </div>

        {/* Row 2: Load Posts + Target Input */}
        <div className="mb-2 flex items-center gap-2">
          {isLoading ? (
            <Button
              onClick={handleStop}
              variant="destructive"
              size="sm"
              className="h-7 flex-1 text-xs"
            >
              <Square className="mr-1 h-3 w-3" />
              Stop ({loadingProgress}/{targetDraftCount})
            </Button>
          ) : (
            <Button
              id="ek-load-posts-button"
              onClick={handleStartWithCloseSettings}
              disabled={
                isSubmitting || isEngageButtonGenerating || hasEngageButtonCards || isAutoResumeLoading
              }
              size="sm"
              className="h-7 flex-1 text-xs"
              title={
                hasEngageButtonCards
                  ? "Clear EngageButton cards first"
                  : undefined
              }
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Load Posts
            </Button>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Target:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={targetDraftCount}
              onChange={(e) =>
                setTargetDraftCount(
                  Math.min(100, Math.max(1, parseInt(e.target.value) || 1)),
                )
              }
              className="border-input bg-background h-6 w-12 rounded border px-1 text-center text-xs"
              disabled={isLoading || isAutoResumeLoading}
            />
          </div>
        </div>


        {/* Row 3: Stats + Actions (only when cards exist) */}
        {cardIds.length > 0 && (
          <div className="flex items-center justify-between border-t pt-2">
            <div className="flex items-center gap-2 text-xs font-medium">
              {((scrollProgress > 0 && isLoading) || (autoResumeScrollProgress > 0 && isAutoResumeLoading)) && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {scrollProgress || autoResumeScrollProgress} scrolling
                </span>
              )}
              {(isLoading || isAutoResumeLoading) && isUserEditing && (
                <span
                  className="flex items-center gap-1 text-amber-600"
                  title="Click outside edit box to continue"
                >
                  <Edit3 className="h-3 w-3" />
                  editing
                </span>
              )}
              {generatingCount > 0 && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {generatingCount} generating
                </span>
              )}
              <span>{draftCount} drafts</span>
              {sentCount > 0 && (
                <span className="text-green-600">{sentCount} sent</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {/* Clear All */}
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive h-6 px-2 text-xs"
                onClick={clearAllCards}
                title="Clear all cards and reset"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Clear All
              </Button>
              {/* Submit All - disabled when EngageButton cards exist (use individual submit) */}
              <Button
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleSubmitAll}
                disabled={
                  isSubmitting ||
                  isAnyGenerating ||
                  draftCount === 0 ||
                  hasEngageButtonCards
                }
                title={
                  hasEngageButtonCards
                    ? "Use individual submit for EngageButton cards"
                    : undefined
                }
              >
                {isSubmitting ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <Send className="mr-1 h-3 w-3" />
                )}
                {isSubmitting ? "Submitting..." : "Submit All"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {cardIds.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-12">
          <Feather className="text-muted-foreground h-10 w-10" />
          <p className="text-muted-foreground text-sm">No comments yet</p>
          <p className="text-muted-foreground text-xs">
            Click "Load Posts" or use the EngageKit button on any post
          </p>
        </div>
      )}

      {/* Compose Cards List */}
      {cardIds.length > 0 && (
        <div className="flex flex-col gap-3">
          {cardIds.map((cardId) => {
            const isSinglePost = singlePostCardIds.includes(cardId);
            // Auto-focus the first single-post card (manual card) for quick typing
            const isFirstManualCard =
              isSinglePost && singlePostCardIds[0] === cardId;
            return (
              <ComposeCard
                key={cardId}
                cardId={cardId}
                isSinglePostCard={isSinglePost}
                autoFocus={isFirstManualCard}
              />
            );
          })}
        </div>
      )}
      {/* Post Preview Sheet - positioned at sidebar's left edge, clips content as it slides */}
      <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-[-1] w-[600px] -translate-x-full overflow-hidden">
        <PostPreviewSheet />
      </div>

      {/* Settings Sheet - positioned at sidebar's left edge */}
      <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-10 w-[400px] -translate-x-full overflow-hidden">
        <SettingsSheet
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    </div>
  );
}
