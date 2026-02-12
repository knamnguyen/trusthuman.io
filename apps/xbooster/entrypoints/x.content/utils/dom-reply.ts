const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Post a reply using DOM manipulation instead of GraphQL API calls.
 * Assumes the browser is already navigated to the tweet page.
 *
 * @param text - The reply text to post.
 * @param target - Which reply button to click:
 *   "mention" (default) = second button (replying to a reply on your tweet)
 *   "original" = first button (replying directly to the original tweet)
 *
 * Flow:
 * 1. Click the appropriate reply button
 * 2. Wait for modal, then focus the tweet textarea
 * 3. Insert text via execCommand (simulates normal typing)
 * 4. Click the submit button
 */
export async function postTweetViaDOM(
  text: string,
  target: "mention" | "original" = "mention",
): Promise<{ success: boolean; message?: string }> {
  try {
    const tweetText = text.trim();
    if (!tweetText) throw new Error("Empty tweet");

    // 1. Click the reply button
    const replyButtons = document.querySelectorAll('[data-testid="reply"]');
    const buttonIndex = target === "original" ? 0 : 1;
    const minButtons = buttonIndex + 1;
    if (replyButtons.length < minButtons) {
      throw new Error(`Reply button not found (need index ${buttonIndex}, found ${replyButtons.length})`);
    }
    (replyButtons[buttonIndex] as HTMLElement).click();
    console.log(`xBooster: Clicked reply button [${buttonIndex}] (${target})`);

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
