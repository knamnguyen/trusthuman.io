/**
 * LinkedIn Profile URN Fetcher
 *
 * Fetches the activity page HTML and extracts the profileUrn using entity-based extraction.
 * - For posts: finds fsd_update entity by activity ID and extracts author's profileUrn from actor
 * - For comments: finds fsd_comment entity by comment ID and extracts commenter's profileUrn
 *
 * Entity-based extraction is more reliable than publicIdentifier matching because:
 * - Comments don't include publicIdentifier for the commenter
 * - publicIdentifier search may find wrong profile (logged-in user or other referenced profiles)
 *
 * Falls back to publicIdentifier search if entity-based extraction fails.
 */

import { storage } from "wxt/storage";

interface LinkedInAuth {
  cookie: string;
  csrfToken: string;
  pageInstance?: string;
  track?: string;
}

/**
 * Decode HTML entities in a string
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#61;/g, "=")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Extract profile URN ID from fsd_profile or fs_miniProfile URN
 */
function extractUrnId(urn: string): string | null {
  // Match urn:li:fsd_profile:ID or urn:li:fs_miniProfile:ID
  const match = urn.match(/urn:li:(?:fsd_profile|fs_miniProfile):([A-Za-z0-9_-]+)/);
  return match?.[1] ?? null;
}

/**
 * Extract comment ID from dashCommentUrn parameter in URL
 * e.g., dashCommentUrn=urn%3Ali%3Afsd_comment%3A(7416392765279760384%2Curn%3Ali%3Aactivity%3A...)
 * Returns the comment ID (first number in parentheses)
 */
function extractCommentIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const dashCommentUrn = urlObj.searchParams.get("dashCommentUrn");
    if (!dashCommentUrn) return null;

    // Decode and extract: urn:li:fsd_comment:(COMMENT_ID,activityUrn)
    const decoded = decodeURIComponent(dashCommentUrn);
    const match = decoded.match(/urn:li:fsd_comment:\((\d+),/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * Extract activity ID from post URL
 * e.g., https://www.linkedin.com/feed/update/urn:li:activity:7415738731510468608/
 * e.g., https://www.linkedin.com/feed/update/urn:li:ugcPost:7416402497470136321/
 * Returns the activity/ugcPost ID
 */
function extractActivityIdFromUrl(url: string): { id: string; type: "activity" | "ugcPost" } | null {
  try {
    // Match urn:li:activity:ID or urn:li:ugcPost:ID in the URL path
    const match = url.match(/urn:li:(activity|ugcPost):(\d+)/);
    if (!match) return null;
    return {
      type: match[1] as "activity" | "ugcPost",
      id: match[2]!,
    };
  } catch {
    return null;
  }
}

/**
 * Parse embedded JSON from HTML code blocks to find profile URN matching publicIdentifier
 */
function parseProfileUrnFromHtml(
  html: string,
  targetPublicIdentifier: string
): string | null {
  // Find all <code> blocks with bpr-guid IDs (LinkedIn's embedded data format)
  const codeBlockRegex = /<code[^>]*id="bpr-guid-\d+"[^>]*>([\s\S]*?)<\/code>/g;

  let match;
  while ((match = codeBlockRegex.exec(html)) !== null) {
    const codeContent = match[1];
    if (!codeContent) continue;

    // Decode HTML entities
    const decoded = decodeHtmlEntities(codeContent);

    // Remove newlines and extra spaces that LinkedIn adds for formatting
    const cleaned = decoded.replace(/\s+/g, " ");

    try {
      // Try to parse as JSON (LinkedIn sometimes has valid JSON)
      const parsed = JSON.parse(cleaned);
      const result = findProfileInObject(parsed, targetPublicIdentifier);
      if (result) return result;
    } catch {
      // Not valid JSON, try regex-based extraction
      const result = extractProfileFromText(cleaned, targetPublicIdentifier);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Extract commenter's profile URN from HTML for a specific comment.
 * Comment structure: fsd_comment:(COMMENT_ID,activityUrn) -> commenter.actor.*profileUrn
 */
function parseCommenterProfileUrnFromHtml(
  html: string,
  commentId: string
): string | null {
  // Find all <code> blocks with bpr-guid IDs
  const codeBlockRegex = /<code[^>]*id="bpr-guid-\d+"[^>]*>([\s\S]*?)<\/code>/g;

  let match;
  while ((match = codeBlockRegex.exec(html)) !== null) {
    const codeContent = match[1];
    if (!codeContent) continue;

    // Decode HTML entities
    const decoded = decodeHtmlEntities(codeContent);

    // Remove newlines and extra spaces
    const cleaned = decoded.replace(/\s+/g, " ");

    try {
      const parsed = JSON.parse(cleaned);
      const result = findCommenterInObject(parsed, commentId);
      if (result) return result;
    } catch {
      // Try regex-based extraction for comments
      const result = extractCommenterFromText(cleaned, commentId);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Recursively search for a comment by ID and extract the commenter's profile URN.
 * LinkedIn structure: comment has entityUrn=fsd_comment:(ID,...) and commenter.actor.*profileUrn
 */
function findCommenterInObject(obj: unknown, targetCommentId: string): string | null {
  if (!obj || typeof obj !== "object") return null;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const result = findCommenterInObject(item, targetCommentId);
      if (result) return result;
    }
    return null;
  }

  const record = obj as Record<string, unknown>;

  // Check if this is the target comment by entityUrn containing the comment ID
  const entityUrn = getValueWithWhitespaceKey(record, "entityUrn") as string | undefined;
  if (entityUrn?.includes(`fsd_comment:(${targetCommentId},`)) {
    // Found the comment! Extract commenter's profile URN
    const commenter = getValueWithWhitespaceKey(record, "commenter") as Record<string, unknown> | undefined;
    if (commenter) {
      // Try actor.*profileUrn first (most reliable)
      const actor = getValueWithWhitespaceKey(commenter, "actor") as Record<string, unknown> | undefined;
      if (actor) {
        const profileUrn = getValueWithWhitespaceKey(actor, "*profileUrn") as string | undefined;
        if (profileUrn) {
          return extractUrnId(profileUrn.trim());
        }
      }

      // Fallback: try image.attributes[0].detailData.nonEntityProfilePicture.*profile
      const image = getValueWithWhitespaceKey(commenter, "image") as Record<string, unknown> | undefined;
      const attributes = getValueWithWhitespaceKey(image ?? {}, "attributes") as unknown[] | undefined;
      if (attributes?.[0]) {
        const detailData = getValueWithWhitespaceKey(
          attributes[0] as Record<string, unknown>,
          "detailData"
        ) as Record<string, unknown> | undefined;
        const nonEntityProfilePicture = getValueWithWhitespaceKey(
          detailData ?? {},
          "nonEntityProfilePicture"
        ) as Record<string, unknown> | undefined;
        const profile = getValueWithWhitespaceKey(nonEntityProfilePicture ?? {}, "*profile") as string | undefined;
        if (profile) {
          return extractUrnId(profile.trim());
        }
      }
    }
  }

  // Check included array
  const included = getValueWithWhitespaceKey(record, "included") as unknown[] | undefined;
  if (Array.isArray(included)) {
    for (const item of included) {
      const result = findCommenterInObject(item, targetCommentId);
      if (result) return result;
    }
  }

  // Recurse into nested objects
  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      const result = findCommenterInObject(value, targetCommentId);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Extract commenter profile URN from text using regex when JSON parsing fails.
 * Looks for fsd_comment:(COMMENT_ID,...) nearby commenter data with fsd_profile URN.
 */
function extractCommenterFromText(text: string, targetCommentId: string): string | null {
  // Find the comment by its fsd_comment URN
  const commentPattern = `fsd_comment:\\s*\\(\\s*${targetCommentId}\\s*,`;
  const commentRegex = new RegExp(commentPattern, "g");

  let match;
  while ((match = commentRegex.exec(text)) !== null) {
    const position = match.index;

    // Search in a window after the comment for commenter's profile URN
    // The commenter data comes after the entityUrn in the comment object
    const windowStart = position;
    const windowEnd = Math.min(text.length, position + 5000);
    const window = text.slice(windowStart, windowEnd);

    // Look for *profileUrn or *profile pointing to fsd_profile
    const profileMatch = window.match(
      /"\*(?:profileUrn|profile)\s*"\s*:\s*"\s*(urn:li:fsd_profile:[A-Za-z0-9_-]+)\s*"/
    );

    if (profileMatch?.[1]) {
      return extractUrnId(profileMatch[1]);
    }
  }

  return null;
}

/**
 * Parse embedded JSON from HTML to find post author's profile URN by activity ID.
 * Post structure: fsd_update:(urn:li:activity:ID,...) -> actor.image.attributes[0].detailData.nonEntityProfilePicture.*profile
 */
function parsePostAuthorProfileUrnFromHtml(
  html: string,
  activityId: string,
  activityType: "activity" | "ugcPost"
): string | null {
  // Find all <code> blocks with bpr-guid IDs
  const codeBlockRegex = /<code[^>]*id="bpr-guid-\d+"[^>]*>([\s\S]*?)<\/code>/g;

  let match;
  while ((match = codeBlockRegex.exec(html)) !== null) {
    const codeContent = match[1];
    if (!codeContent) continue;

    // Decode HTML entities
    const decoded = decodeHtmlEntities(codeContent);

    // Remove newlines and extra spaces
    const cleaned = decoded.replace(/\s+/g, " ");

    try {
      const parsed = JSON.parse(cleaned);
      const result = findPostActorInObject(parsed, activityId, activityType);
      if (result) return result;
    } catch {
      // Try regex-based extraction for posts
      const result = extractPostActorFromText(cleaned, activityId, activityType);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Recursively search for a post by activity ID and extract the author's profile URN.
 * LinkedIn structure: fsd_update entity has actor.image.attributes[0].detailData.nonEntityProfilePicture.*profile
 */
function findPostActorInObject(
  obj: unknown,
  targetActivityId: string,
  activityType: "activity" | "ugcPost"
): string | null {
  if (!obj || typeof obj !== "object") return null;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const result = findPostActorInObject(item, targetActivityId, activityType);
      if (result) return result;
    }
    return null;
  }

  const record = obj as Record<string, unknown>;

  // Check if this is the target fsd_update by entityUrn containing the activity ID
  // Format: urn:li:fsd_update:(urn:li:activity:ID,...) or urn:li:fsd_update:(urn:li:ugcPost:ID,...)
  const entityUrn = getValueWithWhitespaceKey(record, "entityUrn") as string | undefined;
  if (entityUrn?.includes(`fsd_update:(urn:li:${activityType}:${targetActivityId},`)) {
    // Found the post! Extract author's profile URN from actor
    const actor = getValueWithWhitespaceKey(record, "actor") as Record<string, unknown> | undefined;
    if (actor) {
      // Try image.attributes[0].detailData.nonEntityProfilePicture.*profile
      const image = getValueWithWhitespaceKey(actor, "image") as Record<string, unknown> | undefined;
      const attributes = getValueWithWhitespaceKey(image ?? {}, "attributes") as unknown[] | undefined;
      if (attributes?.[0]) {
        const detailData = getValueWithWhitespaceKey(
          attributes[0] as Record<string, unknown>,
          "detailData"
        ) as Record<string, unknown> | undefined;
        const nonEntityProfilePicture = getValueWithWhitespaceKey(
          detailData ?? {},
          "nonEntityProfilePicture"
        ) as Record<string, unknown> | undefined;
        const profile = getValueWithWhitespaceKey(nonEntityProfilePicture ?? {}, "*profile") as string | undefined;
        if (profile) {
          return extractUrnId(profile.trim());
        }
      }

      // Fallback: try actor.*profileUrn directly
      const profileUrn = getValueWithWhitespaceKey(actor, "*profileUrn") as string | undefined;
      if (profileUrn) {
        return extractUrnId(profileUrn.trim());
      }
    }
  }

  // Check included array
  const included = getValueWithWhitespaceKey(record, "included") as unknown[] | undefined;
  if (Array.isArray(included)) {
    for (const item of included) {
      const result = findPostActorInObject(item, targetActivityId, activityType);
      if (result) return result;
    }
  }

  // Recurse into nested objects
  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      const result = findPostActorInObject(value, targetActivityId, activityType);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Extract post author profile URN from text using regex when JSON parsing fails.
 * Looks for fsd_update:(urn:li:activity:ID,...) nearby actor data with fsd_profile URN.
 */
function extractPostActorFromText(
  text: string,
  targetActivityId: string,
  activityType: "activity" | "ugcPost"
): string | null {
  // Find the post by its fsd_update URN
  const updatePattern = `fsd_update:\\s*\\(\\s*urn:li:${activityType}:${targetActivityId}\\s*,`;
  const updateRegex = new RegExp(updatePattern, "g");

  let match;
  while ((match = updateRegex.exec(text)) !== null) {
    const position = match.index;

    // Search in a window after the fsd_update for author's profile URN
    // The actor data comes after the entityUrn in the update object
    const windowStart = position;
    const windowEnd = Math.min(text.length, position + 5000);
    const window = text.slice(windowStart, windowEnd);

    // Look for *profile pointing to fsd_profile (in nonEntityProfilePicture)
    const profileMatch = window.match(
      /"\*profile\s*"\s*:\s*"\s*(urn:li:fsd_profile:[A-Za-z0-9_-]+)\s*"/
    );

    if (profileMatch?.[1]) {
      return extractUrnId(profileMatch[1]);
    }
  }

  return null;
}

/**
 * Get value from object, handling keys that may have trailing whitespace.
 * LinkedIn's JSON sometimes has keys like "publicIdentifier " with trailing space.
 */
function getValueWithWhitespaceKey(
  record: Record<string, unknown>,
  key: string
): unknown {
  // Try exact key first
  if (key in record) return record[key];
  // Try key with trailing space
  if (`${key} ` in record) return record[`${key} `];
  return undefined;
}

/**
 * Recursively search object for profile matching publicIdentifier
 */
function findProfileInObject(
  obj: unknown,
  targetPublicIdentifier: string
): string | null {
  if (!obj || typeof obj !== "object") return null;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const result = findProfileInObject(item, targetPublicIdentifier);
      if (result) return result;
    }
    return null;
  }

  const record = obj as Record<string, unknown>;

  // Check if this object has matching publicIdentifier (handle whitespace in keys)
  const publicId = getValueWithWhitespaceKey(record, "publicIdentifier") as string | undefined;
  const normalizedPublicId = publicId?.trim().toLowerCase();
  if (normalizedPublicId === targetPublicIdentifier.toLowerCase()) {
    // Found matching profile, extract URN (handle whitespace in keys)
    const entityUrn = getValueWithWhitespaceKey(record, "entityUrn") as string | undefined;
    const dashEntityUrn = getValueWithWhitespaceKey(record, "dashEntityUrn") as string | undefined;

    const urn = entityUrn?.trim() || dashEntityUrn?.trim();
    if (urn) {
      return extractUrnId(urn);
    }
  }

  // Check included array (common LinkedIn data structure)
  const included = getValueWithWhitespaceKey(record, "included") as unknown[] | undefined;
  if (Array.isArray(included)) {
    for (const item of included) {
      const result = findProfileInObject(item, targetPublicIdentifier);
      if (result) return result;
    }
  }

  // Recurse into nested objects
  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      const result = findProfileInObject(value, targetPublicIdentifier);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Extract profile URN from text using regex when JSON parsing fails.
 * Handles LinkedIn's HTML format where keys/values may have trailing whitespace inside quotes:
 * e.g., "publicIdentifier ":"hugo-clément-057358282 "
 */
function extractProfileFromText(
  text: string,
  targetPublicIdentifier: string
): string | null {
  // Look for pattern: "publicIdentifier":"slug"...nearby..."entityUrn":"urn:li:fsd_profile:ID"
  // Note: LinkedIn HTML often has whitespace inside quotes, so we use \s* to handle it

  // Find all publicIdentifier occurrences (allow whitespace inside quotes)
  const escapedSlug = targetPublicIdentifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const publicIdRegex = new RegExp(
    `"publicIdentifier\\s*"\\s*:\\s*"\\s*${escapedSlug}\\s*"`,
    "gi"
  );

  let match;
  while ((match = publicIdRegex.exec(text)) !== null) {
    const position = match.index;

    // Search in a window around the match for entityUrn or dashEntityUrn
    const windowStart = Math.max(0, position - 2000);
    const windowEnd = Math.min(text.length, position + 2000);
    const window = text.slice(windowStart, windowEnd);

    // Look for fsd_profile or fs_miniProfile URN (allow whitespace inside quotes)
    const urnMatch = window.match(
      /"(?:entityUrn|dashEntityUrn)\s*"\s*:\s*"\s*(urn:li:(?:fsd_profile|fs_miniProfile):[A-Za-z0-9_-]+)\s*"/
    );

    if (urnMatch?.[1]) {
      return extractUrnId(urnMatch[1]);
    }
  }

  return null;
}

/**
 * Fetches the activity page and extracts the profileUrn.
 *
 * For posts: finds the fsd_update entity by activity ID and extracts author's profileUrn
 * For comments: finds the fsd_comment entity by comment ID and extracts commenter's profileUrn
 *
 * Falls back to publicIdentifier search if entity-based extraction fails.
 *
 * @param activityUrl - The LinkedIn activity URL (post or comment page)
 * @param profileSlug - The profile slug (publicIdentifier) for fallback matching
 * @returns The profile URN ID or null if not found
 */
export async function fetchProfileUrn(
  activityUrl: string,
  profileSlug: string
): Promise<string | null> {
  const auth = await storage.getItem<LinkedInAuth>("local:auth");

  if (!auth?.cookie) {
    console.error("[ProfileUrnFetcher] Missing auth cookies. Please refresh page.");
    return null;
  }

  // Check if this is a comment URL (has dashCommentUrn parameter)
  const commentId = extractCommentIdFromUrl(activityUrl);
  const isComment = commentId !== null;

  // Extract activity ID from URL for post author extraction
  const activityInfo = extractActivityIdFromUrl(activityUrl);

  try {
    console.log("[ProfileUrnFetcher] Fetching:", activityUrl, isComment ? `(comment: ${commentId})` : `(post: ${activityInfo?.id})`);

    const response = await fetch(activityUrl, {
      method: "GET",
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        cookie: auth.cookie,
      },
      credentials: "include",
    });

    if (!response.ok) {
      console.error("[ProfileUrnFetcher] Fetch failed:", response.status);
      return null;
    }

    const html = await response.text();
    console.log("[ProfileUrnFetcher] Received HTML:", html.length, "chars");

    let profileUrn: string | null = null;

    if (isComment) {
      // For comments: find the specific comment and extract commenter's profile URN
      profileUrn = parseCommenterProfileUrnFromHtml(html, commentId);

      // Fallback to publicIdentifier search if comment extraction fails
      // (handles case where commenter is also the post author)
      if (!profileUrn) {
        console.log("[ProfileUrnFetcher] Comment extraction failed, trying publicIdentifier fallback...");
        profileUrn = parseProfileUrnFromHtml(html, profileSlug);
      }
    } else if (activityInfo) {
      // For posts: find the fsd_update entity and extract author's profile URN
      profileUrn = parsePostAuthorProfileUrnFromHtml(html, activityInfo.id, activityInfo.type);

      // Fallback to publicIdentifier search if post author extraction fails
      if (!profileUrn) {
        console.log("[ProfileUrnFetcher] Post actor extraction failed, trying publicIdentifier fallback...");
        profileUrn = parseProfileUrnFromHtml(html, profileSlug);
      }
    } else {
      // Fallback: URL format not recognized, try publicIdentifier search
      console.log("[ProfileUrnFetcher] Unknown URL format, trying publicIdentifier search...");
      profileUrn = parseProfileUrnFromHtml(html, profileSlug);
    }

    if (profileUrn) {
      console.log("[ProfileUrnFetcher] Found profileUrn:", profileUrn);
    } else {
      console.warn("[ProfileUrnFetcher] Could not find profileUrn for:", profileSlug);
    }

    return profileUrn;
  } catch (error) {
    console.error("[ProfileUrnFetcher] Error:", error);
    return null;
  }
}
