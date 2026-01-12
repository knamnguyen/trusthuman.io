/**
 * Watch for Author Profiles - DOM v2 (React SSR + SDUI)
 *
 * Finds profile links in posts/comments using data-view-name pattern:
 * <a data-view-name="feed-actor-image" href="https://www.linkedin.com/in/...">
 */

import type { AuthorProfileTarget, OnTargetsChange } from "../types";

// Match both post authors and comment authors
const PROFILE_LINK_SELECTOR =
  'a[data-view-name="feed-actor-image"][href*="/in/"], a[data-view-name="comment-actor-picture"][href*="/in/"], a[data-view-name="reply-actor-picture"][href*="/in/"]';

const MARKER = "data-engagekit-save-profile-injected";

/**
 * Watch for author profile elements in posts/comments.
 * Creates container divs for button injection.
 * Returns cleanup function.
 */
export function watchForAuthorProfiles(onChange: OnTargetsChange): () => void {
  const targets = new Map<Element, AuthorProfileTarget>();
  let debounceId: number | undefined;

  const scan = () => {
    let changed = false;

    // Find all profile links
    const profileLinks = document.querySelectorAll(PROFILE_LINK_SELECTOR);

    profileLinks.forEach((link) => {
      // Skip if already processed
      if (targets.has(link) || link.hasAttribute(MARKER)) return;

      // Get parent to insert as sibling
      const linkParent = link.parentElement;
      if (!linkParent) return;

      // Avoid duplicate injection
      if (linkParent.querySelector("[data-engagekit-save-profile]")) return;

      // Mark the anchor element
      link.setAttribute(MARKER, "true");

      // Create portal container as sibling (right after the link)
      const container = document.createElement("div");
      container.setAttribute("data-engagekit-save-profile", "true");
      container.style.display = "inline-flex";
      container.style.alignItems = "center";
      container.style.marginLeft = "4px";
      container.style.height = "50px";

      // Insert right after the profile link
      link.insertAdjacentElement("afterend", container);

      targets.set(link, {
        id: crypto.randomUUID(),
        container,
        anchorElement: link,
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
