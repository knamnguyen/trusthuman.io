import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { defer } from "@/lib/commons";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useShallow } from "zustand/shallow";

import { getTouchScoreColor } from "@sassy/linkedin-automation/comment/calculate-touch-score";
import { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";
import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Button } from "@sassy/ui/button";
import { ScrollArea } from "@sassy/ui/scroll-area";
import { Textarea } from "@sassy/ui/textarea";

import { useComposeStore } from "../stores/compose-store";
import { generateSingleComment } from "./utils/generate-ai-comments";
import { submitCommentFullFlow } from "./utils/submit-comment-full-flow";

// Initialize utilities (auto-detects DOM version)
const commentUtils = createCommentUtilities();

/**
 * Panel that displays post details when clicking "View" on a compose card.
 * Reads pre-extracted author info and caption from the store (extracted during collection).
 * Positioning is handled by wrapper div in EngageTab (absolute left-0 -translate-x-full).
 */
export function PostPreviewSheet() {
  // DEBUG: Track renders
  console.log("[PostPreviewSheet] Render");

  // Local submitting state for this card
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);

  // Get the previewing card ID
  const previewingCardId = useComposeStore((state) => state.previewingCardId);

  // Subscribe to the specific card being previewed (only re-renders when THIS card changes)
  const previewingCard = useComposeStore(
    useCallback(
      (state) =>
        previewingCardId
          ? state.cards.find((c) => c.id === previewingCardId)
          : null,
      [previewingCardId],
    ),
  );

  // Get card IDs for navigation - only changes when cards are added/removed
  const cardIds = useComposeStore(
    useShallow((state) => state.cards.map((c) => c.id)),
  );

  // Find current index in the card IDs array
  const currentIndex = useMemo(() => {
    if (!previewingCardId) return -1;
    return cardIds.indexOf(previewingCardId);
  }, [cardIds, previewingCardId]);

  // Actions (stable references)
  const setPreviewingCard = useComposeStore((state) => state.setPreviewingCard);
  const updateCardText = useComposeStore((state) => state.updateCardText);
  const updateCardComment = useComposeStore((state) => state.updateCardComment);
  const updateCardStyleInfo = useComposeStore(
    (state) => state.updateCardStyleInfo,
  );
  const setCardGenerating = useComposeStore((state) => state.setCardGenerating);
  const removeCard = useComposeStore((state) => state.removeCard);
  const isSubmitting = useComposeStore((state) => state.isSubmitting);
  const setIsUserEditing = useComposeStore((state) => state.setIsUserEditing);
  const updateCardStatus = useComposeStore((state) => state.updateCardStatus);

  // Get author info, caption, post time, and post URL from the card (already extracted during collection)
  const authorInfo = previewingCard?.authorInfo ?? null;
  const fullCaption = previewingCard?.fullCaption ?? "";
  const postTime = previewingCard?.postTime ?? null;
  const postUrl = previewingCard?.postUrls?.[0] ?? null;

  // Ref for textarea auto-focus
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea when preview opens or navigates to new card
  useEffect(() => {
    if (previewingCardId && textareaRef.current) {
      // Small delay to ensure the element is rendered
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          // Move caret to end of text
          const len = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [previewingCardId]);

  // Navigation
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < cardIds.length - 1 && currentIndex >= 0;

  const handlePrev = useCallback(() => {
    if (canGoPrev && cardIds[currentIndex - 1]) {
      setPreviewingCard(cardIds[currentIndex - 1] ?? null);
    }
  }, [canGoPrev, cardIds, currentIndex, setPreviewingCard]);

  const handleNext = useCallback(() => {
    if (canGoNext && cardIds[currentIndex + 1]) {
      setPreviewingCard(cardIds[currentIndex + 1] ?? null);
    }
  }, [canGoNext, cardIds, currentIndex, setPreviewingCard]);

  const handleClose = () => {
    setPreviewingCard(null);
  };

  // Text change handler
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (previewingCard) {
        updateCardText(previewingCard.id, e.target.value);
      }
    },
    [previewingCard, updateCardText],
  );

  // Simple focus/blur handlers - pause collection while user is editing
  const handleTextareaFocus = useCallback(() => {
    setIsUserEditing(true);
  }, [setIsUserEditing]);

  const handleTextareaBlur = useCallback(() => {
    setIsUserEditing(false);
  }, [setIsUserEditing]);

  // Focus on post handler - scroll to post and close preview
  const handleFocus = useCallback(() => {
    if (previewingCard) {
      // Close the preview sheet first
      setPreviewingCard(null);

      // Scroll to the post
      previewingCard.postContainer.scrollIntoView({
        behavior: "instant",
        block: "start",
      });

      // Highlight effect
      const prevOutline = previewingCard.postContainer.style.outline;
      previewingCard.postContainer.style.outline = "3px solid #ec4899";
      setTimeout(() => {
        previewingCard.postContainer.style.outline = prevOutline;
      }, 2000);
    }
  }, [previewingCard, setPreviewingCard]);

  // Remove handler
  const handleRemove = useCallback(() => {
    if (previewingCard) {
      // Move to next card if available, otherwise prev, otherwise close
      if (canGoNext && cardIds[currentIndex + 1]) {
        setPreviewingCard(cardIds[currentIndex + 1] ?? null);
      } else if (canGoPrev && cardIds[currentIndex - 1]) {
        setPreviewingCard(cardIds[currentIndex - 1] ?? null);
      } else {
        setPreviewingCard(null);
      }
      removeCard(previewingCard.id);
    }
  }, [
    previewingCard,
    canGoNext,
    canGoPrev,
    cardIds,
    currentIndex,
    setPreviewingCard,
    removeCard,
  ]);

  // Regenerate comment handler using shared utility
  const handleRegenerate = useCallback(async () => {
    if (!previewingCard || previewingCard.isGenerating) return;

    const cardId = previewingCard.id;
    const previousAiComment = previewingCard.originalCommentText;
    const humanEditedComment = previewingCard.commentText;

    // Mark as generating
    setCardGenerating(cardId, true);

    using _ = defer(() => {
      // Ensure generating flag is cleared after operation
      setCardGenerating(cardId, false);
    });

    // Fire regeneration request using shared utility
    // generateSingleComment handles dynamic vs static mode internally
    const result = await generateSingleComment({
      postContent: previewingCard.fullCaption,
      postContainer: previewingCard.postContainer,
      previousAiComment,
      humanEditedComment:
        humanEditedComment !== previousAiComment
          ? humanEditedComment
          : undefined,
    });

    if (result.status === "error") {
      console.error(
        "EngageKit: error regenerating comment for card",
        cardId,
        result.message,
      );
      return;
    }

    updateCardComment(cardId, result.comment);
    updateCardStyleInfo(cardId, {
      commentStyleId: result.styleId,
      styleSnapshot: result.styleSnapshot,
    });
  }, [
    previewingCard,
    setCardGenerating,
    updateCardComment,
    updateCardStyleInfo,
  ]);

  // Submit this card's comment to LinkedIn (with submit settings)
  const handleSubmit = useCallback(async () => {
    if (
      !previewingCard ||
      !previewingCard.commentText.trim() ||
      previewingCard.isGenerating ||
      previewingCard.status === "sent"
    )
      return;

    // Close the preview panel before submitting
    setPreviewingCard(null);

    setIsLocalSubmitting(true);
    try {
      const success = await submitCommentFullFlow(previewingCard, commentUtils);
      if (success) {
        updateCardStatus(previewingCard.id, "sent");
      }
    } catch (err) {
      console.error("EngageKit: error submitting comment", err);
    } finally {
      setIsLocalSubmitting(false);
    }
  }, [previewingCard, setPreviewingCard, updateCardStatus]);

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

  // Touch score is tracked in the store (with floor - never decreases)
  const yourTouchScore = previewingCard?.peakTouchScore ?? 0;

  // Get initials for avatar fallback
  const getInitials = (name: string | null): string => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "?";
    return (
      (parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")
    ).toUpperCase();
  };

  // Show panel only when a card is selected (user can open/close freely)
  const isOpen = !!previewingCardId;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="bg-background pointer-events-auto flex h-full w-[600px] flex-col border"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Post Preview</h2>
              {postUrl?.url && (
                <a
                  href={postUrl.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  title="Open post on LinkedIn"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          {previewingCard && authorInfo && (
            <ScrollArea className="flex-1">
              <div className="flex flex-col gap-4 p-4">
                {/* Author Section */}
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={authorInfo.photoUrl || undefined}
                      alt={authorInfo.name || "Author"}
                    />
                    <AvatarFallback>
                      {getInitials(authorInfo.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {authorInfo.name || "Unknown Author"}
                      </p>
                      {postTime?.displayTime && (
                        <span
                          className="text-muted-foreground text-xs"
                          title={postTime.fullTime || undefined}
                        >
                          • {postTime.displayTime}
                        </span>
                      )}
                    </div>
                    {authorInfo.headline && (
                      <p className="text-muted-foreground line-clamp-2 text-xs">
                        {authorInfo.headline}
                      </p>
                    )}
                    {authorInfo.profileUrl && (
                      <a
                        href={authorInfo.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-xs hover:underline"
                      >
                        View Profile
                      </a>
                    )}
                  </div>
                </div>

                {/* Post Caption */}
                <div className="border-t pt-4">
                  <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                    Post Content
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {fullCaption || previewingCard.captionPreview}
                  </p>
                </div>

                {/* Comments Section */}
                {previewingCard.comments.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                      Comments ({previewingCard.comments.length})
                    </p>
                    <div className="flex flex-col gap-3">
                      {previewingCard.comments.map((comment, index) => (
                        <div
                          key={comment.urn || index}
                          className={`rounded-md border p-3 ${comment.isReply ? "bg-muted/50 ml-4" : "bg-muted/30"}`}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            {comment.authorPhotoUrl && (
                              <Avatar className="h-6 w-6">
                                <AvatarImage
                                  src={comment.authorPhotoUrl}
                                  alt={comment.authorName || "Commenter"}
                                />
                                <AvatarFallback className="text-xs">
                                  {getInitials(comment.authorName)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">
                                {comment.authorName || "Unknown"}
                              </p>
                              {comment.authorHeadline && (
                                <p className="text-muted-foreground truncate text-[10px]">
                                  {comment.authorHeadline}
                                </p>
                              )}
                            </div>
                          </div>
                          {comment.content && (
                            <p className="text-xs">{comment.content}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Sticky Compose Editor at bottom */}
          {previewingCard && (
            <div className="bg-background flex flex-col gap-3 border-t p-4">
              {/* Textarea or loading state */}
              {previewingCard.isGenerating ? (
                <div className="bg-muted/30 flex min-h-[80px] items-center justify-center rounded-md border">
                  <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Textarea
                  ref={textareaRef}
                  value={previewingCard.commentText}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  onFocus={handleTextareaFocus}
                  onBlur={handleTextareaBlur}
                  placeholder="Write your comment manually for 100% authenticity..."
                  className="min-h-[80px] resize-none text-sm"
                  disabled={
                    isSubmitting ||
                    isLocalSubmitting ||
                    previewingCard.status === "sent"
                  }
                />
              )}

              {/* Your Touch Score + Style Name + Actions Row */}
              <div className="flex items-center justify-between gap-2">
                {/* Your Touch indicator + Style Name - hide while generating */}
                {previewingCard.isGenerating ? (
                  <div className="text-muted-foreground text-xs">
                    <span>AI is writing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs">
                    <div
                      className={`flex items-center gap-1 ${getTouchScoreColor(yourTouchScore)}`}
                      title="How much you've personalized the AI-generated comment"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span className="font-medium">Your Touch:</span>
                      <span>{yourTouchScore}%</span>
                    </div>
                    {previewingCard.styleSnapshot?.name && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <span
                          className="text-muted-foreground max-w-[120px] truncate"
                          title={`Style: ${previewingCard.styleSnapshot.name}`}
                        >
                          {previewingCard.styleSnapshot.name}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  {/* Submit - send comment to LinkedIn */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleSubmit}
                    disabled={
                      isLocalSubmitting ||
                      isSubmitting ||
                      previewingCard.isGenerating ||
                      previewingCard.status === "sent" ||
                      !previewingCard.commentText.trim()
                    }
                    title={
                      previewingCard.status === "sent"
                        ? "Already sent"
                        : "Submit comment"
                    }
                  >
                    {isLocalSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
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
                      previewingCard.isGenerating ||
                      previewingCard.status === "sent"
                    }
                    title="Regenerate comment"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${previewingCard.isGenerating ? "animate-spin" : ""}`}
                    />
                  </Button>
                  {/* Focus on post */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleFocus}
                    title="Focus on post"
                  >
                    <Eye className="h-3.5 w-3.5" />
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
                      previewingCard.isGenerating ||
                      previewingCard.status === "sent"
                    }
                    title="Remove card"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Navigation Row */}
              <div className="flex items-center justify-center gap-2 border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                  onClick={handlePrev}
                  disabled={!canGoPrev}
                  title="Previous post"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Prev
                </Button>
                <span className="text-muted-foreground min-w-[50px] text-center text-sm">
                  {currentIndex + 1} / {cardIds.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                  onClick={handleNext}
                  disabled={!canGoNext}
                  title="Next post"
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
