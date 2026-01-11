interface AuthorInfo {
  urn: string | null;
  name: string | null;
  profileUrl: string | null;
  avatarUrl: string | null;
  headline: string | null;
}

interface Post {
  urn: string;
  contentHtml: string;
  captionPreview: string;
  fullCaption: string;
  createdAt: string;
  author: AuthorInfo | null;
  comments: PostComment[];
}

interface PostComment {
  /** Comment author name */
  authorName: string | null;
  /** Comment author headline */
  authorHeadline: string | null;
  /** Comment author profile URL */
  authorProfileUrl: string | null;
  /** Comment author photo URL */
  authorPhotoUrl: string | null;
  /** Comment text content */
  content: string | null;
  /** Comment URN from data-id */
  urn: string | null;
  /** Whether this is a reply to another comment */
  isReply: boolean;
}

if (typeof window === "undefined") {
  console.error("EngageKit: window is undefined, cannot inject internals");
}

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

function extractTextWithLineBreaks(element: HTMLElement) {
  const lines: string[] = [];
  let currentLine = "";

  function processNode(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      // Add text content, normalizing internal whitespace but not trimming
      const text = node.textContent?.replace(/[ \t]+/g, " ") ?? "";
      currentLine += text;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      // Handle line break elements
      if (tagName === "br") {
        lines.push(currentLine.trim());
        currentLine = "";
        return;
      }

      // Block elements create natural breaks
      const isBlock = [
        "div",
        "p",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
      ].includes(tagName);

      if (isBlock && currentLine.trim()) {
        lines.push(currentLine.trim());
        currentLine = "";
      }

      // Process children
      for (const child of el.childNodes) {
        processNode(child);
      }

      if (isBlock && currentLine.trim()) {
        lines.push(currentLine.trim());
        currentLine = "";
      }
    }
  }

  processNode(element);

  // Don't forget the last line
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  // Join with newlines and collapse multiple empty lines
  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractPostCaption(postContainer: HTMLElement) {
  try {
    // XPath: div with dir="ltr" that contains span > span[@dir="ltr"]
    const result = document.evaluate(
      './/div[@dir="ltr" and .//span//span[@dir="ltr"]]',
      postContainer,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    );

    const captionDiv = result.singleNodeValue as HTMLElement | null;
    if (!captionDiv) {
      return null;
    }

    // Extract text preserving line breaks from <br> tags and block elements
    return extractTextWithLineBreaks(captionDiv);
  } catch (error) {
    console.error("EngageKit: failed to extract post caption", error);
    return null;
  }
}

function getPostCaptionPreview(caption: string, wordCount: number) {
  const words = caption.trim().split(/\s+/);
  if (words.length <= wordCount) {
    return caption;
  }
  return words.slice(0, wordCount).join(" ") + "...";
}

