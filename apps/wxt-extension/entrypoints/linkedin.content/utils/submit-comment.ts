import { insertCommentIntoField } from "./insert-comment";

/**
 * Finds the editable comment field within a post container
 * Searches for contenteditable div (LinkedIn's comment input)
 *
 * @param postContainer - The LinkedIn post container element
 * @returns The editable field element, or null if not found
 */
export function findEditableFieldInPost(
  postContainer: HTMLElement,
): HTMLElement | null {
  // LinkedIn's comment editor is a contenteditable div
  const editableField = postContainer.querySelector<HTMLElement>(
    'div[contenteditable="true"]',
  );

  return editableField;
}

/**
 * Finds the submit button (Comment/Reply) within a post container
 * Looks for a button containing a span with "Comment" or "Reply" text
 *
 * @param postContainer - The LinkedIn post container element
 * @returns The submit button element, or null if not found
 */
export function findSubmitButton(
  postContainer: HTMLElement,
): HTMLButtonElement | null {
  // Find the form containing the comment box
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
 * Wait for the editable field to appear in the post container
 * LinkedIn loads the comment box asynchronously after clicking
 *
 * @param postContainer - The LinkedIn post container element
 * @param timeout - Maximum time to wait in ms (default 3000ms)
 * @returns The editable field, or null if timeout
 */
export async function waitForEditableField(
  postContainer: HTMLElement,
  timeout = 3000,
): Promise<HTMLElement | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const field = findEditableFieldInPost(postContainer);
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
 * Get the count of comments in a post container
 * Comments are identified by article elements with data-id containing "urn:li:comment"
 */
function getCommentCount(postContainer: HTMLElement): number {
  const comments = postContainer.querySelectorAll('article[data-id^="urn:li:comment"]');
  return comments.length;
}

/**
 * Wait for a new comment to appear in the post container
 * @param postContainer - The LinkedIn post container element
 * @param previousCount - The comment count before submission
 * @param timeout - Maximum time to wait in ms (default 5000ms)
 * @returns true if a new comment appeared
 */
async function waitForNewComment(
  postContainer: HTMLElement,
  previousCount: number,
  timeout = 5000,
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
 * Submit a comment to a LinkedIn post
 * Note: Comment button should already be clicked during the loading phase.
 * This function waits for the editable field, inserts the comment text,
 * clicks the submit button, and verifies the comment was posted.
 *
 * @param postContainer - The LinkedIn post container element
 * @param commentText - The comment to insert
 * @returns true if comment was successfully submitted and verified
 */
export async function submitCommentToPost(
  postContainer: HTMLElement,
  commentText: string,
): Promise<boolean> {
  // Wait for editable field to appear (comment button already clicked during load)
  const editableField = await waitForEditableField(postContainer);
  if (!editableField) {
    return false;
  }

  // Get comment count before submission for verification
  const commentCountBefore = getCommentCount(postContainer);
  console.log(`EngageKit: Comment count before submission: ${commentCountBefore}`);

  // Focus and insert comment
  editableField.focus();
  await insertCommentIntoField(editableField, commentText);

  // Small delay to let LinkedIn react to the input
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
    console.log(`EngageKit: Comment verified! Count: ${commentCountBefore} → ${newCount}`);
    return true;
  } else {
    const currentCount = getCommentCount(postContainer);
    console.warn(`EngageKit: Verification failed. Count still at ${currentCount} (expected > ${commentCountBefore})`);
    return false;
  }
}
