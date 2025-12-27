import { useCallback, useState } from "react";
import { Hash, Loader2, MessageSquarePlus, Send } from "lucide-react";

import { Button } from "@sassy/ui/button";

import { useComposeStore } from "../stores/compose-store";
import { clickLoadMore } from "../utils/click-load-more";
import {
  extractAuthorInfoFromPost,
  type PostAuthorInfo,
} from "../utils/extract-author-info-from-post";
import {
  extractPostCaption,
  getCaptionPreview,
} from "../utils/extract-post-caption";
import {
  extractPostTime,
  type PostTimeInfo,
} from "../utils/extract-post-time";
import {
  extractPostUrl,
  type PostUrlInfo,
} from "../utils/extract-post-url";
import {
  loadAndExtractComments,
  type PostCommentInfo,
} from "../utils/load-and-extract-comments";
import { submitCommentToPost } from "../utils/submit-comment";
import { ComposeCard } from "./ComposeCard";
import { PostPreviewSheet } from "./PostPreviewSheet";

interface CollectedPost {
  urn: string;
  captionPreview: string;
  fullCaption: string;
  postContainer: HTMLElement;
  authorInfo: PostAuthorInfo | null;
  postTime: PostTimeInfo | null;
  postUrl: PostUrlInfo | null;
  comments: PostCommentInfo[];
}

/**
 * Collect all posts from the feed with all data pre-extracted.
 * This includes clicking comment buttons and loading comments upfront,
 * so card addition can be instant without DOM interactions.
 *
 * @param existingUrns - URNs of posts already in cards (to skip)
 * @param isUrnIgnored - Function to check if a URN was previously ignored
 */
async function collectAllPosts(
  existingUrns: Set<string>,
  isUrnIgnored: (urn: string) => boolean,
): Promise<CollectedPost[]> {
  const posts: CollectedPost[] = [];

  // Get all post containers by data-urn attribute
  const postContainers =
    document.querySelectorAll<HTMLElement>("div[data-urn]");

  for (const container of postContainers) {
    const urn = container.getAttribute("data-urn");
    if (!urn) continue;

    // Skip if it's not an activity URN (filter out other elements)
    if (!urn.includes("activity")) continue;

    // Skip if already in cards or ignored
    if (existingUrns.has(urn) || isUrnIgnored(urn)) continue;

    const fullCaption = extractPostCaption(container);
    if (!fullCaption) continue; // Skip posts without caption

    const captionPreview = getCaptionPreview(fullCaption, 10);
    const authorInfo = extractAuthorInfoFromPost(container);
    const postTime = extractPostTime(container);
    const postUrl = extractPostUrl(container);

    // Load comments upfront (clicks comment button, waits, extracts)
    const comments = await loadAndExtractComments(container);

    posts.push({
      urn,
      captionPreview,
      fullCaption,
      postContainer: container,
      authorInfo,
      postTime,
      postUrl,
      comments,
    });
  }

  return posts;
}

