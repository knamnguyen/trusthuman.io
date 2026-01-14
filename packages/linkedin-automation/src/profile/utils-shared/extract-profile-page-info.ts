/**
 * Extract Profile Page Info
 *
 * Extracts profile information from LinkedIn profile page DOM.
 * Works the same for both v1 and v2 DOM.
 */

import type { ProfilePageInfo } from "../types";

/**
 * Extracts profile URN from the "Show all people you may know" link
 * The href contains: profileUrn=urn%3Ali%3Afsd_profile%3A{URN_ID}
 */
function extractProfileUrn(): string | null {
  const pymkLink = document.querySelector(
    'a[aria-label="Show all people you may know"]',
  );
  if (!pymkLink) return null;

  const href = pymkLink.getAttribute("href");
  if (!href) return null;

  // Match profileUrn=urn%3Ali%3Afsd_profile%3A{ID} or decoded version
  const encodedMatch = href.match(
    /profileUrn=urn%3Ali%3Afsd_profile%3A([^&]+)/,
  );
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }

  // Try decoded version
  const decodedMatch = href.match(/profileUrn=urn:li:fsd_profile:([^&]+)/);
  if (decodedMatch?.[1]) {
    return decodedMatch[1];
  }

  return null;
}

/**
 * Extracts name and photo URL from the profile picture button
 */
function extractNameAndPhoto(): {
  name: string | null;
  photoUrl: string | null;
} {
  const profilePicButton = document.querySelector(
    'button[aria-label="open profile picture"]',
  );
  if (!profilePicButton) {
    return { name: null, photoUrl: null };
  }

  const img = profilePicButton.querySelector("img");
  if (!img) {
    return { name: null, photoUrl: null };
  }

  return {
    name: img.getAttribute("title") || img.getAttribute("alt") || null,
    photoUrl: img.getAttribute("src") || null,
  };
}

/**
 * Extracts headline from the first element with data-generated-suggestion-target
 */
function extractHeadline(): string | null {
  const headlineElement = document.querySelector(
    "[data-generated-suggestion-target]",
  );
  if (!headlineElement) return null;

  return headlineElement.textContent?.trim() || null;
}

/**
 * Gets the current LinkedIn profile URL and slug from the page
 */
function extractProfileUrlAndSlug(): {
  profileUrl: string | null;
  profileSlug: string | null;
} {
  const pathname = window.location.pathname;

  if (!pathname.startsWith("/in/")) {
    return { profileUrl: null, profileSlug: null };
  }

  // Remove trailing slash and any overlay paths
  const parts = pathname.split("/overlay");
  const profilePath = (parts[0] ?? pathname).replace(/\/$/, "");
  const profileUrl = `https://www.linkedin.com${profilePath}`;

  // Extract slug from path like "/in/john-doe"
  const slugMatch = profilePath.match(/\/in\/([^/?]+)/);
  const profileSlug = slugMatch?.[1] ?? null;

  return { profileUrl, profileSlug };
}

/**
 * Extracts full profile info from a LinkedIn profile page
 */
export function extractProfilePageInfo(): ProfilePageInfo {
  const { name, photoUrl } = extractNameAndPhoto();
  const headline = extractHeadline();
  const { profileUrl, profileSlug } = extractProfileUrlAndSlug();
  const urn = extractProfileUrn();

  return {
    name,
    profileSlug,
    profileUrl,
    photoUrl,
    headline,
    profileUrn: urn,
  };
}
