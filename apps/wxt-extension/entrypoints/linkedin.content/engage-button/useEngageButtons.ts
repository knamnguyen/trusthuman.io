/**
 * Hook to inject engage buttons into LinkedIn comment editors.
 * Uses CommentUtilities from linkedin-automation package.
 * Renders vanilla JS buttons (no React portals) for DOM v2 support.
 *
 * Similar pattern to useSaveProfileButtons for profile injection.
 */

import { useEffect, useRef } from "react";

import type { CommentEditorTarget } from "@sassy/linkedin-automation/comment/types";
import { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";

import { getTrpcClient } from "../../../lib/trpc/client";
import { useComposeStore } from "../stores/compose-store";
import { SIDEBAR_TABS, useSidebarStore } from "../stores/sidebar-store";
import { DEFAULT_STYLE_GUIDE } from "../utils/constants";
import {
  createSpriteAnimator,
  SPRITE_PRESETS,
} from "./vanilla-sprite-animator";

/**
 * Preload an image to ensure it's cached by the browser
 */
function preloadImage(url: string): void {
  const img = new Image();
  img.src = url;
}

interface EngageButtonData {
  button: HTMLButtonElement;
  animator: ReturnType<typeof createSpriteAnimator>;
}

/**
 * Create an engage button element with animated sprite.
 */
function createEngageButton(
  target: CommentEditorTarget,
  onClick: (target: CommentEditorTarget) => void,
  blinkSpriteUrl: string,
  breatheSpriteUrl: string
): EngageButtonData {
  const button = document.createElement("button");
  button.type = "button";
  button.style.cssText = `
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background-color: transparent;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.15s;
  `;

  // Create animated sprite (starts with blink animation)
  const animator = createSpriteAnimator({
    spriteUrl: blinkSpriteUrl,
    size: 36, // 50% bigger than default 24
    ...SPRITE_PRESETS.blink,
  });

  // Store breathe URL for loading state switches
  (animator as unknown as { breatheSpriteUrl: string }).breatheSpriteUrl =
    breatheSpriteUrl;
  (animator as unknown as { blinkSpriteUrl: string }).blinkSpriteUrl =
    blinkSpriteUrl;

  button.appendChild(animator.element);

  // Hover effect
  button.addEventListener("mouseenter", () => {
    button.style.backgroundColor = "#f3f6f8";
  });
  button.addEventListener("mouseleave", () => {
    button.style.backgroundColor = "transparent";
  });

  // Click handler
  button.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClick(target);
  });

  return { button, animator };
}

/**
 * Hook to watch for comment editors and inject engage buttons.
 * On click:
 * 1. Extract post info from DOM (immediate)
 * 2. Create compose cards and open sidebar (immediate)
 * 3. Load comments for preview (async)
 * 4. Generate AI comments (async)
 */
