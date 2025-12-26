import { useEffect, useRef, useSyncExternalStore } from "react";

// Target profile links: <a> with aria-label starting with "View " and ending with "graphic link"
// and href to linkedin.com/in/
const PROFILE_LINK_SELECTOR = 'a[aria-label^="View "][aria-label$="graphic link"][href^="https://www.linkedin.com/in/"]';

const MARKER = "data-engagekit-save-profile-injected";

interface Target {
  id: string;
  container: HTMLDivElement;
  anchorElement: Element;
}

/**
 * External store pattern for tracking save profile button injection targets.
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
    const changed = { value: false };

    // Find all profile links
    const profileLinks = document.querySelectorAll(PROFILE_LINK_SELECTOR);

    profileLinks.forEach((link) => {
      // Skip if already processed
      if (targets.has(link) || link.hasAttribute(MARKER)) return;

      // Get parent to insert as sibling
      const linkParent = link.parentElement;
      if (!linkParent) return;

      // Avoid duplicate injection - check if container already exists nearby
      if (linkParent.querySelector("[data-engagekit-save-profile]")) return;

      // Mark the anchor element
      link.setAttribute(MARKER, "true");

      // Create portal container as sibling (right after the link)
      const container = document.createElement("div");
      container.setAttribute("data-engagekit-save-profile", "true");
      container.style.display = "inline-flex";
      container.style.alignItems = "center";
      container.style.marginLeft = "4px"; // Space from profile link

      // Insert right after the profile link
      link.insertAdjacentElement("afterend", container);

      targets.set(link, {
        id: crypto.randomUUID(),
        container,
        anchorElement: link,
      });
      changed.value = true;
    });

    // Remove stale elements (no longer in DOM)
    targets.forEach((target, el) => {
      if (!document.contains(el)) {
        target.container.remove();
        targets.delete(el);
        changed.value = true;
      }
    });

    if (changed.value) notify();
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

export function useSaveProfileTargets() {
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Initial scan
    store.scan();

    const observer = new MutationObserver(() => {
      // Debounce - only scan after DOM settles
      if (debounceRef.current !== undefined) {
        cancelAnimationFrame(debounceRef.current);
      }
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
      if (debounceRef.current !== undefined) {
        cancelAnimationFrame(debounceRef.current);
      }
    };
  }, []);

  // Only re-renders when targets actually change
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
