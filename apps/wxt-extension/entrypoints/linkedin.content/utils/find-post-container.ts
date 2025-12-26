/**
 * Find the post container element from an anchor element
 */
export function findPostContainer(anchorElement: Element): Element | null {
  const form = anchorElement.closest("form");
  return (
    form?.closest("div[data-urn]") ||
    form?.closest("div[data-id]") ||
    form?.closest("article[role='article']") ||
    document.querySelector("main")
  );
}