export function useEngageButtons() {
  const {
    addCard,
    updateCardComment,
    setSinglePostCards,
    setIsEngageButtonGenerating,
    clearSinglePostCards,
    updateCardsComments,
    isCollecting,
    cards,
    singlePostCardIds,
  } = useComposeStore();
  const { openToTab } = useSidebarStore();

  // Get sprite URLs
  const defaultSpriteUrl = chrome.runtime.getURL("/engagekit-sprite-blink.svg");
  const breatheSpriteUrl = chrome.runtime.getURL(
    "/engagekit-sprite-breathe.svg"
  );

  // Preload sprites
  useEffect(() => {
    preloadImage(defaultSpriteUrl);
    preloadImage(breatheSpriteUrl);
  }, [defaultSpriteUrl, breatheSpriteUrl]);

  // Store refs to avoid recreating handleClick on every render
  const storeRef = useRef({
    addCard,
    updateCardComment,
    setSinglePostCards,
    setIsEngageButtonGenerating,
    clearSinglePostCards,
    updateCardsComments,
    isCollecting,
    cards,
    singlePostCardIds,
    openToTab,
    defaultSpriteUrl,
    breatheSpriteUrl,
  });

  // Keep refs up to date
  useEffect(() => {
    storeRef.current = {
      addCard,
      updateCardComment,
      setSinglePostCards,
      setIsEngageButtonGenerating,
      clearSinglePostCards,
      updateCardsComments,
      isCollecting,
      cards,
      singlePostCardIds,
      openToTab,
      defaultSpriteUrl,
      breatheSpriteUrl,
    };
  });

  useEffect(() => {
    const commentUtils = createCommentUtilities();
    const postUtils = createPostUtilities();
    const buttonMap = new Map<string, EngageButtonData>();

    // Subscribe to isEngageButtonGenerating changes to update animations
    let prevIsGenerating = useComposeStore.getState().isEngageButtonGenerating;
    const unsubscribe = useComposeStore.subscribe((state) => {
      const isGenerating = state.isEngageButtonGenerating;
      if (isGenerating === prevIsGenerating) return;
      prevIsGenerating = isGenerating;

      const blinkUrl = storeRef.current.defaultSpriteUrl;
      const breatheUrl = storeRef.current.breatheSpriteUrl;

      buttonMap.forEach(({ animator }) => {
        if (isGenerating) {
          // Switch to breathe animation
          animator.updateConfig({
            spriteUrl: breatheUrl,
            ...SPRITE_PRESETS.breathe,
          });
        } else {
          // Switch back to blink animation
          animator.updateConfig({
            spriteUrl: blinkUrl,
            ...SPRITE_PRESETS.blink,
          });
        }
      });
    });

    const handleClick = async (target: CommentEditorTarget) => {
      const {
        addCard,
        updateCardComment,
        setSinglePostCards,
        setIsEngageButtonGenerating,
        clearSinglePostCards,
        updateCardsComments,
        isCollecting,
        cards,
        singlePostCardIds,
        openToTab,
      } = storeRef.current;

      // Get tRPC client for API calls (vanilla client, not React hook)
      const trpcClient = getTrpcClient();

      // Check if Load Posts is active or has cards
      const hasLoadPostsCards = cards.some(
        (c) => !singlePostCardIds.includes(c.id)
      );
      if (isCollecting || hasLoadPostsCards) {
        console.log(
          "EngageKit: ignoring click - Load Posts running or Load Posts cards exist"
        );
        return;
      }

      const { postContainer } = target;

      // Extract post data using PostUtilities
      const fullCaption = postUtils.extractPostCaption(postContainer);
      if (!fullCaption) {
        console.warn("EngageKit: unable to extract post caption");
        return;
      }

      // Clear any existing single-post cards
      clearSinglePostCards();
      setIsEngageButtonGenerating(true);

      // Extract post info using migrated utilities
      const captionPreview = fullCaption.slice(0, 100);
      const authorInfo = postUtils.extractPostAuthorInfo(postContainer);
      const postTime = postUtils.extractPostTime(postContainer);
      const postUrls = postUtils.extractPostUrl(postContainer);
      const urn = postUrls[0]?.urn || `unknown-${Date.now()}`;

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
        fullCaption.slice(0, 100)
      );

      // Map author info to expected format
      const authorInfoMapped = {
        name: authorInfo.name,
        headline: authorInfo.headline,
        photoUrl: authorInfo.photoUrl,
        profileUrl: authorInfo.profileUrl,
      };

      // Map post time to expected format
      const postTimeMapped = {
        displayTime: postTime.displayTime,
        fullTime: postTime.fullTime,
      };

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
          authorInfo: authorInfoMapped,
          postTime: postTimeMapped,
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
            authorInfo: authorInfoMapped,
            postTime: postTimeMapped,
            postUrls,
            comments: [],
          });
        });
      }

      // Track as single-post cards and open sidebar immediately
      setSinglePostCards(allCardIds);
      openToTab(SIDEBAR_TABS.COMPOSE);

      // Load comments for preview
      const beforeComments = postUtils.extractPostComments(postContainer);
      commentUtils.clickCommentButton(postContainer);
      await commentUtils.waitForCommentsReady(
        postContainer,
        beforeComments.length
      );

      // Blur focus from LinkedIn's comment box
      if (
        document.activeElement instanceof HTMLElement &&
        document.activeElement.isContentEditable
      ) {
        document.activeElement.blur();
      }

      // Extract comments for display
      const loadedComments = postUtils.extractPostComments(postContainer);
      if (loadedComments.length > 0) {
        // Map to expected comment format
        const mappedComments = loadedComments.map((c) => ({
          authorName: c.authorName,
          authorHeadline: c.authorHeadline,
          authorProfileUrl: c.authorProfileUrl,
          authorPhotoUrl: c.authorPhotoUrl,
          content: c.content,
          urn: c.urn,
          isReply: c.isReply,
        }));
        updateCardsComments(urn, mappedComments);
      }

      // Skip AI generation in human mode
      if (humanOnlyMode) {
        setIsEngageButtonGenerating(false);
        return;
      }

      // Extract adjacent comments for AI generation
      const adjacentComments = postUtils.extractAdjacentComments(postContainer);

      // Request params for AI generation
      const requestParams = {
        postContent: fullCaption,
        styleGuide: DEFAULT_STYLE_GUIDE,
        adjacentComments: adjacentComments.map((c) => ({
          commentContent: c.commentContent,
          likeCount: c.likeCount,
          replyCount: c.replyCount,
        })),
      };

      // Fire 3 parallel AI requests
      try {
        await Promise.all(
          aiCardIds.map(async (cardId) => {
            try {
              const result = await trpcClient.aiComments.generateComment.mutate(
                requestParams
              );
              updateCardComment(cardId, result.comment);
            } catch (err) {
              console.error(
                `EngageKit: failed to generate for card ${cardId}`,
                err
              );
              updateCardComment(cardId, "");
            }
          })
        );
      } catch (err) {
        console.error("EngageKit: error generating comments", err);
      } finally {
        setIsEngageButtonGenerating(false);
      }
    };

    const cleanup = commentUtils.watchForCommentEditors((targets) => {
      const blinkUrl = storeRef.current.defaultSpriteUrl;
      const breatheUrl = storeRef.current.breatheSpriteUrl;

      // Add buttons for new targets
      targets.forEach((target) => {
        if (!buttonMap.has(target.id)) {
          const buttonData = createEngageButton(
            target,
            handleClick,
            blinkUrl,
            breatheUrl
          );
          target.container.appendChild(buttonData.button);
          buttonMap.set(target.id, buttonData);
        }
      });

      // Remove buttons for removed targets
      const currentIds = new Set(targets.map((t) => t.id));
      buttonMap.forEach((buttonData, id) => {
        if (!currentIds.has(id)) {
          buttonData.animator.destroy();
          buttonData.button.remove();
          buttonMap.delete(id);
        }
      });
    });

    return () => {
      cleanup();
      unsubscribe();
      // Destroy all animators
      buttonMap.forEach((buttonData) => {
        buttonData.animator.destroy();
      });
      buttonMap.clear();
    };
  }, []);
}
