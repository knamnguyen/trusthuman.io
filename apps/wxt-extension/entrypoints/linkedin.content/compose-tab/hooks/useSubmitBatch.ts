/**
 * useSubmitBatch Hook
 *
 * Handles batch submission of draft comments with:
 * - Sequential submission with delays
 * - Auto-submit callback when generation completes
 * - Respects submission settings (delays, likes, tags, image attach)
 * - Guards for human mode and auto-submit toggle
 */

import { useCallback } from "react";

import { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";

import { useComposeStore } from "../../stores/compose-store";
import { useSettingsDBStore } from "../../stores/settings-db-store";
import { useSettingsLocalStore } from "../../stores/settings-local-store";
import { submitCommentFullFlow } from "../utils/submit-comment-full-flow";

// Initialize utilities (auto-detects DOM version)
const commentUtils = createCommentUtilities();

/**
 * Metadata passed to onGenerationComplete callback
 */
export interface GenerationCompleteMetadata {
  targetCount: number;
  loadedCount: number;
  generatedCount: number;
}

/**
 * Hook for batch submission of comments
 */
export function useSubmitBatch() {
  const isSubmitting = useComposeStore((state) => state.isSubmitting);
  const setIsSubmitting = useComposeStore((state) => state.setIsSubmitting);
  const updateCardStatus = useComposeStore((state) => state.updateCardStatus);

  /**
   * Submit all draft comments to LinkedIn
   * Uses submitCommentFullFlow utility for each card with random delays between submissions.
   */
  const handleSubmitAll = useCallback(async () => {
    // Read fresh state from store (not captured getCards which may be stale)
    const cards = useComposeStore.getState().cards;

    // Only submit cards that are drafts AND have finished generating
    const cardsToSubmit = cards.filter(
      (c) => c.status === "draft" && !c.isGenerating,
    );

    console.log(
      "[useSubmitBatch] handleSubmitAll: Found",
      cardsToSubmit.length,
      "cards to submit",
    );
    if (cardsToSubmit.length === 0) return;

    // Get submit delay settings (use defaults if not loaded yet)
    const submitSettings = useSettingsDBStore.getState().submitComment;
    const [minDelay = 5, maxDelay = 20] = (
      submitSettings?.submitDelayRange ?? "5-20"
    )
      .split("-")
      .map(Number);

    setIsSubmitting(true);

    for (const card of cardsToSubmit) {
      // Skip empty comments
      if (!card.commentText.trim()) {
        continue;
      }

      const success = await submitCommentFullFlow(card, commentUtils);
      if (success) {
        updateCardStatus(card.id, "sent");
      }

      // Random delay between submissions (based on settings)
      const delay = minDelay + Math.random() * (maxDelay - minDelay);
      await new Promise((r) => setTimeout(r, delay * 1000));
    }

    setIsSubmitting(false);
  }, [setIsSubmitting, updateCardStatus]);

  /**
   * Callback invoked when loadPostsToCards completes ALL AI generation
   * Triggers auto-submit if enabled (handleSubmitAll does the rest of the checks)
   */
  const handleGenerationComplete = useCallback(
    async (metadata: GenerationCompleteMetadata) => {
      console.log("[useSubmitBatch] 🔔 Generation complete", metadata);

      // Only check auto-submit specific conditions (handleSubmitAll does the rest)
      const { autoSubmitAfterGenerate, humanOnlyMode } =
        useSettingsLocalStore.getState().behavior;

      if (!autoSubmitAfterGenerate) {
        console.log("[useSubmitBatch] Auto-submit disabled");
        return;
      }

      if (humanOnlyMode) {
        console.log("[useSubmitBatch] Auto-submit skipped (human mode)");
        return;
      }

      console.log("[useSubmitBatch] 🚀 Triggering auto-submit");
      await handleSubmitAll();
      console.log("[useSubmitBatch] ✅ Auto-submit complete");
    },
    [handleSubmitAll],
  );

  return {
    handleSubmitAll,
    handleGenerationComplete,
    isSubmitting,
  };
}
