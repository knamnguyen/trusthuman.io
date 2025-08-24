// Function to extract author info from post container
const FALLBACK_NAME =
  "No author name available, please do not refer to author when making comment" as const;

export default function extractAuthorInfo(postContainer: HTMLElement): {
  name: string;
} {
  try {
    // Primary selector: element with class update-components-actor__title
    const primary = postContainer.querySelector(
      '.update-components-actor__title span[aria-hidden="true"]',
    );
    if (primary?.textContent?.trim()) {
      const name = primary.textContent.trim();
      console.log(`Extracted author name (primary): ${name}`);
      return { name };
    }

    // Secondary selector: first span[aria-hidden="true"] inside actor container
    const secondary = postContainer.querySelector(
      '.update-components-actor__container span[aria-hidden="true"]',
    );
    if (secondary?.textContent?.trim()) {
      const name = secondary.textContent.trim();
      console.log(`Extracted author name (secondary): ${name}`);
      return { name };
    }

    console.log("Author name not found, using fallback");
    return { name: FALLBACK_NAME };
  } catch (error) {
    console.error("Error extracting author info:", error);
    return { name: FALLBACK_NAME };
  }
}
