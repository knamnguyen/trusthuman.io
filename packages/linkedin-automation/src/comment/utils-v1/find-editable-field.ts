/**
 * Find Editable Field - DOM v1 (Legacy)
 *
 * Finds the contenteditable comment input field within a post container.
 *
 * V1 DOM Structure:
 * - Comment input is inside a <form> element
 * - Uses div[contenteditable="true"]
 */

/**
 * Find the editable comment field within a post container.
 * The comment input must already be visible (after clicking comment button).
 *
 * @param postContainer - The LinkedIn post container element
 * @returns The contenteditable element, or null if not found
 */
export function findEditableField(
  postContainer: HTMLElement
): HTMLElement | null {
  // V1: LinkedIn's comment editor is a contenteditable div inside a form
  return (
    postContainer.querySelector<HTMLElement>('div[contenteditable="true"]') ||
    null
  );
}
