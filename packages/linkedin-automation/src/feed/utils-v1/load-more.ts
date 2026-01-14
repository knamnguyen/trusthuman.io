/**
 * Load More - DOM v1 (legacy)
 *
 * Utility for loading more posts in the LinkedIn feed.
 * Prioritizes clicking the "Show more feed updates" button (faster),
 * falls back to scrolling (infinite scroll).
 */

import { countPosts } from "./count-posts";

/** Delay after clicking button before checking for new posts */
const BUTTON_WAIT_MS = 1500;

/** Delay after scrolling before checking for new posts */
const SCROLL_WAIT_MS = 1500;

/**
 * Try to click the "Show more feed updates" button.
 * Uses XPath for resilience against class name changes.
 *
 * @returns true if button was found and clicked
 */
function tryClickLoadMoreButton(): boolean {
  try {
    const result = document.evaluate(
      '//button[.//span[normalize-space(.) = "Show more feed updates"]]',
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    const btn = result.singleNodeValue as HTMLButtonElement | null;
    if (btn && !btn.disabled) {
      btn.click();
      return true;
    }
  } catch (error) {
    console.error("linkedin-automation: failed to click load more button", error);
  }
  return false;
}

/**
 * Fast scroll to bottom of page
 */
function fastScroll(): void {
  window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" });
}

/**
 * Load more posts into the feed.
 * Strategy: Try clicking the "Show more" button first (faster loading),
 * if not available, fall back to scrolling (infinite scroll).
 *
 * @returns true if new posts were loaded, false if no new posts appeared
 */
export async function loadMore(): Promise<boolean> {
  const initialCount = countPosts();

  // Priority 1: Try clicking the "Show more feed updates" button (faster)
  if (tryClickLoadMoreButton()) {
    await new Promise((r) => setTimeout(r, BUTTON_WAIT_MS));
    if (countPosts() > initialCount) {
      return true;
    }
  }

  // Priority 2: Fall back to scrolling (infinite scroll)
  fastScroll();
  await new Promise((r) => setTimeout(r, SCROLL_WAIT_MS));

  return countPosts() > initialCount;
}
