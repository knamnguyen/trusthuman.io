/**
 * Load and extract comments from a LinkedIn post container.
 * Clicks the comment button to open comments, waits for them to load,
 * then extracts comment data from article elements.
 */

export interface PostCommentInfo {
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

/**
 * Wait helper
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract comment info from a single article element
 */
function extractCommentInfoFromArticle(article: HTMLElement): PostCommentInfo {
  const result: PostCommentInfo = {
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
    result.urn = article.getAttribute("data-id");

    // Check if this is a reply (nested comment)
    // Replies are typically in a nested structure or have specific classes
    const parentArticle = article.parentElement?.closest(
      'article[data-id^="urn:li:comment:"]',
    );
    result.isReply = !!parentArticle;

    // Find author image using alt text pattern (same as post author extraction)
    const authorImg =
      article.querySelector<HTMLImageElement>('img[alt^="View "]');

    if (authorImg) {
      result.authorPhotoUrl = authorImg.getAttribute("src");

      // Extract name from alt text
      const alt = authorImg.getAttribute("alt");
      if (alt) {
        const match = alt.match(/^View\s+(.+?)[''\u2019\u0027]s?\s+/i);
        if (match?.[1]) {
          result.authorName = match[1].trim();
        }
      }

      // Get profile URL from parent anchor
      const parentAnchor = authorImg.closest("a");
      if (parentAnchor) {
        const href = parentAnchor.getAttribute("href");
        if (href) {
          result.authorProfileUrl = href.split("?")[0] || null;
        }
      }
    }

    // Extract comment text content
    // Comments typically have their text in a span with dir="ltr"
    const commentTextSpan =
      article.querySelector<HTMLElement>('span[dir="ltr"]');
    if (commentTextSpan) {
      result.content = commentTextSpan.textContent?.trim() || null;
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

/**
 * Load and extract comments from a post container.
 * Uses attribute selectors only - no class selectors for resilience.
 *
 * @param postContainer - The LinkedIn post container element
 * @returns Array of comment info objects
 */
export async function loadAndExtractComments(
  postContainer: HTMLElement,
): Promise<PostCommentInfo[]> {
  try {
    // // 1. Check if comment articles already exist in the post
    // let articles = postContainer.querySelectorAll<HTMLElement>(
    //   'article[data-id^="urn:li:comment:"]',
    // );

    // // 2. If no comments visible, try to click the comment button to open them
    // if (!articles.length) {
    // Comment button selector:
    // - aria-label contains "comments"
    // - aria-label ends with "s post" (e.g., "Show 3 comments on Gabriel B.'s post")
    const commentButton = postContainer.querySelector<HTMLButtonElement>(
      'button[aria-label$="s post"][aria-label*="comment"]',
    );

    if (commentButton) {
      commentButton.click();
      await wait(1000); // Wait for LinkedIn to fetch and render comments
    }

    // 3. Re-query for comment articles after clicking
    const articles = postContainer.querySelectorAll<HTMLElement>(
      'article[data-id^="urn:li:comment:"]',
    );
    // }

    if (!articles.length) {
      return [];
    }

    // 4. Extract info from each article
    const results: PostCommentInfo[] = Array.from(articles).map((article) =>
      extractCommentInfoFromArticle(article),
    );

    return results;
  } catch (error) {
    console.error("EngageKit: Failed to load and extract comments", error);
    return [];
  }
}
