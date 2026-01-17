import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ExternalLink,
  Eye,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent } from "@sassy/ui/card";
import { Textarea } from "@sassy/ui/textarea";

import { getTouchScoreColor } from "@sassy/linkedin-automation/comment/calculate-touch-score";
import { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";

import { useTRPC } from "../../../lib/trpc/client";
import { useComposeStore } from "../stores/compose-store";
import { getCommentStyleConfig } from "../stores/comment-style-cache";
import { submitCommentFullFlow } from "./utils/submit-comment-full-flow";

// Initialize utilities (auto-detects DOM version)
const postUtils = createPostUtilities();
const commentUtils = createCommentUtilities();

interface ComposeCardProps {
  /** Card ID - component subscribes to its own card data */
  cardId: string;
  /** Whether this card is from single-post generation (EngageButton/comment click) */
  isSinglePostCard?: boolean;
  /** Auto-focus the textarea on mount (for quick typing) */
  autoFocus?: boolean;
}

/**
 * Memoized compose card component.
 * Subscribes to its own card data by ID to prevent re-renders when other cards update.
 */
export const ComposeCard = memo(function ComposeCard({
  cardId,
  isSinglePostCard = false,
  autoFocus = false,
}: ComposeCardProps) {
  // DEBUG: Track renders
  console.log(`[ComposeCard] Render: ${cardId.slice(0, 8)}...`);

  // Subscribe to this specific card's data using a stable selector
  // The store preserves card references for unchanged cards, so this only
  // triggers re-renders when THIS specific card changes
  const card = useComposeStore(
    useCallback((state) => state.cards.find((c) => c.id === cardId), [cardId]),
  );

  // Local submitting state for this card
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);

  // Check if this card is currently being previewed
  const isSelected = useComposeStore(
    (state) => state.previewingCardId === cardId,
  );

  // Ref for scrolling into view when selected
  const cardRef = useRef<HTMLDivElement>(null);
  // Ref for auto-focusing the textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll into view when this card becomes selected
  useEffect(() => {
    if (isSelected && cardRef.current) {
      // Find the scrollable parent (overflow-y-auto container)
      let scrollParent: HTMLElement | null = cardRef.current.parentElement;
      while (scrollParent) {
        const style = getComputedStyle(scrollParent);
        if (style.overflowY === "auto" || style.overflowY === "scroll") {
          break;
        }
        scrollParent = scrollParent.parentElement;
      }

      if (scrollParent) {
        // Calculate scroll position to center the card in view
        const cardRect = cardRef.current.getBoundingClientRect();
        const parentRect = scrollParent.getBoundingClientRect();
        const cardTop = cardRef.current.offsetTop;
        const targetScroll =
          cardTop - parentRect.height / 2 + cardRect.height / 2;

        scrollParent.scrollTo({
          top: Math.max(0, targetScroll),
          behavior: "smooth",
        });
      }
    }
  }, [isSelected]);

  // Auto-focus textarea on mount when autoFocus is true
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      // Small delay to ensure the element is fully rendered
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 1000);
    }
  }, [autoFocus]);

  // Use selective subscriptions for actions (these are stable references)
  const updateCardText = useComposeStore((state) => state.updateCardText);
  const updateCardComment = useComposeStore((state) => state.updateCardComment);
  const updateCardStyleInfo = useComposeStore((state) => state.updateCardStyleInfo);
  const setCardGenerating = useComposeStore((state) => state.setCardGenerating);
  const removeCard = useComposeStore((state) => state.removeCard);
  const removeSinglePostCard = useComposeStore(
    (state) => state.removeSinglePostCard,
  );
  const isSubmitting = useComposeStore((state) => state.isSubmitting);
  const setPreviewingCard = useComposeStore((state) => state.setPreviewingCard);
  const setIsUserEditing = useComposeStore((state) => state.setIsUserEditing);
  const updateCardStatus = useComposeStore((state) => state.updateCardStatus);

  const trpc = useTRPC();
  const generateComment = useMutation(
    trpc.aiComments.generateComment.mutationOptions(),
  );

  // Early return if card not found (shouldn't happen, but safety check)
  if (!card) return null;

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateCardText(card.id, e.target.value);
    },
    [card.id, updateCardText],
  );

  // Simple focus/blur handlers - pause collection while user is editing
  const handleTextareaFocus = useCallback(() => {
    setIsUserEditing(true);
  }, [setIsUserEditing]);

  const handleTextareaBlur = useCallback(() => {
    setIsUserEditing(false);
  }, [setIsUserEditing]);

  // Submit this card's comment to LinkedIn (with submit settings)
  const handleSubmit = useCallback(async () => {
    if (!card.commentText.trim() || card.isGenerating || card.status === "sent")
      return;

    // Close the preview panel before submitting
    setPreviewingCard(null);

    setIsLocalSubmitting(true);
    try {
      const success = await submitCommentFullFlow(card, commentUtils);
      if (success) {
        updateCardStatus(card.id, "sent");
      }
    } catch (err) {
      console.error("EngageKit: error submitting comment", err);
    } finally {
      setIsLocalSubmitting(false);
    }
  }, [card, setPreviewingCard, updateCardStatus]);

  // Keyboard shortcut: Ctrl/Cmd+Enter to submit
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleFocus = useCallback(() => {
    // Close the preview panel first
    setPreviewingCard(null);

    // Scroll to the post and highlight it briefly
    card.postContainer.scrollIntoView({ behavior: "smooth", block: "center" });

    // Highlight effect
    const prevOutline = card.postContainer.style.outline;
    card.postContainer.style.outline = "3px solid #ec4899";
    setTimeout(() => {
      card.postContainer.style.outline = prevOutline;
    }, 2000);
  }, [card.postContainer, setPreviewingCard]);

  const handleRemove = useCallback(() => {
    // Single-post cards use different remove behavior (doesn't add to ignoredUrns)
    if (isSinglePostCard) {
      removeSinglePostCard(card.id);
    } else {
      removeCard(card.id);
    }
  }, [card.id, isSinglePostCard, removeCard, removeSinglePostCard]);

  // Regenerate comment handler
  const handleRegenerate = useCallback(async () => {
    if (card.isGenerating) return;

    const previousAiComment = card.originalCommentText;
    const humanEditedComment = card.commentText;

    // Mark as generating
    setCardGenerating(card.id, true);

    // Extract adjacent comments for context
    const adjacentComments = postUtils.extractAdjacentComments(card.postContainer);

    // Get comment style config (styleGuide, maxWords, creativity)
    const styleConfig = await getCommentStyleConfig();
    console.log("[ComposeCard] Using comment style config:", {
      styleName: styleConfig.styleName,
      maxWords: styleConfig.maxWords,
      creativity: styleConfig.creativity,
    });

    // Fire regeneration request with style config
    generateComment
      .mutateAsync({
        postContent: card.fullCaption,
        styleGuide: styleConfig.styleGuide,
        adjacentComments,
        previousAiComment,
        humanEditedComment:
          humanEditedComment !== previousAiComment
            ? humanEditedComment
            : undefined,
        // Pass AI generation config from CommentStyle
        maxWords: styleConfig.maxWords,
        creativity: styleConfig.creativity,
      })
      .then((result) => {
        updateCardComment(card.id, result.comment);
        // Store the style info that was used to generate this comment
        updateCardStyleInfo(card.id, {
          commentStyleId: styleConfig.styleId,
          styleSnapshot: {
            name: styleConfig.styleName,
            content: styleConfig.styleGuide,
            maxWords: styleConfig.maxWords,
            creativity: styleConfig.creativity,
          },
        });
      })
      .catch((err) => {
        console.error(
          "EngageKit: error regenerating comment for card",
          card.id,
          err,
        );
        // On error, just mark as done (keep existing text)
        setCardGenerating(card.id, false);
      });
  }, [
    card.id,
    card.isGenerating,
    card.originalCommentText,
    card.commentText,
    card.postContainer,
    card.fullCaption,
    setCardGenerating,
    generateComment,
    updateCardComment,
    updateCardStyleInfo,
  ]);

  // Get initials for avatar fallback
  const getInitials = (name: string | null): string => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "?";
    return (
      (parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")
    ).toUpperCase();
  };

  const authorInfo = card.authorInfo;

  // Touch score is tracked in the store (with floor - never decreases)
  const yourTouchScore = card.peakTouchScore;

  return (
    <Card
      ref={cardRef}
      className={`relative ${isSelected ? "bg-accent ring-ring ring-2" : ""}`}
    >
      <CardContent className="flex flex-col gap-2 p-3">
        {/* Compact Author + Caption Header */}
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage
              src={authorInfo?.photoUrl || undefined}
              alt={authorInfo?.name || "Author"}
            />
            <AvatarFallback className="text-[10px]">
              {getInitials(authorInfo?.name ?? null)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-xs font-medium">
                {authorInfo?.name || "Unknown"}
              </span>
              <span className="text-muted-foreground text-[10px]">•</span>
              <span className="text-muted-foreground flex-1 truncate text-[10px]">
                {card.captionPreview}
              </span>
            </div>
          </div>
          <Badge
            variant={card.status === "sent" ? "default" : "secondary"}
            className="shrink-0 px-1.5 py-0 text-[10px]"
          >
            {card.status === "sent" ? "Sent" : "Draft"}
          </Badge>
        </div>

        {/* Textarea - main focus */}
        {card.isGenerating ? (
          <div className="bg-muted/30 flex min-h-[80px] items-center justify-center rounded-md border">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={card.commentText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onFocus={handleTextareaFocus}
            onBlur={handleTextareaBlur}
            placeholder="Write your comment manually for 100% authenticity..."
            className="min-h-[80px] resize-none text-sm"
            disabled={
              isSubmitting || isLocalSubmitting || card.status === "sent"
            }
          />
        )}

        {/* Your Touch Score + Actions Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Your Touch indicator - hide while generating */}
          {card.isGenerating ? (
            <div className="text-muted-foreground text-xs">
              <span>AI is writing...</span>
            </div>
          ) : (
            <div
              className={`flex items-center gap-1 text-xs ${getTouchScoreColor(yourTouchScore)}`}
              title="How much you've personalized the AI-generated comment"
            >
              <Sparkles className="h-3 w-3" />
              <span className="font-medium">Your Touch:</span>
              <span>{yourTouchScore}%</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {/* View - opens post preview sheet */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewingCard(card.id)}
              className="flex-1"
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              View
            </Button>
            {/* Submit - send comment to LinkedIn */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleSubmit}
              disabled={
                isLocalSubmitting ||
                isSubmitting ||
                card.isGenerating ||
                card.status === "sent" ||
                !card.commentText.trim()
              }
              title={card.status === "sent" ? "Already sent" : "Submit comment"}
            >
              {isLocalSubmitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
            </Button>
            {/* Regenerate */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRegenerate}
              disabled={
                isSubmitting ||
                isLocalSubmitting ||
                card.isGenerating ||
                card.status === "sent"
              }
              title="Regenerate comment"
            >
              <RefreshCw
                className={`h-3 w-3 ${card.isGenerating ? "animate-spin" : ""}`}
              />
            </Button>
            {/* Focus - scroll to post */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleFocus}
              title="Focus on post"
            >
              <Eye className="h-3 w-3" />
            </Button>
            {/* Delete */}
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive h-8 w-8"
              onClick={handleRemove}
              disabled={
                isSubmitting ||
                isLocalSubmitting ||
                card.isGenerating ||
                card.status === "sent"
              }
              title="Remove card"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
