import { useCallback, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Edit3, Hash, Loader2, Send, Sparkles, Square } from "lucide-react";
import { useShallow } from "zustand/shallow";

import { Button } from "@sassy/ui/button";

import type { PostAuthorInfo } from "../utils/extract-author-info-from-post";
import type { PostCommentInfo } from "../utils/extract-comment-from-post";
import type { PostTimeInfo } from "../utils/extract-post-time";
import type { PostUrlInfo } from "../utils/extract-post-url";
import { useTRPC } from "../../../lib/trpc/client";
import { useComposeStore } from "../stores/compose-store";
import {
  DEFAULT_STYLE_GUIDE,
  extractAdjacentComments,
  waitForCommentsReady,
} from "../utils";
import { clickCommentButton } from "../utils/click-comment-button";
import { extractAuthorInfoFromPost } from "../utils/extract-author-info-from-post";
import { extractCommentsFromPost } from "../utils/extract-comment-from-post";
import {
  extractPostCaption,
  getCaptionPreview,
} from "../utils/extract-post-caption";
import { extractPostTime } from "../utils/extract-post-time";
import { extractPostUrl } from "../utils/extract-post-url";
import { loadMore } from "../utils/load-more";
import { submitCommentToPost } from "../utils/submit-comment";
import { ComposeCard } from "./ComposeCard";
import { PostPreviewSheet } from "./PostPreviewSheet";

interface ReadyPost {
  urn: string;
  captionPreview: string;
  fullCaption: string;
  postContainer: HTMLElement;
  authorInfo: PostAuthorInfo | null;
  postTime: PostTimeInfo | null;
  postUrl: PostUrlInfo | null;
  comments: PostCommentInfo[];
}

/** Max consecutive iterations with no progress before giving up */
const MAX_IDLE_ITERATIONS = 10;

/**
 * Wait while user is editing (focused on textarea).
 * Pauses collection until user clicks outside the edit box.
 */
async function waitWhileEditing(): Promise<void> {
  while (useComposeStore.getState().isUserEditing) {
    await new Promise((r) => setTimeout(r, 100));
  }
}

/**
 * Get all activity URNs currently in the DOM
 */
function getAllActivityUrns(): Set<string> {
  const urns = new Set<string>();
  const posts = document.querySelectorAll<HTMLElement>("div[data-urn]");
  for (const post of posts) {
    const urn = post.getAttribute("data-urn");
    if (urn?.includes("activity")) {
      urns.add(urn);
    }
  }
  return urns;
}

/**
 * Find new posts in the DOM that haven't been processed yet.
 * Returns array of { urn, container } for posts that need processing.
 */
function findNewPosts(
  existingUrns: Set<string>,
  processedUrns: Set<string>,
  isUrnIgnored: (urn: string) => boolean,
): Array<{ urn: string; container: HTMLElement }> {
  const newPosts: Array<{ urn: string; container: HTMLElement }> = [];
  const posts = document.querySelectorAll<HTMLElement>("div[data-urn]");

  for (const container of posts) {
    const urn = container.getAttribute("data-urn");
    if (!urn || !urn.includes("activity")) continue;
    if (existingUrns.has(urn) || processedUrns.has(urn) || isUrnIgnored(urn))
      continue;

    // Check if post has a caption (valid post)
    const fullCaption = extractPostCaption(container);
    if (!fullCaption) continue;

    newPosts.push({ urn, container });
  }

  return newPosts;
}

/**
 * Extract full post data from a container
 */
function extractPostData(container: HTMLElement): ReadyPost | null {
  const urn = container.getAttribute("data-urn");
  if (!urn) return null;

  const fullCaption = extractPostCaption(container);
  if (!fullCaption) return null;

  return {
    urn,
    captionPreview: getCaptionPreview(fullCaption, 10),
    fullCaption,
    postContainer: container,
    authorInfo: extractAuthorInfoFromPost(container),
    postTime: extractPostTime(container),
    postUrl: extractPostUrl(container),
    comments: extractCommentsFromPost(container),
  };
}

