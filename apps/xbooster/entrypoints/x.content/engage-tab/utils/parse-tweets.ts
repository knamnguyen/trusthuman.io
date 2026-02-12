/**
 * parse-tweets.ts -- Response parsers for List and Community tweet endpoints.
 *
 * Extracts tweet data from X.com GraphQL responses into a normalized
 * EngageTweetData format used by the Engage tab.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EngageTweetData {
  tweetId: string;
  text: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  url: string;
  timestamp: string;
  sourceId: string;
  sourceType: "list" | "community";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely access a nested property path on an unknown object.
 * Returns undefined if any segment is missing.
 */
function getNestedValue(obj: unknown, path: string[]): unknown {
  let current: unknown = obj;
  for (const key of path) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Extract tweet data from a single tweet result object.
 * Handles both `Tweet` and `TweetWithVisibilityResults` wrappers.
 *
 * Returns null if the tweet cannot be parsed or is a retweet.
 */
function parseSingleTweet(
  rawResult: unknown,
  sourceId: string,
  sourceType: "list" | "community",
): EngageTweetData | null {
  if (!rawResult || typeof rawResult !== "object") return null;

  let result = rawResult as Record<string, unknown>;

  // Handle TweetWithVisibilityResults wrapper
  const typeName = result.__typename as string | undefined;
  if (typeName === "TweetWithVisibilityResults") {
    const innerTweet = result.tweet as Record<string, unknown> | undefined;
    if (!innerTweet) return null;
    result = innerTweet;
  }

  // Skip non-Tweet types (e.g., TweetTombstone)
  if (result.__typename && result.__typename !== "Tweet") return null;

  // Skip retweets
  const legacy = result.legacy as Record<string, unknown> | undefined;
  if (!legacy) return null;
  if (legacy.retweeted_status_result) return null;

  // Extract tweet ID
  const tweetId = (result.rest_id as string) ?? "";
  if (!tweetId) return null;

  // Extract text -- prefer note_tweet for long tweets, fall back to full_text
  const noteTweetText = getNestedValue(result, [
    "note_tweet",
    "note_tweet_results",
    "result",
    "text",
  ]) as string | undefined;
  const fullText = (legacy.full_text as string) ?? "";
  const text = noteTweetText ?? fullText;

  // Extract author info
  // Twitter API exposes user data at multiple paths; try each
  const userResult = getNestedValue(result, [
    "core",
    "user_results",
    "result",
  ]) as Record<string, unknown> | undefined;

  const userCore = userResult?.core as Record<string, unknown> | undefined;
  const userLegacy = userResult?.legacy as
    | Record<string, unknown>
    | undefined;
  const userAvatar = userResult?.avatar as
    | Record<string, unknown>
    | undefined;

  // Name & handle: prefer core (newer API), fall back to legacy
  const authorName =
    (userCore?.name as string) ??
    (userLegacy?.name as string) ??
    "";
  const authorHandle =
    (userCore?.screen_name as string) ??
    (userLegacy?.screen_name as string) ??
    "";

  // Avatar: prefer avatar.image_url, fall back to legacy
  const authorAvatar =
    (userAvatar?.image_url as string) ??
    (userLegacy?.profile_image_url_https as string) ??
    "";

  // Build tweet URL (use /i/status/ fallback if handle is missing)
  const url = authorHandle
    ? `https://x.com/${authorHandle}/status/${tweetId}`
    : `https://x.com/i/status/${tweetId}`;

  // Extract timestamp
  const timestamp = (legacy.created_at as string) ?? "";

  return {
    tweetId,
    text,
    authorName,
    authorHandle,
    authorAvatar,
    url,
    timestamp,
    sourceId,
    sourceType,
  };
}

/**
 * Sort tweets by created_at descending (newest first).
 */
function sortByNewest(tweets: EngageTweetData[]): EngageTweetData[] {
  return tweets.sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    // Handle invalid dates -- push them to the end
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateB - dateA;
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse the response from ListLatestTweetsTimeline GraphQL endpoint.
 *
 * Response path:
 *   data.list.tweets_timeline.timeline.instructions[]
 *     -> find type === "TimelineAddEntries"
 *     -> entries where entryId starts with "tweet-"
 *     -> entry.content.itemContent.tweet_results.result
 */
export function parseListTweetsResponse(
  data: unknown,
  sourceId: string,
): EngageTweetData[] {
  const tweets: EngageTweetData[] = [];

  try {
    const instructions = getNestedValue(data, [
      "data",
      "list",
      "tweets_timeline",
      "timeline",
      "instructions",
    ]) as unknown[] | undefined;

    if (!Array.isArray(instructions)) return tweets;

    for (const instruction of instructions) {
      const inst = instruction as Record<string, unknown>;
      if (inst?.type !== "TimelineAddEntries") continue;

      const entries = inst.entries as unknown[] | undefined;
      if (!Array.isArray(entries)) continue;

      for (const entry of entries) {
        const e = entry as Record<string, unknown>;
        const entryId = e?.entryId as string | undefined;
        if (!entryId?.startsWith("tweet-")) continue;

        const tweetResult = getNestedValue(e, [
          "content",
          "itemContent",
          "tweet_results",
          "result",
        ]);

        const parsed = parseSingleTweet(tweetResult, sourceId, "list");
        if (parsed) tweets.push(parsed);
      }
    }
  } catch (err) {
    console.error("xBooster: parseListTweetsResponse error:", err);
  }

  return sortByNewest(tweets);
}

/**
 * Parse the response from CommunityTweetsTimeline GraphQL endpoint.
 *
 * Response path:
 *   data.communityResults.result.ranked_community_timeline.timeline.instructions[]
 *     -> handles BOTH TimelinePinEntry (single pinned entry) AND TimelineAddEntries
 *     -> for TimelinePinEntry: instruction.entry.content.itemContent.tweet_results.result
 *     -> for TimelineAddEntries: same as list parsing
 */
export function parseCommunityTweetsResponse(
  data: unknown,
  sourceId: string,
): EngageTweetData[] {
  const tweets: EngageTweetData[] = [];

  try {
    const instructions = getNestedValue(data, [
      "data",
      "communityResults",
      "result",
      "ranked_community_timeline",
      "timeline",
      "instructions",
    ]) as unknown[] | undefined;

    if (!Array.isArray(instructions)) return tweets;

    for (const instruction of instructions) {
      const inst = instruction as Record<string, unknown>;
      const instType = inst?.type as string | undefined;

      // Handle TimelinePinEntry (single pinned entry)
      if (instType === "TimelinePinEntry") {
        const tweetResult = getNestedValue(inst, [
          "entry",
          "content",
          "itemContent",
          "tweet_results",
          "result",
        ]);

        const parsed = parseSingleTweet(
          tweetResult,
          sourceId,
          "community",
        );
        if (parsed) tweets.push(parsed);
        continue;
      }

      // Handle TimelineAddEntries (multiple entries)
      if (instType === "TimelineAddEntries") {
        const entries = inst.entries as unknown[] | undefined;
        if (!Array.isArray(entries)) continue;

        for (const entry of entries) {
          const e = entry as Record<string, unknown>;
          const entryId = e?.entryId as string | undefined;
          if (!entryId?.startsWith("tweet-")) continue;

          const tweetResult = getNestedValue(e, [
            "content",
            "itemContent",
            "tweet_results",
            "result",
          ]);

          const parsed = parseSingleTweet(
            tweetResult,
            sourceId,
            "community",
          );
          if (parsed) tweets.push(parsed);
        }
      }
    }
  } catch (err) {
    console.error("xBooster: parseCommunityTweetsResponse error:", err);
  }

  return sortByNewest(tweets);
}
