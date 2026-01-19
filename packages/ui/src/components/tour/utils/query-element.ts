/**
 * Query selector that searches both shadow root and document.
 * Used across tour components to find elements in shadow DOM contexts.
 */
export function queryElement(
  selector: string,
  shadowRoot?: Element | DocumentFragment | null
): Element | null {
  // First try the shadow root if provided
  if (shadowRoot) {
    const element = shadowRoot.querySelector(selector);
    if (element) return element;
  }
  // Fall back to document
  return document.querySelector(selector);
}
