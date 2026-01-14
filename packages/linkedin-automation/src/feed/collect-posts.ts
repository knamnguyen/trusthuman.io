/**
 * Utility for loading LinkedIn posts from the feed without AI generation.
 * This module handles the post collection pipeline that:
 * - Scrolls the feed to find posts
 * - Clicks comment buttons to load comments
 * - Extracts post data (caption, author, comments, etc.)
 *
 * Designed to be UI-agnostic for use with both browser extension and Puppeteer.
 * Uses factory pattern to support both DOM v1 and v2.
 */

import type {
  PostAuthorInfo,
  PostCommentInfo,
  PostTimeInfo,
  PostUrlInfo,
} from "../post/types";
import { createCommentUtilities } from "../comment/create-comment-utilities";
import { createPostUtilities } from "../post/create-post-utilities";
import { createFeedUtilities } from "./create-feed-utilities";

// Lazy-initialized utilities (created on first use when DOM is ready)
let _postUtils: ReturnType<typeof createPostUtilities> | null = null;
let _commentUtils: ReturnType<typeof createCommentUtilities> | null = null;
let _feedUtils: ReturnType<typeof createFeedUtilities> | null = null;

function getPostUtils() {
  if (!_postUtils) _postUtils = createPostUtilities();
  return _postUtils;
}

function getCommentUtils() {
  if (!_commentUtils) _commentUtils = createCommentUtilities();
  return _commentUtils;
}

function getFeedUtils() {
  if (!_feedUtils) _feedUtils = createFeedUtilities();
  return _feedUtils;
}

// Helper function for caption preview
function getCaptionPreview(fullCaption: string, wordLimit: number): string {
  const words = fullCaption.split(/\s+/);
  if (words.length <= wordLimit) return fullCaption;
  return words.slice(0, wordLimit).join(" ") + "...";
}

/**
 * Data structure for a post that has been collected and is ready for use.
 * Contains all extracted information about the post.
 */
export interface ReadyPost {
  urn: string;
  captionPreview: string;
  fullCaption: string;
  postContainer: HTMLElement;
  authorInfo: PostAuthorInfo | null;
  postTime: PostTimeInfo | null;
  postUrls: PostUrlInfo[];
  comments: PostCommentInfo[];
}

/** Max consecutive iterations with no progress before giving up */
const MAX_IDLE_ITERATIONS = 10;

/**
 * Extract URN from a post container (v1 and v2 compatible).
 * Uses postUtils.extractPostUrl() which handles both versions.
 */
function extractUrn(container: HTMLElement): string | null {
  const postUrls = getPostUtils().extractPostUrl(container);
  if (postUrls.length > 0 && postUrls[0]) {
    return postUrls[0].urn;
  }
  return null;
}

/**
 * Find new posts in the DOM that haven't been processed yet.
 * Returns array of { urn, container } for posts that need processing.
 */
function findNewPosts(opts: {
  existingUrns?: Set<string>;
  processedUrns?: Set<string>;
  isUrnIgnored?: (urn: string) => boolean;
}): Array<{ urn: string; container: HTMLElement }> {
  const { existingUrns, processedUrns, isUrnIgnored } = opts ?? {};
  const newPosts: Array<{ urn: string; container: HTMLElement }> = [];
  const selector = getPostUtils().getPostContainerSelector();
  const posts = document.querySelectorAll<HTMLElement>(selector);

  for (const container of posts) {
    const urn = extractUrn(container);
    if (!urn) continue;
    if (
      existingUrns?.has(urn) ||
      processedUrns?.has(urn) ||
      isUrnIgnored?.(urn)
    )
      continue;

    // Check if post has a caption (valid post)
    const fullCaption = getPostUtils().extractPostCaption(container);
    if (!fullCaption) continue;

    newPosts.push({ urn, container });
  }

  return newPosts;
}

/**
 * Extract full post data from a container
 */
function extractPostData(container: HTMLElement): ReadyPost | null {
  const urn = extractUrn(container);
  if (!urn) return null;

  const postUtils = getPostUtils();
  const fullCaption = postUtils.extractPostCaption(container);
  if (!fullCaption) return null;

  return {
    urn,
    captionPreview: getCaptionPreview(fullCaption, 10),
    fullCaption,
    postContainer: container,
    authorInfo: postUtils.extractPostAuthorInfo(container),
    postTime: postUtils.extractPostTime(container),
    postUrls: postUtils.extractPostUrl(container),
    comments: postUtils.extractPostComments(container),
  };
}

