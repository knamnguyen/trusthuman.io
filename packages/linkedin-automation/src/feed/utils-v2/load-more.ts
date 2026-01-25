/**
 * Load More - DOM v2 (React SSR + SDUI)
 *
 * Utility for loading more posts in the LinkedIn feed.
 * Prioritizes clicking the "Load more" button (faster),
 * falls back to scrolling (infinite scroll).
 */

import { countPosts } from "./count-posts";

/** Delay after clicking button before checking for new posts */
const BUTTON_WAIT_MS = 1500;

/** Delay after scrolling before checking for new posts */
const SCROLL_WAIT_MS = 1500;

/**
 * Try to click the "Load more" button.
 * Searches for button elements containing "Load more" text.
 *
 * @returns true if button was found and clicked
 */
function tryClickLoadMoreButton(): boolean {
  try {
    // Find all buttons and check for "Load more" text
    const buttons = document.querySelectorAll("button");
    for (const btn of buttons) {
      const text = btn.textContent?.trim();
      if (text === "Load more" && !btn.disabled) {
        btn.click();
        return true;
      }
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
 * Strategy: Try clicking the "Load more" button first (faster loading),
 * if not available, fall back to scrolling (infinite scroll).
 *
 * @returns true if new posts were loaded, false if no new posts appeared
 */
export async function loadMore(): Promise<boolean> {
  console.time(`⏱️ [load-more] loadMore cycle`);
  const initialCount = countPosts();

  // Priority 1: Try clicking the "Load more" button (faster)
  if (tryClickLoadMoreButton()) {
    console.time(`⏱️ [load-more] Button click wait (${BUTTON_WAIT_MS}ms)`);
    await new Promise((r) => setTimeout(r, BUTTON_WAIT_MS));
    console.timeEnd(`⏱️ [load-more] Button click wait (${BUTTON_WAIT_MS}ms)`);
    if (countPosts() > initialCount) {
      console.timeEnd(`⏱️ [load-more] loadMore cycle`);
      return true;
    }
  }

  // Priority 2: Fall back to scrolling (infinite scroll)
  fastScroll();
  console.time(`⏱️ [load-more] Scroll wait (${SCROLL_WAIT_MS}ms)`);
  await new Promise((r) => setTimeout(r, SCROLL_WAIT_MS));
  console.timeEnd(`⏱️ [load-more] Scroll wait (${SCROLL_WAIT_MS}ms)`);

  const hasNewPosts = countPosts() > initialCount;
  console.timeEnd(`⏱️ [load-more] loadMore cycle`);
  return hasNewPosts;
}
