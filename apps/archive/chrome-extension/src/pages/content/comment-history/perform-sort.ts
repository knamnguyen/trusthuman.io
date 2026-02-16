import type { PostData } from "./extract-linkedin-data";
import { collectPosts } from "./extract-linkedin-data";

/**
 * Sorting functions for LinkedIn comment history
 */

/**
 * Re-inserts posts in the DOM in the given order
 */
export function reinsertPosts(posts: PostData[]): void {
  if (!posts.length) return;

  const ul = posts[0]?.li.parentElement;
  if (!ul) return;

  for (const post of posts) {
    ul.appendChild(post.li);
  }
}

/**
 * Sorts posts by impressions (highest first, non-mine posts go to bottom)
 */
export function sortByImpressions(): void {
  const posts = collectPosts();

  posts.sort((a, b) => {
    // Posts that are not mine (impressions === -1) always go to the bottom
    if (a.impressions === -1 && b.impressions !== -1) return 1;
    if (b.impressions === -1 && a.impressions !== -1) return -1;
    // For mine, sort descending by impressions
    return b.impressions - a.impressions;
  });

  reinsertPosts(posts);
}

/**
 * Sorts posts by replies (posts with replies first)
 */
export function sortByReplies(): void {
  const posts = collectPosts();

  posts.sort((a, b) => {
    if (a.hasReplies !== b.hasReplies) {
      return b.hasReplies ? 1 : -1;
    }
    return 0;
  });

  reinsertPosts(posts);
}

/**
 * Generic async sort function with button state management
 */
export async function performSort(
  sortFn: () => void,
  button: HTMLButtonElement,
): Promise<void> {
  button.disabled = true;
  const originalText = button.textContent || "";
  button.textContent = "Sorting...";

  // Let UI update
  await new Promise((resolve) => setTimeout(resolve, 10));

  try {
    sortFn();
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
}
