// Utility: Extract current user's LinkedIn profile path (e.g. "/in/withkynam/")
// and persist it to chrome.storage.local under the key `usernameUrl`.
// Call this each time you want to refresh the stored username for the active account.

export default function saveCurrentUsernameUrl(): void {
  try {
    const anchor =
      document.querySelector<HTMLAnchorElement>(
        'a.profile-card-profile-link[href^="/in/"]',
      ) || document.querySelector<HTMLAnchorElement>('a[href^="/in/"]');

    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href) return;

    chrome.storage.local.set({ usernameUrl: href });
    console.log(`🔗 Saved usernameUrl to storage: ${href}`);
  } catch (err) {
    console.warn("Could not save usernameUrl:", err);
  }
}
