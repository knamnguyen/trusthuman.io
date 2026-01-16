/**
 * Submit Comment - DOM v2 (React SSR + SDUI)
 *
 * Clicks the submit button and verifies the comment was posted.
 * Note: Comment text should already be inserted before calling this.
 *
 * Flow:
 * 1. Capture comment URLs before submission
 * 2. Find and click submit button
 * 3. Verify comment was posted (count increased)
 * 4. Extract the new comment's URL by comparing before/after
 *
 * V2 DOM Structure:
 * - No <form> element wrapping comment input
 * - Submit button: button[data-view-name="comment-post"]
 * - Comments: a[data-view-name="comment-actor-picture"] (main) + a[data-view-name="reply-actor-picture"] (replies)
 */

import { getCommentUrls, findNewCommentUrl } from "./extract-comment-url";
import type { SubmitCommentResult } from "../types";

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
 * Get the count of comments in a post container.
 * V2 uses data-view-name attributes for comment/reply actor pictures.
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
 * Clicks the submit button and verifies the comment was posted.
 * Returns the URL of the newly posted comment.
 *
 * Note: Comment text should already be inserted via insertComment()
 * before calling this function. This allows for tagging and image
 * attachment between insert and submit.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns Result with success status and comment URL info
 */
export async function submitComment(
  postContainer: HTMLElement
): Promise<SubmitCommentResult> {
  // Capture comment URLs before submission
  const commentUrlsBefore = getCommentUrls(postContainer);
  const commentCountBefore = getCommentCount(postContainer);
  console.log(
    `EngageKit: Comment count before submission: ${commentCountBefore}`
  );

  // Find the submit button
  const submitButton = findSubmitButton(postContainer);
  if (!submitButton) {
    console.warn("EngageKit: Submit button not found (v2)");
    return { success: false };
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

    // Extract the new comment's URL
    const commentUrlsAfter = getCommentUrls(postContainer);
    const newCommentInfo = findNewCommentUrl(commentUrlsBefore, commentUrlsAfter);

    if (newCommentInfo) {
      console.log(`EngageKit: New comment URL: ${newCommentInfo.url}`);
    } else {
      console.warn("EngageKit: Could not extract new comment URL");
    }

    // Blur focus so spacebar can trigger new generation
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    return {
      success: true,
      commentUrn: newCommentInfo?.urn,
      commentUrl: newCommentInfo?.url,
    };
  } else {
    const currentCount = getCommentCount(postContainer);
    console.warn(
      `EngageKit: Verification failed (v2). Count still at ${currentCount} (expected > ${commentCountBefore})`
    );
    return { success: false };
  }
}
