/**
 * Post Utilities Types
 *
 * Defines operations for interacting with LinkedIn posts.
 * Implementations exist for both DOM versions (v1 legacy, v2 React SSR).
 */

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
}
