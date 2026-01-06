/**
 * Utility for loading LinkedIn posts from the feed without AI generation.
 * This module handles the post collection pipeline that:
 * - Scrolls the feed to find posts
 * - Clicks comment buttons to load comments
 * - Extracts post data (caption, author, comments, etc.)
 *
 * Designed to be UI-agnostic for future hyperbrowser use.
 */

import type { PostAuthorInfo } from "../utils/post/extract-author-info-from-post";
import type { PostCommentInfo } from "../utils/post/extract-comment-from-post";
import type { PostTimeInfo } from "../utils/post/extract-post-time";
import type { PostUrlInfo } from "../utils/post/extract-post-url";
import { waitForCommentsReady } from "../utils";
import { clickCommentButton } from "../utils/comment/click-comment-button";
import { loadMore } from "../utils/feed/load-more";
import { extractAuthorInfoFromPost } from "../utils/post/extract-author-info-from-post";
import { extractCommentsFromPost } from "../utils/post/extract-comment-from-post";
import {
  extractPostCaption,
  getCaptionPreview,
} from "../utils/post/extract-post-caption";
import { extractPostTime } from "../utils/post/extract-post-time";
import { extractPostUrl } from "../utils/post/extract-post-url";

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
 * Get all activity URNs currently in the DOM
 */
function getAllActivityUrns(): Set<string> {
  const urns = new Set<string>();
  const posts = document.querySelectorAll<HTMLElement>("div[data-urn]");
  for (const post of posts) {
    const urn = post.getAttribute("data-urn");
    if (urn?.includes("activity")) {
      urns.add(urn);
    }
  }
  return urns;
}

/**
 * Find new posts in the DOM that haven't been processed yet.
 * Returns array of { urn, container } for posts that need processing.
 */
function findNewPosts(
  existingUrns: Set<string>,
  processedUrns: Set<string>,
  isUrnIgnored: (urn: string) => boolean,
): Array<{ urn: string; container: HTMLElement }> {
  const newPosts: Array<{ urn: string; container: HTMLElement }> = [];
  const posts = document.querySelectorAll<HTMLElement>("div[data-urn]");

  for (const container of posts) {
    const urn = container.getAttribute("data-urn");
    if (!urn || !urn.includes("activity")) continue;
    if (existingUrns.has(urn) || processedUrns.has(urn) || isUrnIgnored(urn))
      continue;

    // Check if post has a caption (valid post)
    const fullCaption = extractPostCaption(container);
    if (!fullCaption) continue;

    newPosts.push({ urn, container });
  }

  return newPosts;
}

/**
 * Extract full post data from a container
 */
function extractPostData(container: HTMLElement): ReadyPost | null {
  const urn = container.getAttribute("data-urn");
  if (!urn) return null;

  const fullCaption = extractPostCaption(container);
  if (!fullCaption) return null;

  return {
    urn,
    captionPreview: getCaptionPreview(fullCaption, 10),
    fullCaption,
    postContainer: container,
    authorInfo: extractAuthorInfoFromPost(container),
    postTime: extractPostTime(container),
    postUrls: extractPostUrl(container),
    comments: extractCommentsFromPost(container),
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
 * @returns Number of posts collected
 */
export async function collectPostsBatch(
  targetCount: number,
  existingUrns: Set<string>,
  isUrnIgnored: (urn: string) => boolean,
  onBatchReady: (posts: ReadyPost[]) => void,
  shouldStop: () => boolean,
  isUserEditing: () => boolean,
): Promise<number> {
  const processedUrns = new Set<string>();
  let emittedCount = 0;
  let idleIterations = 0;
  let lastUrnCount = getAllActivityUrns().size;

  /**
   * Wait while user is editing (focused on textarea).
   * Pauses collection until user clicks outside the edit box.
   */
  const waitWhileEditing = async (): Promise<void> => {
    while (isUserEditing()) {
      await new Promise((r) => setTimeout(r, 100));
    }
  };

  console.log(`[EngageKit] Starting batch collection - target: ${targetCount}`);

  while (emittedCount < targetCount && idleIterations < MAX_IDLE_ITERATIONS) {
    // Check if user requested stop
    if (shouldStop()) {
      console.log(`[EngageKit] Stop requested, exiting`);
      break;
    }

    // Find ALL new posts that haven't been processed
    const newPosts = findNewPosts(existingUrns, processedUrns, isUrnIgnored);

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
          beforeCount: extractCommentsFromPost(container).length,
        };
      });

      // Step 2: Click ALL comment buttons at once (no delays)
      for (const { container } of postContexts) {
        clickCommentButton(container);
      }

      // Step 3: Wait for ALL comments to load in parallel
      await Promise.all(
        postContexts.map(({ container, beforeCount }) =>
          waitForCommentsReady(container, beforeCount),
        ),
      );

      // Step 4: Collect ALL post data
      const readyPosts: ReadyPost[] = [];
      for (const { container } of postContexts) {
        if (shouldStop()) break;
        const postData = extractPostData(container);
        if (postData) {
          readyPosts.push(postData);
        }
      }

      // Step 5: Emit entire batch at once
      if (readyPosts.length > 0) {
        onBatchReady(readyPosts);
        emittedCount += readyPosts.length;
        console.log(
          `[EngageKit] Batch complete: ${emittedCount}/${targetCount} posts ready`,
        );
      }
    }

    // Track progress
    const currentUrnCount = getAllActivityUrns().size;
    const hasNewPosts =
      currentUrnCount > lastUrnCount || postsToProcess.length > 0;

    if (hasNewPosts) {
      lastUrnCount = currentUrnCount;
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
    await loadMore();
  }

  if (idleIterations >= MAX_IDLE_ITERATIONS) {
    console.log(
      `[EngageKit] Exited due to max idle iterations. Final count: ${emittedCount}`,
    );
  }

  return emittedCount;
}
