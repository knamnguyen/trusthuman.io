/**
 * New Posts Pill - DOM v1 (legacy)
 *
 * Pill appears as button containing "New posts" text.
 */

function findAndRemove(): boolean {
  for (const button of document.querySelectorAll("button")) {
    if (button.textContent?.includes("New posts")) {
      button.remove();
      console.log("pill button detected and removed");

      return true;
    }
  }
  return false;
}

/**
 * Watch for and remove the "New posts" pill whenever it appears.
 * @returns Cleanup function to stop watching
 */
export function watchAndRemoveNewPostsPill(): () => void {
  findAndRemove();

  const observer = new MutationObserver(() => findAndRemove());
  observer.observe(document.body, { childList: true, subtree: true });

  return () => observer.disconnect();
}
