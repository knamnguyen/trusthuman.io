const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Post a reply using DOM manipulation instead of GraphQL API calls.
 * Assumes the browser is already navigated to the tweet page.
 *
 * Flow:
 * 1. Click the second reply button (first belongs to the parent/original tweet)
 * 2. Wait for modal, then focus the tweet textarea
 * 3. Insert text via execCommand (simulates normal typing)
 * 4. Click the submit button
 */
export async function postTweetViaDOM(
  text: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const tweetText = text.trim();
    if (!tweetText) throw new Error("Empty tweet");

    // 1. Click the second reply button (first one belongs to the parent tweet)
    const replyButtons = document.querySelectorAll('[data-testid="reply"]');
    if (replyButtons.length < 2) {
      throw new Error("Second reply button not found");
    }
    (replyButtons[1] as HTMLElement).click();
    console.log("xBooster: Clicked reply button");

    await delay(1500);

    // 2. Focus the contenteditable textarea
    const editable = document.querySelector(
      '[data-testid="tweetTextarea_0"]',
    ) as HTMLElement | null;
    if (!editable) {
      throw new Error("Tweet textarea not found");
    }
    editable.focus();
    console.log("xBooster: Focused editor");

    await delay(500);

    // 3. Insert text via execCommand (simulates normal typing events)
    document.execCommand("insertText", false, tweetText);
    console.log("xBooster: Inserted text");

    await delay(1000);

    // 4. Click the submit button
    const tweetBtn = document.querySelector(
      '[data-testid="tweetButton"]',
    ) as HTMLElement | null;
    if (!tweetBtn) {
      throw new Error("Tweet button not found");
    }
    tweetBtn.click();
    console.log("xBooster: Clicked submit");

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("xBooster: postTweetViaDOM error:", message);
    return { success: false, message };
  }
}
