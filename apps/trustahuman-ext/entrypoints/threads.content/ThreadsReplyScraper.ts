/**
 * Threads Reply Scraper
 * Extracts reply context and waits for toast to get activity URL
 */

export interface ThreadsReplyContext {
  replyText: string;
  parent: {
    postUrl: string | null;
    authorUsername: string | null;
    authorAvatarUrl: string | null;
    textSnippet: string | null;
  };
}

/**
 * DOM Selectors for Threads
 */
export const SELECTORS = {
  // Reply/comment input - contenteditable with specific placeholder
  replyInput: [
    '[contenteditable="true"][role="textbox"][aria-placeholder^="Reply to"]',
    '[contenteditable="true"][role="textbox"]',
  ] as string[],

  // Submit button - Modal: div with "Post" text
  // Inline: button with rotated arrow SVG
  submitButtonModal: 'div[role="button"]',

  // Toast container - appears after posting with "Posted" text and View link
  toastContainer: 'li[class*="xwcsmn1"]',
  toastLink: 'a[href*="/post/"]',
};

/**
 * Check if element is a valid submit button (not the reply icon that opens editor)
 */
export function isSubmitButton(element: HTMLElement): boolean {
  // Modal submit: div[role="button"] containing "Post" text
  if (element.getAttribute("role") === "button") {
    const text = element.textContent?.trim().toLowerCase() || "";

    // Modal "Post" button
    if (text === "post") {
      return true;
    }

    // Inline submit: button with rotated Reply arrow (rotate(90deg))
    // The arrow icon has style="--x-transform: rotate(90deg)"
    const rotatedSpan = element.querySelector('span[style*="rotate(90deg)"]');
    if (rotatedSpan) {
      const replyArrow = rotatedSpan.querySelector('svg[aria-label="Reply"]');
      if (replyArrow) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if element is just the reply icon (opens editor, NOT submit)
 */
export function isReplyIconButton(element: HTMLElement): boolean {
  if (element.getAttribute("role") !== "button") return false;

  // Reply icon has svg[aria-label="Reply"] but NOT inside a rotated span
  const replySvg = element.querySelector('svg[aria-label="Reply"]');
  if (!replySvg) return false;

  // Check if it's inside a rotated span (that would be the submit button)
  const rotatedSpan = element.querySelector('span[style*="rotate(90deg)"]');
  if (rotatedSpan) return false; // This is submit, not reply icon

  // Check the SVG path - bubble icon has different path than arrow
  // Bubble icon has a circular chat bubble shape
  // Arrow icon has line and polyline elements
  const hasLine = replySvg.querySelector('line');
  const hasPolyline = replySvg.querySelector('polyline');

  // If it has line/polyline but no rotation, it's likely the inline submit
  // If it has neither, it's the bubble reply icon
  if (!hasLine && !hasPolyline) {
    return true; // Bubble icon - opens editor
  }

  return false;
}

/**
 * Scrape reply context when user submits a reply
 */
export function scrapeReplyContext(): ThreadsReplyContext | null {
  try {
    // Find the active reply input element
    const { text: replyText, element: activeEditor } = extractReplyTextAndElement();

    if (!replyText) {
      console.log("TrustAHuman Threads: No reply text found");
      return null;
    }

    // Find the parent post info relative to the active editor
    const parentPost = findParentPost(activeEditor);

    return {
      replyText,
      parent: {
        postUrl: parentPost?.postUrl || null, // Will be replaced by toast URL
        authorUsername: parentPost?.authorUsername || null,
        authorAvatarUrl: parentPost?.authorAvatarUrl || null,
        textSnippet: parentPost?.textSnippet || null,
      },
    };
  } catch (err) {
    console.error("TrustAHuman Threads: Error scraping reply context", err);
    return null;
  }
}

function extractReplyText(): string {
  const { text } = extractReplyTextAndElement();
  return text;
}

function extractReplyTextAndElement(): { text: string; element: HTMLElement | null } {
  // First check focused element - this is most reliable for knowing which editor is active
  const active = document.activeElement as HTMLElement;
  if (active?.getAttribute("contenteditable") === "true") {
    const text = active.innerText?.trim() || active.textContent?.trim() || "";
    if (text) {
      console.log("TrustAHuman Threads: Found reply text from focused element:", text.substring(0, 50));
      return { text, element: active };
    }
  }

  // Fallback: try each selector
  for (const sel of SELECTORS.replyInput) {
    try {
      const elements = document.querySelectorAll<HTMLElement>(sel);
      for (const el of elements) {
        const text = el.innerText?.trim() || el.textContent?.trim() || "";
        if (text) {
          console.log("TrustAHuman Threads: Found reply text from selector:", text.substring(0, 50));
          return { text, element: el };
        }
      }
    } catch {
      // Skip invalid selector
    }
  }

  return { text: "", element: null };
}

interface ParentPostInfo {
  postUrl: string | null;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
  textSnippet: string | null;
}

function findParentPost(activeEditor: HTMLElement | null): ParentPostInfo | null {
  // Strategy 1: Check if we're in a modal by looking at aria-placeholder
  // Modal editors have aria-placeholder="Reply to {username}..."
  if (activeEditor) {
    const placeholder = activeEditor.getAttribute("aria-placeholder");
    const placeholderMatch = placeholder?.match(/^Reply to ([^.]+)\.\.\./);

    if (placeholderMatch) {
      const username = placeholderMatch[1];
      console.log("TrustAHuman Threads: Found username from placeholder:", username);

      // We're likely in a modal - find context within the modal/page
      // Look for avatar and text in the broader context
      const modalOrPage = activeEditor.closest('[role="dialog"]') || document.body;

      // Try to find avatar for this user
      const avatarImg = modalOrPage.querySelector(`img[alt*="${username}"]`) as HTMLImageElement ||
                       modalOrPage.querySelector('img[alt*="profile picture"]') as HTMLImageElement;

      // Try to find post text
      const textSnippet = extractMainPostText();

      return {
        postUrl: null, // Will come from toast
        authorUsername: username,
        authorAvatarUrl: avatarImg?.src || null,
        textSnippet,
      };
    }
  }

  // Strategy 2: Walk up from the editor to find the post container with a /post/ link
  if (activeEditor) {
    let container: HTMLElement | null = activeEditor;

    while (container && container !== document.body) {
      container = container.parentElement;

      if (!container) break;

      // Check if this container has a post link
      const postLink = container.querySelector<HTMLAnchorElement>('a[href*="/post/"]');
      if (postLink) {
        const href = postLink.getAttribute("href");
        const match = href?.match(/\/@([^/]+)\/post\/([^/]+)/);

        if (match) {
          const username = match[1];

          // Try to find avatar
          const avatarImg = container.querySelector('img[alt*="profile picture"]') as HTMLImageElement;

          // Try to find post text
          let textSnippet: string | null = null;
          const textElements = container.querySelectorAll('span[dir="auto"] > span, span[dir="auto"]');
          for (const el of textElements) {
            const text = el.textContent?.trim() || "";
            // Skip short text, usernames, timestamps
            if (text.length > 30 && text !== username && !text.match(/^\d+[hmd]$/)) {
              textSnippet = text.length > 200 ? text.slice(0, 200) + "..." : text;
              break;
            }
          }

          console.log("TrustAHuman Threads: Found parent post from editor context:", username);

          return {
            postUrl: `https://www.threads.net${href}`,
            authorUsername: username,
            authorAvatarUrl: avatarImg?.src || null,
            textSnippet,
          };
        }
      }
    }
  }

  // Strategy 3: Fallback - extract from current URL if on a post page
  const urlMatch = window.location.pathname.match(/\/@([^/]+)\/post\/([^/]+)/);
  if (urlMatch) {
    return {
      postUrl: window.location.href,
      authorUsername: urlMatch[1],
      authorAvatarUrl: null,
      textSnippet: extractMainPostText(),
    };
  }

  console.log("TrustAHuman Threads: Could not find parent post context");
  return null;
}

/**
 * Extract main post text from the page (for modal view)
 */
function extractMainPostText(): string | null {
  // Look for longer text content in span elements
  const textElements = document.querySelectorAll('span[dir="auto"] > span, span[dir="auto"]');
  for (const el of textElements) {
    const text = el.textContent?.trim() || "";
    // Skip short text (UI elements)
    if (text.length > 30) {
      return text.length > 200 ? text.slice(0, 200) + "..." : text;
    }
  }
  return null;
}

/**
 * Wait for toast to appear and extract the activity URL
 * Toast appears with "Posted" text and a "View" link to the new post
 */
export async function waitForToastUrl(timeoutMs = 8000): Promise<string | null> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let resolved = false;

    const checkForToast = () => {
      if (resolved) return;

      // Look for toast with "Posted" text and View link
      const toastLinks = document.querySelectorAll<HTMLAnchorElement>('a[href*="/post/"]');

      for (const link of toastLinks) {
        const href = link.getAttribute("href");
        if (!href) continue;

        // Check if this link is inside a toast (has "Posted" nearby or "View" text)
        const parent = link.closest('li') || link.closest('[role="alert"]');
        if (parent) {
          const parentText = parent.textContent || "";
          if (parentText.includes("Posted") || link.textContent?.trim() === "View") {
            console.log("TrustAHuman Threads: Found toast URL:", href);
            resolved = true;
            // Return full URL
            const fullUrl = href.startsWith("http") ? href : `https://www.threads.net${href}`;
            resolve(fullUrl);
            return;
          }
        }
      }

      if (Date.now() - startTime < timeoutMs) {
        requestAnimationFrame(checkForToast);
      } else {
        console.log("TrustAHuman Threads: Toast timeout, no URL found");
        resolve(null);
      }
    };

    checkForToast();
  });
}

/**
 * Legacy function for compatibility
 */
export async function waitForSuccessToast(timeoutMs = 5000): Promise<boolean> {
  const url = await waitForToastUrl(timeoutMs);
  return url !== null;
}
