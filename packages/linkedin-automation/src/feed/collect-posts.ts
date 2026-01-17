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
  ConnectionDegree,
  PostAuthorInfo,
  PostCommentInfo,
  PostTimeInfo,
  PostUrlInfo,
} from "../post/types";
import { createCommentUtilities } from "../comment/create-comment-utilities";
import { createFeedUtilities } from "./create-feed-utilities";
import { createPostUtilities } from "../post/create-post-utilities";
import { parseTimeToHours } from "../post/utils-shared/parse-time-to-hours";

/**
 * Configuration for filtering posts during collection.
 * Passed to collectPostsBatch to filter posts before processing.
 */
export interface PostFilterConfig {
  /** Enable filtering posts by age */
  timeFilterEnabled: boolean;
  /** Maximum post age in hours (posts older than this are skipped) */
  minPostAge: number | null;

  /** Skip sponsored/promoted posts */
  skipPromotedPosts: boolean;
  /** Skip posts from company/showcase pages */
  skipCompanyPages: boolean;
  /** Skip posts that are "X liked this" or "X commented on this" */
  skipFriendActivities: boolean;

  /** Skip posts from 1st degree connections */
  skipFirstDegree: boolean;
  /** Skip posts from 2nd degree connections */
  skipSecondDegree: boolean;
  /** Skip posts from 3rd+ degree connections */
  skipThirdDegree: boolean;
  /** Skip posts from people you follow (not connected) */
  skipFollowing: boolean;
}

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
 * Check if a post should be skipped based on connection degree filters.
 */
function shouldSkipByConnectionDegree(
  degree: ConnectionDegree,
  filterConfig: PostFilterConfig
): boolean {
  if (degree === "1st" && filterConfig.skipFirstDegree) return true;
  if (degree === "2nd" && filterConfig.skipSecondDegree) return true;
  if (degree === "3rd" && filterConfig.skipThirdDegree) return true;
  if (degree === "following" && filterConfig.skipFollowing) return true;
  return false;
}

/**
 * Find new posts in the DOM that haven't been processed yet.
 * Applies filter config to skip posts based on user settings.
 * Returns array of { urn, container } for posts that need processing.
 */
