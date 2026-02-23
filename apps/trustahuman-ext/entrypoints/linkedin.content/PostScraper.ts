/**
 * Scrape post context from LinkedIn DOM when user submits a comment
 * Uses V2 DOM selectors (React SSR + SDUI) matching linkedin-automation package
 */

export interface LinkedInPostContext {
  postUrl: string;
  postUrn?: string;
  postAuthorName?: string;
  postAuthorProfileUrl?: string;
  postAuthorAvatarUrl?: string;
  postAuthorHeadline?: string;
  postTextSnippet?: string;
}

export interface CommentContext {
  commentText: string;
  post: LinkedInPostContext;
}

/**
 * Find the post container element from a submit button.
 * V2 DOM: div[role="listitem"] or div[data-view-name="feed-full-update"]
 * V1 DOM: .feed-shared-update-v2 or single post page container
 */
function findPostContainer(element: HTMLElement): HTMLElement | null {
  // V2: Find the listitem container (full post including comments)
  const listItem = element.closest('div[role="listitem"]');
  if (listItem instanceof HTMLElement) {
    return listItem;
  }

  // V2: Try finding feed-full-update and get its parent
  const feedUpdate = element.closest('div[data-view-name="feed-full-update"]');
  if (feedUpdate?.parentElement instanceof HTMLElement) {
    return feedUpdate.parentElement;
  }

  // V2: Try feed-detail-page for single post view
  const feedDetailPage = document.querySelector<HTMLElement>('div[data-view-name="feed-detail-page"]');
  if (feedDetailPage) {
    return feedDetailPage;
  }

  // V1: Try feed-shared-update-v2 (Ember.js single post pages)
  const feedSharedUpdate = element.closest('.feed-shared-update-v2');
  if (feedSharedUpdate instanceof HTMLElement) {
    return feedSharedUpdate;
  }

  // V1: Try the main content area for single post pages
  const mainContent = document.querySelector<HTMLElement>('.feed-shared-update-v2, .scaffold-finite-scroll__content');
  if (mainContent) {
    return mainContent;
  }

  // V1: For /posts/ pages, the whole document body area with the post
  const singlePostContainer = document.querySelector<HTMLElement>('[data-urn^="urn:li:activity:"]');
  if (singlePostContainer) {
    return singlePostContainer;
  }

  return null;
}

/**
 * Parse data-view-tracking-scope JSON and extract URN from buffer data.
 */
