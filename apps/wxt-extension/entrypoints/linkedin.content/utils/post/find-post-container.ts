/**
 * Find the post container element from an anchor element.
 * Works for both EngageButton (inside forms) and LinkedIn's native comment buttons.
 */
export function findPostContainer(anchorElement: Element): Element | null {
  // Try finding post container directly from anchor element first
  // This works for LinkedIn's native comment buttons
  const directMatch =
    anchorElement.closest("div[data-urn]") ||
    anchorElement.closest("div[data-id]") ||
    anchorElement.closest("article[role='article']");

  if (directMatch) {
    return directMatch;
  }

  // Fallback: try from form (for EngageButton which is inside comment forms)
  const form = anchorElement.closest("form");
  if (form) {
    const fromForm =
      form.closest("div[data-urn]") ||
      form.closest("div[data-id]") ||
      form.closest("article[role='article']");
    if (fromForm) {
      return fromForm;
    }
  }

  // Last resort fallback
  return document.querySelector("main");
}
