import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { EngageKitSprite } from "@sassy/ui/components/engagekit-sprite";

import { useTRPC } from "../../../lib/trpc/client";
import { useCommentStore } from "../stores/comment-store";
import { SIDEBAR_TABS, useSidebarStore } from "../stores/sidebar-store";
import {
  DEFAULT_STYLE_GUIDE,
  extractAdjacentComments,
  extractPostContent,
  findEditableField,
  findPostContainer,
  insertCommentIntoField,
  setCurrentEditableField,
} from "../utils";

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
  // Comment store for AI generation state
  const { setComments, setIsGenerating, setPostContent, generateVariations } =
    useCommentStore();
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

    if (generateComment.isPending) return;

    // Find the surrounding post container using the anchor element
    const postContainer = findPostContainer(anchorElement);

    if (!postContainer) {
      console.warn("EngageKit: unable to locate surrounding post container");
      return;
    }

    // Extract post content
    const postContent = extractPostContent(postContainer);

    if (!postContent) {
      console.warn("EngageKit: unable to extract post content");
      return;
    }

    // Extract adjacent comments for context
    const adjacentComments = extractAdjacentComments(postContainer);

    console.log(
      "EngageKit: generating comment for post:",
      postContent.slice(0, 100),
    );

    // Update store: start generating and open sidebar to Write tab
    setIsGenerating(true);
    setPostContent(postContent);
    setComments([]);
    openToTab(SIDEBAR_TABS.WRITE);

    const requestParams = {
      postContent,
      styleGuide: DEFAULT_STYLE_GUIDE,
      adjacentComments,
    };

    // Find editable field for potential insertion
    const form = anchorElement.closest("form");
    const editableField = findEditableField(form);

    try {
      if (generateVariations) {
        // Store the editable field for later insertion when user picks a variation
        setCurrentEditableField(editableField);

        // Send 3 parallel requests for variations
        console.log("EngageKit: generating 3 variations in parallel");
        const results = await Promise.all([
          generateComment.mutateAsync(requestParams),
          generateComment.mutateAsync(requestParams),
          generateComment.mutateAsync(requestParams),
        ]);

        // Extract comments from results
        const comments = results.map((r) => r.comment);
        setComments(comments);

        // Don't auto-insert - user picks from variations in sidebar
      } else {
        // Single request mode
        const result = await generateComment.mutateAsync(requestParams);

        if (!result.success) {
          console.warn("EngageKit: AI generation failed, using fallback");
        }

        // Update store with generated comment
        setComments([result.comment]);

        // Insert generated comment into editable field
        if (!editableField) {
          console.warn("EngageKit: editable field not found");
          return;
        }

        insertCommentIntoField(editableField, result.comment);
      }
    } catch (err) {
      console.error("EngageKit: error generating comment", err);
      setComments([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const iconSize = 32;
  const isLoading = generateComment.isPending;

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px",
        backgroundColor: isHovered && !isLoading ? "#f3f6f8" : "transparent",
        border: "none",
        borderRadius: "50%",
        transition: "background-color 0.15s",
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
