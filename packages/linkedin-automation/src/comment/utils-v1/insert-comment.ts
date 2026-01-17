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

import { findEditableField } from "./find-editable-field";

/**
 * Insert text into a LinkedIn comment field.
 * Handles multi-line content and triggers input events.
 *
 * @param editableField - The contenteditable element
 * @param comment - The comment text to insert
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

  // 2. Insert comment text
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

  // 5. Dispatch input event so LinkedIn recognizes changes
  editableField.dispatchEvent(
    new Event("input", { bubbles: true, cancelable: true }),
  );

  return true;
}
