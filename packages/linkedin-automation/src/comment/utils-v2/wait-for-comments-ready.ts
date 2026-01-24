/**
 * Wait for Comments Ready - DOM v2 (React SSR + SDUI)
 *
 * Wait for comments to load on a post after clicking the comment button.
 *
 * V2 DOM Structure:
 * - Comments: a[data-view-name="comment-actor-picture"]
 * - Replies: a[data-view-name="reply-actor-picture"]
 */

/** Maximum time to wait for comments to load per post */
const MAX_WAIT_MS = 5000;

/** How often to check for comment count changes */
const POLL_INTERVAL_MS = 500;

/**
 * Get the count of comments in a post container.
 * V2: Uses data-view-name attributes for comment/reply actor pictures.
 */
function getCommentCount(postContainer: HTMLElement): number {
  // Count main comments
  const commentPictures = postContainer.querySelectorAll(
    'a[data-view-name="comment-actor-picture"]',
  );

  // Count replies
  const replyPictures = postContainer.querySelectorAll(
    'a[data-view-name="reply-actor-picture"]',
  );

  return commentPictures.length + replyPictures.length;
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
  beforeCount: number,
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
    `[EngageKit] Comment load timeout for post, proceeding (before: ${beforeCount})`,
  );
}
