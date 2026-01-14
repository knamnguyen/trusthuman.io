import { storage } from "wxt/storage";

import type { CommentData } from "./saved-profile-store";

interface LinkedInAuth {
  cookie: string;
  csrfToken: string;
  pageInstance?: string;
  track?: string;
}

// === Lightweight parsers adapted from apps/draft-howActive/extract-comments.js ===

const safeGet = <T>(
  obj: unknown,
  pathSegments: string[],
  defaultValue: T | undefined = undefined,
): T | undefined => {
  try {
    return (
      (pathSegments.reduce(
        (acc, key) =>
          acc && (acc as Record<string, unknown>)[key] !== undefined
            ? (acc as Record<string, unknown>)[key]
            : undefined,
        obj as unknown,
      ) as T) ?? defaultValue
    );
  } catch {
    return defaultValue;
  }
};

const parseCommentEntityUrn = (
  entityUrn: string,
): { commentId: string; parentUrn: string } | null => {
  if (typeof entityUrn !== "string") return null;
  const match = entityUrn.match(/^urn:li:fsd_comment:\(([^,]+),(.+)\)$/);
  if (!match?.[1] || !match[2]) return null;
  return { commentId: match[1], parentUrn: match[2] };
};

const parseUpdateEntityUrn = (entityUrn: string): string | null => {
  if (typeof entityUrn !== "string") return null;
  const match = entityUrn.match(/^urn:li:fsd_update:\((urn:li:[^,]+),/);
  if (!match?.[1]) return null;
  return match[1];
};

/**
 * Extracts profile picture URL from LinkedIn's vectorImage structure
 * Prefers 100x100 size for thumbnails
 */
const extractProfilePicUrl = (imageObj: unknown): string | null => {
  try {
    const image = imageObj as Record<string, unknown>;
    const attributes = image?.attributes as unknown[];
    if (!attributes?.length) return null;

    const firstAttr = attributes[0] as Record<string, unknown>;
    const detailData = firstAttr?.detailData as Record<string, unknown>;
    const nonEntityProfilePicture =
      detailData?.nonEntityProfilePicture as Record<string, unknown>;
    const vectorImage = nonEntityProfilePicture?.vectorImage as Record<
      string,
      unknown
    >;

    if (!vectorImage) return null;

    const rootUrl = vectorImage.rootUrl as string;
    const artifacts = vectorImage.artifacts as Array<Record<string, unknown>>;

    if (!rootUrl || !artifacts?.length) return null;

    // Prefer 100x100 size for thumbnails
    const small = artifacts.find((a) => a.width === 100 || a.width === 200);
    const artifact = small || artifacts[0];
    const segment = artifact?.fileIdentifyingUrlPathSegment as string;

    return segment ? `${rootUrl}${segment}` : null;
  } catch {
    return null;
  }
};

/**
 * Strips query parameters from URL to get clean activity URL
 */
const cleanActivityUrl = (permalink: string | null): string | null => {
  if (!permalink) return null;
  try {
    const url = new URL(permalink);
    return `${url.origin}${url.pathname}`;
  } catch {
    return permalink.split("?")[0] || null;
  }
};

/**
 * Strips query parameters from profile URL
 */
const cleanProfileUrl = (url: string | null): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("?")[0] || null;
  }
};

interface UpdateData {
  postAuthor: string | null;
  backendUrn: string | null;
  type: string;
  originalEntityUrn: string;
  /** Post author's profile picture URL */
  postAuthorPhotoUrl: string | null;
  /** Post author's profile URL */
  postAuthorProfileUrl: string | null;
}

interface CommentParseData {
  author: string | null;
  content: string | null;
  time: number | null;
  entityUrn: string;
  parentUrn: string | null;
  parentCommentUrn: string | null;
  isReply: boolean;
  /** Direct link to the activity/post */
  activityUrl: string | null;
  /** Commenter's profile picture URL */
  authorPhotoUrl: string | null;
  /** Commenter's profile URL */
  authorProfileUrl: string | null;
}

interface ParseResult {
  comments: CommentData[];
  profilesByUrn: Map<string, { name: string }>;
  updatesByUrn: Map<string, UpdateData>;
}

