// Function to clean up old timestamp entries for commented authors (older than 7 days)
export default async function cleanupOldTimestampsAuthor(): Promise<void> {
  const storageKey = "commented_authors_timestamps";
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  return new Promise((resolve) => {
    chrome.storage.local.get([storageKey], (result) => {
      const authorTimestamps = result[storageKey] || {};
      const cleanedTimestamps: { [key: string]: number } = {};

      let removedCount = 0;
      for (const [authorName, timestamp] of Object.entries(authorTimestamps)) {
        if (typeof timestamp === "number" && now - timestamp < sevenDaysInMs) {
          cleanedTimestamps[authorName] = timestamp;
        } else {
          removedCount++;
        }
      }

      if (removedCount > 0) {
        chrome.storage.local.set({ [storageKey]: cleanedTimestamps }, () => {
          console.log(`Cleaned up ${removedCount} old timestamp entries`);
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}