/**
 * Batch post collection pipeline:
 * - Finds ALL new posts in the DOM
 * - Waits for user to stop typing (once per batch)
 * - Clicks ALL comment buttons at once
 * - Waits for ALL comments to load in parallel
 * - Collects ALL data and emits as a batch
 * - Scrolls for more posts until target reached or stopped
 */
async function collectPostsBatch(
  targetCount: number,
  existingUrns: Set<string>,
  isUrnIgnored: (urn: string) => boolean,
  onBatchReady: (posts: ReadyPost[]) => void,
  shouldStop: () => boolean,
): Promise<number> {
  const processedUrns = new Set<string>();
  let emittedCount = 0;
  let idleIterations = 0;
  let lastUrnCount = getAllActivityUrns().size;

  console.log(`[EngageKit] Starting batch collection - target: ${targetCount}`);

  while (emittedCount < targetCount && idleIterations < MAX_IDLE_ITERATIONS) {
    // Check if user requested stop
    if (shouldStop()) {
      console.log(`[EngageKit] Stop requested, exiting`);
      break;
    }

    // Find ALL new posts that haven't been processed
    const newPosts = findNewPosts(existingUrns, processedUrns, isUrnIgnored);

    // Limit to remaining needed
    const postsToProcess = newPosts.slice(0, targetCount - emittedCount);

    if (postsToProcess.length > 0) {
      console.log(
        `[EngageKit] Processing batch of ${postsToProcess.length} posts`,
      );

      // Wait if user is editing - only once per batch before clicking
      await waitWhileEditing();

      // Step 1: Get before counts and mark as processed
      const postContexts = postsToProcess.map(({ urn, container }) => {
        processedUrns.add(urn);
        return {
          urn,
          container,
          beforeCount: extractCommentsFromPost(container).length,
        };
      });

      // Step 2: Click ALL comment buttons at once (no delays)
      for (const { container } of postContexts) {
        clickCommentButton(container);
      }

      // Step 3: Wait for ALL comments to load in parallel
      await Promise.all(
        postContexts.map(({ container, beforeCount }) =>
          waitForCommentsReady(container, beforeCount),
        ),
      );

      // Step 4: Collect ALL post data
      const readyPosts: ReadyPost[] = [];
      for (const { container } of postContexts) {
        if (shouldStop()) break;
        const postData = extractPostData(container);
        if (postData) {
          readyPosts.push(postData);
        }
      }

      // Step 5: Emit entire batch at once
      if (readyPosts.length > 0) {
        onBatchReady(readyPosts);
        emittedCount += readyPosts.length;
        console.log(
          `[EngageKit] Batch complete: ${emittedCount}/${targetCount} posts ready`,
        );
      }
    }

    // Track progress
    const currentUrnCount = getAllActivityUrns().size;
    const hasNewPosts =
      currentUrnCount > lastUrnCount || postsToProcess.length > 0;

    if (hasNewPosts) {
      lastUrnCount = currentUrnCount;
      idleIterations = 0;
    } else {
      idleIterations++;
    }

    // Check if we have enough
    if (emittedCount >= targetCount) {
      console.log(`[EngageKit] Target reached!`);
      break;
    }

    // Wait for user to finish editing before scrolling
    await waitWhileEditing();

    // Scroll to load more posts
    await loadMore();
  }

  if (idleIterations >= MAX_IDLE_ITERATIONS) {
    console.log(
      `[EngageKit] Exited due to max idle iterations. Final count: ${emittedCount}`,
    );
  }

  return emittedCount;
}

