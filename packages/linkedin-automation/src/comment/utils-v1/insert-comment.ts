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

import { clickCommentButton } from "./click-comment-button";
import { findEditableField } from "./find-editable-field";

/**
 * Insert text into a LinkedIn comment field.
 * Handles multi-line content and triggers input events.
 *
 * Note: If the editable field is not immediately available (e.g., when skipCommentsLoading is enabled),
 * this function will automatically click the comment button to reveal the editor before inserting text.
 *
 * @param postContainer - The post container element
 * @param comment - The comment text to insert
 */
export async function insertComment(
  postContainer: HTMLElement,
  comment: string,
): Promise<boolean> {
  // 1. Wait for editable field (poll until found, max 3s)
  let editableField: HTMLElement | null = null;
  const startTime = Date.now();
  let clickedCommentButton = false;

  while (Date.now() - startTime < 3000) {
    editableField = findEditableField(postContainer);
    if (editableField) break;

    // If not found after 500ms and we haven't clicked yet, try clicking the comment button
    if (!clickedCommentButton && Date.now() - startTime > 500) {
      console.log(
        "EngageKit: Editable field not found, clicking comment button to reveal editor",
      );
      const clicked = clickCommentButton(postContainer);
      if (clicked) {
        clickedCommentButton = true;
        // Give LinkedIn time to expand the editor (300ms)
        await new Promise((r) => setTimeout(r, 300));
      }
    }

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
