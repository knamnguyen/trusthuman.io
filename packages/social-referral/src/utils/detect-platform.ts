import type { SocialPlatform } from "../types";

const X_REGEX = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.*/i;
const LINKEDIN_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/.*/i;
const THREADS_REGEX = /^https?:\/\/(www\.)?threads\.net\/.*/i;
const FACEBOOK_REGEX = /^https?:\/\/(www\.)?facebook\.com\/.*/i;

/**
 * Detect social platform from URL
 */
export function detectPlatform(url: string): SocialPlatform {
  if (X_REGEX.test(url)) return "x";
  if (LINKEDIN_REGEX.test(url)) return "linkedin";
  if (THREADS_REGEX.test(url)) return "threads";
  if (FACEBOOK_REGEX.test(url)) return "facebook";

  throw new Error(`Unable to detect social platform from URL: ${url}`);
}
