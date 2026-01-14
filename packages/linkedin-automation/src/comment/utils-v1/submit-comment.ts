/**
 * Submit Comment - DOM v1 (Legacy)
 *
 * Clicks the submit button and verifies the comment was posted.
 * Note: Comment text should already be inserted before calling this.
 *
 * Flow:
 * 1. Find submit button (Comment/Reply)
 * 2. Click submit button
 * 3. Verify comment was posted (count increased)
 *
 * V1 DOM Structure:
 * - Comment form wrapped in <form> element
 * - Submit button inside form with "Comment" or "Reply" text
 * - Comments are article elements with data-id="urn:li:comment:*"
 */

/**
 * Finds the submit button (Comment/Reply) within a post container.
 * Looks for a button containing a span with "Comment" or "Reply" text inside a form.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns The submit button element, or null if not found
 */
export function findSubmitButton(
  postContainer: HTMLElement
): HTMLButtonElement | null {
  // V1: Find the form containing the comment box
  const form = postContainer.querySelector("form");
  if (!form) return null;

  // Find button containing a span with "Comment" or "Reply" text
  const buttons = form.querySelectorAll("button");
  for (const btn of buttons) {
    const span = btn.querySelector("span");
    const text = span?.textContent?.trim();
    if (text === "Comment" || text === "Reply") {
      return btn as HTMLButtonElement;
    }
  }

  return null;
}


/**
 * Get the count of comments in a post container.
 * Comments are identified by article elements with data-id containing "urn:li:comment".
 */
function getCommentCount(postContainer: HTMLElement): number {
  const comments = postContainer.querySelectorAll(
    'article[data-id^="urn:li:comment"]'
  );
  return comments.length;
}

/**
 * Wait for a new comment to appear in the post container.
 *
 * @param postContainer - The LinkedIn post container element
 * @param previousCount - The comment count before submission
 * @param timeout - Maximum time to wait in ms (default 5000ms)
 * @returns true if a new comment appeared
 */
async function waitForNewComment(
  postContainer: HTMLElement,
  previousCount: number,
  timeout = 5000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const currentCount = getCommentCount(postContainer);
    if (currentCount > previousCount) {
      return true;
    }
    // Poll every 200ms
    await new Promise((r) => setTimeout(r, 200));
  }

  return false;
}

/**
 * Submit a comment to a LinkedIn post.
 * Clicks the submit button and verifies the comment was posted.
 *
 * Note: Comment text should already be inserted via insertComment()
 * before calling this function. This allows for tagging and image
 * attachment between insert and submit.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns true if comment was successfully submitted and verified
 */
export async function submitComment(
  postContainer: HTMLElement
): Promise<boolean> {
  // Get comment count before submission for verification
  const commentCountBefore = getCommentCount(postContainer);
  console.log(
    `EngageKit: Comment count before submission: ${commentCountBefore}`
  );

  // Find the submit button
  const submitButton = findSubmitButton(postContainer);
  if (!submitButton) {
    console.warn("EngageKit: Submit button not found (v1)");
    return false;
  }

  // Click the submit button
  submitButton.click();
  console.log("EngageKit: Submit button clicked, waiting for verification...");

  // Wait for the new comment to appear
  const verified = await waitForNewComment(postContainer, commentCountBefore);

  if (verified) {
    const newCount = getCommentCount(postContainer);
    console.log(
      `EngageKit: Comment verified! Count: ${commentCountBefore} → ${newCount}`
    );

    // Blur focus so spacebar can trigger new generation
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    return true;
  } else {
    const currentCount = getCommentCount(postContainer);
    console.warn(
      `EngageKit: Verification failed (v1). Count still at ${currentCount} (expected > ${commentCountBefore})`
    );
    return false;
  }
}
