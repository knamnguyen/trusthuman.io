export default async function saveCommentedAuthorWithTimestamp(
  authorName: string,
): Promise<void> {
  const storageKey = "commented_authors_timestamps";
  const now = Date.now();
  return new Promise((resolve) => {
    chrome.storage.local.get([storageKey], (result) => {
      const authorTimestamps = result[storageKey] || {};
      authorTimestamps[authorName] = now;
      chrome.storage.local.set({ [storageKey]: authorTimestamps }, () => {
        resolve();
      });
    });
  });
}
