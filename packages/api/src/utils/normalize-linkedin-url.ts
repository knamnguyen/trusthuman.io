/**
 * Normalize a LinkedIn profile URL to a canonical form for deduplication.
 * - Trim whitespace
 * - Force https scheme
 * - Lowercase host
 * - Remove query string and hash
 * - Remove trailing slashes
 */
export const normalizeLinkedInUrl = (input: string): string => {
  try {
    const trimmed = input.trim();
    const hasProtocol = /^https?:\/\//i.test(trimmed);
    const withProtocol = hasProtocol ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    url.protocol = "https:";
    url.hash = "";
    url.search = "";
    url.hostname = url.hostname.toLowerCase();
    // Remove trailing slashes from pathname
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    // Fallback best-effort: strip trailing slashes and ensure https prefix
    const trimmed = input.trim().replace(/\/+$/, "");
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  }
};
