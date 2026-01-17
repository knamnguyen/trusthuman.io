import { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";
import { navigateToPostAndSubmitComment } from "@sassy/linkedin-automation/comment/navigate-and-comment";
import { collectPostsBatch } from "@sassy/linkedin-automation/feed/collect-posts";
import { createFeedUtilities } from "@sassy/linkedin-automation/feed/create-feed-utilities";
import { navigateLinkedIn } from "@sassy/linkedin-automation/navigate/navigate-linkedin";
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";

function createEngagekitInternals() {
  const feedUtils = createFeedUtilities();
  const commentUtils = createCommentUtilities();
  const postUtils = createPostUtilities();

  return {
    retry,
    collectPostsBatch,
    navigate: navigateLinkedIn,
    feedUtils,
    commentUtils,
    postUtils,
    navigateToPostAndSubmitComment: navigateToPostAndSubmitComment.bind(
      null,
      postUtils,
      commentUtils,
    ),
  };
}

export type EngagekitInternals = ReturnType<typeof createEngagekitInternals>;

function inject() {
  if (typeof window === "undefined") {
    // just return if this file was somehow imported in a non-browser context
    console.error("EngageKit: window is undefined, cannot inject internals");
    return;
  }

  window.engagekitInternals = createEngagekitInternals();
}

inject();

declare const window: Window & {
  engagekitInternals: EngagekitInternals;
};

async function retry<TOutput>(
  fn: () => TOutput,
  opts?: {
    timeout?: number;
    interval?: number;
    retryOn?: (output: TOutput) => boolean;
  },
) {
  const { timeout = 10000, interval = 200 } = opts ?? {};
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const result = await Promise.resolve(fn());

      return {
        ok: true as const,
        data: result,
      };
    } catch {
      await new Promise((resolve) => setTimeout(resolve, interval));
      // ignore
    }
  }

  return {
    ok: false as const,
    error: new Error("timeout"),
  };
}
