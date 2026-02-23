/**
 * Facebook Post Scraper
 * Extracts post context and comment data from Facebook's DOM
 *
 * DOM SELECTORS NEEDED (fill in after inspection):
 * - Comment input box selector
 * - Comment submit button selector
 * - Post author name selector
 * - Post author avatar selector
 * - Post text content selector
 * - Comment URL extraction pattern
 */

// Store reference to the last submit button for context extraction
let lastSubmitButton: HTMLElement | null = null;

export function setLastSubmitButton(btn: HTMLElement) {
  lastSubmitButton = btn;
}

export interface FacebookCommentContext {
  commentText: string;
  post: {
    postUrl: string | null; // Link to the post (if available)
    postAuthorName: string | null;
    postAuthorAvatarUrl: string | null;
    postTextSnippet: string | null;
  };
}

/**
 * Facebook DOM Selectors (February 2026)
 * Uses Lexical editor for comments
 */
const SELECTORS = {
  // Comment input - Lexical editor with aria-label "Comment as [Name]" or "Reply to [Name]"
  commentInput: [
    '[data-lexical-editor="true"][aria-label^="Comment as"]',
    '[data-lexical-editor="true"][aria-label^="Reply to"]',
    '[data-lexical-editor="true"][role="textbox"]',
    '[contenteditable="true"][role="textbox"]',
  ] as string[],

  // Comment submit button - has aria-label="Comment" and role="button"
  // When disabled: aria-disabled="true", when enabled: aria-disabled not present or "false"
  submitButton: [
    'div[role="button"][aria-label="Comment"]:not([aria-disabled="true"])',
    'div[role="button"][aria-label="Reply"]:not([aria-disabled="true"])',
    '[aria-label="Comment"][role="button"]',
  ] as string[],

  // Post author name - in the post header with link to profile
  postAuthorName: [
    'h3 a[role="link"] span',
    'h3 span strong span',
    'a[aria-label] strong span',
    'h2 a span',
    'span[dir="auto"] strong',
  ] as string[],

  // Post author avatar - image inside SVG with mask
  postAuthorAvatar: [
    'svg image[preserveAspectRatio="xMidYMid slice"]',
    'a[aria-label] svg image',
    'image[style*="height: 40px"]',
    'image[style*="height: 36px"]',
  ] as string[],

  // Post text content - the main post body
  postText: [
    'div[data-ad-rendering-role="story_message"] span[dir="auto"]',
    'div[dir="auto"][style*="text-align"]',
    'span[dir="auto"] span',
    'div.xdj266r span[dir="auto"]',
  ] as string[],
};

/**
 * Scrape comment context from the DOM near the submit button
 */
export function scrapeCommentContext(
  submitButton: HTMLElement
): FacebookCommentContext | null {
  try {
    // Extract comment text FIRST - this is the most important
    const commentText = extractCommentText(submitButton);

    console.log("TrustAHuman FB: Scraped comment text:", commentText ? commentText.substring(0, 50) : "EMPTY");

    // Find the post container (parent of the comment area)
    const postContainer = findPostContainer(submitButton);

    // Even without post container, return data if we have comment text
    if (!postContainer) {
      console.warn("TrustAHuman FB: Could not find post container, returning partial data");
      if (commentText) {
        return {
          commentText,
          post: {
            postUrl: window.location.href,
            postAuthorName: null,
            postAuthorAvatarUrl: null,
            postTextSnippet: null,
          },
        };
      }
      return null;
    }

    // Extract post context
    const postUrl = extractPostUrl(postContainer);
    const postAuthorName = extractPostAuthorName(postContainer);
    const postAuthorAvatarUrl = extractPostAuthorAvatar(postContainer);
    const postTextSnippet = extractPostText(postContainer);

    return {
      commentText,
      post: {
        postUrl,
        postAuthorName,
        postAuthorAvatarUrl,
        postTextSnippet,
      },
    };
  } catch (err) {
    console.error("TrustAHuman FB: Error scraping comment context", err);
    return null;
  }
}