/**
 * Batch post collection pipeline:
 * - Finds ALL new posts in the DOM
 * - Waits for user to stop typing (once per batch)
 * - Clicks ALL comment buttons at once
 * - Waits for ALL comments to load in parallel
 * - Collects ALL data and emits as a batch
 * - Scrolls for more posts until target reached or stopped
 *
 * @param targetCount - Number of posts to collect
 * @param existingUrns - URNs of posts already in the store (to skip)
 * @param isUrnIgnored - Function to check if a URN should be ignored
 * @param onBatchReady - Callback fired when a batch of posts is ready
 * @param shouldStop - Function that returns true when collection should stop
 * @param isUserEditing - Function that returns true when user is editing (pauses collection)
 * @returns ReadyPost[] - All collected posts
 */
export async function collectPosts({
  targetCount,
  existingUrns,
  isUrnIgnored,
  onBatchReady,
  shouldStop,
  isUserEditing,
}: {
  targetCount: number;
  existingUrns?: Set<string>;
  isUrnIgnored?: (urn: string) => boolean;
  onBatchReady?: (posts: ReadyPost[]) => void;
  shouldStop?: () => boolean;
  isUserEditing?: () => boolean;
}): Promise<ReadyPost[]> {
  const postUtils = getPostUtils();
  const commentUtils = getCommentUtils();
  const feedUtils = getFeedUtils();

  const allPosts: ReadyPost[] = [];

  const processedUrns = new Set<string>();
  let emittedCount = 0;
  let idleIterations = 0;
  let lastPostCount = feedUtils.countPosts();

  /**
   * Wait while user is editing (focused on textarea).
   * Pauses collection until user clicks outside the edit box.
   */
  const waitWhileEditing = async (): Promise<void> => {
    while (isUserEditing?.()) {
      await new Promise((r) => setTimeout(r, 100));
    }
  };

  console.log(`[EngageKit] Starting batch collection - target: ${targetCount}`);

  while (emittedCount < targetCount && idleIterations < MAX_IDLE_ITERATIONS) {
    // Check if user requested stop
    if (shouldStop?.()) {
      console.log(`[EngageKit] Stop requested, exiting`);
      break;
    }

    // Find ALL new posts that haven't been processed
    const newPosts = findNewPosts({
      existingUrns,
      processedUrns,
      isUrnIgnored,
    });

    // Limit to remaining needed
    const postsToProcess = newPosts.slice(0, targetCount - emittedCount);

    if (postsToProcess.length > 0) {
      console.log(
        `[EngageKit] Processing batch of ${postsToProcess.length} posts`,
      );

      // Wait if user is editing - only once per batch before clicking
      await waitWhileEditing();

      // Step 1: Get before counts and mark as processed
      const postContexts = postsToProcess.map(({ urn, container }) => {
        processedUrns.add(urn);
        return {
          urn,
          container,
          beforeCount: postUtils.extractPostComments(container).length,
        };
      });

      // Step 2: Click ALL comment buttons at once (no delays)
      for (const { container } of postContexts) {
        commentUtils.clickCommentButton(container);
      }

      // Step 3: Wait for ALL comments to load in parallel
      await Promise.all(
        postContexts.map(({ container, beforeCount }) =>
          commentUtils.waitForCommentsReady(container, beforeCount),
        ),
      );

      // Step 4: Collect ALL post data
      const readyPosts: ReadyPost[] = [];
      for (const { container } of postContexts) {
        if (shouldStop?.()) break;
        const postData = extractPostData(container);
        if (postData) {
          readyPosts.push(postData);
        }
      }

      // Step 5: Emit entire batch at once
      if (readyPosts.length > 0) {
        onBatchReady?.(readyPosts);
        emittedCount += readyPosts.length;
        allPosts.push(...readyPosts);
        console.log(
          `[EngageKit] Batch complete: ${emittedCount}/${targetCount} posts ready`,
        );
      }
    }

    // Track progress
    const currentPostCount = feedUtils.countPosts();
    const hasNewPosts =
      currentPostCount > lastPostCount || postsToProcess.length > 0;

    if (hasNewPosts) {
      lastPostCount = currentPostCount;
      idleIterations = 0;
    } else {
      idleIterations++;
    }

    // Check if we have enough
    if (emittedCount >= targetCount) {
      console.log(`[EngageKit] Target reached!`);
      break;
    }

    // Wait for user to finish editing before scrolling
    await waitWhileEditing();

    // Scroll to load more posts
    await feedUtils.loadMore();
  }

  if (idleIterations >= MAX_IDLE_ITERATIONS) {
    console.log(
      `[EngageKit] Exited due to max idle iterations. Final count: ${emittedCount}`,
    );
  }

  return allPosts;
}
