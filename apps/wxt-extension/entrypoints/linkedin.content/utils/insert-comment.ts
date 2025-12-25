// Store reference to the last used editable field for variation selection
let currentEditableField: HTMLElement | null = null;

/**
 * Set the current editable field for later insertion
 */
export function setCurrentEditableField(field: HTMLElement | null): void {
  currentEditableField = field;
}

/**
 * Get the current editable field
 */
export function getCurrentEditableField(): HTMLElement | null {
  return currentEditableField;
}

/**
 * Insert text into a LinkedIn comment field
 * Handles multi-line content and triggers input events
 */
export function insertCommentIntoField(
  editableField: HTMLElement,
  comment: string,
): void {
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
    new Event("input", { bubbles: true, cancelable: true }),
  );
}

/**
 * Insert comment into the current editable field (if set)
 * Returns true if successful, false otherwise
 */
export function insertIntoCurrentField(comment: string): boolean {
  if (!currentEditableField) {
    console.warn("EngageKit: No current editable field set");
    return false;
  }
  insertCommentIntoField(currentEditableField, comment);
  return true;
}
