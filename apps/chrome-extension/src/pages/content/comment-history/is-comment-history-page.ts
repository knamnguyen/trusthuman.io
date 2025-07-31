/**
 * Checks if the current URL matches a LinkedIn comment history page pattern
 * @returns true if the URL ends with `/recent-activity/comments/`
 */
export default function isCommentHistoryPage(): boolean {
  const url = window.location.href;
  return url.includes("/recent-activity/comments/");
}