export const parseCommentsFromVoyagerResponse = (
  json: unknown,
): ParseResult => {
  const data = json as Record<string, unknown>;
  const included = Array.isArray(data?.included)
    ? data.included
    : Array.isArray((data?.data as Record<string, unknown>)?.included)
      ? ((data?.data as Record<string, unknown>)?.included as unknown[])
      : [];

  if (!included.length) {
    return { comments: [], profilesByUrn: new Map(), updatesByUrn: new Map() };
  }

  const updatesByUrn = new Map<string, UpdateData>();
  const commentsByUrn = new Map<string, CommentParseData>();
  const profilesByUrn = new Map<string, { name: string }>();

  // First pass: catalog entities
  for (const item of included) {
    const entity = item as Record<string, unknown>;
    const type = entity?.$type as string;
    const entityUrn = entity?.entityUrn as string;

    if (type === "com.linkedin.voyager.dash.feed.Update") {
      const postAuthor =
        safeGet<string>(entity, ["actor", "name", "text"]) ||
        safeGet<string>(entity, ["header", "text", "text"]) ||
        null;
      const metadata = entity?.metadata as Record<string, unknown>;
      const backendUrn =
        (metadata?.backendUrn as string) ||
        (entity?.backendUrn as string) ||
        null;

      // Extract post author's profile pic and URL
      const actorImage = safeGet<unknown>(entity, ["actor", "image"]);
      const postAuthorPhotoUrl = extractProfilePicUrl(actorImage);
      const postAuthorProfileUrl = cleanProfileUrl(
        safeGet<string>(entity, [
          "actor",
          "navigationContext",
          "actionTarget",
        ]) ?? null,
      );

      const updateData: UpdateData = {
        postAuthor,
        backendUrn,
        type: "update",
        originalEntityUrn: entityUrn,
        postAuthorPhotoUrl,
        postAuthorProfileUrl,
      };

      if (backendUrn) {
        updatesByUrn.set(backendUrn, updateData);
      }
      const innerUrn = parseUpdateEntityUrn(entityUrn);
      if (innerUrn && innerUrn !== backendUrn) {
        updatesByUrn.set(innerUrn, updateData);
      }
      if (entityUrn && entityUrn !== backendUrn) {
        updatesByUrn.set(entityUrn, updateData);
      }
    } else if (type === "com.linkedin.voyager.dash.social.Comment") {
      const author =
        safeGet<string>(entity, ["commenter", "title", "text"]) ||
        safeGet<string>(entity, ["title", "text"]) ||
        safeGet<string>(entity, ["commenter", "name", "text"]) ||
        safeGet<string>(entity, ["actor", "name", "text"]) ||
        null;

      const commentaryText = safeGet<string>(entity, ["commentary", "text"]);
      const messageText = safeGet<string>(entity, ["message", "text"]);
      const rawCommentary = safeGet<unknown>(entity, ["commentary"]);
      const content =
        commentaryText ||
        messageText ||
        (typeof rawCommentary === "string" ? rawCommentary : null);

      const time =
        (entity?.createdAt as number) ??
        (entity?.createdTime as number) ??
        null;
      const permalink = (entity?.permalink as string) || "";
      const isReply = permalink.includes("replyUrn=");

      let parentCommentUrn: string | null = null;
      if (isReply) {
        const commentUrnMatch = permalink.match(/commentUrn=([^&]+)/);
        if (commentUrnMatch?.[1]) {
          const decodedCommentUrn = decodeURIComponent(commentUrnMatch[1]);
          const commentIdMatch = decodedCommentUrn.match(
            /urn:li:comment:\((activity|ugcPost):[^,]+,(\d+)\)/,
          );
          if (commentIdMatch?.[1] && commentIdMatch[2]) {
            const parentType = commentIdMatch[1];
            const parentIdMatch = decodedCommentUrn.match(
              /(activity|ugcPost):(\d+)/,
            );
            const parentId = parentIdMatch?.[2];
            const commentId = commentIdMatch[2];
            if (parentType === "activity" && parentId) {
              parentCommentUrn = `urn:li:fsd_comment:(${commentId},urn:li:activity:${parentId})`;
            } else if (parentType === "ugcPost" && parentId) {
              parentCommentUrn = `urn:li:fsd_comment:(${commentId},urn:li:ugcPost:${parentId})`;
            }
          }
        }
      }

      const parsedUrn = parseCommentEntityUrn(entityUrn);
      const parentUrn = parsedUrn?.parentUrn || null;

      // Extract commenter's profile pic and URL
      const commenterImage = safeGet<unknown>(entity, ["commenter", "image"]);
      const authorPhotoUrl = extractProfilePicUrl(commenterImage);
      const authorProfileUrl = cleanProfileUrl(
        safeGet<string>(entity, ["commenter", "navigationUrl"]) ?? null,
      );
      const activityUrl = cleanActivityUrl(permalink || null);

      if (entityUrn) {
        commentsByUrn.set(entityUrn, {
          author,
          content,
          time,
          entityUrn,
          parentUrn,
          parentCommentUrn,
          isReply,
          activityUrl,
          authorPhotoUrl,
          authorProfileUrl,
        });
      }
    } else if (type === "com.linkedin.voyager.dash.identity.profile.Profile") {
      const firstName = safeGet<string>(entity, ["firstName"]) || "";
      const lastName = safeGet<string>(entity, ["lastName"]) || "";
      const name = `${firstName} ${lastName}`.trim();
      if (entityUrn) {
        profilesByUrn.set(entityUrn, { name });
      }
    } else if (type === "com.linkedin.voyager.dash.social.SocialDetail") {
      // Map ugcPost <-> activity using SocialDetail
      const match = entityUrn?.match(
        /^urn:li:fsd_socialDetail:\(([^,]+),([^,]+),/,
      );
      if (match?.[1] && match[2]) {
        const ugcPostUrn = match[1];
        const activityUrn = match[2];
        if (updatesByUrn.has(activityUrn)) {
          const updateData = updatesByUrn.get(activityUrn)!;
          updatesByUrn.set(ugcPostUrn, updateData);
        }
      }
    }
  }

  const resolvePostAuthorData = (
    parentUrn: string | null,
  ): {
    postAuthor: string | null;
    postAuthorPhotoUrl: string | null;
    postAuthorProfileUrl: string | null;
  } => {
    const empty = {
      postAuthor: null,
      postAuthorPhotoUrl: null,
      postAuthorProfileUrl: null,
    };
    if (!parentUrn) return empty;

    const direct = updatesByUrn.get(parentUrn);
    if (direct?.postAuthor) {
      return {
        postAuthor: direct.postAuthor,
        postAuthorPhotoUrl: direct.postAuthorPhotoUrl,
        postAuthorProfileUrl: direct.postAuthorProfileUrl,
      };
    }
    // Fallback: search any update whose backendUrn matches parentUrn
    for (const [, upd] of updatesByUrn) {
      if (upd?.backendUrn === parentUrn && upd.postAuthor) {
        return {
          postAuthor: upd.postAuthor,
          postAuthorPhotoUrl: upd.postAuthorPhotoUrl,
          postAuthorProfileUrl: upd.postAuthorProfileUrl,
        };
      }
    }
    return empty;
  };

  // Resolve relationships and produce results
  const results: CommentData[] = [];
  for (const [, comment] of commentsByUrn) {
    const result: CommentData = {
      author: comment.author,
      content: comment.content,
      time: comment.time,
      postAuthor: null,
      parentCommentAuthor: null,
      isReply: comment.isReply,
      entityUrn: comment.entityUrn,
      parentUrn: comment.parentUrn,
      activityUrl: comment.activityUrl,
      authorPhotoUrl: comment.authorPhotoUrl,
      authorProfileUrl: comment.authorProfileUrl,
      postAuthorPhotoUrl: null,
      postAuthorProfileUrl: null,
    };

    if (comment.isReply && comment.parentCommentUrn) {
      const parentComment = commentsByUrn.get(comment.parentCommentUrn);
      result.parentCommentAuthor = parentComment?.author || null;
      const postData = resolvePostAuthorData(comment.parentUrn);
      result.postAuthor = postData.postAuthor;
      result.postAuthorPhotoUrl = postData.postAuthorPhotoUrl;
      result.postAuthorProfileUrl = postData.postAuthorProfileUrl;
    } else if (comment.parentUrn) {
      const postData = resolvePostAuthorData(comment.parentUrn);
      result.postAuthor = postData.postAuthor;
      result.postAuthorPhotoUrl = postData.postAuthorPhotoUrl;
      result.postAuthorProfileUrl = postData.postAuthorProfileUrl;
    }

    results.push(result);
  }

  return { comments: results, profilesByUrn, updatesByUrn };
};

/**
 * Fetches the dynamic GraphQL queryId from LinkedIn's static JS file
 */
async function getCommentQueryId(): Promise<string | null> {
  const JS_FILE =
    "https://static.licdn.com/aero-v1/sc/h/51y6vs7n7cki0hin5qs1dnzlv";
  try {
    console.log("Fetching GraphQL queryId from:", JS_FILE);
    const response = await fetch(JS_FILE);
    console.log(
      "JS file fetch response:",
      response.status,
      response.statusText,
    );

    if (!response.ok) {
      console.error("Failed to fetch JS file:", response.status);
      return null;
    }

    const text = await response.text();
    console.log("JS file size:", text.length, "chars");

    // Try multiple pattern variations (id may come before or after name)
    const patterns = [
      /name:\s*"get-feed-dash-profile-updates-by-member-comments"[^}]*id:\s*"([^"]+)"/,
      /id:\s*"([^"]+)"[^}]*name:\s*"get-feed-dash-profile-updates-by-member-comments"/,
      /"get-feed-dash-profile-updates-by-member-comments"[^}]*id:\s*"([^"]+)"/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        console.log("Found queryId:", match[1]);
        return match[1];
      }
    }

    // No pattern matched
    console.error("No regex pattern matched.");
    if (text.includes("get-feed-dash-profile-updates-by-member-comments")) {
      console.log("Query name exists but all patterns failed to extract id");
    } else {
      console.log("Query name not found in JS file - URL may be wrong");
    }
    return null;
  } catch (e) {
    console.error("Failed to fetch Query ID:", e);
    return null;
  }
}

