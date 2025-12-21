import axios from "axios";
import * as cheerio from "cheerio";

const LINKEDIN_BASE_URL = "https://www.linkedin.com";

/**
 * Comment data returned from LinkedIn scraping
 */
export interface LinkedInCommentData {
  title: string;
  comment: {
    urn: string;
    author: {
      name: string;
      profileUrl: string;
      avatarUrl: string | null;
    };
    text: string;
    relativeTime: string | null;
    reactions: number;
  };
  foundCommentId: boolean;
}

const ensureAbsoluteUrl = (href: string | null | undefined): string => {
  if (!href) {
    return "";
  }
  try {
    return new URL(href, LINKEDIN_BASE_URL).href;
  } catch {
    return href;
  }
};

const parseNumericText = (value: string | null | undefined): number => {
  if (!value) {
    return 0;
  }
  const digits = value.replace(/[^\d]/g, "");
  return Number.parseInt(digits, 10) || 0;
};

const extractCommentId = (
  urn: string | null | undefined = null,
): string | null => {
  if (!urn) {
    return null;
  }
  const fsdMatch = urn.match(/fsd_comment:\((\d+)/);
  if (fsdMatch && fsdMatch[1]) {
    return fsdMatch[1];
  }
  const commentMatch = urn.match(/comment:\(activity:\d+,(\d+)\)/);
  if (commentMatch && commentMatch[1]) {
    return commentMatch[1];
  }
  const digits = urn.match(/(\d{5,})/g);
  return digits && digits.length ? (digits[digits.length - 1] ?? null) : null;
};

/**
 * Fetch LinkedIn comment data from a public URL
 * @param url - LinkedIn comment URL with commentUrn parameter
 * @returns Comment data or null if not found
 */
export async function fetchLinkedInComment(
  url: string,
): Promise<LinkedInCommentData | null> {
  try {
    // Fetch HTML as browser
    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    const html = res.data as string;

    // Load into cheerio
    const $ = cheerio.load(html);

    // Extract comment URN from URL
    const urlObj = new URL(url);
    const commentUrn = urlObj.searchParams.get("commentUrn");
    const dashCommentUrn = urlObj.searchParams.get("dashCommentUrn");
    const targetCommentId =
      extractCommentId(commentUrn) ?? extractCommentId(dashCommentUrn);

    if (!targetCommentId) {
      return null;
    }

    // Find specific comment by ID
    const specificComment = $(
      `[data-semaphore-content-urn*="${targetCommentId}"]`,
    );

    if (!specificComment.length) {
      return null;
    }

    let foundAuthor = "";
    let foundText = "";
    let authorProfileUrl = "";
    let authorAvatarUrl = "";
    let relativeTime = "";
    let reactions = 0;
    const commentUrnAttr =
      specificComment.attr("data-semaphore-content-urn") ?? "";

    // Find container
    let container = specificComment.closest(
      "section.comment, .comment, .comments-comment-item, li",
    );

    if (!container.length || container.find(".comment__text").length === 0) {
      let current = specificComment.parent();
      let depth = 0;
      while (current.length && depth < 25) {
        if (
          current.find(".comment__text").length > 0 ||
          current.find(".attributed-text-segment-list__content").length > 0
        ) {
          container = current;
          break;
        }
        current = current.parent();
        depth += 1;
      }
    }

    const sectionContainer = container.closest("section.comment");
    if (sectionContainer.length) {
      container = sectionContainer;
    }

    if (container.length) {
      // Extract author
      const authorEl = container
        .find(
          ".comment__author-name, .comment__author, .comments-post-meta__name, .feed-shared-actor__name, .ivm-view-attr__img--centered",
        )
        .first();
      foundAuthor =
        authorEl.text().trim() ||
        container.find('a[href*="/in/"]').first().text().trim();
      authorProfileUrl = ensureAbsoluteUrl(authorEl.attr("href"));

      // Extract avatar
      const avatarEl = container
        .closest("section.comment")
        .find("img")
        .first();
      authorAvatarUrl =
        avatarEl.attr("data-delayed-url") ||
        avatarEl.attr("src") ||
        authorAvatarUrl;

      // Extract comment text
      const textEl = container
        .find(".comment__text, .attributed-text-segment-list__content")
        .first();
      foundText = textEl.text().trim();

      // Extract relative time
      relativeTime = container
        .find(".comment__duration-since")
        .first()
        .text()
        .trim();

      // Extract reactions
      const visibleReactionEls = container
        .find(".comment__reactions-count")
        .filter((_, el) => !$(el).hasClass("hidden"));
      const reactionsText =
        visibleReactionEls.first().text() ||
        container.find(".comment__reactions-count").last().text();
      reactions = parseNumericText(reactionsText);
    }

    return {
      title: $("title").text().trim(),
      comment: {
        urn: commentUrnAttr,
        author: {
          name: foundAuthor,
          profileUrl: authorProfileUrl,
          avatarUrl: authorAvatarUrl || null,
        },
        text: foundText,
        relativeTime: relativeTime || null,
        reactions,
      },
      foundCommentId: !!specificComment.length,
    };
  } catch (error) {
    // Return null on any error (network, parsing, etc.)
    return null;
  }
}