export function ExploreTab() {
  // DEBUG: Track renders
  console.log("[ExploreTab] Render");

  const [isLoading, setIsLoading] = useState(false);
  /** Target number of drafts to collect (user configurable, max 100) */
  const [targetDraftCount, setTargetDraftCount] = useState<number>(10);
  /** Live progress counter during loading */
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  /** Ref to signal stop request to the streaming loop */
  const stopRequestedRef = useRef(false);

  // Subscribe to isUserEditing for paused indicator
  const isUserEditing = useComposeStore((state) => state.isUserEditing);

  const trpc = useTRPC();
  const generateComment = useMutation(
    trpc.aiComments.generateComment.mutationOptions(),
  );

  // Use separate subscriptions for different concerns to minimize re-renders
  // Card IDs for rendering the list - only changes when cards are added/removed
  const cardIds = useComposeStore(
    useShallow((state) => {
      console.log(
        "[ExploreTab] cardIds selector called, count:",
        state.cards.length,
      );
      return state.cards.map((c) => c.id);
    }),
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

  // Actions and other state
  const isSubmitting = useComposeStore((state) => state.isSubmitting);
  const addCard = useComposeStore((state) => state.addCard);
  const setIsSubmitting = useComposeStore((state) => state.setIsSubmitting);
  const setIsCollecting = useComposeStore((state) => state.setIsCollecting);
  const updateCardStatus = useComposeStore((state) => state.updateCardStatus);
  const updateCardComment = useComposeStore((state) => state.updateCardComment);
  const isUrnIgnored = useComposeStore((state) => state.isUrnIgnored);

  // Get cards array only when needed for operations (not for rendering)
  const getCards = useComposeStore((state) => state.cards);
  const setPreviewingCard = useComposeStore((state) => state.setPreviewingCard);


  /**
   * Start batch collection:
   * - Scrolls feed, clicks ALL comment buttons at once per batch
   * - Waits for ALL comments to load in parallel
   * - Adds all cards and fires all AI requests at once
   * - Much faster than sequential processing
   */
  const handleStart = useCallback(async () => {
    setIsLoading(true);
    setIsCollecting(true); // Mark as collecting so ComposeCard can refocus on blur
    setLoadingProgress(0);
    stopRequestedRef.current = false;

    // Get current cards to find existing URNs (snapshot at start time)
    const existingUrns = new Set(getCards.map((card) => card.urn));

    // Batch callback - called when each batch of posts is ready
    const onBatchReady = (posts: ReadyPost[]) => {
      console.log(`[EngageKit] Batch received: ${posts.length} posts`);

      // Check if no card is being previewed yet - we'll set first card as preview
      const needsFirstPreview = useComposeStore.getState().previewingCardId === null;
      let firstCardId: string | null = null;

      // Process all posts in the batch
      for (const post of posts) {
        const cardId = crypto.randomUUID();

        // Track first card ID for setting preview
        if (needsFirstPreview && !firstCardId) {
          firstCardId = cardId;
        }

        // Add card immediately with loading state
        addCard({
          id: cardId,
          urn: post.urn,
          captionPreview: post.captionPreview,
          fullCaption: post.fullCaption,
          commentText: "", // Empty while generating
          originalCommentText: "",
          postContainer: post.postContainer,
          status: "draft",
          isGenerating: true,
          authorInfo: post.authorInfo,
          postTime: post.postTime,
          postUrl: post.postUrl,
          comments: post.comments,
        });

        // Extract adjacent comments for AI context
        const adjacentComments = extractAdjacentComments(post.postContainer);

        // Fire AI request (don't await - run in parallel)
        generateComment
          .mutateAsync({
            postContent: post.fullCaption,
            styleGuide: DEFAULT_STYLE_GUIDE,
            adjacentComments,
          })
          .then((result) => {
            updateCardComment(cardId, result.comment);
          })
          .catch((err) => {
            console.error(
              "EngageKit: error generating comment for card",
              cardId,
              err,
            );
            updateCardComment(cardId, "");
          });
      }

      // Update progress for the whole batch
      setLoadingProgress((prev) => prev + posts.length);

      // Set first card as preview (panel already open from isCollecting)
      if (firstCardId) {
        setPreviewingCard(firstCardId);
      }
    };

    // Run batch collection
    await collectPostsBatch(
      targetDraftCount,
      existingUrns,
      isUrnIgnored,
      onBatchReady,
      () => stopRequestedRef.current,
    );

    setIsLoading(false);
    setIsCollecting(false); // Done collecting, stop refocusing on blur
  }, [
    addCard,
    getCards,
    generateComment,
    isUrnIgnored,
    setIsCollecting,
    setPreviewingCard,
    targetDraftCount,
    updateCardComment,
  ]);

  /**
   * Stop the batch collection
   */
  const handleStop = useCallback(() => {
    stopRequestedRef.current = true;
    setIsCollecting(false); // Stop refocusing immediately when user stops
  }, [setIsCollecting]);

  /**
   * Submit all draft comments to LinkedIn
   * Goes through each card from top to bottom:
   * 1. Clicks the comment button to open comment box
   * 2. Waits for editable field to appear
   * 3. Inserts the comment text
   * 4. Marks card as "sent"
   */
  const handleSubmitAll = useCallback(async () => {
    // Only submit cards that are drafts AND have finished generating
    const cardsToSubmit = getCards.filter(
      (c) => c.status === "draft" && !c.isGenerating,
    );
    if (cardsToSubmit.length === 0) return;

    setIsSubmitting(true);

    for (const card of cardsToSubmit) {
      // Skip empty comments
      if (!card.commentText.trim()) {
        continue;
      }

      // Submit comment to the post
      const success = await submitCommentToPost(
        card.postContainer,
        card.commentText,
      );

      if (success) {
        // Mark as sent
        updateCardStatus(card.id, "sent");
      }

      // Delay between submissions to avoid rate limiting
      await new Promise((r) => setTimeout(r, 2000));
    }

    setIsSubmitting(false);
  }, [getCards, setIsSubmitting, updateCardStatus]);

  return (
    <div className="bg-background flex flex-col gap-3 px-4">
      {/* Sticky Compact Header */}
      <div className="bg-background sticky top-0 z-10 -mx-4 border-b px-4 py-2">
        {/* Row 1: Title + Target Input */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="h-3.5 w-3.5" />
            <span className="text-sm font-medium">Feed Explorer</span>
          </div>
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
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Row 2: Start/Stop Button */}
        <div className="flex gap-2">
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
              onClick={handleStart}
              disabled={isSubmitting}
              size="sm"
              className="h-7 flex-1 text-xs"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Start
            </Button>
          )}
        </div>

        {/* Row 3: Drafts/Sent count + Submit (only when cards exist) */}
        {cardIds.length > 0 && (
          <div className="mt-2 flex items-center justify-between border-t pt-2">
            <div className="flex items-center gap-2 text-xs font-medium">
              {isLoading && isUserEditing && (
                <span className="flex items-center gap-1 text-amber-600" title="Click outside edit box to continue">
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
            <Button
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={handleSubmitAll}
              disabled={isSubmitting || draftCount === 0}
            >
              {isSubmitting ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Send className="mr-1 h-3 w-3" />
              )}
              {isSubmitting ? "Submitting..." : "Submit All"}
            </Button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {cardIds.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">
            Click Start to collect posts
          </p>
        </div>
      )}

      {/* Compose Cards List */}
      {cardIds.length > 0 && (
        <div className="flex flex-col gap-3">
          {cardIds.map((cardId) => (
            <ComposeCard key={cardId} cardId={cardId} />
          ))}
        </div>
      )}
      {/* Post Preview Sheet - positioned at sidebar's left edge, clips content as it slides */}
      <div className="pointer-events-none absolute top-0 bottom-0 left-0 z-[-1] w-[600px] -translate-x-full overflow-hidden">
        <PostPreviewSheet />
      </div>
    </div>
  );
}
