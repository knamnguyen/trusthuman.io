/**
 * Extracts profile information from LinkedIn DOM elements
 */

export interface ProfileInfo {
  name: string | null;
  linkedinUrl: string | null;
  photoUrl: string | null;
  headline: string | null;
}

/**
 * Extracts LinkedIn URL without query params
 * e.g., "https://www.linkedin.com/in/will-mctighe?miniProfileUrn=..." => "https://www.linkedin.com/in/will-mctighe"
 */
function extractLinkedInUrl(href: string | null): string | null {
  if (!href) return null;
  const urlWithoutParams = href.split("?")[0];
  return urlWithoutParams || null;
}

/**
 * Extracts profile name from img alt text
 * e.g., "View Will McTighe's graphic link" => "Will McTighe"
 * e.g., "View Alireza Ghasemi's open to work graphic link" => "Alireza Ghasemi"
 * e.g., "View Adrian Betts' graphic link" => "Adrian Betts" (names ending in 's')
 */
function extractNameFromAlt(alt: string | null): string | null {
  if (!alt) return null;

  // Pattern: "View {Name}'s ..." or "View {Name}' ..." (for names ending in 's')
  // Handle multiple apostrophe variants and multiple spaces after possessive
  // The 's' after apostrophe is optional for names ending in 's' (e.g., "Betts'" vs "McTighe's")
  const possessiveMatch = alt.match(/^View\s+(.+?)[''\u2019\u0027]s?\s+/i);
  if (possessiveMatch?.[1]) {
    return possessiveMatch[1].trim();
  }

  // Debug: log alt text if no match found
  console.log("SaveProfile: Could not extract name from alt:", alt);

  return null;
}

/**
 * Extracts headline from the element after the profile link/button container
 */
function extractHeadline(buttonContainer: Element): string | null {
  // Get the next sibling after our button container
  const nextSibling = buttonContainer.nextElementSibling;
  if (!nextSibling) return null;

  let headlineElement: Element | null = null;

  if (nextSibling.tagName === "A") {
    // If directly below is <a>, select its last child
    headlineElement = nextSibling.lastElementChild;
  } else if (nextSibling.tagName === "DIV") {
    // If directly below is <div>, find <a> inside, then select its last child
    const innerAnchor = nextSibling.querySelector("a");
    if (innerAnchor) {
      headlineElement = innerAnchor.lastElementChild;
    }
  }

  if (headlineElement) {
    return headlineElement.textContent?.trim() || null;
  }

  return null;
}

/**
 * Extracts full profile info from the anchor element (profile link)
 * @param anchorElement - The <a> element with the profile link (our injection point)
 * @param buttonContainer - The container div we injected
 */
export function extractProfileInfo(
  anchorElement: Element,
  buttonContainer: Element,
): ProfileInfo {
  // Get href and extract URL without query params
  const href = anchorElement.getAttribute("href");
  const linkedinUrl = extractLinkedInUrl(href);

  // Find img element inside the anchor with alt starting with "View "
  const img = anchorElement.querySelector('img[alt^="View "]');
  const photoUrl = img?.getAttribute("src") || null;
  const name = extractNameFromAlt(img?.getAttribute("alt") || null);

  // Extract headline from sibling element
  const headline = extractHeadline(buttonContainer);

  return {
    name,
    linkedinUrl,
    photoUrl,
    headline,
  };
}
