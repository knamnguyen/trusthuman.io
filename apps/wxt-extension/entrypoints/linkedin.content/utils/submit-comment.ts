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
 * Note: Comment button should already be clicked during the loading phase.
 * This function waits for the editable field and inserts the comment text.
 *
 * @param postContainer - The LinkedIn post container element
 * @param commentText - The comment to insert
 * @returns true if comment was successfully placed in the field
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

  // Focus and insert comment
  editableField.focus();
  insertCommentIntoField(editableField, commentText);

  console.log("EngageKit: Comment inserted successfully");
  return true;
}