function extractPostTime(postContainer: HTMLElement) {
  function extractLabeledTime() {
    try {
      // Find the author image
      const authorImg =
        postContainer.querySelector<HTMLImageElement>('img[alt^="View "]');

      if (!authorImg) {
        return null;
      }

      // Navigate to the author anchor
      const authorAnchor = authorImg.closest("a");
      if (!authorAnchor) {
        return null;
      }

      // The time span is typically a sibling of the author anchor's parent container
      // Navigate up to find the container that has both the anchor and the time span
      const authorMetaContainer = authorAnchor.parentElement;
      if (!authorMetaContainer) {
        return null;
      }

      // Look for spans that are siblings of the author anchor
      // The time span typically contains text like "1h •", "2d •", "1w •"
      const siblingSpans =
        authorMetaContainer.querySelectorAll<HTMLElement>(":scope > span");

      for (const span of siblingSpans) {
        // Skip if this span is inside the anchor (it's not a sibling then)
        if (authorAnchor.contains(span)) continue;

        // Check for time patterns in aria-hidden content
        const ariaHiddenSpan = span.querySelector<HTMLElement>(
          'span[aria-hidden="true"]',
        );
        const visuallyHiddenSpan = span.querySelector<HTMLElement>(
          "span.visually-hidden",
        );

        // Try to get display time from aria-hidden span
        if (ariaHiddenSpan) {
          const text = ariaHiddenSpan.textContent?.trim() ?? "";
          // Time patterns: "1h •", "2d •", "1w •", "3mo •"
          const timeMatch = /^(\d+[hdwmoy]+)\s*[•·]/i.exec(text);
          if (timeMatch?.[1]) {
            return {
              type: "display",
              value: timeMatch[1],
            } as const;
          }
        }

        // Try to get full time from visually-hidden span
        // Pattern: "1 hour ago", "2 days ago", etc.
        if (visuallyHiddenSpan) {
          const text = visuallyHiddenSpan.textContent?.trim() ?? "";
          const fullTimeMatch =
            /^(\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago)/i.exec(
              text,
            );
          if (fullTimeMatch?.[1]) {
            return {
              type: "full",
              value: fullTimeMatch[1],
            } as const;
          }
        }
      }

      // Fallback: Search more broadly if sibling approach didn't work
      // Look for any span in the post that has time-like content
      // This is a broader search but still uses the visually-hidden pattern
      const allVisuallyHiddenSpans =
        postContainer.querySelectorAll<HTMLElement>(
          'span[class*="visually-hidden"]',
        );

      for (const span of allVisuallyHiddenSpans) {
        const text = span.textContent?.trim() ?? "";
        // Match patterns like "1 hour ago", "2 days ago" at the start
        const match =
          /^(\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago)/i.exec(
            text,
          );
        if (match?.[1]) {
          return {
            type: "full",
            value: match[1],
          } as const;
        }
      }
    } catch (error) {
      console.error("EngageKit: Failed to extract post time", error);
    }

    return null;
  }

  function parsePostTime(input: {
    type: "full" | "display";
    value: string;
  }): Date {
    const now = new Date();

    // Helper to subtract time from the current date
    function subtractTime(
      amount: number,
      unit: "second" | "minute" | "hour" | "day" | "week",
    ) {
      const d = new Date(now);
      switch (unit) {
        case "second":
          d.setSeconds(d.getSeconds() - amount);
          break;
        case "minute":
          d.setMinutes(d.getMinutes() - amount);
          break;
        case "hour":
          d.setHours(d.getHours() - amount);
          break;
        case "day":
          d.setDate(d.getDate() - amount);
          break;
        case "week":
          d.setDate(d.getDate() - amount * 7);
          break;
      }
      return d;
    }
    switch (input.type) {
      case "display": {
        const match = /^(\d+)([smhdw])$/i.exec(input.value);
        if (!match) return now; // fallback if no match

        const [, amountStr, unitChar] = match;
        if (amountStr === undefined || unitChar === undefined) {
          return now;
        }

        const amount = parseInt(amountStr, 10);
        switch (unitChar.toLowerCase()) {
          case "s":
            return subtractTime(amount, "second");
          case "m":
            return subtractTime(amount, "minute");
          case "h":
            return subtractTime(amount, "hour");
          case "d":
            return subtractTime(amount, "day");
          case "w":
            return subtractTime(amount, "week");
          default:
            return now;
        }
      }
      case "full": {
        const match =
          /(\d+)\s*(second|minute|hour|day|week|month|year)s?\s+ago/i.exec(
            input.value,
          );
        if (!match) return now;

        const [, amountStr, unit] = match;
        if (amountStr === undefined || unit === undefined) {
          return now;
        }
        const amount = parseInt(amountStr, 10);
        switch (unit.toLowerCase()) {
          case "second":
            return subtractTime(amount, "second");
          case "minute":
            return subtractTime(amount, "minute");
          case "hour":
            return subtractTime(amount, "hour");
          case "day":
            return subtractTime(amount, "day");
          case "week":
            return subtractTime(amount, "week");
          case "month": {
            const d = new Date(now);
            d.setMonth(d.getMonth() - amount);
            return d;
          }
          case "year": {
            const d = new Date(now);
            d.setFullYear(d.getFullYear() - amount);
            return d;
          }
          default:
            return now;
        }
      }
      default:
        return now;
    }
  }

  const labeledTime = extractLabeledTime();

  if (labeledTime === null) {
    return new Date();
  }

  return parsePostTime(labeledTime);
}