function findPostContainer(submitButton: HTMLElement): HTMLElement | null {
  // Strategy: Find the active comment input, then walk UP from there to find the post
  // This works better than walking from submit button which may be disconnected in DOM

  // First, find the active Lexical editor (the one user is typing in)
  let startElement: HTMLElement | null = null;

  // Try focused element first
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement?.closest('[data-lexical-editor="true"]')) {
    startElement = activeElement.closest('[data-lexical-editor="true"]') as HTMLElement;
  }

  // If no focused editor, find any editor with content
  if (!startElement) {
    const editors = document.querySelectorAll<HTMLElement>('[data-lexical-editor="true"]');
    for (const editor of editors) {
      const text = editor.innerText?.trim() || editor.textContent?.trim() || "";
      if (text) {
        startElement = editor;
        break;
      }
    }
  }

  // If still nothing, fall back to submit button
  if (!startElement) {
    startElement = submitButton;
  }

  console.log("TrustAHuman FB: Finding post container starting from:", startElement?.tagName);

  let topArticle: HTMLElement | null = null;
  let parent = startElement.parentElement;

  // Walk up to find the post container
  for (let i = 0; i < 50 && parent; i++) {
    // Check for feed unit pagelet - this is the MAIN post container
    const pagelet = parent.getAttribute("data-pagelet");
    if (pagelet?.includes("FeedUnit") || pagelet?.includes("ProfileTimeline")) {
      console.log("TrustAHuman FB: Found post container via pagelet:", pagelet);
      return parent;
    }

    // Track article elements - we want the topmost one (main post, not comment)
    if (parent.getAttribute("role") === "article") {
      topArticle = parent;
    }

    parent = parent.parentElement;
  }

  // If we found any articles, the topmost one is likely the main post
  if (topArticle) {
    console.log("TrustAHuman FB: Found post container via article role");
    return topArticle;
  }

  // Fallback: find container with profile_name data attribute
  parent = startElement.parentElement;
  for (let i = 0; i < 50 && parent; i++) {
    if (parent.querySelector('[data-ad-rendering-role="profile_name"]')) {
      console.log("TrustAHuman FB: Found post container via profile_name");
      return parent;
    }
    parent = parent.parentElement;
  }

  // Last resort: find container with h3 link (post author header)
  parent = startElement.parentElement;
  for (let i = 0; i < 50 && parent; i++) {
    if (parent.querySelector('h3 a[role="link"]')) {
      console.log("TrustAHuman FB: Found post container via h3 link");
      return parent;
    }
    parent = parent.parentElement;
  }

  console.log("TrustAHuman FB: Could not find post container");
  return null;
}

function extractCommentText(submitButton: HTMLElement): string {
  // Strategy: Find the FOCUSED/ACTIVE Lexical editor on the page
  // Facebook only has one active comment input at a time

  // Priority 1: Find focused Lexical editor (has focus or contains selection)
  const activeElement = document.activeElement;
  if (activeElement?.closest('[data-lexical-editor="true"]')) {
    const editor = activeElement.closest('[data-lexical-editor="true"]') as HTMLElement;
    const text = extractTextFromEditor(editor);
    if (text) {
      console.log("TrustAHuman FB: Found text from focused editor:", text.substring(0, 50));
      return text;
    }
  }

  // Priority 2: Find any Lexical editor with content
  const editors = document.querySelectorAll<HTMLElement>('[data-lexical-editor="true"]');
  for (const editor of editors) {
    const text = extractTextFromEditor(editor);
    if (text) {
      console.log("TrustAHuman FB: Found text from editor with content:", text.substring(0, 50));
      return text;
    }
  }

  // Priority 3: Find contenteditable with role="textbox"
  const textboxes = document.querySelectorAll<HTMLElement>('[contenteditable="true"][role="textbox"]');
  for (const textbox of textboxes) {
    const text = textbox.innerText?.trim() || textbox.textContent?.trim() || "";
    if (text) {
      console.log("TrustAHuman FB: Found text from textbox:", text.substring(0, 50));
      return text;
    }
  }

  console.log("TrustAHuman FB: No comment text found in any editor");
  return "";
}

function extractTextFromEditor(editor: HTMLElement): string {
  // Lexical stores text in <p> elements or <span> elements
  const paragraphs = editor.querySelectorAll("p");
  if (paragraphs.length > 0) {
    const text = Array.from(paragraphs)
      .map((p) => p.textContent?.trim() || "")
      .filter(Boolean)
      .join("\n");
    if (text) return text;
  }

  // Fallback to innerText
  const text = editor.innerText?.trim() || editor.textContent?.trim() || "";
  return text;
}

