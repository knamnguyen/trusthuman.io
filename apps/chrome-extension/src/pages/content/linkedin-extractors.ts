/**
 * LinkedIn Data Extractors Service
 *
 * SERVICE CLASS - Handles DOM parsing and data extraction from LinkedIn
 * - Extracts post content, author information, and URNs from LinkedIn elements
 * - Provides utilities for parsing LinkedIn DOM structure
 * - Handles various LinkedIn post formats and edge cases
 * - Centralized data extraction logic separate from automation logic
 */

export interface PostData {
  content: string;
  authorName: string;
  urn: string;
  postElement: Element;
  authorElement: Element | null;
}

export interface AuthorInfo {
  name: string;
  element: Element | null;
}

export class LinkedInExtractors {
  /**
   * Extract post content from a LinkedIn post element
   */
  static extractPostContent(postElement: Element): string {
    console.log("🔍 Extracting post content from element:", postElement);

    // Multiple selectors for different LinkedIn post layouts
    const contentSelectors = [
      '.feed-shared-text__text-view span[dir="ltr"]',
      '.feed-shared-text span[dir="ltr"]',
      ".feed-shared-text__text-view .break-words span",
      ".feed-shared-text .break-words span",
      '[data-test-id="main-feed-activity-card__commentary"] span[dir="ltr"]',
      ".feed-shared-text__text-view",
      ".feed-shared-text",
      '.feed-shared-inline-show-more-text span[dir="ltr"]',
    ];

    for (const selector of contentSelectors) {
      const elements = postElement.querySelectorAll(selector);
      if (elements.length > 0) {
        let content = Array.from(elements)
          .map((el) => el.textContent?.trim())
          .filter((text) => text && text.length > 0)
          .join(" ");

        if (content.length > 10) {
          // Minimum meaningful content length
          console.log(`✅ Found content using selector: ${selector}`);
          console.log(`📝 Content preview: ${content.substring(0, 100)}...`);
          return content;
        }
      }
    }

    // Fallback: try to get any text content from the post
    const fallbackContent = postElement.textContent?.trim() || "";
    console.log(
      `⚠️ Using fallback content extraction: ${fallbackContent.substring(0, 100)}...`,
    );
    return fallbackContent;
  }

  /**
   * Extract author name from a LinkedIn post element
   */
  static extractAuthorName(postElement: Element): AuthorInfo {
    console.log("👤 Extracting author name from element:", postElement);

    // Multiple selectors for different LinkedIn author name locations
    const authorSelectors = [
      '.feed-shared-actor__name span[dir="ltr"]',
      ".feed-shared-actor__name .hoverable-link-text span",
      ".feed-shared-actor__name .hoverable-link-text",
      '.update-components-actor__name span[dir="ltr"]',
      ".update-components-actor__name .hoverable-link-text",
      '[data-test-id="main-feed-activity-card__actor"] span[dir="ltr"]',
      ".feed-shared-actor__name",
      ".update-components-actor__name",
    ];

    for (const selector of authorSelectors) {
      const authorElement = postElement.querySelector(selector);
      if (authorElement) {
        const authorName = authorElement.textContent?.trim();
        if (authorName && authorName.length > 0) {
          console.log(`✅ Found author using selector: ${selector}`);
          console.log(`👤 Author: ${authorName}`);
          return { name: authorName, element: authorElement };
        }
      }
    }

    console.log("⚠️ Could not extract author name");
    return { name: "Unknown Author", element: null };
  }

  /**
   * Extract LinkedIn URN (Unique Resource Name) from post element
   */
  static extractPostUrn(postElement: Element): string {
    console.log("🔗 Extracting URN from element:", postElement);

    // Look for URN in data attributes
    const urnAttributes = [
      "data-urn",
      "data-activity-urn",
      "data-post-urn",
      "data-shared-urn",
    ];

    for (const attr of urnAttributes) {
      const urn = postElement.getAttribute(attr);
      if (urn) {
        console.log(`✅ Found URN using attribute ${attr}: ${urn}`);
        return urn;
      }
    }

    // Look for URN in child elements
    const urnSelectors = [
      "[data-urn]",
      "[data-activity-urn]",
      "[data-post-urn]",
    ];

    for (const selector of urnSelectors) {
      const element = postElement.querySelector(selector);
      if (element) {
        const urn =
          element.getAttribute("data-urn") ||
          element.getAttribute("data-activity-urn") ||
          element.getAttribute("data-post-urn");
        if (urn) {
          console.log(`✅ Found URN using child selector ${selector}: ${urn}`);
          return urn;
        }
      }
    }

    // Fallback: try to extract URN from any link or button in the post
    const links = postElement.querySelectorAll(
      'a[href*="urn:"], button[data-urn]',
    );
    for (const link of Array.from(links)) {
      const href = link.getAttribute("href");
      const dataUrn = link.getAttribute("data-urn");

      if (href && href.includes("urn:")) {
        const urnMatch = href.match(/urn:[^&]+/);
        if (urnMatch) {
          console.log(`✅ Found URN from link href: ${urnMatch[0]}`);
          return urnMatch[0];
        }
      }

      if (dataUrn) {
        console.log(`✅ Found URN from button data-urn: ${dataUrn}`);
        return dataUrn;
      }
    }

    // Generate a fallback URN based on content hash
    const content = this.extractPostContent(postElement);
    const author = this.extractAuthorName(postElement);
    const fallbackUrn = `urn:generated:${this.hashCode(content + author.name)}`;

    console.log(`⚠️ Could not find URN, generated fallback: ${fallbackUrn}`);
    return fallbackUrn;
  }

