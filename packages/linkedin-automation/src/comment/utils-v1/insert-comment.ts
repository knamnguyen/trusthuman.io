/**
 * Insert Comment - DOM v1 (Legacy)
 *
 * Insert text into a LinkedIn comment field.
 * Handles multi-line content and triggers input events for LinkedIn to recognize changes.
 *
 * V1 DOM Structure:
 * - Comment input is a contenteditable div inside a form
 * - Uses standard paragraph elements for line breaks
 */

/**
 * Insert text into a LinkedIn comment field.
 * Handles multi-line content and triggers input events.
 *
 * @param editableField - The contenteditable element
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

  // Dispatch input event so LinkedIn recognizes changes
  editableField.dispatchEvent(
    new Event("input", { bubbles: true, cancelable: true })
  );
}
