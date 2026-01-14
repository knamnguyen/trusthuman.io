/**
 * Submit Comment - DOM v2 (React SSR + SDUI)
 *
 * Full flow to submit a comment to a LinkedIn post:
 * 1. Wait for editable field to appear
 * 2. Insert comment text
 * 3. Click submit button
 * 4. Verify comment was posted
 *
 * V2 DOM Structure:
 * - No <form> element wrapping comment input
 * - Submit button: button[data-view-name="comment-post"]
 * - Comments: a[data-view-name="comment-actor-picture"] (main) + a[data-view-name="reply-actor-picture"] (replies)
 * - Uses TipTap/ProseMirror editor
 */

import { findEditableField } from "./find-editable-field";
import { insertComment } from "./insert-comment";

/**
 * Finds the submit button (Comment/Reply) within a post container.
 * V2 uses data-view-name="comment-post" attribute.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns The submit button element, or null if not found
 */
export function findSubmitButton(
  postContainer: HTMLElement
): HTMLButtonElement | null {
  // V2: Submit button with data-view-name="comment-post"
  const submitButton = postContainer.querySelector<HTMLButtonElement>(
    'button[data-view-name="comment-post"]'
  );

  if (submitButton) {
    return submitButton;
  }

  // Fallback: Look for button with "Comment" or "Reply" text in span
  const buttons = postContainer.querySelectorAll("button");
  for (const btn of buttons) {
    const spans = btn.querySelectorAll("span");
    for (const span of spans) {
      const text = span.textContent?.trim();
      if (text === "Comment" || text === "Reply") {
        return btn as HTMLButtonElement;
      }
    }
  }

  return null;
}

/**
 * Wait for the editable field to appear in the post container.
 * LinkedIn loads the comment box asynchronously after clicking.
 *
 * @param postContainer - The LinkedIn post container element
 * @param timeout - Maximum time to wait in ms (default 3000ms)
 * @returns The editable field, or null if timeout
 */
export async function waitForEditableField(
  postContainer: HTMLElement,
  timeout = 3000
): Promise<HTMLElement | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const field = findEditableField(postContainer);
    if (field) {
      return field;
    }
    // Poll every 100ms
    await new Promise((r) => setTimeout(r, 100));
  }

  console.warn("EngageKit: Timeout waiting for editable field");
  return null;
}

/**
 * Get the count of comments in a post container.
 * V2 uses data-view-name attributes for comment/reply actor pictures.
 * Reuses the same pattern as extract-post-comments.ts
 */
function getCommentCount(postContainer: HTMLElement): number {
  // Count main comments
  const commentPictures = postContainer.querySelectorAll(
    'a[data-view-name="comment-actor-picture"]'
  );

  // Count replies
  const replyPictures = postContainer.querySelectorAll(
    'a[data-view-name="reply-actor-picture"]'
  );

  return commentPictures.length + replyPictures.length;
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
 * Note: Comment button should already be clicked during the loading phase.
 * This function waits for the editable field, inserts the comment text,
 * clicks the submit button, and verifies the comment was posted.
 *
 * @param postContainer - The LinkedIn post container element
 * @param commentText - The comment to insert
 * @returns true if comment was successfully submitted and verified
 */
export async function submitComment(
  postContainer: HTMLElement,
  commentText: string
): Promise<boolean> {
  // Wait for editable field to appear (comment button already clicked during load)
  const editableField = await waitForEditableField(postContainer);
  if (!editableField) {
    return false;
  }

  // Get comment count before submission for verification
  const commentCountBefore = getCommentCount(postContainer);
  console.log(
    `EngageKit: Comment count before submission: ${commentCountBefore}`
  );

  // Focus and insert comment
  editableField.focus();
  await insertComment(editableField, commentText);

  // Small delay to let LinkedIn/TipTap react to the input
  await new Promise((r) => setTimeout(r, 500));

  // Find and click the submit button
  const submitButton = findSubmitButton(postContainer);
  if (!submitButton) {
    console.warn("EngageKit: Submit button not found");
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
      `EngageKit: Verification failed. Count still at ${currentCount} (expected > ${commentCountBefore})`
    );
    return false;
  }
}