function findNewPosts(
  existingUrns: Set<string>,
  processedUrns: Set<string>,
  isUrnIgnored: (urn: string) => boolean,
  filterConfig: PostFilterConfig,
  isAuthorBlacklisted?: (authorProfileUrl: string | null | undefined) => boolean
): Array<{ urn: string; container: HTMLElement }> {
  const newPosts: Array<{ urn: string; container: HTMLElement }> = [];
  const postUtils = getPostUtils();
  const selector = postUtils.getPostContainerSelector();
  const posts = document.querySelectorAll<HTMLElement>(selector);

  // Track URNs seen in THIS iteration to prevent duplicates from V1 DOM
  // (V1 has both data-urn and data-id elements for the same post)
  const seenInThisIteration = new Set<string>();

  for (const container of posts) {
    const urn = extractUrn(container);
    if (!urn) continue;

    // Skip comment URNs - they look like "urn:li:comment:(activity:xxx,yyy)"
    // We only want post URNs like "urn:li:activity:xxx"
    if (urn.includes(":comment:")) continue;

    if (
      seenInThisIteration.has(urn) ||
      existingUrns.has(urn) ||
      processedUrns.has(urn) ||
      isUrnIgnored(urn)
    ) {
      continue;
    }
    seenInThisIteration.add(urn);

    // Check if post has a caption (valid post)
    const fullCaption = postUtils.extractPostCaption(container);
    if (!fullCaption) continue;

    // === Apply Filters ===

    // 1. Skip promoted/sponsored posts
    if (filterConfig.skipPromotedPosts && postUtils.detectPromotedPost(container)) {
      continue;
    }

    // 2. Skip company page posts
    if (filterConfig.skipCompanyPages && postUtils.detectCompanyPost(container)) {
      continue;
    }

    // 3. Skip friend activity posts ("X liked this", "X commented on this")
    if (filterConfig.skipFriendActivities && postUtils.detectFriendActivity(container)) {
      continue;
    }

    // 4. Skip by connection degree
    const hasConnectionFilter =
      filterConfig.skipFirstDegree ||
      filterConfig.skipSecondDegree ||
      filterConfig.skipThirdDegree ||
      filterConfig.skipFollowing;

    if (hasConnectionFilter) {
      const degree = postUtils.detectConnectionDegree(container);
      if (shouldSkipByConnectionDegree(degree, filterConfig)) {
        continue;
      }
    }

    // 5. Time filter - skip posts older than max age
    if (filterConfig.timeFilterEnabled && filterConfig.minPostAge !== null) {
      const postTime = postUtils.extractPostTime(container);
      if (postTime?.displayTime) {
        const postAgeHours = parseTimeToHours(postTime.displayTime);
        console.log(`[EngageKit] Time filter: "${postTime.displayTime}" = ${postAgeHours}h, max: ${filterConfig.minPostAge}h, skip: ${postAgeHours !== null && postAgeHours > filterConfig.minPostAge}`);
        if (postAgeHours !== null && postAgeHours > filterConfig.minPostAge) {
          continue; // Post is older than max allowed age
        }
      }
    } else if (filterConfig.timeFilterEnabled) {
      console.log(`[EngageKit] Time filter enabled but minPostAge is null`);
    }

    // 6. Blacklist filter - skip posts from blacklisted authors
    if (isAuthorBlacklisted) {
      const authorInfo = postUtils.extractPostAuthorInfo(container);
      if (isAuthorBlacklisted(authorInfo?.profileUrl)) {
        console.log(
          `[EngageKit] ⛔ Skipping blacklisted author: ${authorInfo?.name ?? "Unknown"} (${authorInfo?.profileUrl})`
        );
        continue;
      }
    }

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
 * @param filterConfig - Configuration for filtering posts (promoted, company, connection degree, etc.)
 * @param isAuthorBlacklisted - Optional function to check if a post author should be skipped (blacklist)
 * @returns Number of posts collected
 */
export async function collectPostsBatch(
  targetCount: number,
  existingUrns: Set<string>,
  isUrnIgnored: (urn: string) => boolean,
  onBatchReady: (posts: ReadyPost[]) => void,
  shouldStop: () => boolean,
  isUserEditing: () => boolean,
  filterConfig: PostFilterConfig,
  isAuthorBlacklisted?: (authorProfileUrl: string | null | undefined) => boolean
): Promise<number> {
  const postUtils = getPostUtils();
  const commentUtils = getCommentUtils();
  const feedUtils = getFeedUtils();

  const processedUrns = new Set<string>();
  let emittedCount = 0;
  let idleIterations = 0;
  let lastPostCount = feedUtils.countPosts();

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
  console.log(`[EngageKit] Filter config:`, {
    timeFilterEnabled: filterConfig.timeFilterEnabled,
    minPostAge: filterConfig.minPostAge,
    skipPromotedPosts: filterConfig.skipPromotedPosts,
    skipCompanyPages: filterConfig.skipCompanyPages,
  });

  while (emittedCount < targetCount && idleIterations < MAX_IDLE_ITERATIONS) {
    // Check if user requested stop
    if (shouldStop()) {
      console.log(`[EngageKit] Stop requested, exiting`);
      break;
    }

    // Find ALL new posts that haven't been processed (with filters applied)
    const newPosts = findNewPosts(existingUrns, processedUrns, isUrnIgnored, filterConfig, isAuthorBlacklisted);

    // Limit to remaining needed
    const postsToProcess = newPosts.slice(0, targetCount - emittedCount);

    if (postsToProcess.length > 0) {
      console.log(
        `[EngageKit] Processing batch of ${postsToProcess.length} posts`
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
          commentUtils.waitForCommentsReady(container, beforeCount)
        )
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
          `[EngageKit] Batch complete: ${emittedCount}/${targetCount} posts ready`
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
      `[EngageKit] Exited due to max idle iterations. Final count: ${emittedCount}`
    );
  }

  return emittedCount;
}
