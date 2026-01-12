/**
 * Watch for Profile Page
 *
 * Watches for LinkedIn profile pages (/in/username) and provides
 * injection point for save profile button.
 * Works the same for both v1 and v2 DOM.
 */

export interface ProfilePageTarget {
  id: string;
  container: HTMLDivElement;
}

export type OnProfilePageTargetChange = (target: ProfilePageTarget | null) => void;

const PROFILE_PAGE_TARGET_SELECTOR = "[data-generated-suggestion-target]";
const MARKER = "data-engagekit-profile-page-injected";

/**
 * Checks if current page is a LinkedIn profile page
 */
function isProfilePage(): boolean {
  return window.location.pathname.startsWith("/in/");
}

/**
 * Watch for profile page and create injection container.
 * Returns cleanup function.
 */
export function watchForProfilePage(onChange: OnProfilePageTargetChange): () => void {
  let currentTarget: ProfilePageTarget | null = null;
  let debounceId: number | undefined;

  const scan = () => {
    // Only activate on profile pages
    if (!isProfilePage()) {
      if (currentTarget) {
        currentTarget.container.remove();
        currentTarget = null;
        onChange(null);
      }
      return;
    }

    // Already injected and still in DOM
    if (currentTarget && document.contains(currentTarget.container)) {
      return;
    }

    // Clean up stale target
    if (currentTarget && !document.contains(currentTarget.container)) {
      currentTarget = null;
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

    // Create container as last child of first child
    const container = document.createElement("div");
    container.setAttribute("data-engagekit-profile-page-save", "true");
    container.style.display = "inline-flex";
    container.style.alignItems = "center";
    container.style.marginLeft = "8px";

    firstChild.appendChild(container);

    currentTarget = {
      id: crypto.randomUUID(),
      container,
    };
    onChange(currentTarget);
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

  // Also scan on URL changes (SPA navigation)
  const handleNavigation = () => {
    scan();
  };
  window.addEventListener("popstate", handleNavigation);

  // Cleanup function
  return () => {
    observer.disconnect();
    window.removeEventListener("popstate", handleNavigation);
    if (debounceId !== undefined) {
      cancelAnimationFrame(debounceId);
    }
    if (currentTarget) {
      currentTarget.container.remove();
    }
  };
}
