import wait from "@src/utils/wait";

type CommentInfo = {
  commentContent: string;
  likeCount: number;
  replyCount: number;
  commentedProfileUrl: string;
  commenterTitle: string;
};

function findNextSocialBar(startNode: Node): HTMLElement | null {
  let node: Node | null = startNode;
  const getParentElement = (n: Node | null): HTMLElement | null => {
    if (!n) return null;
    if (n instanceof HTMLElement) return n.parentElement;
    const parent = n.parentNode;
    return parent instanceof HTMLElement ? parent : null;
  };

  while (node) {
    const parentEl = getParentElement(node);
    node = node.nextSibling || (parentEl ? parentEl.nextSibling : null);
    if (!node) break;
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.classList.contains("comments-comment-social-bar--cr")) {
        return el;
      }
      const child = el.querySelector<HTMLElement>(
        ".comments-comment-social-bar--cr",
      );
      if (child) return child;
    }
  }
  return null;
}

function extractCommentInfo(item: HTMLElement): CommentInfo {
  const commentContent = (item.textContent || "").trim();

  const article = item.closest(
    ".comments-comment-entity",
  ) as HTMLElement | null;

  let commentedProfileUrl = "";
  let commenterTitle = "";

  if (article) {
    // Try the container itself if it is an anchor
    const containerAnchor = article.querySelector<HTMLAnchorElement>(
      ".comments-comment-meta__description-container",
    );
    if (
      containerAnchor &&
      containerAnchor.tagName === "A" &&
      containerAnchor.href
    ) {
      commentedProfileUrl = containerAnchor.href;
    } else {
      // Or a nested anchor inside the container
      const nestedAnchor = article.querySelector<HTMLAnchorElement>(
        ".comments-comment-meta__description-container a",
      );
      if (nestedAnchor && nestedAnchor.href) {
        commentedProfileUrl = nestedAnchor.href;
      }
    }

    const titleEl = article.querySelector<HTMLElement>(
      ".comments-comment-meta__description-title",
    );
    if (titleEl && titleEl.textContent) {
      commenterTitle = titleEl.textContent.trim();
    }
  }

  const socialBar = findNextSocialBar(item);
  let likeCount = 0;
  let replyCount = 0;

  if (socialBar) {
    const likeBtn = socialBar.querySelector(
      ".comments-comment-social-bar__reactions-count--cr",
    );
    if (likeBtn) {
      const likeSpan = likeBtn.querySelector("span");
      if (likeSpan && likeSpan.textContent) {
        const parsed = parseInt(likeSpan.textContent.replace(/\D/g, ""), 10);
        likeCount = isNaN(parsed) ? 0 : parsed;
      }
    }

    const replyEl = socialBar.querySelector(
      ".comments-comment-social-bar__replies-count--cr",
    );
    if (replyEl && replyEl.textContent) {
      const match = replyEl.textContent.match(/\d+/);
      replyCount = match ? parseInt(match[0]!, 10) : 0;
    }
  }

  return {
    commentContent,
    likeCount,
    replyCount,
    commentedProfileUrl,
    commenterTitle,
  };
}

export default async function loadAndExtractComments(
  postContainer: HTMLElement,
): Promise<CommentInfo[]> {
  try {
    const loadMoreBtn = postContainer.querySelector<HTMLElement>(
      ".comments-comments-list__load-more-comments-button--cr",
    );

    if (loadMoreBtn) {
      loadMoreBtn.click();
      await wait(1000);
    }

    const container = postContainer.querySelector<HTMLElement>(
      ".comments-comment-list__container",
    );

    if (!container) {
      console.log([]);
      return [];
    }

    const items = container.querySelectorAll<HTMLElement>(
      ".comments-comment-item__main-content",
    );

    if (items.length === 0) {
      console.log([]);
      return [];
    }

    const results: CommentInfo[] = Array.from(items).map((el) =>
      extractCommentInfo(el),
    );
    console.log(results);
    return results;
  } catch (e) {
    console.log([]);
    return [];
  }
}