function extractPostAuthorInfo(postContainer: HTMLElement) {
  const result: AuthorInfo = {
    urn: null,
    name: null,
    avatarUrl: null,
    headline: null,
    profileUrl: null,
  };

  try {
    // Step 1: Find author image by alt text pattern
    // LinkedIn author images have alt="View {Name}'s profile"
    const authorImg =
      postContainer.querySelector<HTMLImageElement>('img[alt^="View "]');

    if (!authorImg) {
      return result;
    }

    // Step 2: Extract photo URL
    result.avatarUrl = authorImg.getAttribute("src");

    // Step 3: Extract name from alt text
    const alt = authorImg.getAttribute("alt");

    if (alt !== null) {
      const possessiveMatch = /^View\s+(.+?)['‘’]s?\s+/i.exec(alt);
      if (possessiveMatch?.[1]) {
        result.name = possessiveMatch[1].trim();
      }
    }

    // Step 4: Navigate up to find the anchor element for profile URL
    const photoAnchor = authorImg.closest("a");
    if (photoAnchor) {
      const href = photoAnchor.getAttribute("href");
      if (href !== null) {
        result.profileUrl = href.split("?")[0] ?? null;
      }

      // Step 5: Extract headline using sibling navigation (like extract-profile-info.ts)
      result.headline = extractHeadlineFromAuthorSection(photoAnchor);
    }
  } catch (error) {
    console.error("EngageKit: Failed to extract author info from post", error);
  }

  return result;
}

function extractPostComments(postContainer: HTMLElement) {
  const articles = postContainer.querySelectorAll<HTMLElement>(
    'article[data-id^="urn:li:comment:"]',
  );

  if (!articles.length) {
    return [];
  }

  return Array.from(articles).map((article) => extractPostComment(article));
}

async function expandPostComments(postContainer: HTMLElement) {
  const beforeCommentsLength = extractPostComments(postContainer).length;

  const clickShowCommentButton = () => {
    let commentButton = postContainer.querySelector<HTMLButtonElement>(
      'button[aria-label*="comment"]',
    );

    if (commentButton !== null) {
      commentButton.click();
      return true;
    }

    commentButton = postContainer.querySelector<HTMLButtonElement>(
      'button[aria-label="Comment"]',
    );

    if (commentButton !== null) {
      commentButton.click();
      return true;
    }

    return false;
  };

  const waitForCommentsReady = () => {
    return retry(
      () => {
        const commentsLength = extractPostComments(postContainer).length;

        if (commentsLength > beforeCommentsLength) {
          return true;
        }

        throw new Error("Comments not expanded yet, throwing for retry");
      },
      {
        // POLL_INTERVAL_MS
        interval: 500,
        // MAX_WAIT_MS
        timeout: 6_000,
      },
    );
  };

  clickShowCommentButton();

  await waitForCommentsReady();
}

async function extractPostData(container: HTMLElement) {
  const urn = container.getAttribute("data-urn");
  if (!urn) return null;

  const fullCaption = extractPostCaption(container);
  if (!fullCaption) return null;

  await expandPostComments(container);

  const comments = extractPostComments(container);

  return {
    urn,
    fullCaption,
    contentHtml: container.innerHTML,
    captionPreview: getPostCaptionPreview(fullCaption, 10),
    createdAt: extractPostTime(container).toISOString(),
    author: extractPostAuthorInfo(container),
    comments,
  };
}

class Semaphore {
  private queue: (() => void)[] = [];
  private size = 0;
  constructor(private readonly concurrency = 1) {}

  async acquire() {
    // if unlocked, then just lock it immediately
    if (++this.size <= this.concurrency) {
      return {
        [Symbol.dispose]: () => {
          this.release();
        },
      };
    }

    await new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
    return {
      [Symbol.dispose]: () => {
        this.release();
      },
    };
  }

  get locked() {
    return this.size >= this.concurrency;
  }

  release(): void {
    this.size--;

    if (this.queue.length > 0) {
      this.queue.shift()?.();
    }
  }
}

/**
 * Utility for loading more posts in the LinkedIn feed.
 * Prioritizes clicking the "Show more" button (faster), falls back to scrolling.
 */

/* Delay after clicking button before checking for new posts */
const BUTTON_WAIT_MS = 1500;

/** Delay after scrolling before checking for new posts */
const SCROLL_WAIT_MS = 1500;

/**
 * Count current post containers in the feed
 */
function countPosts(): number {
  return document.querySelectorAll('div[data-urn*="activity"]').length;
}

/**
 * Try to click the "Show more feed updates" button.
 * Uses XPath for resilience against class name changes.
 *
 * @returns true if button was found and clicked
 */
function tryClickLoadMoreButton(): boolean {
  try {
    const result = document.evaluate(
      '//button[.//span[normalize-space(.) = "Show more feed updates"]]',
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    );
    const btn = result.singleNodeValue as HTMLButtonElement | null;
    if (btn && !btn.disabled) {
      btn.click();
      return true;
    }
  } catch (error) {
    console.error("EngageKit: failed to click load more button", error);
  }
  return false;
}

/**
 * Fast scroll to bottom of page
 */
function fastScroll(): void {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "instant",
  });
}