export function ExploreTab() {
  const [isLoading, setIsLoading] = useState(false);
  /** Target number of drafts to collect (user configurable, max 100) */
  const [targetDraftCount, setTargetDraftCount] = useState<number>(10);
  /** Pre-collected posts ready for composing (collected during load/initial) */
  const [collectedPosts, setCollectedPosts] = useState<CollectedPost[]>([]);

  const {
    cards,
    isSubmitting,
    addCard,
    setIsSubmitting,
    updateCardStatus,
    isUrnIgnored,
  } = useComposeStore();


  /**
   * Load posts until we reach the target draft count.
   * Scrolls down, waits for posts to load, collects data, repeats.
   */
  const handleLoadPosts = useCallback(async () => {
    setIsLoading(true);

    const existingUrns = new Set(cards.map((card) => card.urn));
    const collectedUrns = new Set(collectedPosts.map((p) => p.urn));
    let currentCollected = [...collectedPosts];

    // Keep loading until we hit target or can't load more
    while (currentCollected.length < targetDraftCount) {
      // Collect from currently visible posts
      const newPosts = await collectAllPosts(
        new Set([...existingUrns, ...collectedUrns]),
        isUrnIgnored,
      );

      // Add new posts to collection
      for (const post of newPosts) {
        if (!collectedUrns.has(post.urn)) {
          collectedUrns.add(post.urn);
          currentCollected.push(post);
          // Update state progressively so user sees progress
          setCollectedPosts([...currentCollected]);

          if (currentCollected.length >= targetDraftCount) {
            break;
          }
        }
      }

      // If we've hit target, stop
      if (currentCollected.length >= targetDraftCount) {
        break;
      }

      // Try to load more posts by scrolling/clicking load more
      const success = await clickLoadMore();
      if (!success) {
        // No more posts to load, stop
        break;
      }

      // Brief additional wait for DOM to settle after scroll
      await new Promise((r) => setTimeout(r, 500));
    }

    setIsLoading(false);
  }, [cards, collectedPosts, targetDraftCount, isUrnIgnored]);

  const handleComposeComments = useCallback(() => {
    // Get existing URNs to avoid duplicates
    const existingUrns = new Set(cards.map((card) => card.urn));

    // Filter pre-collected posts to get only new ones
    const postsToAdd = collectedPosts.filter(
      (post) => !existingUrns.has(post.urn) && !isUrnIgnored(post.urn),
    );

    if (postsToAdd.length === 0) {
      return;
    }

    // Add cards instantly (no DOM interactions, data already collected)
    for (const post of postsToAdd) {
      addCard({
        id: crypto.randomUUID(),
        urn: post.urn,
        captionPreview: post.captionPreview,
        fullCaption: post.fullCaption,
        commentText: post.captionPreview, // Mock data: use caption preview as placeholder
        postContainer: post.postContainer,
        status: "draft",
        authorInfo: post.authorInfo,
        postTime: post.postTime,
        postUrl: post.postUrl,
        comments: post.comments,
      });
    }

    // Clear used posts from collected list
    const addedUrns = new Set(postsToAdd.map((p) => p.urn));
    setCollectedPosts((prev) => prev.filter((p) => !addedUrns.has(p.urn)));
  }, [addCard, cards, collectedPosts, isUrnIgnored]);

  /**
   * Submit all draft comments to LinkedIn
   * Goes through each card from top to bottom:
   * 1. Clicks the comment button to open comment box
   * 2. Waits for editable field to appear
   * 3. Inserts the comment text
   * 4. Marks card as "sent"
   */
  const handleSubmitAll = useCallback(async () => {
    const draftCards = cards.filter((c) => c.status === "draft");
    if (draftCards.length === 0) return;

    setIsSubmitting(true);

    for (const card of draftCards) {
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
  }, [cards, setIsSubmitting, updateCardStatus]);

  // Count drafts and sent for display
  const draftCount = cards.filter((c) => c.status === "draft").length;
  const sentCount = cards.filter((c) => c.status === "sent").length;

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

        {/* Row 2: Load + Compose Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleLoadPosts}
            disabled={isLoading || isSubmitting}
            variant="outline"
            size="sm"
            className="h-7 flex-1 text-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                {collectedPosts.length}/{targetDraftCount}
              </>
            ) : (
              "Load Posts"
            )}
          </Button>

          <Button
            onClick={handleComposeComments}
            disabled={isLoading || isSubmitting || collectedPosts.length === 0}
            size="sm"
            className="h-7 flex-1 text-xs"
          >
            <MessageSquarePlus className="mr-1 h-3 w-3" />
            Compose ({collectedPosts.length})
          </Button>
        </div>

        {/* Row 3: Drafts/Sent count + Submit (only when cards exist) */}
        {cards.length > 0 && (
          <div className="mt-2 flex items-center justify-between border-t pt-2">
            <div className="flex items-center gap-2 text-xs font-medium">
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

      {/* Compose Cards List */}
      {cards.length > 0 && (
        <div className="flex flex-col gap-3">
          {cards.map((card) => (
            <ComposeCard key={card.id} card={card} />
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
