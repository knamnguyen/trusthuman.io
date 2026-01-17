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

import { findEditableField } from "./find-editable-field";

/**
 * Insert text into a LinkedIn comment field.
 * Handles multi-line content and triggers input events.
 *
 * @param editableField - The contenteditable element (TipTap/ProseMirror)
 * @param comment - The comment text to insert
 * @return true if insertion succeeded, false otherwise
 */
export async function insertComment(
  postContainer: HTMLElement,
  comment: string,
): Promise<boolean> {
  // 1. Wait for editable field (poll until found, max 3s)
  let editableField: HTMLElement | null = null;
  const startTime = Date.now();
  while (Date.now() - startTime < 3000) {
    editableField = findEditableField(postContainer);
    if (editableField) break;
    await new Promise((r) => setTimeout(r, 100));
  }

  if (!editableField) {
    console.warn("EngageKit: Editable field not found in post container");
    return false;
  }

  // 2. Focus the editable field
  editableField.focus();

  // 3. Clear existing content
  editableField.innerHTML = "";

  // 4. Insert each line as a paragraph
  comment.split("\n").forEach((line) => {
    const p = document.createElement("p");
    if (line === "") {
      p.appendChild(document.createElement("br"));
    } else {
      p.textContent = line;
    }
    editableField.appendChild(p);
  });

  // 5. Dispatch input event so LinkedIn/TipTap recognizes changes
  editableField.dispatchEvent(
    new Event("input", { bubbles: true, cancelable: true }),
  );

  return true;
}
