import { insertCommentIntoField } from "./insert-comment";

/**
 * Opens the comment box for a post by clicking the Comment button
 * Uses aria-label selector for resilience against class changes
 *
 * @param postContainer - The LinkedIn post container element
 * @returns true if comment button was found and clicked
 */
export function clickCommentButton(postContainer: HTMLElement): boolean {
  const commentButton = postContainer.querySelector<HTMLButtonElement>(
    'button[aria-label="Comment"]',
  );

  if (!commentButton) {
    console.warn("EngageKit: Comment button not found in post container");
    return false;
  }

  commentButton.click();
  console.log("EngageKit: Clicked comment button");
  return true;
}

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
 * Submit a comment to a LinkedIn post
 * 1. Clicks the comment button to open the comment box
 * 2. Waits for the editable field to appear
 * 3. Inserts the comment text
 *
 * @param postContainer - The LinkedIn post container element
 * @param commentText - The comment to insert
 * @returns true if comment was successfully placed in the field
 */
export async function submitCommentToPost(
  postContainer: HTMLElement,
  commentText: string,
): Promise<boolean> {
  // Step 1: Click comment button
  const clicked = clickCommentButton(postContainer);
  if (!clicked) {
    return false;
  }

  // Step 2: Wait for editable field to appear
  const editableField = await waitForEditableField(postContainer);
  if (!editableField) {
    return false;
  }

  // Step 3: Focus and insert comment
  editableField.focus();
  insertCommentIntoField(editableField, commentText);

  console.log("EngageKit: Comment inserted successfully");
  return true;
}
