const commentedPostHashes = new Map<string, number>();

/**
 * Load the map of commented post content hashes from chrome.storage and populate the in-memory cache.
 */
async function loadCommentedPostHashes(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["commented_post_hashes"], (result) => {
      const storedHashes = result.commented_post_hashes || {};
      commentedPostHashes.clear();
      Object.entries(storedHashes).forEach(([hash, timestamp]) => {
        commentedPostHashes.set(hash, Number(timestamp));
      });
      console.log(
        `Loaded ${commentedPostHashes.size} commented post hashes from storage`,
      );
      resolve();
    });
  });
}

/**
 * Persist a new commented post content hash into storage and the in-memory cache.
 */
async function saveCommentedPostHash(hash: string): Promise<void> {
  const timestamp = Date.now();
  commentedPostHashes.set(hash, timestamp);

  return new Promise((resolve) => {
    const hashesObject = Object.fromEntries(commentedPostHashes);
    chrome.storage.local.set({ commented_post_hashes: hashesObject }, () => {
      console.log(
        `Saved commented post hash: ${hash.slice(0, 12)}... at timestamp: ${timestamp}`,
      );
      resolve();
    });
  });
}

/**
 * Check if the given content hash has been commented on in this browser profile.
 */
function hasCommentedOnPostHash(hash: string): boolean {
  return commentedPostHashes.has(hash);
}

export {
  loadCommentedPostHashes,
  saveCommentedPostHash,
  hasCommentedOnPostHash,
  commentedPostHashes,
};
