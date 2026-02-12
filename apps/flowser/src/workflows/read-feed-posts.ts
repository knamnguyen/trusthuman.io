import { getPage } from "../browser";

export interface FeedPost {
  urn: string;
  url: string;
  captionPreview: string;
  fullCaption: string;
  authorName: string | null;
  authorHeadline: string | null;
  authorProfileUrl: string | null;
  postTime: string | null;
  comments: Array<{
    authorName: string | null;
    content: string | null;
  }>;
}

/**
 * Scroll the LinkedIn feed and collect post data.
 * Returns serialized post data (no HTMLElement refs).
 */
export async function readFeedPosts(count: number): Promise<FeedPost[]> {
  const page = getPage();

  // Navigate to feed if not already there
  if (!page.url().includes("linkedin.com/feed")) {
    await page.goto("https://www.linkedin.com/feed/", {
      waitUntil: "domcontentloaded",
    });
  }

  const posts = await page.evaluate(async (targetCount: number) => {
    const internals = (globalThis as any).engagekitInternals;
    if (!internals) throw new Error("engagekitInternals not found on window");

    const result = await internals.collectPostsBatch(
      targetCount,
      new Set<string>(), // existingUrns
      () => false, // isUrnIgnored
      () => {}, // onBatchReady (no-op, we use the return value)
      () => false, // shouldStop
      () => false, // isUserEditing
      {
        // filterConfig — permissive defaults for MCP
        timeFilterEnabled: false,
        minPostAge: null,
        skipPromotedPosts: true,
        skipCompanyPages: false,
        skipFriendActivities: false,
        skipFirstDegree: false,
        skipSecondDegree: false,
        skipThirdDegree: false,
        skipFollowing: false,
        skipCommentsLoading: false,
      },
    );

    // Serialize to plain objects (strip HTMLElement refs)
    return result.map((post: any) => ({
      urn: post.urn,
      url: post.url,
      captionPreview: post.captionPreview,
      fullCaption: post.fullCaption,
      authorName: post.authorInfo?.name ?? null,
      authorHeadline: post.authorInfo?.headline ?? null,
      authorProfileUrl: post.authorInfo?.profileUrl ?? null,
      postTime: post.postTime?.displayTime ?? null,
      comments: (post.comments ?? []).map((c: any) => ({
        authorName: c.authorName ?? null,
        content: c.content ?? null,
      })),
    }));
  }, count);

  return posts;
}
