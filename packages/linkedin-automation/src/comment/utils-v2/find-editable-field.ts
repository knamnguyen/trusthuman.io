/**
 * Find Editable Field - DOM v2 (React SSR + SDUI)
 *
 * Finds the contenteditable comment input field within a post container.
 *
 * V2 DOM Structure:
 * - No <form> element wrapping the comment input
 * - Uses TipTap/ProseMirror editor
 * - Comment box: div[data-view-name="comment-box"]
 * - Editor: div.tiptap.ProseMirror[contenteditable="true"]
 * - Parent has aria-label="Text editor for creating comment"
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
  // V2: TipTap/ProseMirror editor inside comment-box
  // Try specific selector first for accuracy
  const commentBox = postContainer.querySelector<HTMLElement>(
    'div[data-view-name="comment-box"] div[contenteditable="true"]'
  );
  if (commentBox) {
    return commentBox;
  }

  // Fallback: look for TipTap editor class
  const tiptapEditor = postContainer.querySelector<HTMLElement>(
    'div.tiptap.ProseMirror[contenteditable="true"]'
  );
  if (tiptapEditor) {
    return tiptapEditor;
  }

  // Last fallback: any contenteditable within comment text editor area
  const textEditor = postContainer.querySelector<HTMLElement>(
    'div[aria-label="Text editor for creating comment"] div[contenteditable="true"]'
  );
  return textEditor || null;
}