/**
 * Fetches recent comments for a LinkedIn member profile
 * @param profileUrn - The profile URN ID (e.g., "ACoAAEjGgeABxDXPoubs3XfseZ_a62DYx20aoCo")
 * @returns Array of comments with author, content, postAuthor, isReply, etc.
 */
export async function fetchMemberComments(
  profileUrn: string,
): Promise<CommentData[]> {
  const auth = await storage.getItem<LinkedInAuth>("local:auth");

  if (!auth || !auth.cookie || !auth.csrfToken) {
    console.error("Missing Auth Headers. Please refresh page.");
    return [];
  }

  const queryId = await getCommentQueryId();
  if (!queryId) {
    console.error("Failed to get GraphQL queryId");
    return [];
  }

  const MAX_PAGES = 2;
  const PAGE_SIZE = 20;
  const allComments: CommentData[] = [];
  const seenUrns = new Set<string>();
  let start = 0;
  let paginationToken: string | null = null;
  let hasMore = true;
  let pageCount = 0;

  while (hasMore && pageCount < MAX_PAGES) {
    // Build variables - include paginationToken for subsequent requests
    let variables = `(count:${PAGE_SIZE},start:${start},profileUrn:urn%3Ali%3Afsd_profile%3A${profileUrn}`;
    if (paginationToken) {
      variables += `,paginationToken:${encodeURIComponent(paginationToken)}`;
    }
    variables += ")";

    const endpoint = `https://www.linkedin.com/voyager/api/graphql?variables=${variables}&queryId=${queryId}`;

    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "csrf-token": auth.csrfToken,
          cookie: auth.cookie,
          "x-restli-protocol-version": "2.0.0",
          accept: "application/vnd.linkedin.normalized+json+2.1",
          "x-li-lang": "en_US",
          "x-li-page-instance":
            auth.pageInstance || "urn:li:page:d_flagship3_profile_view_base;0",
          "x-li-track": auth.track || "{}",
        },
      });

      if (!response.ok) throw new Error(`Status ${response.status}`);

      const data = await response.json();
      const { comments: pageComments } = parseCommentsFromVoyagerResponse(data);

      if (pageComments.length === 0) {
        hasMore = false;
      } else {
        // Deduplicate by entityUrn before adding
        for (const comment of pageComments) {
          if (!seenUrns.has(comment.entityUrn)) {
            seenUrns.add(comment.entityUrn);
            allComments.push(comment);
          }
        }

        // Extract paginationToken for next request
        const nestedData = (data?.data as Record<string, unknown>)
          ?.data as Record<string, unknown>;
        const feedData =
          nestedData?.feedDashProfileUpdatesByMemberComments as Record<
            string,
            unknown
          >;
        const metadata = feedData?.metadata as Record<string, unknown>;
        const nextToken = metadata?.paginationToken as string | undefined;

        if (nextToken) {
          paginationToken = nextToken;
        } else {
          hasMore = false;
        }

        // Also check elements count
        const elements = feedData?.["*elements"] as unknown[] | undefined;
        if (elements && elements.length < PAGE_SIZE) {
          hasMore = false;
        }

        start += PAGE_SIZE;
        pageCount++;

        // Rate limiting delay between requests
        if (hasMore) await new Promise((r) => setTimeout(r, 300));
      }
    } catch (e) {
      console.error(`Error fetching comments page ${pageCount}:`, e);
      break;
    }
  }

  console.log(
    `Fetched ${allComments.length} comments across ${pageCount} pages`,
  );
  return allComments;
}