function extractHeadlineFromAuthorSection(photoAnchor: Element): string | null {
  // Strategy 1: Look at the parent container and find spans that aren't the name
  const authorContainer = photoAnchor.parentElement;
  if (!authorContainer) return null;

  // The author section usually has the structure where headline is in a sibling anchor
  // or in spans within the container
  const siblingAnchors = authorContainer.querySelectorAll("a");

  for (const anchor of siblingAnchors) {
    // Skip the photo anchor itself
    if (anchor === photoAnchor) continue;

    // Check if this anchor contains profile info (has children with text)
    const lastChild = anchor.lastElementChild;
    if (lastChild) {
      const text = lastChild.textContent?.trim();
      // Headline is usually longer than name and doesn't start with "View"
      if (text && text.length > 5 && !text.startsWith("View ")) {
        return text;
      }
    }

    // Also check anchor's nextElementSibling for headline
    const nextSibling = anchor.nextElementSibling;
    if (nextSibling) {
      const siblingText = nextSibling.textContent?.trim();
      if (
        siblingText &&
        siblingText.length > 5 &&
        !siblingText.startsWith("View ")
      ) {
        return siblingText;
      }
    }
  }

  // Strategy 2: Look in the grandparent for a different structure
  const grandparent = authorContainer.parentElement;
  if (grandparent) {
    // Find all anchors and look for the one that's not the photo
    const anchors = grandparent.querySelectorAll("a");
    for (const anchor of anchors) {
      if (anchor.contains(photoAnchor) || anchor === photoAnchor) continue;

      // This might be the name/headline anchor
      const lastChild = anchor.lastElementChild;
      if (lastChild) {
        const text = lastChild.textContent?.trim();
        if (text && text.length > 5 && !text.startsWith("View ")) {
          return text;
        }
      }
    }
  }

  return null;
}

