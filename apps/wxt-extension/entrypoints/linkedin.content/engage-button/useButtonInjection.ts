import { useEffect, useRef, useSyncExternalStore } from "react";

// Target comment boxes by their editor placeholder (semantic, stable)
// This avoids class selectors and correctly skips the post creation form
const COMMENT_EDITOR_SELECTOR =
  '[data-placeholder="Add a comment…"], [aria-placeholder="Add a comment…"]';
const ADD_PHOTO_SELECTOR = '[aria-label="Add a photo"]';
const MARKER = "data-engagekit-injected";

interface Target {
  id: string;
  container: HTMLDivElement;
  anchorElement: Element;
}

/**
 * External store pattern for tracking button injection targets.
 * React only re-renders when targets actually change.
 */
function createTargetStore() {
  let targets = new Map<Element, Target>();
  let listeners = new Set<() => void>();
  let snapshotCache: Target[] = [];

  const notify = () => {
    snapshotCache = Array.from(targets.values());
    listeners.forEach((l) => l());
  };

  const scan = () => {
    const commentEditors = document.querySelectorAll(COMMENT_EDITOR_SELECTOR);
    let changed = false;

    // Find "Add a photo" buttons inside forms that contain comment editors
    commentEditors.forEach((editor) => {
      const form = editor.closest("form");
      if (!form) return;

      const el = form.querySelector(ADD_PHOTO_SELECTOR);
      if (!el || targets.has(el) || el.hasAttribute(MARKER)) return;

      // Get parent to insert as sibling
      const parent = el.parentElement;
      if (!parent) return;

      // Avoid duplicate injection - check if we already have a button nearby
      if (parent.querySelector("[data-engagekit-button]")) return;

      // Mark the anchor element
      el.setAttribute(MARKER, "true");

      // Create portal container as sibling (right after the "Add a photo" button)
      // Only set display style, avoid modifying other LinkedIn elements
      const container = document.createElement("div");
      container.setAttribute("data-engagekit-button", "true");
      container.style.display = "inline-flex";

      // Insert right after the anchor element
      el.insertAdjacentElement("afterend", container);

      targets.set(el, {
        id: crypto.randomUUID(),
        container,
        anchorElement: el,
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

    if (changed) notify();
  };

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => snapshotCache,
    scan,
  };
}

const store = createTargetStore();

export function useButtonTargets() {
  const debounceRef = useRef<number>();

  useEffect(() => {
    // Initial scan
    store.scan();

    const observer = new MutationObserver(() => {
      // Debounce - only scan after DOM settles
      cancelAnimationFrame(debounceRef.current!);
      debounceRef.current = requestAnimationFrame(() => {
        store.scan();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(debounceRef.current!);
    };
  }, []);

  // Only re-renders when targets actually change
  // Third arg is server snapshot - use same function since we're client-only
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
