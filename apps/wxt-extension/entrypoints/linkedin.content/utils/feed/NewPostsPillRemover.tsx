import { useEffect } from "react";

/**
 * Find the "New posts" pill button without using class selectors.
 * Identifies by: button containing a span with exact text "New posts"
 */
function findNewPostsPill(container: Element): HTMLElement | null {
  // Find all buttons within the container
  const buttons = container.querySelectorAll("button");

  for (const button of buttons) {
    // Look for a span with text "New posts" inside the button
    const spans = button.querySelectorAll("span");
    for (const span of spans) {
      if (span.textContent?.trim() === "New posts") {
        // Return the outermost container div (parent of the sticky div)
        // Walk up to find the container that wraps the entire pill
        let current: HTMLElement | null = button;
        while (current && current.parentElement) {
          const parent = current.parentElement;
          // Stop at main feed or if we've gone too far up
          if (
            parent.tagName === "MAIN" ||
            parent.getAttribute("aria-label") === "Main Feed"
          ) {
            break;
          }
          // The pill container is typically a direct child structure
          // Check if this looks like the pill wrapper (has sticky child)
          const stickyChild = parent.querySelector('[style*="sticky"]');
          if (stickyChild || parent.querySelector("button") === button) {
            current = parent;
          } else {
            break;
          }
        }
        return current;
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
