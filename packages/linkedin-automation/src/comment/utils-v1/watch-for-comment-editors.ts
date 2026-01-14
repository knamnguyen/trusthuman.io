/**
 * Watch for Comment Editors - DOM v1 (Legacy)
 *
 * Finds comment editor elements using form-based structure:
 * - Comment form: form containing [data-placeholder="Add a comment…"]
 * - Add image button: [aria-label="Add a photo"]
 *
 * Creates injection points next to add-image button for EngageKit button.
 */

import type {
  CommentEditorTarget,
  OnCommentEditorTargetsChange,
} from "../types";

// V1: Comment editor is inside a form, uses aria-placeholder
const COMMENT_EDITOR_SELECTOR =
  '[data-placeholder="Add a comment…"], [aria-placeholder="Add a comment…"]';
const ADD_IMAGE_BUTTON_SELECTOR = '[aria-label="Add a photo"]';

// Post container in V1 is div[data-urn] or div[data-id]
const POST_CONTAINER_SELECTOR = "div[data-urn], div[data-id]";

const MARKER = "data-engagekit-engage-injected";

/**
 * Watch for comment editor elements where we can inject engage button.
 * V1: Uses form-based structure with aria-label attributes.
 * Returns cleanup function.
 */
export function watchForCommentEditors(
  onChange: OnCommentEditorTargetsChange
): () => void {
  const targets = new Map<Element, CommentEditorTarget>();
  let debounceId: number | undefined;

  const scan = () => {
    let changed = false;

    // Find all comment editors
    const commentEditors = document.querySelectorAll(COMMENT_EDITOR_SELECTOR);

    commentEditors.forEach((editor) => {
      // V1: Editor is inside a form
      const form = editor.closest("form");
      if (!form) return;

      // Find the add-image button within the form
      const addImageButton = form.querySelector(ADD_IMAGE_BUTTON_SELECTOR);
      if (!addImageButton) return;

      // Skip if already processed
      if (targets.has(addImageButton) || addImageButton.hasAttribute(MARKER))
        return;

      // Get parent to insert as sibling
      const buttonParent = addImageButton.parentElement;
      if (!buttonParent) return;

      // Find the post container
      const postContainer = form.closest(
        POST_CONTAINER_SELECTOR
      ) as HTMLElement | null;
      if (!postContainer) return;

      // Avoid duplicate injection
      if (buttonParent.querySelector("[data-engagekit-engage-button]")) return;

      // Mark the anchor element
      addImageButton.setAttribute(MARKER, "true");

      // Create container as sibling (right after the add-image button)
      const container = document.createElement("div");
      container.setAttribute("data-engagekit-engage-button", "true");
      container.style.display = "inline-flex";

      // Insert right after the add-image button
      addImageButton.insertAdjacentElement("afterend", container);

      targets.set(addImageButton, {
        id: crypto.randomUUID(),
        container,
        anchorElement: addImageButton,
        postContainer,
      });
      changed = true;
    });

    // Remove stale elements (no longer in DOM)
    targets.forEach((target, el) => {
      if (!document.contains(el)) {
        target.container.remove();
        targets.delete(el);
        changed = true;
      }
    });

    if (changed) {
      onChange(Array.from(targets.values()));
    }
  };

  // Initial scan
  scan();

  // Watch for DOM changes
  const observer = new MutationObserver(() => {
    if (debounceId !== undefined) {
      cancelAnimationFrame(debounceId);
    }
    debounceId = requestAnimationFrame(() => {
      scan();
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Cleanup function
  return () => {
    observer.disconnect();
    if (debounceId !== undefined) {
      cancelAnimationFrame(debounceId);
    }
    // Remove all injected containers
    targets.forEach((target) => {
      target.container.remove();
    });
    targets.clear();
  };
}
