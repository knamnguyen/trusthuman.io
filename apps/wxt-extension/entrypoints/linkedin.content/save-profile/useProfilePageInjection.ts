import { useEffect, useRef, useSyncExternalStore } from "react";

// Target: first element with data-generated-suggestion-target on profile pages
const PROFILE_PAGE_TARGET_SELECTOR = "[data-generated-suggestion-target]";

const MARKER = "data-engagekit-profile-page-injected";

interface Target {
  id: string;
  container: HTMLDivElement;
}

/**
 * Checks if current page is a LinkedIn profile page
 */
function isProfilePage(): boolean {
  return window.location.pathname.startsWith("/in/");
}

/**
 * External store pattern for tracking profile page button injection.
 * Only injects on individual profile pages (/in/username).
 */
function createProfilePageStore() {
  let target: Target | null = null;
  let listeners = new Set<() => void>();
  let snapshotCache: Target[] = [];

  const notify = () => {
    snapshotCache = target ? [target] : [];
    listeners.forEach((l) => l());
  };

  const scan = () => {
    // Only activate on profile pages
    if (!isProfilePage()) {
      if (target) {
        target.container.remove();
        target = null;
        notify();
      }
      return;
    }

    // Already injected
    if (target && document.contains(target.container)) {
      return;
    }

    // Clean up stale target
    if (target && !document.contains(target.container)) {
      target = null;
    }

    // Find the first target element
    const targetElement = document.querySelector(PROFILE_PAGE_TARGET_SELECTOR);
    if (!targetElement) return;

    // Check if already processed
    if (targetElement.hasAttribute(MARKER)) return;

    // Navigate: target → parent → first child
    const parentElement = targetElement.parentElement;
    if (!parentElement) return;

    const firstChild = parentElement.firstElementChild;
    if (!firstChild) return;

    // Avoid duplicate injection
    if (firstChild.querySelector("[data-engagekit-profile-page-save]")) return;

    // Mark as processed
    targetElement.setAttribute(MARKER, "true");

    // Create portal container as last child of first child
    const container = document.createElement("div");
    container.setAttribute("data-engagekit-profile-page-save", "true");
    container.style.display = "inline-flex";
    container.style.alignItems = "center";
    container.style.marginLeft = "8px";

    firstChild.appendChild(container);

    target = {
      id: crypto.randomUUID(),
      container,
    };
    notify();
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

const store = createProfilePageStore();

export function useProfilePageTargets() {
  const debounceRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Initial scan
    store.scan();

    const observer = new MutationObserver(() => {
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

    // Also scan on URL changes (SPA navigation)
    const handleNavigation = () => {
      store.scan();
    };

    window.addEventListener("popstate", handleNavigation);

    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", handleNavigation);
      if (debounceRef.current !== undefined) {
        cancelAnimationFrame(debounceRef.current);
      }
    };
  }, []);

  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
