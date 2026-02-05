import type { MentionData, OriginalTweet } from "../stores/mentions-store";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Parse notification data from X.com NotificationsTimeline response
 * into a flat list of mentions.
 */
export function parseNotificationEntries(data: any): MentionData[] {
  const mentions: MentionData[] = [];

  try {
    const instructions =
      data?.data?.viewer_v2?.user_results?.result?.notification_timeline
        ?.timeline?.instructions;

    if (!instructions) return mentions;

    const addEntries = instructions.find(
      (i: any) => i.type === "TimelineAddEntries",
    );
    if (!addEntries?.entries) return mentions;

    for (const entry of addEntries.entries) {
      if (
        entry.content?.entryType !== "TimelineTimelineItem" ||
        entry.content?.itemContent?.itemType !== "TimelineTweet"
      )
        continue;

      const result = entry.content.itemContent.tweet_results?.result;
      if (!result) continue;

      const authorName =
        result.core?.user_results?.result?.core?.name ??
        result.core?.user_results?.result?.legacy?.name;
      const authorHandle =
        result.core?.user_results?.result?.legacy?.screen_name ??
        result.core?.user_results?.result?.core?.screen_name ??
        "";
      const fullText = result.legacy?.full_text;
      const conversationId = result.legacy?.conversation_id_str;
      const inReplyToStatusId = result.legacy?.in_reply_to_status_id_str;
      const tweetId = result.legacy?.id_str;
      const replyCount = result.legacy?.reply_count ?? 0;
      const timestamp = result.legacy?.created_at ?? "";

      // Must be a reply (has in_reply_to data)
      const isReply = !!inReplyToStatusId;

      if (authorName && fullText && isReply && tweetId) {
        mentions.push({
          tweetId,
          text: fullText,
          authorName,
          authorHandle,
          conversationId: conversationId ?? "",
          inReplyToStatusId: inReplyToStatusId ?? "",
          replyCount,
          timestamp,
        });
      }
    }
  } catch (err) {
    console.error("xBooster: Error parsing notifications:", err);
  }

  return mentions;
}

/**
 * Parse TweetDetail response into an OriginalTweet object.
 */
export function parseTweetDetail(data: any): OriginalTweet | null {
  try {
    const instructions =
      data?.data?.threaded_conversation_with_injections_v2?.instructions;
    if (!instructions) return null;

    const addEntries = instructions.find(
      (i: any) => i.type === "TimelineAddEntries",
    );
    if (!addEntries?.entries?.length) return null;

    // The focal tweet is typically the first entry
    for (const entry of addEntries.entries) {
      const result =
        entry.content?.itemContent?.tweet_results?.result ??
        entry.content?.items?.[0]?.item?.itemContent?.tweet_results?.result;

      if (!result) continue;

      const tweetId = result.legacy?.id_str;
      const text = result.legacy?.full_text;
      const authorName =
        result.core?.user_results?.result?.core?.name ??
        result.core?.user_results?.result?.legacy?.name;
      const authorHandle =
        result.core?.user_results?.result?.legacy?.screen_name ??
        result.core?.user_results?.result?.core?.screen_name ??
        "";

      if (tweetId && text) {
        return { tweetId, text, authorName: authorName ?? "Unknown", authorHandle };
      }
    }
  } catch (err) {
    console.error("xBooster: Error parsing tweet detail:", err);
  }

  return null;
}
