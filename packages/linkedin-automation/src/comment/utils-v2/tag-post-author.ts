/**
 * Tag Post Author - DOM v2 (React SSR + SDUI)
 *
 * Tags the post author at the END of a comment using LinkedIn's mention picker.
 *
 * Flow:
 * 1. Move cursor to end of comment
 * 2. Ensure space before @ (mention picker requires it)
 * 3. Type "@" to trigger mention picker
 * 4. Wait for dropdown to appear
 * 5. Use keyboard navigation (ArrowDown + Enter) to select first option
 */

/**
 * Waits for the mention picker dropdown to appear.
 * Polls until found or timeout reached.
 *
 * @param maxWaitMs - Maximum time to wait in milliseconds
 * @param pollIntervalMs - Interval between checks
 * @returns true if dropdown appeared, false otherwise
 */
async function waitForMentionDropdown(
  maxWaitMs: number = 3000,
  pollIntervalMs: number = 100
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const dropdown = document.querySelector<HTMLElement>(
      '[data-testid="typeahead-results-container"]'
    );
    if (dropdown) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return false;
}

/**
 * Dispatches a keyboard event to the active element.
 */
function sendKey(key: string, code: string, keyCode: number): void {
  const eventInit: KeyboardEventInit = {
    key,
    code,
    keyCode,
    which: keyCode,
    bubbles: true,
    cancelable: true,
    composed: true,
  };
  document.activeElement?.dispatchEvent(new KeyboardEvent("keydown", eventInit));
  document.activeElement?.dispatchEvent(new KeyboardEvent("keyup", eventInit));
}

/**
 * Tags the post author at the END of the comment.
 * Uses LinkedIn's mention picker to create a proper mention.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns Promise<boolean> - true if author was tagged, false otherwise
 */
export async function tagPostAuthor(postContainer: HTMLElement): Promise<boolean> {
  try {
    // Find the TipTap editor (V2 uses ProseMirror-based editor)
    const editor = postContainer.querySelector<HTMLElement>(".tiptap.ProseMirror");

    if (!editor) {
      console.warn("EngageKit: Comment editor not found (v2)");
      return false;
    }

    // Focus the editor
    editor.focus();

    // Move cursor to END of content
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false); // false = collapse to end
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Small delay to ensure focus and cursor position are registered
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check if editor has existing content - if so, ensure space before @
    // Mention picker only appears when @ is not attached to preceding text
    const editorText = editor.textContent || "";
    if (editorText.length > 0 && !editorText.endsWith(" ")) {
      document.execCommand("insertText", false, " ");
    }

    // Type "@" to trigger the mention picker
    // Post author typically appears as first suggestion
    document.execCommand("insertText", false, "@");

    // Wait for the mention dropdown to appear
    const dropdownVisible = await waitForMentionDropdown(3000, 100);

    if (!dropdownVisible) {
      console.warn("EngageKit: Mention dropdown did not appear (v2)");
      // Clean up the @ we typed
      document.execCommand("delete", false);
      return false;
    }

    // Wait for options to fully load
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Use keyboard navigation to select first option
    // ArrowDown selects the first option, Enter confirms
    sendKey("ArrowDown", "ArrowDown", 40);
    await new Promise((resolve) => setTimeout(resolve, 300));

    sendKey("Enter", "Enter", 13);

    // Wait for mention to be inserted
    await new Promise((resolve) => setTimeout(resolve, 200));

    console.log("EngageKit: Post author tagged successfully (v2)");
    return true;
  } catch (error) {
    console.error("EngageKit: Failed to tag post author (v2)", error);
    return false;
  }
}
