/**
 * Watch for Comment Editors - DOM v2 (React SSR + SDUI)
 *
 * Finds comment editor elements using data-view-name pattern:
 * - Add image button: [data-view-name="comment-add-image"]
 *
 * Creates injection points next to add-image button for EngageKit button.
 *
 * DOM Structure:
 * <div aria-label="Text editor for creating comment">
 *   <div>
 *     <div>
 *       <div componentkey="commentBox-...">
 *         <div data-view-name="comment-box">...</div>
 *       </div>
 *     </div>
 *     <div>  <!-- Button row (sibling) -->
 *       <button data-view-name="comment-emoji-picker">...</button>
 *       <button data-view-name="comment-add-image">...</button>
 *     </div>
 *   </div>
 * </div>
 */

import type {
  CommentEditorTarget,
  OnCommentEditorTargetsChange,
} from "../types";

// V2: Directly find add-image buttons
const ADD_IMAGE_BUTTON_SELECTOR = '[data-view-name="comment-add-image"]';

// Post container in V2 is div[role="listitem"]
const POST_CONTAINER_SELECTOR = 'div[role="listitem"]';

const MARKER = "data-engagekit-engage-injected";

/**
 * Watch for comment editor elements where we can inject engage button.
 * V2: Directly finds add-image buttons and injects next to them.
 * Returns cleanup function.
 */
export function watchForCommentEditors(
  onChange: OnCommentEditorTargetsChange,
): () => void {
  const targets = new Map<Element, CommentEditorTarget>();
  let debounceId: number | undefined;

  const scan = () => {
    let changed = false;

    // Find all add-image buttons (each represents a visible comment editor)
    const addImageButtons = document.querySelectorAll(
      ADD_IMAGE_BUTTON_SELECTOR,
    );

    addImageButtons.forEach((addImageButton) => {
      // Skip if already processed
      if (targets.has(addImageButton) || addImageButton.hasAttribute(MARKER))
        return;

      // Get parent to insert as sibling
      const buttonParent = addImageButton.parentElement;
      if (!buttonParent) return;

      // Find the post container (walk up from the button)
      const postContainer = addImageButton.closest(
        POST_CONTAINER_SELECTOR,
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
