/**
 * Post Utilities Types
 *
 * Defines operations for interacting with LinkedIn posts.
 * Implementations exist for both DOM versions (v1 legacy, v2 React SSR).
 */

/**
 * Post URL information extracted from a LinkedIn post.
 */
export interface PostUrlInfo {
  /** The raw URN (e.g., "urn:li:activity:7410741511803297792") */
  urn: string;
  /** The full LinkedIn URL to the post */
  url: string;
}

/**
 * Author information extracted from a LinkedIn post.
 */
export interface PostAuthorInfo {
  /** Author's display name */
  name: string | null;
  /** URL to author's profile photo */
  photoUrl: string | null;
  /** Author's headline/title */
  headline: string | null;
  /** URL to author's LinkedIn profile */
  profileUrl: string | null;
}

/**
 * Post Utilities Interface
 *
 * Defines operations for extracting data from LinkedIn posts.
 * Implementations exist for both DOM versions (v1 legacy, v2 React SSR).
 */
export interface PostUtilities {
  /**
   * Find the post container element from an anchor element.
   * Traverses up the DOM to find the nearest post container.
   *
   * @param anchorElement - Any element within a post
   * @returns The post container element, or null if not found
   */
  findPostContainer(anchorElement: Element): Element | null;

  /**
   * Extract post URL(s) from a LinkedIn post container.
   * Handles both single activity URNs and aggregate URNs (multiple posts).
   *
   * @param postContainer - The LinkedIn post container element (or any child element)
   * @returns Array of PostUrlInfo objects (empty if no valid URNs found)
   */
  extractPostUrl(postContainer: HTMLElement): PostUrlInfo[];

  /**
   * Extract author information from a LinkedIn post container.
   *
   * @param postContainer - The LinkedIn post container element
   * @returns PostAuthorInfo object with available information
   */
  extractAuthorInfo(postContainer: HTMLElement): PostAuthorInfo;

  /**
   * Extract post caption text from a LinkedIn post container.
   * Preserves line breaks from <br> tags and block elements.
   *
   * @param postContainer - The LinkedIn post container element
   * @returns The caption text, or empty string if not found
   */
  extractPostCaption(postContainer: Element): string;
}