function extractPostUrl(postContainer: HTMLElement): string | null {
  // Priority 1: Look for /posts/ links within the container
  const containerPostsLinks = postContainer.querySelectorAll('a[href*="/posts/"]') as NodeListOf<HTMLAnchorElement>;
  for (const link of containerPostsLinks) {
    if (link.href) {
      const url = cleanFacebookUrl(link.href);
      console.log("TrustAHuman FB: Found post URL in container via /posts/:", url);
      return url;
    }
  }

  // Priority 2: Look for /permalink/ links within the container (group posts)
  const permalinkLink = postContainer.querySelector('a[href*="/permalink/"]') as HTMLAnchorElement;
  if (permalinkLink?.href) {
    const url = cleanFacebookUrl(permalinkLink.href);
    console.log("TrustAHuman FB: Found post URL via /permalink/:", url);
    return url;
  }

  // Priority 3: Extract post ID from photo links (set=pcb.{postId} pattern)
  // Photo album posts don't have /posts/ links, but photos have set=pcb.{postId}
  const photoLinks = postContainer.querySelectorAll('a[href*="/photo/"]') as NodeListOf<HTMLAnchorElement>;
  for (const link of photoLinks) {
    const match = link.href.match(/set=pcb\.(\d+)/);
    if (match) {
      // We have a post ID, but we need the page/user handle to construct URL
      // Look for the profile link in the container
      const profileLink = postContainer.querySelector('a[href*="facebook.com/"][role="link"]') as HTMLAnchorElement;
      if (profileLink?.href) {
        const profileMatch = profileLink.href.match(/facebook\.com\/([^/?]+)/);
        if (profileMatch) {
          const handle = profileMatch[1];
          const postId = match[1];
          const constructedUrl = `https://www.facebook.com/${handle}/posts/${postId}`;
          console.log("TrustAHuman FB: Constructed post URL from photo:", constructedUrl);
          return constructedUrl;
        }
      }
    }
  }

  // Priority 4: Extract from group photo links (set=gm.{postId})
  for (const link of photoLinks) {
    const match = link.href.match(/set=gm\.(\d+)/);
    if (match) {
      const groupLink = postContainer.querySelector('a[href*="/groups/"]') as HTMLAnchorElement;
      if (groupLink?.href) {
        const groupMatch = groupLink.href.match(/\/groups\/([^/?]+)/);
        if (groupMatch) {
          const groupId = groupMatch[1];
          const postId = match[1];
          const constructedUrl = `https://www.facebook.com/groups/${groupId}/posts/${postId}`;
          console.log("TrustAHuman FB: Constructed group post URL from photo:", constructedUrl);
          return constructedUrl;
        }
      }
    }
  }

  // Priority 5: Use the photo URL directly (single photo posts)
  // For photos with set=a.{albumId}, the photo URL is effectively the post URL
  if (photoLinks.length > 0) {
    const firstPhoto = photoLinks[0];
    if (firstPhoto.href) {
      const url = cleanFacebookUrl(firstPhoto.href);
      console.log("TrustAHuman FB: Using photo URL as post URL:", url);
      return url;
    }
  }

  // Priority 6: Fallback to current page URL
  console.log("TrustAHuman FB: No post URL found, using current page");
  return window.location.href;
}

function cleanFacebookUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove tracking params but keep the essential post identifier
    // Use bracket notation to handle special characters in param names
    const paramsToDelete = ["__tn__", "comment_id"];
    paramsToDelete.forEach(p => urlObj.searchParams.delete(p));

    // Handle __cft__[0] specially since it has brackets
    const cleanedSearch = urlObj.search.replace(/[?&]__cft__\[[^\]]*\]=[^&]*/g, "");
    urlObj.search = cleanedSearch.startsWith("&") ? "?" + cleanedSearch.slice(1) : cleanedSearch;

    return urlObj.toString();
  } catch {
    return url;
  }
}

