// Function to clean up old post URNs (older than 1 year)
export default async function cleanupOldPostUrns(
  commentedPostUrns: Map<string, number>,
): Promise<void> {
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  return new Promise((resolve) => {
    let removedCount = 0;
    const cleanedUrns = new Map<string, number>();

    for (const [urn, timestamp] of commentedPostUrns) {
      if (now - timestamp < oneYearInMs) {
        cleanedUrns.set(urn, timestamp);
      } else {
        removedCount++;
      }
    }

    if (removedCount > 0) {
      commentedPostUrns = cleanedUrns;
      const urnsObject = Object.fromEntries(commentedPostUrns);
      chrome.storage.local.set({ commented_post_urns: urnsObject }, () => {
        console.log(
          `Cleaned up ${removedCount} old post URNs (older than 1 year)`,
        );
        resolve();
      });
    } else {
      console.log("No old post URNs to clean up");
      resolve();
    }
  });
}
