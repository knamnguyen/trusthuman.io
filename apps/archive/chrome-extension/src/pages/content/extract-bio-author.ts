/**
 * Extracts the bio/follower description text from a LinkedIn post container.
 * The description is usually inside a span with classes:
 * `.update-components-actor__description.text-body-xsmall`
 * and contains child spans with `aria-hidden="true"`.
 *
 * @param postContainer The root HTML element of a LinkedIn post.
 * @returns The trimmed text content of the bio span, or null if not found.
 */
export default function extractBioAuthor(
  postContainer: HTMLElement,
): string | null {
  try {
    const bioSpan = postContainer.querySelector<HTMLElement>(
      ".update-components-actor__description.text-body-xsmall [aria-hidden='true']",
    );

    if (!bioSpan || !bioSpan.textContent) return null;

    return bioSpan.textContent.trim();
  } catch (error) {
    console.error("Error extracting author bio:", error);
    return null;
  }
}