function extractPostComment(commentContainer: HTMLElement): PostComment {
  const result: PostComment = {
    authorName: null,
    authorHeadline: null,
    authorProfileUrl: null,
    authorPhotoUrl: null,
    content: null,
    urn: null,
    isReply: false,
  };

  try {
    // Get URN from data-id attribute
    result.urn = commentContainer.getAttribute("data-id");

    // Check if this is a reply (nested comment)
    // Replies are typically in a nested structure or have specific classes
    const parentArticle = commentContainer.parentElement?.closest(
      'article[data-id^="urn:li:comment:"]',
    );
    result.isReply = !!parentArticle;

    // Find author image using alt text pattern (same as post author extraction)
    const authorImg =
      commentContainer.querySelector<HTMLImageElement>('img[alt^="View "]');

    if (authorImg) {
      result.authorPhotoUrl = authorImg.getAttribute("src");

      // Extract name from alt text
      const alt = authorImg.getAttribute("alt");
      if (alt) {
        const match = /^View\s+(.+?)[''\u2019\u0027]s?\s+/i.exec(alt);
        if (match?.[1]) {
          result.authorName = match[1].trim();
        }
      }

      // Get profile URL from parent anchor
      const parentAnchor = authorImg.closest("a");
      if (parentAnchor) {
        const href = parentAnchor.getAttribute("href");
        if (href) {
          result.authorProfileUrl = href.split("?")[0] ?? null;
        }
      }
    }

    // Extract comment text content
    // Comments typically have their text in a span with dir="ltr"
    const commentTextSpan =
      commentContainer.querySelector<HTMLElement>('span[dir="ltr"]');
    if (commentTextSpan) {
      result.content = commentTextSpan.textContent?.trim() ?? null;
    }

    // Try to find headline - usually near the author name
    // Look for spans that aren't the name and aren't the comment text
    if (authorImg) {
      const authorSection = authorImg.closest("a")?.parentElement;
      if (authorSection) {
        const spans = authorSection.querySelectorAll("span");
        for (const span of spans) {
          const text = span.textContent?.trim();
          if (
            text &&
            text.length > 5 &&
            text !== result.authorName &&
            !text.startsWith("View ")
          ) {
            result.authorHeadline = text;
            break;
          }
        }
      }
    }
  } catch (error) {
    console.error("EngageKit: Failed to extract comment info", error);
  }

  return result;
}

const engagekitInternals = {
  retry,
  async findPosts({
    skipPostUrns,
    limit,
  }: {
    skipPostUrns: Set<string>;
    limit: number;
  }) {
    const posts = document.querySelectorAll<HTMLElement>("div[data-urn]");

    const validPosts: Post[] = [];

    const semaphore = new Semaphore(20);
    // limit to 20 concurrent extractions at once so we dont overload the browser

    for (const container of posts) {
      await semaphore.acquire();
      void (async () => {
        const urn = container.getAttribute("data-urn");
        if (!urn?.includes("activity")) return;
        if (skipPostUrns.has(urn)) return;

        const fullCaption = extractPostCaption(container);
        if (fullCaption === null) {
          return;
        }

        const postData = await extractPostData(container);
        if (postData === null) return;

        if (validPosts.length >= limit) {
          return validPosts;
        }

        validPosts.push(postData);
        semaphore.release();
      })();
    }

    return validPosts;
  },
  async loadMore() {
    /**
     * Load more posts into the feed.
     * Strategy: Try clicking the "Show more" button first (faster loading),
     * if not available, fall back to scrolling (infinite scroll).
     *
     * @returns true if new posts were loaded, false if no new posts appeared
     */
    const initialCount = countPosts();

    // Priority 1: Try clicking the "Show more feed updates" button (faster)
    if (tryClickLoadMoreButton()) {
      await new Promise((r) => setTimeout(r, BUTTON_WAIT_MS));
      if (countPosts() > initialCount) {
        return true;
      }
    }

    // Priority 2: Fall back to scrolling (infinite scroll)
    fastScroll();
    await new Promise((r) => setTimeout(r, SCROLL_WAIT_MS));

    return countPosts() > initialCount;
  },
  doesAnyPostContainerExist() {
    return document.querySelectorAll('div[data-urn*="activity"]').length > 0;
  },
};

window.engagekitInternals = engagekitInternals;

type EngagekitInternals = typeof engagekitInternals;

declare global {
  interface Window {
    engagekitInternals: EngagekitInternals;
  }
}
