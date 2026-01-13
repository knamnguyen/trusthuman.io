/**
 * Wait for Comments Ready - DOM v1 (Legacy)
 *
 * Wait for comments to load on a post after clicking the comment button.
 *
 * V1 DOM Structure:
 * - Comments are article elements with data-id="urn:li:comment:*"
 */

/** Maximum time to wait for comments to load per post */
const MAX_WAIT_MS = 3000;

/** How often to check for comment count changes */
const POLL_INTERVAL_MS = 500;

/**
 * Get the count of comments in a post container.
 * V1: Comments are article elements with data-id containing "urn:li:comment".
 */
function getCommentCount(postContainer: HTMLElement): number {
  const comments = postContainer.querySelectorAll(
    'article[data-id^="urn:li:comment"]'
  );
  return comments.length;
}

/**
 * Wait for comments to load on a post after clicking the comment button.
 *
 * Detection logic:
 * - Poll every 500ms checking if comment count increased
 * - If count increases, comments have loaded → return immediately
 * - If 3 seconds pass without increase, assume ready (0 comments or slow load)
 *
 * @param container - The post container element
 * @param beforeCount - Comment count before clicking the comment button
 * @returns Promise that resolves when comments are ready
 */
export async function waitForCommentsReady(
  container: HTMLElement,
  beforeCount: number
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < MAX_WAIT_MS) {
    const afterCount = getCommentCount(container);

    if (afterCount > beforeCount) {
      // Comments loaded!
      return;
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  // Timeout reached - treat as ready anyway (0 comments or slow load)
  console.log(
    `[EngageKit] Comment load timeout for post, proceeding (before: ${beforeCount})`
  );
}
