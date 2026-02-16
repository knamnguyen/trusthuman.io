/**
 * LinkedIn data extraction utilities for comment history pages (fixed version)
 */

/**
 * Parses LinkedIn time text into a Date object
 */
export function parseLinkedInTime(timeText: string): Date {
  timeText = timeText.trim().toLowerCase().replace(/\s+/g, "");
  const now = new Date();

  const match = timeText.match(/^(\d+)(s|m|h|d|w|mo|y)$/);
  if (match && match[1] && match[2]) {
    const num = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        return new Date(now.getTime() - num * 1000);
      case "m":
        return new Date(now.getTime() - num * 60 * 1000);
      case "h":
        return new Date(now.getTime() - num * 60 * 60 * 1000);
      case "d":
        return new Date(now.getTime() - num * 24 * 60 * 60 * 1000);
      case "w":
        return new Date(now.getTime() - num * 7 * 24 * 60 * 60 * 1000);
      case "mo": {
        const d = new Date(now);
        d.setMonth(now.getMonth() - num);
        return d;
      }
      case "y": {
        const d = new Date(now);
        d.setFullYear(now.getFullYear() - num);
        return d;
      }
    }
  }

  // Try parsing as absolute date
  let absd = Date.parse(timeText);
  if (!isNaN(absd)) return new Date(absd);

  // Try with current year
  absd = Date.parse(timeText + " " + now.getFullYear());
  if (!isNaN(absd)) return new Date(absd);

  return now;
}

/**
 * Gets all feed list items from the LinkedIn comment history page
 */
export function getFeedLis(): HTMLLIElement[] {
  const scrollContent = document.querySelector(
    ".scaffold-finite-scroll__content",
  );
  if (!scrollContent) return [];

  const ul = scrollContent.querySelector("ul");
  if (!ul) return [];

  return Array.from(ul.getElementsByTagName("li"));
}

/**
 * Extracts impression count from a list item
 */
export function getImpressions(li: HTMLLIElement): number {
  const impressionEl = li.querySelector(
    ".comments-comment-social-bar__impressions-count",
  );
  if (!impressionEl) return 0;

  const text = impressionEl.textContent || "";
  const match = text.replace(/,/g, "").match(/([\d]+)/);
  return match && match[1] ? parseInt(match[1], 10) : 0;
}

/**
 * Extracts time text from a list item
 */
export function getTime(li: HTMLLIElement): string | null {
  const timeEl = li.querySelector("time.comments-comment-meta__data");
  return timeEl?.textContent?.trim() || null;
}

/**
 * Gets the current user's name from LinkedIn page (cached after first call)
 */
let cachedUserName: string | null = null;

export function getYourName(): string | null {
  if (cachedUserName) return cachedUserName;

  const spans = document.getElementsByClassName(
    "comments-comment-meta__description-title",
  );
  for (let i = 0; i < spans.length; i++) {
    const span = spans[i] as HTMLElement;
    if (span?.textContent && span.parentElement?.innerText.includes("You")) {
      cachedUserName = span.textContent.trim();
      break;
    }
  }

  return cachedUserName;
}

/**
 * Post data interface for collected posts
 */
export interface PostData {
  li: HTMLLIElement;
  mainArticle: HTMLElement | null;
  isMine: boolean;
  impressions: number;
  hasReplies: boolean;
  postContainer: HTMLElement | null;
}

/**
 * Collects all posts with their metadata
 */
export function collectPosts(): PostData[] {
  const lis = getFeedLis();
  const name = getYourName();
  const posts: PostData[] = [];

  lis.forEach((li) => {
    const mainArticle = li.querySelector(
      "article.comments-comment-entity",
    ) as HTMLElement | null;

    let isMine = false;
    let impressions = -1;
    let hasReplies = false;

    if (mainArticle) {
      const author = mainArticle.querySelector(
        ".comments-comment-meta__description-title",
      );
      if (author && author.textContent?.trim() === name) {
        isMine = true;
        const impressionEl = mainArticle.querySelector(
          ".comments-comment-social-bar__impressions-count",
        );
        impressions = impressionEl ? getImpressions(li) : 0;
        const repliesCountEl = mainArticle.querySelector(
          ".comments-comment-social-bar__replies-count--cr",
        );
        hasReplies = !!(
          repliesCountEl &&
          parseInt(repliesCountEl.textContent?.replace(/,/g, "") || "0") > 0
        );
      }
    }

    const postContainer = li.querySelector(
      ".fie-impression-container",
    ) as HTMLElement | null;

    posts.push({
      li,
      mainArticle,
      isMine,
      impressions,
      hasReplies,
      postContainer,
    });
  });

  return posts;
}

/**
 * Formats a date for display
 */
export function formatDate(date: Date | null): string {
  return date
    ? date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";
}
