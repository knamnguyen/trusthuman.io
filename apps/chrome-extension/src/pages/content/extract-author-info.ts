// Function to extract author info from post container
export default function extractAuthorInfo(
  postContainer: HTMLElement,
): { name: string } | null {
  try {
    // Look for author container within the post
    const authorContainer = postContainer.querySelector(
      ".update-components-actor__container",
    );
    if (!authorContainer) {
      console.log("Author container not found");
      return null;
    }

    // Try different selectors for author name
    const nameSelectors = [
      '.update-components-actor__title span[dir="ltr"] span[aria-hidden="true"]',
      '.update-components-actor__title span[aria-hidden="true"]',
      ".update-components-actor__title",
      ".update-components-actor__name",
    ];

    for (const selector of nameSelectors) {
      const nameElement = authorContainer.querySelector(selector);
      if (nameElement && nameElement.textContent) {
        const name = nameElement!
          .textContent!.replace(/<!---->/g, "")
          .trim()
          .split("•")[0]
          .trim();
        if (name) {
          console.log(`Extracted author name: ${name}`);
          return { name };
        }
      }
    }

    console.log("Could not extract author name");
    return null;
  } catch (error) {
    console.error("Error extracting author info:", error);
    return null;
  }
}
