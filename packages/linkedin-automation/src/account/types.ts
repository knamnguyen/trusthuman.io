/**
 * Account Utilities Interface
 *
 * Defines operations for extracting current LinkedIn account info.
 * Implementations exist for both DOM versions (v1 legacy, v2 React SSR).
 */

export interface LinkedInProfile {
  profileUrl: string | null;
  profileUrn: string | null;
  profileSlug: string | null;
}

export interface AccountUtilities {
  /**
   * Extract current logged-in LinkedIn profile from page DOM (sync).
   * Returns immediately - may return null if data not yet loaded.
   */
  extractCurrentProfile(): LinkedInProfile;

  /**
   * Extract current logged-in LinkedIn profile (async with retry).
   * Waits for data to be available, with timeout.
   * @param timeoutMs - Max time to wait (default 5000ms)
   */
  extractCurrentProfileAsync(timeoutMs?: number): Promise<LinkedInProfile>;
}