  /**
   * Extract complete post data from a LinkedIn post element
   */
  static extractPostData(postElement: Element): PostData {
    const content = this.extractPostContent(postElement);
    const authorInfo = this.extractAuthorName(postElement);
    const urn = this.extractPostUrn(postElement);

    return {
      content,
      authorName: authorInfo.name,
      urn,
      postElement,
      authorElement: authorInfo.element,
    };
  }

  /**
   * Find all post elements on the current page
   */
  static findPostElements(): Element[] {
    const postSelectors = [
      ".feed-shared-update-v2",
      ".occludable-update",
      ".feed-shared-update-v2__content",
      '[data-test-id="main-feed-activity-card"]',
      ".update-components-update",
    ];

    const allPosts: Element[] = [];

    for (const selector of postSelectors) {
      const posts = document.querySelectorAll(selector);
      allPosts.push(...Array.from(posts));
    }

    // Remove duplicates by checking if elements are the same or nested
    const uniquePosts = allPosts.filter((post, index) => {
      return !allPosts.some(
        (other, otherIndex) =>
          otherIndex < index && (other === post || other.contains(post)),
      );
    });

    console.log(`🔍 Found ${uniquePosts.length} unique post elements`);
    return uniquePosts;
  }

  /**
   * Find comment button for a specific post element
   */
  static findCommentButton(postElement: Element): Element | null {
    const commentButtonSelectors = [
      '.social-actions-button[aria-label*="Comment"]',
      '.social-actions-button[data-test-id*="comment"]',
      '.react-button__trigger[aria-label*="Comment"]',
      '.social-action-button[aria-label*="Comment"]',
      'button[aria-label*="Comment"]',
      ".comment-button",
      'button[data-control-name="comment"]',
    ];

    for (const selector of commentButtonSelectors) {
      const button = postElement.querySelector(selector);
      if (button) {
        console.log(`✅ Found comment button using selector: ${selector}`);
        return button;
      }
    }

    console.log("⚠️ Could not find comment button");
    return null;
  }

  /**
   * Find comment text area for a specific post element
   */
  static findCommentTextArea(postElement: Element): Element | null {
    const textAreaSelectors = [
      '.ql-editor[contenteditable="true"]',
      'div[contenteditable="true"][role="textbox"]',
      ".mentions-texteditor__content",
      ".ql-editor",
      'div[data-placeholder*="comment"]',
      'div[aria-label*="comment"]',
    ];

    for (const selector of textAreaSelectors) {
      const textArea = postElement.querySelector(selector);
      if (textArea) {
        console.log(`✅ Found comment text area using selector: ${selector}`);
        return textArea;
      }
    }

    // Also check in the document for recently opened comment areas
    for (const selector of textAreaSelectors) {
      const textArea = document.querySelector(selector);
      if (textArea && this.isElementVisible(textArea)) {
        console.log(
          `✅ Found comment text area in document using selector: ${selector}`,
        );
        return textArea;
      }
    }

    console.log("⚠️ Could not find comment text area");
    return null;
  }

  /**
   * Find post button for submitting a comment
   */
  static findPostButton(
    context: Element | Document = document,
  ): Element | null {
    const postButtonSelectors = [
      'button[data-test-id="comment-submit-button"]',
      'button[aria-label*="Post comment"]',
      'button[data-control-name="comment.post"]',
      ".comments-comment-box__submit-button",
      'button[type="submit"][form*="comment"]',
      'button:has(span):contains("Post")',
      'button[data-control-name="add_comment"]',
    ];

    for (const selector of postButtonSelectors) {
      const button = context.querySelector(selector);
      if (button && this.isElementVisible(button)) {
        console.log(`✅ Found post button using selector: ${selector}`);
        return button;
      }
    }

    // Fallback: look for any button with "Post" text
    const buttons = context.querySelectorAll("button");
    for (const button of Array.from(buttons)) {
      if (
        button.textContent?.trim().toLowerCase().includes("post") &&
        this.isElementVisible(button)
      ) {
        console.log("✅ Found post button by text content");
        return button;
      }
    }

    console.log("⚠️ Could not find post button");
    return null;
  }

  /**
   * Check if an element is visible on the page
   */
  static isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      style.opacity !== "0"
    );
  }

  /**
   * Scroll element into view smoothly
   */
  static scrollIntoView(element: Element): void {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }

  /**
   * Generate a simple hash code for string content
   */
  private static hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Extract timestamp from post element if available
   */
  static extractPostTimestamp(postElement: Element): Date | null {
    const timeSelectors = [
      "time",
      '[data-test-id="feed-shared-actor__sub-description"] time',
      ".update-components-actor__sub-description time",
      ".feed-shared-actor__sub-description time",
    ];

    for (const selector of timeSelectors) {
      const timeElement = postElement.querySelector(selector);
      if (timeElement) {
        const datetime = timeElement.getAttribute("datetime");
        if (datetime) {
          return new Date(datetime);
        }

        const textContent = timeElement.textContent?.trim();
        if (textContent) {
          // Try to parse relative time like "2h", "1d", etc.
          const timeMatch = textContent.match(/(\d+)([hmd])/);
          if (timeMatch && timeMatch[1] && timeMatch[2]) {
            const value = parseInt(timeMatch[1]);
            const unit = timeMatch[2];
            const now = new Date();

            switch (unit) {
              case "h":
                return new Date(now.getTime() - value * 60 * 60 * 1000);
              case "d":
                return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
              case "m":
                return new Date(now.getTime() - value * 60 * 1000);
            }
          }
        }
      }
    }

    return null;
  }
}
