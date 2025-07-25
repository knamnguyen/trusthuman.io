const commentedPostUrns = new Map<string, number>();

/**
 * Load the map of commented post URNs from chrome.storage and populate the in-memory cache.
 */
async function loadCommentedPostUrns(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["commented_post_urns"], (result) => {
      const storedUrns = result.commented_post_urns || {};
      commentedPostUrns.clear();
      Object.entries(storedUrns).forEach(([urn, timestamp]) => {
        commentedPostUrns.set(urn, Number(timestamp));
      });
      console.log(
        `Loaded ${commentedPostUrns.size} commented post URNs from storage`,
      );
      resolve();
    });
  });
}

/**
 * Persist a new commented post URN into storage and the in-memory cache.
 */
async function saveCommentedPostUrn(urn: string): Promise<void> {
  const timestamp = Date.now();
  commentedPostUrns.set(urn, timestamp);

  return new Promise((resolve) => {
    const urnsObject = Object.fromEntries(commentedPostUrns);
    chrome.storage.local.set({ commented_post_urns: urnsObject }, () => {
      console.log(
        `Saved commented post URN: ${urn} at timestamp: ${timestamp}`,
      );
      resolve();
    });
  });
}

/**
 * Check if the given post URN has been commented on in this browser profile.
 */
function hasCommentedOnPostUrn(urn: string): boolean {
  return commentedPostUrns.has(urn);
}

export {
  loadCommentedPostUrns,
  saveCommentedPostUrn,
  hasCommentedOnPostUrn,
  commentedPostUrns,
};
