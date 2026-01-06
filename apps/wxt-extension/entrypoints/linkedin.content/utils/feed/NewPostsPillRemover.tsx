import { useEffect } from "react";

/**
 * Find the "New posts" pill button without using class selectors.
 * Identifies by: button containing a span with exact text "New posts"
 */
function findNewPostsPill(container: Element): HTMLElement | null {
  const buttons = container.querySelectorAll("button");

  for (const button of buttons) {
    const spans = button.querySelectorAll("span");
    for (const span of spans) {
      if (span.textContent?.trim() === "New posts") {
        return button;
      }
    }
  }

  return null;
}

/**
 * Remove the "New posts" pill if found
 */
function removeNewPostsPill(container: Element): void {
  const pill = findNewPostsPill(container);
  if (pill) {
    console.log("EngageKit: Removing 'New posts' pill");
    pill.remove();
  }
}

/**
 * Observer component that watches the LinkedIn main feed and removes
 * the "New posts" pill button whenever it appears.
 *
 * This prevents the feed from prompting users to load new posts,
 * which can disrupt the workflow.
 *
 * This component renders nothing - it only sets up the MutationObserver.
 */
export function NewPostsPillRemover() {
  useEffect(() => {
    // Find the main feed element
    const mainFeed = document.querySelector('main[aria-label="Main Feed"]');

    if (!mainFeed) {
      console.warn("EngageKit: Main Feed element not found");
      return;
    }

    // Initial check - remove if already present
    removeNewPostsPill(mainFeed);

    // Create MutationObserver to watch for the pill appearing
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // Check added nodes for the pill
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node instanceof Element) {
              // Check if this node or its descendants contain the pill
              const pill = findNewPostsPill(node);
              if (pill) {
                console.log("EngageKit: Removing 'New posts' pill (added)");
                pill.remove();
                return; // Found and removed, done for this mutation batch
              }
            }
          }
        }

        // Also check the target itself in case of attribute/subtree changes
        if (mutation.target instanceof Element) {
          removeNewPostsPill(mutation.target);
        }
      }
    });

    // Start observing the main feed
    observer.observe(mainFeed, {
      childList: true,
      subtree: true,
    });

    console.log("EngageKit: NewPostsPillRemover active");

    // Cleanup on unmount
    return () => {
      observer.disconnect();
      console.log("EngageKit: NewPostsPillRemover disconnected");
    };
  }, []);

  // This component renders nothing
  return null;
}
