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
 * 5. Click on first option to select
 */

/**
 * Waits for the mention picker dropdown to appear and returns first option.
 * Polls until found or timeout reached.
 *
 * @param maxWaitMs - Maximum time to wait in milliseconds
 * @param pollIntervalMs - Interval between checks
 * @returns The first clickable option element, or null if not found
 */
async function waitForMentionOption(
  maxWaitMs: number = 3000,
  pollIntervalMs: number = 100
): Promise<HTMLElement | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    // V2 uses floating UI portal with typeahead-results-container
    // Options are div[role="option"] with div[role="button"] inside
    const option = document.querySelector<HTMLElement>(
      '[data-testid="typeahead-results-container"] [role="option"] [role="button"]'
    );
    if (option) {
      return option;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return null;
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

    // Wait for the mention dropdown to appear with first option
    const firstOption = await waitForMentionOption(3000, 100);

    if (!firstOption) {
      console.warn("EngageKit: Mention dropdown did not appear (v2)");
      // Clean up the @ we typed
      document.execCommand("delete", false);
      return false;
    }

    // Wait a bit for options to fully render
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Click on the first option to select it
    firstOption.click();

    // Wait for mention to be inserted
    await new Promise((resolve) => setTimeout(resolve, 300));

    console.log("EngageKit: Post author tagged successfully (v2)");
    return true;
  } catch (error) {
    console.error("EngageKit: Failed to tag post author (v2)", error);
    return false;
  }
}
