import { useState } from "react";

import { EngageKitSprite } from "@sassy/ui/components/engagekit-sprite";

interface EngageButtonProps {
  anchorElement: Element;
}

/**
 * Engage button that injects into LinkedIn comment forms.
 * Uses inline styles since it renders via portal outside shadow DOM.
 */
export function EngageButton({ anchorElement }: EngageButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Get asset URLs from extension public folder
  const defaultSpriteUrl = chrome.runtime.getURL("/engagekit-sprite-blink.svg");
  const loadingSpriteUrl = chrome.runtime.getURL(
    "/engagekit-sprite-loading.svg",
  );

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading) return;

    setIsLoading(true);
    try {
      // Find the surrounding post container using the anchor element
      const form = anchorElement.closest("form");
      const postContainer =
        form?.closest("div[data-urn]") ||
        form?.closest("div[data-id]") ||
        form?.closest("article[role='article']") ||
        document.querySelector("main");

      if (!postContainer) {
        console.warn("EngageKit: unable to locate surrounding post container");
        // Still show loading for demo
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return;
      }

      // Extract post content - try multiple selectors
      const postContentEl =
        postContainer.querySelector('[data-ad-preview="message"]') ||
        postContainer.querySelector(".feed-shared-update-v2__description") ||
        postContainer.querySelector(".update-components-text");
      const postContent = postContentEl?.textContent?.trim() || "";

      if (!postContent) {
        console.warn("EngageKit: unable to extract post content");
        // Still show loading for demo
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return;
      }

      // TODO: Call tRPC to generate comment
      console.log(
        "EngageKit: generating comment for post:",
        postContent.slice(0, 100),
      );

      // Simulate API call delay for demo - replace with actual tRPC call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Placeholder - replace with actual tRPC call
      const generated = `This is a placeholder comment. Post content: "${postContent.slice(0, 50)}..."`;

      // Find editable field and insert generated comment
      const editableField = form?.querySelector<HTMLElement>(
        'div[contenteditable="true"]',
      );
      if (!editableField) {
        console.warn("EngageKit: editable field not found");
        return;
      }

      // Replace content with generated comment
      editableField.innerHTML = "";
      generated.split("\n").forEach((line) => {
        const p = document.createElement("p");
        if (line === "") {
          p.appendChild(document.createElement("br"));
        } else {
          p.textContent = line;
        }
        editableField.appendChild(p);
      });

      // Dispatch input event so LinkedIn recognizes changes
      editableField.dispatchEvent(
        new Event("input", { bubbles: true, cancelable: true }),
      );
    } catch (err) {
      console.error("EngageKit: unexpected error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const iconSize = 32;

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
        cursor: isLoading ? "wait" : "pointer",
        transition: "background-color 0.15s",
      }}
    >
      {isLoading ? (
        <EngageKitSprite
          spriteUrl={loadingSpriteUrl}
          size={iconSize}
          fps={6}
          frameCount={6}
        />
      ) : (
        <EngageKitSprite
          spriteUrl={defaultSpriteUrl}
          size={iconSize}
          fps={6}
          frameCount={3}
          delayBetweenCycles={2000}
        />
      )}
    </button>
  );
}
