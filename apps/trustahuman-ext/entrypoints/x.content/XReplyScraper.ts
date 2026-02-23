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
 * Scrape reply context from the reply modal
 *
 * Selectors based on xBooster analysis:
 * - [data-testid="tweetTextarea_0"] - Reply text input
 * - [data-testid="tweetText"] - Tweet text content
 * - [data-testid="User-Name"] - Author info
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

    // Try to get the original tweet context from the modal or page
    // The modal shows the tweet being replied to above the textarea
    const modal = document.querySelector('[aria-labelledby="modal-header"]');
    let tweetAuthorHandle: string | undefined;
    let tweetAuthorName: string | undefined;
    let tweetTextSnippet: string | undefined;

    let tweetAuthorAvatarUrl: string | undefined;

    if (modal) {
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
      // The avatar is typically in the tweet container, look for pbs.twimg.com profile images
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

      // Check for modal close (fallback - no toast seen)
      const modal = document.querySelector('[aria-labelledby="modal-header"]');
      if (!modal) {
        const elapsed = Date.now() - startTime;
        // Only consider modal-close as success after some time has passed
        if (elapsed > 2000) {
          clearInterval(check);
          console.log("TrustAHuman X: Modal closed (no toast detected)");
          resolve({ success: true, message: "Modal closed without toast" });
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
