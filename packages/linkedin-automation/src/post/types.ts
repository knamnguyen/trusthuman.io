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
 * Time information extracted from a LinkedIn post.
 */
export interface PostTimeInfo {
  /** Display time (e.g., "1h", "2d", "1w") */
  displayTime: string | null;
  /** Full time description (e.g., "1 hour ago") */
  fullTime: string | null;
}

/**
 * Comment information extracted from a LinkedIn post.
 */
export interface PostCommentInfo {
  /** Comment author name */
  authorName: string | null;
  /** Comment author headline */
  authorHeadline: string | null;
  /** Comment author profile URL */
  authorProfileUrl: string | null;
  /** Comment author photo URL */
  authorPhotoUrl: string | null;
  /** Comment text content */
  content: string | null;
  /** Comment URN from data-id */
  urn: string | null;
  /** Whether this is a reply to another comment */
  isReply: boolean;
}

/**
 * Simplified comment info for AI context generation.
 * Used to provide adjacent comments as context for better AI comment generation.
 */
export interface AdjacentCommentInfo {
  /** Comment text content */
  commentContent: string;
  /** Number of reactions/likes on the comment */
  likeCount: number;
  /** Number of replies to the comment */
  replyCount: number;
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
  extractPostAuthorInfo(postContainer: HTMLElement): PostAuthorInfo;

  /**
   * Extract post caption text from a LinkedIn post container.
   * Preserves line breaks from <br> tags and block elements.
   *
   * @param postContainer - The LinkedIn post container element
   * @returns The caption text, or empty string if not found
   */
  extractPostCaption(postContainer: Element): string;

  /**
   * Extract post time from a LinkedIn post container.
   *
   * @param postContainer - The LinkedIn post container element
   * @returns PostTimeInfo with display and full time
   */
  extractPostTime(postContainer: HTMLElement): PostTimeInfo;

  /**
   * Detect if the post is from a company page (not a personal profile).
   * Company posts have "/company/" in the author anchor href.
   *
   * @param postContainer - The LinkedIn post container element
   * @returns True if the post is from a company page
   */
  detectCompanyPost(postContainer: HTMLElement): boolean;

  /**
   * Detect if the post is promoted/sponsored content.
   *
   * @param postContainer - The LinkedIn post container element
   * @returns True if the post is promoted/sponsored
   */
  detectPromotedPost(postContainer: HTMLElement): boolean;

  /**
   * Extract comments from a post container (assumes comments are already loaded).
   * Does NOT click any buttons - only extracts existing comment data.
   *
   * @param postContainer - The LinkedIn post container element
   * @returns Array of comment info objects
   */
  extractPostComments(postContainer: HTMLElement): PostCommentInfo[];

  /**
   * Extract adjacent comments for AI context generation.
   * Returns simplified comment data (content + engagement metrics) for AI prompts.
   * Limited to top 5 comments to keep payload reasonable.
   *
   * @param postContainer - The LinkedIn post container element
   * @returns Array of simplified comment info objects
   */
  extractAdjacentComments(postContainer: HTMLElement): AdjacentCommentInfo[];
}
