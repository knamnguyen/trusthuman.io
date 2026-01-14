/**
 * Profile Utilities Types
 *
 * Used for watching author profiles in posts/comments and extracting
 * profile info when save button is clicked.
 */

/**
 * Profile info extracted when clicking save button in feed.
 * Includes activityUrn extracted by walking up the DOM tree.
 * - Old DOM: from data-id attribute (urn:li:activity:... or urn:li:comment:...)
 * - New DOM: from data-view-tracking-scope (decoded buffer)
 */
export interface SaveButtonProfileInfo {
  name: string | null;
  profileSlug: string | null;
  profileUrl: string | null;
  photoUrl: string | null;
  headline: string | null;
  /** Raw URN: urn:li:activity:... or urn:li:comment:(...) */
  activityUrn: string | null;
  /** Clickable LinkedIn URL to the post/comment */
  activityUrl: string | null;
  /** Profile URN: urn:li:fsd_profile:... (fetched from activity page) */
  profileUrn: string | null;
}

/**
 * Profile info extracted from profile page.
 * Simpler than SaveButtonProfileInfo - no activity context, just profile data.
 */
export interface ProfilePageInfo {
  name: string | null;
  profileSlug: string | null;
  profileUrl: string | null;
  photoUrl: string | null;
  headline: string | null;
  /** Profile URN ID (e.g., ACoAADnB9GgBHY72WrXA0hUz4IY8FAfYcrrSd0o) */
  profileUrn: string | null;
}

/**
 * Target for injecting save button next to author profile.
 * Minimal - just where to inject and reference to anchor for extraction.
 */
export interface AuthorProfileTarget {
  id: string;
  container: HTMLDivElement;
  anchorElement: Element;
}

/**
 * Callback type for target changes.
 */
export type OnTargetsChange = (targets: AuthorProfileTarget[]) => void;

/**
 * Profile utilities interface - implemented by V1 and V2.
 */
export interface ProfileUtilities {
  /**
   * Watch for author profile elements in posts/comments where
   * we can inject a "save profile" button.
   * Returns cleanup function.
   */
  watchForAuthorProfiles(onChange: OnTargetsChange): () => void;

  /**
   * Extract profile info from the anchor element when save button is clicked.
   */
  extractProfileInfoFromSaveButton(
    anchorElement: Element,
    container: Element
  ): SaveButtonProfileInfo;
}