function parseTrackingScope(trackingScope: string): string | null {
  try {
    const parsed = JSON.parse(trackingScope);
    if (!Array.isArray(parsed)) return null;

    // Look for FeedUpdateServedEvent with updateUrn (for posts)
    for (const entry of parsed) {
      if (entry?.topicName !== "FeedUpdateServedEvent") continue;

      const bufferData = entry?.breadcrumb?.content?.data;
      if (!Array.isArray(bufferData)) continue;

      const jsonString = String.fromCharCode(...bufferData);

      // Look for updateUrn field specifically
      const updateUrnMatch = jsonString.match(
        /"updateUrn"\s*:\s*"(urn:li:activity:\d+)"/
      );
      if (updateUrnMatch?.[1]) {
        return updateUrnMatch[1];
      }
    }

    // Fallback: look for any activity URN pattern
    for (const entry of parsed) {
      const bufferData = entry?.breadcrumb?.content?.data;
      if (!Array.isArray(bufferData)) continue;

      const jsonString = String.fromCharCode(...bufferData);
      const activityMatch = jsonString.match(/urn:li:activity:\d+/);
      if (activityMatch) {
        return activityMatch[0];
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Walk up DOM tree to find element with data-view-tracking-scope and extract URN.
 */
function extractUrnFromTrackingScope(element: Element): string | null {
  let current: Element | null = element;

  while (current) {
    const trackingScope = current.getAttribute("data-view-tracking-scope");
    if (trackingScope) {
      const urn = parseTrackingScope(trackingScope);
      if (urn) return urn;
    }
    current = current.parentElement;
  }

  return null;
}

/**
 * Extract post URL and URN from container using tracking scope
 */
function extractPostUrlAndUrn(container: HTMLElement): { url: string; urn?: string } {
  const urn = extractUrnFromTrackingScope(container);

  if (urn && (urn.startsWith("urn:li:activity:") || urn.startsWith("urn:li:ugcPost:"))) {
    return {
      url: `https://www.linkedin.com/feed/update/${urn}`,
      urn,
    };
  }

  // Fallback: current page URL
  return { url: window.location.href };
}

/**
 * Clean author name by removing LinkedIn badges and connection degree text
 * Handles: "Name Verified Profile 3rd+Name" → "Name"
 *          "Name • 3rd+" → "Name"
 *          "Name Premium Profile" → "Name"
 */
function cleanAuthorName(rawName: string): string {
  let name = rawName.trim();

  // Remove everything after connection degree markers (• 3rd+, • 2nd, etc.)
  name = name.replace(/\s*[•·]\s*(3rd\+?|2nd|1st|Following).*$/i, "");

  // Remove "Verified Profile" and everything after (often duplicates the name)
  name = name.replace(/\s*Verified\s*Profile.*$/i, "");

  // Remove "Premium Profile" and similar badges
  name = name.replace(/\s*Premium\s*Profile.*$/i, "");

  // Remove trailing connection degree without bullet (e.g., "Name 3rd+")
  name = name.replace(/\s+(3rd\+?|2nd|1st)\s*$/i, "");

  return name.trim();
}

/**
 * Extract author info using V2 and V1 selectors
 */
function extractPostAuthor(container: HTMLElement): {
  name?: string;
  profileUrl?: string;
  avatarUrl?: string;
  headline?: string;
} {
  const result: {
    name?: string;
    profileUrl?: string;
    avatarUrl?: string;
    headline?: string;
  } = {};

  try {
    // V2: Find author anchor by data-view-name
    let photoAnchor = container.querySelector<HTMLAnchorElement>(
      'a[data-view-name="feed-actor-image"]'
    );

    // V1: Try Ember.js selectors for single post pages
    if (!photoAnchor) {
      photoAnchor = container.querySelector<HTMLAnchorElement>(
        '.feed-shared-actor__container-link, .update-components-actor__image a, .feed-shared-actor__avatar-image'
      );
    }

    // V1: Try actor meta container
    if (!photoAnchor) {
      const actorContainer = container.querySelector('.feed-shared-actor, .update-components-actor');
      if (actorContainer) {
        photoAnchor = actorContainer.querySelector('a');
      }
    }

    if (!photoAnchor) {
      console.log("TrustAHuman: Could not find author photo anchor");
      return result;
    }

    // Extract profile URL from anchor (clean query params)
    const href = photoAnchor.getAttribute("href");
    if (href) {
      if (href.startsWith("/in/")) {
        result.profileUrl = `https://www.linkedin.com${href.split("?")[0]}`;
      } else {
        result.profileUrl = href.split("?")[0];
      }
    }

    // Extract photo URL from img inside anchor (or nearby)
    let img = photoAnchor.querySelector("img");
    if (!img) {
      // V1: Try finding avatar image in actor container
      const actorContainer = container.querySelector('.feed-shared-actor, .update-components-actor');
      img = actorContainer?.querySelector('img.EntityPhoto-circle-3, img.feed-shared-actor__avatar-image, img.avatar');
    }
    if (img?.src) {
      result.avatarUrl = img.src;
    }

    // Find name/headline - V2 approach
    const siblingAnchor = photoAnchor.nextElementSibling;
    if (siblingAnchor?.tagName === "A" && siblingAnchor.querySelector("p")) {
      // First <p> is name - but we need to get just the text, not nested elements
      const nameP = siblingAnchor.querySelector("p");
      if (nameP) {
        // Get only direct text content, not from nested spans (which have badges like "Premium")
        let nameText = "";
        for (const node of nameP.childNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            nameText += node.textContent || "";
          }
        }
        // Clean name: remove connection degree suffix like " • 3rd+" and "Verified Profile" text
        result.name = cleanAuthorName(nameText);

        // Fallback to full text if no direct text found
        if (!result.name && nameP.textContent) {
          result.name = cleanAuthorName(nameP.textContent);
        }
      }

      // Second <p> is headline
      const paragraphs = siblingAnchor.querySelectorAll("p");
      if (paragraphs.length >= 2 && paragraphs[1]?.textContent) {
        result.headline = paragraphs[1].textContent.trim().slice(0, 200);
      }
    }

    // V1: Try Ember.js name selectors if V2 didn't work
    if (!result.name) {
      const nameEl = container.querySelector<HTMLElement>(
        '.feed-shared-actor__name, .update-components-actor__name, .feed-shared-actor__title'
      );
      if (nameEl?.textContent) {
        result.name = cleanAuthorName(nameEl.textContent);
      }
    }

    // V1: Try headline selector
    if (!result.headline) {
      const headlineEl = container.querySelector<HTMLElement>(
        '.feed-shared-actor__description, .update-components-actor__description, .feed-shared-actor__sub-description'
      );
      if (headlineEl?.textContent) {
        result.headline = headlineEl.textContent.trim().slice(0, 200);
      }
    }
  } catch (error) {
    console.error("TrustAHuman: Failed to extract author info", error);
  }

  return result;
}

/**
 * Extract post caption text using V2 and V1 selectors
 */
function extractPostText(container: HTMLElement): string | undefined {
  try {
    // V2: Find caption by data-view-name (primary selector)
    let captionElement = container.querySelector<HTMLElement>(
      '[data-view-name="feed-commentary"]'
    );

    // V2: Try feed-full-update which contains the post content
    if (!captionElement) {
      const feedUpdate = container.querySelector<HTMLElement>(
        'div[data-view-name="feed-full-update"]'
      );
      if (feedUpdate) {
        captionElement = feedUpdate.querySelector<HTMLElement>(
          '[data-view-name="feed-commentary"]'
        );
      }
    }

    // V1: Ember.js selectors for single post pages
    if (!captionElement) {
      captionElement = container.querySelector<HTMLElement>(
        '.feed-shared-update-v2__description, .feed-shared-text, .feed-shared-update-v2__commentary, .update-components-text'
      );
    }

    // V1: Try the text span with dir attribute
    if (!captionElement) {
      captionElement = container.querySelector<HTMLElement>(
        '.feed-shared-text span[dir="ltr"], .break-words span[dir="ltr"]'
      );
    }

    if (!captionElement) {
      console.log("TrustAHuman: Could not find caption element in container");
      return undefined;
    }

    const text = captionElement.textContent?.trim() || "";
    if (!text) {
      console.log("TrustAHuman: Caption element found but empty");
      return undefined;
    }

    console.log("TrustAHuman: Extracted post text:", text.slice(0, 100));
    // Return first 500 chars as snippet
    return text.length > 500 ? text.slice(0, 497) + "..." : text;
  } catch (error) {
    console.error("TrustAHuman: Failed to extract post text", error);
    return undefined;
  }
}

/**
 * Extract comment text from the active comment box
 * V2: Uses TipTap/ProseMirror editor
 * V1: Uses Quill editor (.ql-editor)
 */
function extractCommentText(container: HTMLElement): string {
  const selectors = [
    // V2: TipTap editor inside comment-box
    'div[data-view-name="comment-box"] div[contenteditable="true"]',
    'div.tiptap.ProseMirror[contenteditable="true"]',
    'div[aria-label="Text editor for creating comment"] div[contenteditable="true"]',
    // V1: Quill editor (Ember.js single post pages)
    '.ql-editor[contenteditable="true"]',
    '.comments-comment-texteditor .ql-editor',
    '.comments-comment-box__form .ql-editor',
    // Fallback selectors
    '[contenteditable="true"]',
  ];

  for (const selector of selectors) {
    const el = container.querySelector(selector);
    if (el?.textContent) {
      return el.textContent.trim();
    }
  }

  // V1: Try finding Quill editor in the whole document (for reply boxes)
  const quillEditor = document.querySelector('.comments-comment-box--cr .ql-editor[contenteditable="true"]');
  if (quillEditor?.textContent) {
    return quillEditor.textContent.trim();
  }

  // Fallback: try to find any active/focused contenteditable
  const activeEl = document.activeElement;
  if (activeEl?.getAttribute("contenteditable") === "true" && activeEl.textContent) {
    return activeEl.textContent.trim();
  }

  return "";
}

/**
 * Scrape full context when user submits a comment
 * Call this from the submit button click handler
 */
export function scrapeCommentContext(submitButton: HTMLElement): CommentContext | null {
  const postContainer = findPostContainer(submitButton);

  if (!postContainer) {
    console.log("TrustAHuman: Could not find post container");
    return null;
  }

  const commentText = extractCommentText(postContainer);
  if (!commentText) {
    console.log("TrustAHuman: Could not extract comment text");
    return null;
  }

  const { url: postUrl, urn: postUrn } = extractPostUrlAndUrn(postContainer);
  const author = extractPostAuthor(postContainer);
  const postTextSnippet = extractPostText(postContainer);

  const context: CommentContext = {
    commentText,
    post: {
      postUrl,
      postUrn,
      postAuthorName: author.name,
      postAuthorProfileUrl: author.profileUrl,
      postAuthorAvatarUrl: author.avatarUrl,
      postAuthorHeadline: author.headline,
      postTextSnippet,
    },
  };

  console.log("TrustAHuman: Scraped comment context", context);
  return context;
}

/**
 * Store reference to the last clicked submit button for context scraping
 */
let lastSubmitButton: HTMLElement | null = null;

export function setLastSubmitButton(btn: HTMLElement): void {
  lastSubmitButton = btn;
}

export function getLastSubmitButton(): HTMLElement | null {
  return lastSubmitButton;
}

// ========== Comment URL Extraction (from linkedin-automation) ==========

export interface CommentUrlInfo {
  /** Full comment URN from DOM, e.g., "urn:li:comment:(urn:li:activity:123,456)" */
  urn: string;
  /** Full LinkedIn URL to the comment */
  url: string;
}

/**
 * Parse a comment URN and build the LinkedIn URL (V2 format)
 * Format: urn:li:comment:(urn:li:ugcPost:123,456) or urn:li:comment:(urn:li:activity:123,456)
 */
function buildUrlFromUrn(urn: string): string | null {
  const match = urn.match(
    /^urn:li:comment:\((urn:li:(ugcPost|activity):(\d+)),(\d+)\)$/
  );
  if (!match || !match[1] || !match[4]) {
    return null;
  }

  const fullPostUrn = match[1];
  const commentId = match[4];

  // Format: urn:li:fsd_comment:(commentId,postUrn)
  const dashCommentUrn = `urn:li:fsd_comment:(${commentId},${fullPostUrn})`;

  // Encode with explicit parentheses encoding
  const encoded = encodeURIComponent(dashCommentUrn)
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");

  return `https://www.linkedin.com/feed/update/${fullPostUrn}/?dashCommentUrn=${encoded}`;
}

/**
 * Parse a comment URN and build the LinkedIn URL (V1 format - Ember.js)
 * Format: urn:li:comment:(activity:123,456)
 */
function buildUrlFromUrnV1(urn: string): string | null {
  // V1 format: urn:li:comment:(activity:7431533238709510144,7431565896994791424)
  const match = urn.match(
    /^urn:li:comment:\((activity:(\d+)),(\d+)\)$/
  );
  if (!match || !match[1] || !match[3]) {
    return null;
  }

  const activityId = match[2];
  const commentId = match[3];
  const fullPostUrn = `urn:li:activity:${activityId}`;

  // Format: urn:li:fsd_comment:(commentId,urn:li:activity:activityId)
  const dashCommentUrn = `urn:li:fsd_comment:(${commentId},${fullPostUrn})`;

  // Encode with explicit parentheses encoding
  const encoded = encodeURIComponent(dashCommentUrn)
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");

  return `https://www.linkedin.com/feed/update/${fullPostUrn}/?dashCommentUrn=${encoded}`;
}

/**
 * Extract all comment URLs from a post container (or document for V1)
 */
export function getCommentUrls(postContainer: HTMLElement): Map<string, CommentUrlInfo> {
  const results = new Map<string, CommentUrlInfo>();

  // V2: componentkey="replaceableComment_urn:li:comment:(postUrn,commentId)"
  const commentElementsV2 = postContainer.querySelectorAll(
    '[componentkey^="replaceableComment_urn:li:comment:"]'
  );

  for (const el of commentElementsV2) {
    const key = el.getAttribute("componentkey");
    if (!key) continue;

    // Extract URN from componentkey
    const urnMatch = key.match(
      /^replaceableComment_(urn:li:comment:\([^)]+\))$/
    );
    if (!urnMatch || !urnMatch[1]) continue;

    const urn = urnMatch[1];

    // Skip duplicates
    if (results.has(urn)) continue;

    const url = buildUrlFromUrn(urn);
    if (!url) continue;

    results.set(urn, { urn, url });
  }

  // V1: article.comments-comment-entity[data-id="urn:li:comment:(activity:xxx,yyy)"]
  // On V1 pages, comments may be in a separate container, so also search document
  const searchRoots = [postContainer];

  // For V1, also search the comments list container if it exists
  const commentsListV1 = document.querySelector('.comments-comments-list');
  if (commentsListV1 && commentsListV1 !== postContainer && !postContainer.contains(commentsListV1)) {
    searchRoots.push(commentsListV1 as HTMLElement);
  }

  for (const root of searchRoots) {
    const commentElementsV1 = root.querySelectorAll(
      'article.comments-comment-entity[data-id^="urn:li:comment:"]'
    );

    for (const el of commentElementsV1) {
      const dataId = el.getAttribute("data-id");
      if (!dataId) continue;

      // V1 format: urn:li:comment:(activity:123,456)
      const urn = dataId;

      // Skip duplicates
      if (results.has(urn)) continue;

      const url = buildUrlFromUrnV1(urn);
      if (!url) continue;

      results.set(urn, { urn, url });
    }
  }

  return results;
}

/**
 * Find a new comment URL by comparing before/after states
 */
export function findNewCommentUrl(
  beforeUrls: Map<string, CommentUrlInfo>,
  afterUrls: Map<string, CommentUrlInfo>
): CommentUrlInfo | null {
  for (const [urn, info] of afterUrls) {
    if (!beforeUrls.has(urn)) {
      return info;
    }
  }
  return null;
}

/**
 * Get the count of comments in a post container (or document for V1)
 */
function getCommentCount(postContainer: HTMLElement): number {
  // V2: data-view-name selectors
  const commentPicturesV2 = postContainer.querySelectorAll(
    'a[data-view-name="comment-actor-picture"]'
  );
  const replyPicturesV2 = postContainer.querySelectorAll(
    'a[data-view-name="reply-actor-picture"]'
  );
  const v2Count = commentPicturesV2.length + replyPicturesV2.length;

  // V1: article.comments-comment-entity selectors
  // On V1 pages, comments may be in a separate container
  let v1Count = postContainer.querySelectorAll('article.comments-comment-entity').length;

  // Also check the comments list container for V1
  const commentsListV1 = document.querySelector('.comments-comments-list');
  if (commentsListV1 && commentsListV1 !== postContainer && !postContainer.contains(commentsListV1)) {
    v1Count = commentsListV1.querySelectorAll('article.comments-comment-entity').length;
  }

  // Return max of both approaches
  return Math.max(v2Count, v1Count);
}

/**
 * Wait for a new comment to appear and extract its URL
 * Call this AFTER the submit button is clicked
 */
export async function waitForNewCommentUrl(
  submitButton: HTMLElement,
  commentUrlsBefore: Map<string, CommentUrlInfo>,
  timeout = 5000
): Promise<CommentUrlInfo | null> {
  const postContainer = findPostContainer(submitButton);
  if (!postContainer) {
    console.log("TrustAHuman: Could not find post container for comment URL extraction");
    return null;
  }

  const countBefore = getCommentCount(postContainer);
  const startTime = Date.now();

  // Poll until new comment appears or timeout
  while (Date.now() - startTime < timeout) {
    const currentCount = getCommentCount(postContainer);
    if (currentCount > countBefore) {
      // New comment appeared, extract its URL
      const commentUrlsAfter = getCommentUrls(postContainer);
      const newComment = findNewCommentUrl(commentUrlsBefore, commentUrlsAfter);

      if (newComment) {
        console.log("TrustAHuman: Extracted new comment URL:", newComment.url);
        return newComment;
      }
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log("TrustAHuman: Timeout waiting for new comment URL");
  return null;
}

/**
 * Capture comment URLs before submission
 * Call this BEFORE the submit button click
 */
export function captureCommentUrlsBefore(submitButton: HTMLElement): Map<string, CommentUrlInfo> {
  const postContainer = findPostContainer(submitButton);
  if (!postContainer) {
    return new Map();
  }
  return getCommentUrls(postContainer);
}
