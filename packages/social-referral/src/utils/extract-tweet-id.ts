/**
 * Extract tweet ID from X.com URL
 */
export function extractTweetId(url: string): string {
  // Match patterns like:
  // https://x.com/username/status/1234567890
  // https://twitter.com/username/status/1234567890
  const match = url.match(/\/status\/(\d+)/);

  if (!match || !match[1]) {
    throw new Error(`Unable to extract tweet ID from URL: ${url}`);
  }

  return match[1];
}
