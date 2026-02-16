export async function loadCommentedAuthorsWithTimestamps(): Promise<
  Map<string, number>
> {
  const storageKey = "commented_authors_timestamps";
  return new Promise((resolve) => {
    chrome.storage.local.get([storageKey], (result) => {
      const authorTimestamps = result[storageKey] || {};
      resolve(
        new Map(
          Object.entries(authorTimestamps).map(([name, timestamp]) => [
            name,
            Number(timestamp),
          ]),
        ),
      );
    });
  });
}

export async function saveCommentedAuthorWithTimestamp(
  authorName: string,
): Promise<void> {
  const storageKey = "commented_authors_timestamps";
  const now = Date.now();
  return new Promise((resolve) => {
    chrome.storage.local.get([storageKey], (result) => {
      const authorTimestamps = result[storageKey] || {};
      authorTimestamps[authorName] = now;
      chrome.storage.local.set({ [storageKey]: authorTimestamps }, () =>
        resolve(),
      );
    });
  });
}

export function hasCommentedOnAuthorRecently(
  authorName: string,
  commentedAuthors: Map<string, number>,
  hoursWindow: number,
): boolean {
  const timestamp = commentedAuthors.get(authorName);
  if (!timestamp) return false;
  const now = Date.now();
  const hoursInMs = hoursWindow * 60 * 60 * 1000;
  return now - timestamp < hoursInMs;
}
