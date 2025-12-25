/**
 * Extract adjacent comments from a LinkedIn post container
 * Used to provide context to the AI for better comment generation
 */
export function extractAdjacentComments(
  postContainer: Element,
): { commentContent: string; likeCount: number; replyCount: number }[] {
  const comments: {
    commentContent: string;
    likeCount: number;
    replyCount: number;
  }[] = [];

  // Try to find comment elements - LinkedIn uses various selectors
  const commentElements = postContainer.querySelectorAll(
    '[data-id*="comment"], .comments-comment-item, .feed-shared-update-v2__comments-container article',
  );

  commentElements.forEach((el) => {
    const contentEl = el.querySelector(
      ".comments-comment-item__main-content, .feed-shared-inline-show-more-text",
    );
    const content = contentEl?.textContent?.trim();

    if (content && content.length > 0) {
      // Try to extract like count
      const likeEl = el.querySelector(
        '[aria-label*="like"], .comments-comment-social-bar__reactions-count',
      );
      const likeText = likeEl?.textContent?.trim() || "0";
      const likeCount = parseInt(likeText.replace(/\D/g, ""), 10) || 0;

      // Try to extract reply count
      const replyEl = el.querySelector(
        '[aria-label*="repl"], .comments-comment-social-bar__replies-count',
      );
      const replyText = replyEl?.textContent?.trim() || "0";
      const replyCount = parseInt(replyText.replace(/\D/g, ""), 10) || 0;

      comments.push({ commentContent: content, likeCount, replyCount });
    }
  });

  // Limit to top 5 comments to keep payload reasonable
  return comments.slice(0, 5);
}
