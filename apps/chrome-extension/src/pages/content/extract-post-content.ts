// Function to extract post content from post container
export default function extractPostContent(postContainer: HTMLElement): string {
  try {
    // Look for the content container within the post
    // const contentContainer = postContainer.querySelector('.fie-impression-container');
    const contentContainer = postContainer.querySelector(
      ".update-components-text",
    );
    if (!contentContainer) {
      console.log("Content container not found");
      return "";
    }

    // Extract text content recursively
    function extractText(node: Node): string {
      let text = "";
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent?.trim() + " ";
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          text += extractText(child);
        }
      });
      return text;
    }

    const content = extractText(contentContainer).replace(/\s+/g, " ").trim();
    console.log(`Extracted post content: ${content.substring(0, 100)}...`);
    return content;
  } catch (error) {
    console.error("Error extracting post content:", error);
    return "";
  }
}