function extractPostAuthorName(postContainer: HTMLElement): string | null {
  // IMPORTANT: We want the MAIN POST author, not comment authors

  // Priority 1: Look for data-ad-rendering-role="profile_name" (most reliable)
  const profileNameEl = postContainer.querySelector('[data-ad-rendering-role="profile_name"]');
  if (profileNameEl?.textContent) {
    const name = profileNameEl.textContent.trim();
    if (name.length > 1) {
      console.log("TrustAHuman FB: Found author via profile_name:", name);
      return name;
    }
  }

  // Priority 2: Look for h3 with link to profile (main post author)
  const h3Link = postContainer.querySelector("h3 a");
  if (h3Link?.textContent) {
    const name = h3Link.textContent.trim();
    if (name.length > 1) {
      console.log("TrustAHuman FB: Found author via h3 link:", name);
      return name;
    }
  }

  // Priority 3: Look for h2 with link (some page posts)
  const h2Link = postContainer.querySelector("h2 a");
  if (h2Link?.textContent) {
    const name = h2Link.textContent.trim();
    if (name.length > 1) {
      console.log("TrustAHuman FB: Found author via h2 link:", name);
      return name;
    }
  }

  // Priority 4: Check aria-label on the FIRST svg (avatar) - extract name before comma
  const firstSvg = postContainer.querySelector('svg[aria-label]');
  if (firstSvg) {
    const label = firstSvg.getAttribute("aria-label");
    if (label && label.length > 1 && label.length < 100) {
      // aria-label is often "Name, view story" - extract just the name
      const name = label.split(",")[0].trim();
      if (name.length > 1) {
        console.log("TrustAHuman FB: Found author via svg aria-label:", name);
        return name;
      }
    }
  }

  // Last resort: find strong text near the top of the container
  const firstStrong = postContainer.querySelector("strong span");
  if (firstStrong?.textContent) {
    return firstStrong.textContent.trim();
  }

  return null;
}

function extractPostAuthorAvatar(postContainer: HTMLElement): string | null {
  // IMPORTANT: We want the FIRST avatar which is the main post author
  // Facebook uses SVG with image elements inside for avatars

  // Priority 1: Get the FIRST SVG image (main post author avatar)
  const firstSvgImage = postContainer.querySelector("svg image");
  if (firstSvgImage) {
    const href = firstSvgImage.getAttributeNS("http://www.w3.org/1999/xlink", "href") ||
                 firstSvgImage.getAttribute("xlink:href");
    if (href && href.includes("fbcdn")) {
      return href;
    }
  }

  // Priority 2: First img tag with fbcdn URL
  const firstImg = postContainer.querySelector("img[src*='fbcdn']") as HTMLImageElement;
  if (firstImg?.src) {
    return firstImg.src;
  }

  return null;
}

function extractPostText(postContainer: HTMLElement): string | null {
  // Priority 1: Look for data-ad-rendering-role="story_message" (most reliable)
  const storyMessage = postContainer.querySelector('[data-ad-rendering-role="story_message"]');
  if (storyMessage?.textContent) {
    const text = storyMessage.textContent.trim();
    if (text.length > 5) {
      console.log("TrustAHuman FB: Found post text via story_message");
      return text.length > 500 ? text.slice(0, 500) + "..." : text;
    }
  }

  // Priority 2: Look for div with style="text-align:start" (Facebook's post text container)
  const textAlignDivs = postContainer.querySelectorAll('div[dir="auto"][style*="text-align"]');
  for (const div of textAlignDivs) {
    const text = div.textContent?.trim();
    if (text && text.length > 20) {
      console.log("TrustAHuman FB: Found post text via text-align div");
      return text.length > 500 ? text.slice(0, 500) + "..." : text;
    }
  }

  // Priority 3: Look for span[dir="auto"] that contains actual post text
  const spans = postContainer.querySelectorAll('span[dir="auto"]');
  for (const span of spans) {
    const text = span.textContent?.trim();
    // Skip short text, profile names, dates, etc.
    if (text && text.length > 50) {
      // Check it's not inside a link (which would be author name)
      const isInLink = span.closest("a");
      const isInHeading = span.closest("h2, h3, h4");
      if (!isInLink && !isInHeading) {
        return text.length > 500 ? text.slice(0, 500) + "..." : text;
      }
    }
  }

  return null;
}

/**
 * Wait for the new comment to appear and extract its URL
 */
export async function waitForNewCommentUrl(
  submitButton: HTMLElement,
  timeoutMs = 5000
): Promise<string | null> {
  // TODO: Implement after DOM inspection
  // Facebook may not have direct comment URLs like LinkedIn
  // This might return null if comment URLs aren't available
  return null;
}

export { SELECTORS };
