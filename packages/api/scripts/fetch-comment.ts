import axios from "axios";
import * as cheerio from "cheerio";

const LINKEDIN_BASE_URL = "https://www.linkedin.com";

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

async function getLinkedInCommentFromUrl(url: string) {
  try {
    console.log(`Fetching URL: ${url}`);
    // 1) Fetch HTML as if we were a browser
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
    // console.log('HTML length:', html.length);
    // 2) Load into cheerio
    const $ = cheerio.load(html);
    // 3) Parse for comments
    // The user provided logic suggests looking for specific data attributes.
    // However, LinkedIn structure varies. We will try to dump all text first to see what we get if specific selectors fail.
    // Extract the specific comment URN from the URL if possible for filtering
    const urlObj = new URL(url);
    const commentUrn = urlObj.searchParams.get("commentUrn");
    const dashCommentUrn = urlObj.searchParams.get("dashCommentUrn");
    const targetCommentId =
      extractCommentId(commentUrn) ?? extractCommentId(dashCommentUrn);
    console.log("Target Comment URN:", commentUrn);
    console.log("Target Dash Comment URN:", dashCommentUrn);
    if (urlObj.searchParams.get("replyUrn")) {
      console.warn(
        "Reply URNs are not supported. Please provide a top-level comment link.",
      );
    }
    console.log("Resolved Comment ID:", targetCommentId);
    // Attempt to finding the article body or main feed update
    // LinkedIn public posts usually have some schema.org json-ld
    const jsonLd = $('script[type="application/ld+json"]');
    if (jsonLd.length) {
      console.log("Found JSON-LD data, parsing...");
      jsonLd.each((i, el) => {
        try {
          const data = JSON.parse($(el).html() || "{}");
          console.log("JSON-LD Type:", data["@type"]);
          // Sometimes comments are in specific fields
        } catch (e) {
          // ignore
        }
      });
    }
    // Try to find the specific comment text if it exists in the DOM
    // This part is tricky without exact selectors, using the generic approach from user
    const comments: { author?: string; text?: string; id?: string }[] = [];
    // General article/post scraping - trying to find ANY text that looks like a comment
    // Often linkedIn public pages have class names like 'comment' or 'feed-shared-update-v2__comment-content-body'
    // But classes are often obfuscated.
    // Let's dump all text that is in a paragraph or span that is long enough to be a comment
    // matching the specific ID might be hard if it's dynamic.
    // Check if the page says "Sign in"
    if ($("body").text().includes("Sign in to view more content")) {
      console.warn(
        'WARNING: Page contains "Sign in to view more content". Content might be hidden.',
      );
    }
    // Attempt to find the specific comment by URN if it's in the DOM
    // The URN usually appears in data-urn or id attributes
    // Search for the comment ID in the HTML
    if (!targetCommentId) {
      console.warn("Unable to resolve comment ID from provided URL.");
      return null;
    }

    const specificComment = $(
      `[data-semaphore-content-urn*="${targetCommentId}"]`,
    );
    let foundAuthor = "";
    let foundText = "";
    let authorHeadline = "";
    let authorProfileUrl = "";
    let authorAvatarUrl = "";
    let relativeTime = "";
    let reactions = 0;
    const commentUrnAttr =
      specificComment.attr("data-semaphore-content-urn") ?? "";

    if (specificComment.length) {
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
        const authorEl = container
          .find(
            ".comment__author-name, .comment__author, .comments-post-meta__name, .feed-shared-actor__name, .ivm-view-attr__img--centered",
          )
          .first();
        foundAuthor =
          authorEl.text().trim() ||
          container.find('a[href*="/in/"]').first().text().trim();
        authorProfileUrl = ensureAbsoluteUrl(authorEl.attr("href"));

        const avatarEl = container
          .closest("section.comment")
          .find("img")
          .first();
        authorAvatarUrl =
          avatarEl.attr("data-delayed-url") ||
          avatarEl.attr("src") ||
          authorAvatarUrl;

        const textEl = container
          .find(".comment__text, .attributed-text-segment-list__content")
          .first();
        foundText = textEl.text().trim();

        relativeTime = container
          .find(".comment__duration-since")
          .first()
          .text()
          .trim();

        const visibleReactionEls = container
          .find(".comment__reactions-count")
          .filter((_, el) => !$(el).hasClass("hidden"));
        const reactionsText =
          visibleReactionEls.first().text() ||
          container.find(".comment__reactions-count").last().text();
        reactions = parseNumericText(reactionsText);
      }
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
    console.error("Error fetching URL:", error);
    return null;
  }
}
(async () => {
  const url =
    "https://www.linkedin.com/feed/update/urn:li:activity:7404428637250281475?commentUrn=urn%3Ali%3Acomment%3A%28activity%3A7404428637250281475%2C7404432299532091393%29&dashCommentUrn=urn%3Ali%3Afsd_comment%3A%287404432299532091393%2Curn%3Ali%3Aactivity%3A7404428637250281475%29";
  const result = await getLinkedInCommentFromUrl(url);
  console.log("Result:", result);
})();
