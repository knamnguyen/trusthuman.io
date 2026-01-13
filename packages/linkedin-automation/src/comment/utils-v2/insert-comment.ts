/**
 * Insert Comment - DOM v2 (React SSR + SDUI)
 *
 * Insert text into a LinkedIn comment field.
 * Handles multi-line content and triggers input events for LinkedIn to recognize changes.
 *
 * V2 DOM Structure:
 * - Uses TipTap/ProseMirror editor
 * - Comment box: div[data-view-name="comment-box"]
 * - Editor: div.tiptap.ProseMirror[contenteditable="true"]
 */

/**
 * Insert text into a LinkedIn comment field.
 * Handles multi-line content and triggers input events.
 *
 * @param editableField - The contenteditable element (TipTap/ProseMirror)
 * @param comment - The comment text to insert
 */
export async function insertComment(
  editableField: HTMLElement,
  comment: string
): Promise<void> {
  // Clear existing content
  editableField.innerHTML = "";

  // Insert each line as a paragraph
  comment.split("\n").forEach((line) => {
    const p = document.createElement("p");
    if (line === "") {
      p.appendChild(document.createElement("br"));
    } else {
      p.textContent = line;
    }
    editableField.appendChild(p);
  });

  // Dispatch input event so LinkedIn/TipTap recognizes changes
  editableField.dispatchEvent(
    new Event("input", { bubbles: true, cancelable: true })
  );
}
