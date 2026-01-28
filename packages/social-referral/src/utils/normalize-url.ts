/**
 * Normalize social media URL
 * - Trim whitespace
 * - Ensure https
 * - Remove trailing slashes
 */
export function normalizeUrl(url: string): string {
  let normalized = url.trim();

  // Ensure https
  if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
    normalized = `https://${normalized}`;
  }

  // Remove trailing slashes
  normalized = normalized.replace(/\/+$/, "");

  return normalized;
}
