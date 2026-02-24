/**
 * X/Twitter Reply Scraper
 *
 * Detects when user submits a reply and extracts context from DOM.
 * Uses xBooster patterns for detecting success via toast.
 */

export interface XReplyContext {
  replyText: string;
  // Original tweet context (optional - for display purposes)
  tweetAuthorHandle?: string;
  tweetAuthorName?: string;
  tweetAuthorAvatarUrl?: string;
  tweetTextSnippet?: string;
}

/**
 * Scrape reply context from modal OR inline reply
 *
 * Selectors based on xBooster analysis:
 * - [data-testid="tweetTextarea_0"] - Reply text input
 * - [data-testid="tweetText"] - Tweet text content
 * - [data-testid="User-Name"] - Author info
 *
 * Inline replies:
 * - [data-testid="inline_reply_offscreen"] - Container for inline reply
 * - Parent tweet is the <article data-testid="tweet"> sibling before the inline container
 */
export function scrapeReplyContext(): XReplyContext | null {
  try {
    // Get reply text from the textarea
    const textarea = document.querySelector('[data-testid="tweetTextarea_0"]');
    const replyText = textarea?.textContent?.trim() || "";

    if (!replyText) {
      console.log("TrustAHuman X: No reply text found in textarea");
      return null;
    }

    let tweetAuthorHandle: string | undefined;
    let tweetAuthorName: string | undefined;
    let tweetTextSnippet: string | undefined;
    let tweetAuthorAvatarUrl: string | undefined;

    // Try modal first (reply via modal popup)
    const modal = document.querySelector('[aria-labelledby="modal-header"]');

    // Try inline reply if no modal
    const inlineReplyContainer = document.querySelector('[data-testid="inline_reply_offscreen"]');

    if (modal) {
      // === MODAL REPLY MODE ===
      console.log("TrustAHuman X: Detected modal reply mode");

      // Find the tweet text in the modal (first tweetText, which is the original)
      const tweetTextEl = modal.querySelector('[data-testid="tweetText"]');
      tweetTextSnippet = tweetTextEl?.textContent?.trim().slice(0, 280);

      // Find user name - it's in a complex structure
      const userNameEl = modal.querySelector('[data-testid="User-Name"]');
      if (userNameEl) {
        // Structure: contains display name and @handle
        const allText = userNameEl.textContent || "";
        // Handle format is typically @username
        const handleMatch = allText.match(/@(\w+)/);
        if (handleMatch) {
          tweetAuthorHandle = handleMatch[1];
        }
        // Display name is typically before the @handle
        const parts = allText.split("@");
        if (parts[0]) {
          tweetAuthorName = parts[0].trim();
        }
      }

      // Find author avatar - look for img with profile image URL
      const avatarImg = modal.querySelector('img[src*="pbs.twimg.com/profile_images"]') as HTMLImageElement | null;
      if (avatarImg) {
        tweetAuthorAvatarUrl = avatarImg.src;
      } else {
        // Fallback: check background-image style
        const avatarDiv = modal.querySelector('[style*="pbs.twimg.com/profile_images"]') as HTMLElement | null;
        if (avatarDiv) {
          const bgMatch = avatarDiv.style.backgroundImage?.match(/url\("?([^"]+)"?\)/);
          if (bgMatch?.[1]) {
            tweetAuthorAvatarUrl = bgMatch[1];
          }
        }
      }
    } else if (inlineReplyContainer) {
      // === INLINE REPLY MODE ===
      // The parent tweet is the <article data-testid="tweet"> that appears before
      // the inline reply container in the DOM (as a previous sibling or ancestor's sibling)
      console.log("TrustAHuman X: Detected inline reply mode");

      // Find the parent tweet article - it's typically a sibling element
      // Walk up from inline container to find a common ancestor, then find the tweet article
      let parentTweet: Element | null = null;

      // Method 1: Look for previous sibling article
      let sibling = inlineReplyContainer.previousElementSibling;
      while (sibling) {
        if (sibling.matches('[data-testid="tweet"]')) {
          parentTweet = sibling;
          break;
        }
        // Check if sibling contains a tweet
        const nestedTweet = sibling.querySelector('[data-testid="tweet"]');
        if (nestedTweet) {
          parentTweet = nestedTweet;
          break;
        }
        sibling = sibling.previousElementSibling;
      }

      // Method 2: Walk up and look for tweet in ancestors' siblings
      if (!parentTweet) {
        let current: Element | null = inlineReplyContainer;
        while (current && !parentTweet) {
          const parent = current.parentElement;
          if (!parent) break;

          // Look for previous sibling tweets at each level
          let prevSibling = current.previousElementSibling;
          while (prevSibling) {
            if (prevSibling.matches('[data-testid="tweet"]')) {
              parentTweet = prevSibling;
              break;
            }
            const nestedTweet = prevSibling.querySelector('[data-testid="tweet"]');
            if (nestedTweet) {
              parentTweet = nestedTweet;
              break;
            }
            prevSibling = prevSibling.previousElementSibling;
          }
          current = parent;
        }
      }

      // Method 3: Fallback - find the first tweet article on the page that's NOT in the inline reply area
      if (!parentTweet) {
        const allTweets = document.querySelectorAll('[data-testid="tweet"]');
        for (const tweet of allTweets) {
          // Make sure this tweet is not inside the inline reply container
          if (!inlineReplyContainer.contains(tweet)) {
            parentTweet = tweet;
            break;
          }
        }
      }

      if (parentTweet) {
        console.log("TrustAHuman X: Found parent tweet for inline reply");

        // Extract tweet text
        const tweetTextEl = parentTweet.querySelector('[data-testid="tweetText"]');
        tweetTextSnippet = tweetTextEl?.textContent?.trim().slice(0, 280);

        // Extract author info from User-Name
        const userNameEl = parentTweet.querySelector('[data-testid="User-Name"]');
        if (userNameEl) {
          const allText = userNameEl.textContent || "";
          const handleMatch = allText.match(/@(\w+)/);
          if (handleMatch) {
            tweetAuthorHandle = handleMatch[1];
          }
          const parts = allText.split("@");
          if (parts[0]) {
            tweetAuthorName = parts[0].trim();
          }
        }

        // Extract avatar
        const avatarImg = parentTweet.querySelector('img[src*="pbs.twimg.com/profile_images"]') as HTMLImageElement | null;
        if (avatarImg) {
          tweetAuthorAvatarUrl = avatarImg.src;
        }
      } else {
        console.warn("TrustAHuman X: Could not find parent tweet for inline reply");
      }
    } else {
      // No modal and no inline container - try to extract from current page context
      // This handles the case where user is on a tweet detail page
      console.log("TrustAHuman X: No modal or inline container, trying page context");

      const firstTweet = document.querySelector('[data-testid="tweet"]');
      if (firstTweet) {
        const tweetTextEl = firstTweet.querySelector('[data-testid="tweetText"]');
        tweetTextSnippet = tweetTextEl?.textContent?.trim().slice(0, 280);

        const userNameEl = firstTweet.querySelector('[data-testid="User-Name"]');
        if (userNameEl) {
          const allText = userNameEl.textContent || "";
          const handleMatch = allText.match(/@(\w+)/);
          if (handleMatch) {
            tweetAuthorHandle = handleMatch[1];
          }
          const parts = allText.split("@");
          if (parts[0]) {
            tweetAuthorName = parts[0].trim();
          }
        }

        const avatarImg = firstTweet.querySelector('img[src*="pbs.twimg.com/profile_images"]') as HTMLImageElement | null;
        if (avatarImg) {
          tweetAuthorAvatarUrl = avatarImg.src;
        }
      }
    }

    console.log("TrustAHuman X: Scraped reply context:", {
      replyText: replyText.slice(0, 50) + "...",
      tweetAuthorHandle,
      tweetAuthorName,
      tweetAuthorAvatarUrl: tweetAuthorAvatarUrl ? "found" : "not found",
    });

    return {
      replyText,
      tweetAuthorHandle,
      tweetAuthorName,
      tweetAuthorAvatarUrl,
      tweetTextSnippet,
    };
  } catch (err) {
    console.error("TrustAHuman X: Error scraping reply context:", err);
    return null;
  }
}

