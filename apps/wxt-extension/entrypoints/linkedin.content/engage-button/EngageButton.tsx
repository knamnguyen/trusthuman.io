import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { EngageKitSprite } from "@sassy/ui/components/engagekit-sprite";

import { useTRPC } from "../../../lib/trpc/client";
import { useComposeStore } from "../stores/compose-store";
import { SIDEBAR_TABS, useSidebarStore } from "../stores/sidebar-store";
import {
  DEFAULT_STYLE_GUIDE,
  extractAdjacentComments,
  extractAuthorInfoFromPost,
  extractCommentsFromPost,
  extractPostCaption,
  extractPostTime,
  extractPostUrl,
  findPostContainer,
  getCaptionPreview,
  waitForCommentsReady,
} from "../utils";
import { clickCommentButton } from "../utils/comment/click-comment-button";

/**
 * Preload an image to ensure it's cached by the browser
 */
function preloadImage(url: string): void {
  const img = new Image();
  img.src = url;
}

interface EngageButtonProps {
  anchorElement: Element;
}

/**
 * Engage button that injects into LinkedIn comment forms.
 * Uses inline styles since it renders via portal outside shadow DOM.
 */
export function EngageButton({ anchorElement }: EngageButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const trpc = useTRPC();
  // Compose store for creating ComposeCards
  const {
    addCard,
    updateCardComment,
    setSinglePostCards,
    setIsEngageButtonGenerating,
    clearSinglePostCards,
    updateCardsComments,
    isCollecting,
    isEngageButtonGenerating,
    cards,
    singlePostCardIds,
  } = useComposeStore();

  // Check if Load Posts cards exist (mutual exclusivity with EngageButton)
  const hasLoadPostsCards = cards.some(
    (c) => !singlePostCardIds.includes(c.id),
  );
  // Sidebar store for UI state
  const { openToTab } = useSidebarStore();

  const generateComment = useMutation(
    trpc.aiComments.generateComment.mutationOptions(),
  );

  // Get asset URLs from extension public folder bc we in content script
  const defaultSpriteUrl = chrome.runtime.getURL("/engagekit-sprite-blink.svg");
  const breatheSpriteUrl = chrome.runtime.getURL(
    "/engagekit-sprite-breathe.svg",
  );

  // Preload both sprites on mount to avoid loading delay on state change
  useEffect(() => {
    preloadImage(defaultSpriteUrl);
    preloadImage(breatheSpriteUrl);
  }, [defaultSpriteUrl, breatheSpriteUrl]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only block if Load Posts is running or Load Posts cards exist
    // (Single-post cards will be auto-cleared for fresh generation)
    if (isCollecting || hasLoadPostsCards) {
      console.log(
        "EngageKit: ignoring click - Load Posts running or Load Posts cards exist",
      );
      return;
    }

    // Find the surrounding post container using the anchor element
    // Cast to HTMLElement since LinkedIn elements are always HTMLElements
    const postContainer = findPostContainer(
      anchorElement,
    ) as HTMLElement | null;

    if (!postContainer) {
      console.warn("EngageKit: unable to locate surrounding post container");
      return;
    }

    // Extract full post data for ComposeCards
    const fullCaption = extractPostCaption(postContainer);
    if (!fullCaption) {
      console.warn("EngageKit: unable to extract post caption");
      return;
    }

    // Clear any existing single-post cards (fresh start for new post)
    clearSinglePostCards();

    // Mark as generating
    setIsEngageButtonGenerating(true);

    // Extract basic post info immediately (no waiting required)
    const captionPreview = getCaptionPreview(fullCaption, 10);
    const authorInfo = extractAuthorInfoFromPost(postContainer);
    const postTime = extractPostTime(postContainer);
    const postUrls = extractPostUrl(postContainer);
    const urn =
      postContainer.getAttribute("data-urn") ||
      postContainer.getAttribute("data-id") ||
      `unknown-${Date.now()}`;

    // Get humanOnlyMode setting
    const { humanOnlyMode } = useComposeStore.getState().settings;

    // Create card IDs based on mode
    const manualCardId = humanOnlyMode ? crypto.randomUUID() : null;
    const aiCardIds = humanOnlyMode
      ? []
      : [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
    const allCardIds = manualCardId ? [manualCardId] : aiCardIds;

    console.log(
      `EngageKit: ${humanOnlyMode ? "creating 1 manual card (100% human mode)" : "generating 3 AI variations"} for post:`,
      fullCaption.slice(0, 100),
    );

    if (humanOnlyMode && manualCardId) {
      // HUMAN MODE: Add only empty manual card
      addCard({
        id: manualCardId,
        urn,
        captionPreview,
        fullCaption,
        commentText: "",
        originalCommentText: "",
        postContainer,
        status: "draft",
        isGenerating: false,
        authorInfo,
        postTime,
        postUrls,
        comments: [],
      });
    } else {
      // AI MODE: Add 3 AI cards in generating state
      aiCardIds.forEach((id) => {
        addCard({
          id,
          urn,
          captionPreview,
          fullCaption,
          commentText: "",
          originalCommentText: "",
          postContainer,
          status: "draft",
          isGenerating: true,
          authorInfo,
          postTime,
          postUrls,
          comments: [],
        });
      });
    }

    // INSTANT: Track as single-post cards and open sidebar immediately
    setSinglePostCards(allCardIds);
    openToTab(SIDEBAR_TABS.COMPOSE);

    // Load comments for preview (useful in both modes)
    const beforeCount = extractCommentsFromPost(postContainer).length;
    clickCommentButton(postContainer);
    await waitForCommentsReady(postContainer, beforeCount);

    // Blur focus from LinkedIn's comment box (contenteditable) so spacebar can trigger new generation
    // Only blur contenteditable elements (LinkedIn's comment box), not our sidebar's textarea
    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement.isContentEditable
    ) {
      document.activeElement.blur();
    }

    // Extract comments for display in preview
    const loadedComments = extractCommentsFromPost(postContainer);
    if (loadedComments.length > 0) {
      updateCardsComments(urn, loadedComments);
    }

    // Skip AI generation in human mode
    if (humanOnlyMode) {
      setIsEngageButtonGenerating(false);
      return;
    }

    // Extract adjacent comments for AI generation
    const adjacentComments = extractAdjacentComments(postContainer);

    // Request params for AI generation
    const requestParams = {
      postContent: fullCaption,
      styleGuide: DEFAULT_STYLE_GUIDE,
      adjacentComments,
    };

    // Fire 3 parallel AI requests, update each card as it completes
    try {
      await Promise.all(
        aiCardIds.map(async (cardId) => {
          try {
            const result = await generateComment.mutateAsync(requestParams);
            updateCardComment(cardId, result.comment);
          } catch (err) {
            console.error(
              `EngageKit: failed to generate for card ${cardId}`,
              err,
            );
            // Set empty comment on failure so isGenerating becomes false
            updateCardComment(cardId, "");
          }
        }),
      );
    } catch (err) {
      console.error("EngageKit: error generating comments", err);
    } finally {
      // Mark as done generating
      setIsEngageButtonGenerating(false);
    }
  };

  const iconSize = 32;
  // Show loading state when generating
  const isLoading = generateComment.isPending || isEngageButtonGenerating;
  // Only disable when Load Posts is active (allow clicking during single-post generation for fresh start)
  const isDisabled = isCollecting || hasLoadPostsCards;

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isDisabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px",
        backgroundColor: isHovered && !isDisabled ? "#f3f6f8" : "transparent",
        border: "none",
        borderRadius: "50%",
        transition: "background-color 0.15s",
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
      }}
    >
      {/* Keep both sprites mounted to avoid load delay on state change */}
      {/* Use visibility + position to hide inactive sprite */}
      <div style={{ position: "relative", width: iconSize, height: iconSize }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            visibility: isLoading ? "hidden" : "visible",
          }}
        >
          <EngageKitSprite
            spriteUrl={defaultSpriteUrl}
            size={iconSize}
            fps={6}
            frameCount={3}
            delayBetweenCycles={2000}
          />
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            visibility: isLoading ? "visible" : "hidden",
          }}
        >
          <EngageKitSprite
            spriteUrl={breatheSpriteUrl}
            size={iconSize}
            fps={10}
            frameCount={10}
          />
        </div>
      </div>
    </button>
  );
}
