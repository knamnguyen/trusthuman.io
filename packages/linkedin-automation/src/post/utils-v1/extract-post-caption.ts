/**
 * Extract Post Caption - DOM v1 (Legacy)
 *
 * Extracts post caption text from a LinkedIn post container.
 * Uses XPath for resilience against class name changes.
 *
 * Target structure:
 * <div dir="ltr">
 *   <span>
 *     <span dir="ltr">...caption text...</span>
 *   </span>
 * </div>
 */

/**
 * Extracts post caption text from a LinkedIn post container.
 * Uses XPath to find the caption div regardless of class names.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns The caption text, or empty string if not found
 */
export function extractPostCaption(postContainer: Element): string {
  try {
    // XPath: div with dir="ltr" that contains span > span[@dir="ltr"]
    const result = document.evaluate(
      './/div[@dir="ltr" and .//span//span[@dir="ltr"]]',
      postContainer,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );

    const captionDiv = result.singleNodeValue as HTMLElement | null;
    if (!captionDiv) {
      return "";
    }

    // Extract text preserving line breaks from <br> tags and block elements
    return extractTextWithLineBreaks(captionDiv);
  } catch (error) {
    console.error("EngageKit: failed to extract post caption (v1)", error);
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