/**
 * Wait for the success toast and extract reply URL
 *
 * Toast structure:
 * <div data-testid="toast">
 *   <span>Your post was sent.</span>
 *   <a href="/username/status/123456789">View</a>
 * </div>
 *
 * Returns the full URL like https://x.com/username/status/123456789
 */
export async function waitForSuccessToast(
  timeout = 10000
): Promise<{ success: boolean; replyUrl?: string; message?: string }> {
  const startTime = Date.now();
  console.log(`TrustAHuman X: Waiting for success toast (timeout: ${timeout}ms)`);

  return new Promise((resolve) => {
    const check = setInterval(() => {
      // Check for rate limit
      const allSpans = document.querySelectorAll("span");
      for (const span of allSpans) {
        const text = span.textContent ?? "";
        if (text.includes("might be automated")) {
          clearInterval(check);
          console.warn("TrustAHuman X: Rate limit detected:", text);
          resolve({ success: false, message: "Rate limited: " + text });
          return;
        }
      }

      // Check for success toast
      const toast = document.querySelector('[data-testid="toast"]');
      if (toast) {
        const toastText = toast.textContent || "";
        if (toastText.includes("Your post was sent")) {
          clearInterval(check);

          // Extract reply URL from the View link
          const viewLink = toast.querySelector('a[href*="/status/"]') as HTMLAnchorElement | null;
          let replyUrl: string | undefined;

          if (viewLink) {
            const href = viewLink.getAttribute("href") || "";
            // Convert relative URL to absolute
            replyUrl = href.startsWith("/") ? `https://x.com${href}` : href;
            console.log("TrustAHuman X: Success toast found with reply URL:", replyUrl);
          } else {
            console.log("TrustAHuman X: Success toast found but no View link");
          }

          resolve({ success: true, replyUrl });
          return;
        }
      }

      // Check for modal close (fallback - no toast seen) - only for modal replies
      const modal = document.querySelector('[aria-labelledby="modal-header"]');
      const inlineReply = document.querySelector('[data-testid="inline_reply_offscreen"]');

      // For modal replies: check if modal closed
      if (!modal && !inlineReply) {
        const elapsed = Date.now() - startTime;
        // Only consider modal-close as success after some time has passed
        if (elapsed > 2000) {
          clearInterval(check);
          console.log("TrustAHuman X: Modal closed (no toast detected)");
          resolve({ success: true, message: "Modal closed without toast" });
          return;
        }
      }

      // For inline replies: check if textarea was cleared (indicates success)
      if (inlineReply) {
        const textarea = document.querySelector('[data-testid="tweetTextarea_0"]');
        const textContent = textarea?.textContent?.trim() || "";
        const elapsed = Date.now() - startTime;
        // If textarea is now empty after some time, assume success
        if (elapsed > 1500 && textContent === "") {
          clearInterval(check);
          console.log("TrustAHuman X: Inline reply textarea cleared (assuming success)");
          resolve({ success: true, message: "Inline reply submitted" });
          return;
        }
      }

      // Timeout
      if (Date.now() - startTime > timeout) {
        clearInterval(check);
        console.warn("TrustAHuman X: Timeout waiting for success toast");
        resolve({ success: false, message: "Timeout - no success indicator" });
      }
    }, 200);
  });
}
