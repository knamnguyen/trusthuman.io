// Function to clean up old post content hashes (older than 1 year)
export default async function cleanupOldPostHashes(
  commentedPostHashes: Map<string, number>,
): Promise<void> {
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  return new Promise((resolve) => {
    let removedCount = 0;
    const cleaned = new Map<string, number>();

    for (const [hash, timestamp] of commentedPostHashes) {
      if (now - timestamp < oneYearInMs) {
        cleaned.set(hash, timestamp);
      } else {
        removedCount++;
      }
    }

    if (removedCount > 0) {
      // Replace contents of the original Map
      commentedPostHashes.clear();
      for (const [hash, ts] of cleaned) {
        commentedPostHashes.set(hash, ts);
      }

      const hashesObject = Object.fromEntries(commentedPostHashes);
      chrome.storage.local.set({ commented_post_hashes: hashesObject }, () => {
        console.log(
          `Cleaned up ${removedCount} old post content hashes (older than 1 year)`,
        );
        resolve();
      });
    } else {
      console.log("No old post content hashes to clean up");
      resolve();
    }
  });
}
