import { getXAuth } from "@/lib/x-auth-service";

// Feature flags required by X.com's GraphQL API
const FEATURES = {
  rweb_video_screen_enabled: false,
  payments_enabled: false,
  profile_label_improvements_pcf_label_in_post_enabled: true,
  rweb_tipjar_consumption_enabled: true,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  premium_content_api_read_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  responsive_web_grok_analyze_button_fetch_trends_enabled: false,
  responsive_web_grok_analyze_post_followups_enabled: true,
  responsive_web_jetfuel_frame: true,
  responsive_web_grok_share_attachment_enabled: true,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  responsive_web_grok_show_grok_translated_post: false,
  responsive_web_grok_analysis_button_from_backend: true,
  creator_subscriptions_quote_tweet_preview_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  responsive_web_grok_image_annotation_enabled: true,
  responsive_web_grok_community_note_auto_translation_is_enabled: false,
  responsive_web_enhance_cards_enabled: false,
  rweb_xchat_enabled: false,
  responsive_web_profile_redirect_enabled: true,
  responsive_web_grok_imagine_annotation_enabled: true,
  responsive_web_grok_annotations_enabled: true,
  post_ctas_fetch_enabled: false,
};

// Fallback queryIds — update these if X.com changes them
const FALLBACK_QUERY_IDS = {
  CreateTweet: "F7hteriqzdRzvMfXM6Ul4w",
  TweetDetail: "Vrkl31e9tzfybLjkgNUEmg",
  NotificationsTimeline: "Jizym-xYEiKIUsJ0xn6hFg",
};

// Cache extracted queryIds so we don't re-parse the bundle
let cachedQueryIds: Record<string, string> | null = null;

/**
 * Extract queryIds from X.com's main.*.js bundle
 */
async function extractQueryIds(): Promise<Record<string, string>> {
  if (cachedQueryIds) return cachedQueryIds;

  try {
    const mainScript = Array.from(document.querySelectorAll("script[src]"))
      .map((s) => (s as HTMLScriptElement).src)
      .find((src) => src.includes("main") && src.endsWith(".js"));

    if (!mainScript) throw new Error("No main JS bundle found");

    const response = await fetch(mainScript);
    const js = await response.text();

    const ids: Record<string, string> = {};
    const regex = /e\.exports\s*=\s*({[^}]+})/g;
    let match;
    while ((match = regex.exec(js)) !== null) {
      const objStr = match[1]!;
      for (const op of [
        "CreateTweet",
        "TweetDetail",
        "NotificationsTimeline",
      ]) {
        if (objStr.includes(`operationName:"${op}"`)) {
          const idMatch = objStr.match(/queryId:"([^"]+)"/);
          if (idMatch) ids[op] = idMatch[1]!;
        }
      }
    }

    cachedQueryIds = ids;
    console.log("xBooster: Extracted queryIds:", ids);
    return ids;
  } catch (err) {
    console.warn("xBooster: Failed to extract queryIds, using fallbacks:", err);
    return {};
  }
}

async function getQueryId(operation: string): Promise<string> {
  const extracted = await extractQueryIds();
  return (
    extracted[operation] ??
    FALLBACK_QUERY_IDS[operation as keyof typeof FALLBACK_QUERY_IDS] ??
    ""
  );
}

function extractCookieValue(cookieString: string, name: string): string | null {
  const match = cookieString.match(new RegExp("(^|; )" + name + "=([^;]+)"));
  return match ? match[2]! : null;
}

/**
 * Build common headers for X.com API requests
 */
async function buildHeaders(referer: string): Promise<HeadersInit> {
  const auth = await getXAuth();
  if (!auth) throw new Error("No auth captured — browse X.com first");
  if (!auth.cookie) throw new Error("No cookies captured");
  if (!auth.authorization) throw new Error("No authorization captured");

  const ct0 = extractCookieValue(auth.cookie, "ct0");
  if (!ct0) throw new Error("Missing ct0 cookie");

  return {
    authorization: auth.authorization,
    "content-type": "application/json",
    "x-csrf-token": ct0,
    "x-twitter-active-user": "yes",
    "x-twitter-auth-type": "OAuth2Session",
    "x-twitter-client-language": "en",
    cookie: auth.cookie,
    Referer: referer,
  };
}

/**
 * Fetch mentions from X.com NotificationsTimeline
 */
export async function fetchNotifications(count = 40): Promise<{
  success: boolean;
  data?: unknown;
  message?: string;
}> {
  try {
    const queryId = await getQueryId("NotificationsTimeline");

    const variables = {
      timeline_type: "Mentions",
      cursor: null,
      count,
    };

    const url = `/i/api/graphql/${queryId}/NotificationsTimeline?variables=${encodeURIComponent(
      JSON.stringify(variables),
    )}&features=${encodeURIComponent(JSON.stringify(FEATURES))}`;

    const headers = await buildHeaders("https://x.com/notifications");

    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HTTP ${res.status}: ${err}`);
    }

    const json = await res.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors));

    return { success: true, data: json };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("xBooster: fetchNotifications error:", message);
    return { success: false, message };
  }
}

/**
 * Fetch tweet details via TweetDetail GraphQL endpoint
 */
export async function getTweetDetail(tweetId: string): Promise<{
  success: boolean;
  data?: unknown;
  message?: string;
}> {
  try {
    const queryId = await getQueryId("TweetDetail");

    const variables = {
      focalTweetId: tweetId,
      referrer: "ntab",
      with_rux_injections: false,
      rankingMode: "Relevance",
      includePromotedContent: true,
      withCommunity: true,
      withQuickPromoteEligibilityTweetFields: true,
      withBirdwatchNotes: true,
      withVoice: true,
    };

    const fieldToggles = {
      withArticleRichContentState: true,
      withArticlePlainText: false,
      withGrokAnalyze: false,
      withDisallowedReplyControls: false,
    };

    const url = `/i/api/graphql/${queryId}/TweetDetail?variables=${encodeURIComponent(
      JSON.stringify(variables),
    )}&features=${encodeURIComponent(
      JSON.stringify(FEATURES),
    )}&fieldToggles=${encodeURIComponent(JSON.stringify(fieldToggles))}`;

    const headers = await buildHeaders(
      `https://x.com/i/web/status/${tweetId}`,
    );

    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HTTP ${res.status}: ${err}`);
    }

    const json = await res.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors));

    return { success: true, data: json };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("xBooster: getTweetDetail error:", message);
    return { success: false, message };
  }
}

/**
 * Post a tweet (or reply) via CreateTweet GraphQL endpoint
 */
export async function postTweet(
  text: string,
  replyToTweetId?: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const tweetText = text.trim();
    if (!tweetText) throw new Error("Empty tweet");

    const queryId = await getQueryId("CreateTweet");

    const variables: Record<string, unknown> = {
      tweet_text: tweetText,
      dark_request: false,
      media: { media_entities: [], possibly_sensitive: false },
      semantic_annotation_ids: [],
      disallowed_reply_options: null,
      broadcast: true,
    };

    if (replyToTweetId) {
      variables.reply = {
        in_reply_to_tweet_id: replyToTweetId,
        exclude_reply_user_ids: [],
      };
    }

    const body = {
      variables,
      features: FEATURES,
      queryId,
    };

    const headers = await buildHeaders(window.location.href);

    const res = await fetch(`/i/api/graphql/${queryId}/CreateTweet`, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HTTP ${res.status}: ${err}`);
    }

    const json = await res.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors));

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("xBooster: postTweet error:", message);
    return { success: false, message };
  }
}
