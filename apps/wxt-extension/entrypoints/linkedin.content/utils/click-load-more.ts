/**
 * Helper to wait
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Count current post containers in the feed
 */
function countPosts(): number {
  return document.querySelectorAll('div[data-urn*="activity"]').length;
}

/**
 * Try to click the "Show more feed updates" button
 * Uses XPath for resilience against class name changes
 */
function tryClickLoadMoreButton(): boolean {
  try {
    const result = document.evaluate(
      '//button[.//span[normalize-space(.) = "Show more feed updates"]]',
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    );
    const btn = result.singleNodeValue as HTMLButtonElement | null;
    if (btn && !btn.disabled) {
      btn.click();
      console.log("EngageKit: clicked load more feed updates button");
      return true;
    }
  } catch (error) {
    console.error("EngageKit: failed to click load more button", error);
  }
  return false;
}

/**
 * Load more posts by scrolling down (infinite scroll) or clicking load more button.
 * LinkedIn primarily uses infinite scroll - posts load as you scroll down.
 * The "Show more feed updates" button only appears occasionally.
 *
 * @returns true if new posts were loaded, false if we've reached the end
 */
export const clickLoadMore = async (): Promise<boolean> => {
  const initialCount = countPosts();

  // First, try clicking the "Show more feed updates" button if it exists
  if (tryClickLoadMoreButton()) {
    await wait(1500);
    if (countPosts() > initialCount) {
      return true;
    }
  }

  // Otherwise, scroll down to trigger infinite scroll
  // Find the last post and scroll it into view
  const posts = document.querySelectorAll<HTMLElement>('div[data-urn*="activity"]');
  const lastPost = posts[posts.length - 1];

  if (lastPost) {
    lastPost.scrollIntoView({ behavior: "smooth", block: "end" });
    await wait(500);

    // Also scroll the window a bit more to ensure we trigger loading
    window.scrollBy({ top: 500, behavior: "smooth" });
    await wait(1500);

    const newCount = countPosts();
    if (newCount > initialCount) {
      console.log(`EngageKit: loaded ${newCount - initialCount} more posts via scroll`);
      return true;
    }
  }

  // Try one more aggressive scroll
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  await wait(2000);

  const finalCount = countPosts();
  if (finalCount > initialCount) {
    console.log(`EngageKit: loaded ${finalCount - initialCount} more posts via aggressive scroll`);
    return true;
  }

  console.log("EngageKit: no more posts to load");
  return false;
};
