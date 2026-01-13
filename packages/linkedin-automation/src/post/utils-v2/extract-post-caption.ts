/**
 * Extract Post Caption - DOM v2 (React SSR + SDUI)
 *
 * Extracts post caption text from a LinkedIn post container.
 * Uses data-view-name="feed-commentary" selector.
 *
 * Target structure:
 * <p data-view-name="feed-commentary">
 *   <span data-testid="expandable-text-box">
 *     ...caption content with <br> tags...
 *   </span>
 * </p>
 */

/**
 * Extracts post caption text from a LinkedIn post container.
 * Uses data-view-name="feed-commentary" selector for V2 DOM.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns The caption text, or empty string if not found
 */
export function extractPostCaption(postContainer: Element): string {
  try {
    // Find the caption element by data-view-name
    const captionElement = postContainer.querySelector<HTMLElement>(
      '[data-view-name="feed-commentary"]'
    );

    if (!captionElement) {
      return "";
    }

    // Extract text preserving line breaks from <br> tags and block elements
    return extractTextWithLineBreaks(captionElement);
  } catch (error) {
    console.error("EngageKit: failed to extract post caption (v2)", error);
    return "";
  }
}

/**
 * Extract text content while preserving line breaks.
 * Converts <br> tags to newlines and handles block element boundaries.
 */
function extractTextWithLineBreaks(element: HTMLElement): string {
  const lines: string[] = [];
  let currentLine = "";

  function processNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      // Add text content, normalizing internal whitespace but not trimming
      const text = node.textContent?.replace(/[ \t]+/g, " ") || "";
      currentLine += text;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      // Skip the "...more" button
      if (tagName === "button") {
        return;
      }

      // Handle line break elements
      if (tagName === "br") {
        lines.push(currentLine.trim());
        currentLine = "";
        return;
      }

      // Block elements create natural breaks
      const isBlock = [
        "div",
        "p",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
      ].includes(tagName);

      if (isBlock && currentLine.trim()) {
        lines.push(currentLine.trim());
        currentLine = "";
      }

      // Process children
      for (const child of el.childNodes) {
        processNode(child);
      }

      if (isBlock && currentLine.trim()) {
        lines.push(currentLine.trim());
        currentLine = "";
      }
    }
  }

  processNode(element);

  // Don't forget the last line
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  // Join with newlines and collapse multiple empty lines
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
