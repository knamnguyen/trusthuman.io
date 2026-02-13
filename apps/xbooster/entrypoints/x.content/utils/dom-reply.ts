/**
 * Poll for an element to appear in the DOM.
 * @param selector - CSS selector to query
 * @param timeout - Max time to wait in milliseconds (default: 10000)
 * @param interval - Polling interval in milliseconds (default: 300)
 * @returns The found element or null if timeout
 */
async function waitForElement(
  selector: string,
  timeout: number = 10000,
  interval: number = 300,
): Promise<HTMLElement | null> {
  const startTime = Date.now();
  console.log(`xBooster: Waiting for element: ${selector} (timeout: ${timeout}ms)`);

  return new Promise((resolve) => {
    const checkExist = setInterval(() => {
      const element = document.querySelector(selector) as HTMLElement | null;

      if (element) {
        clearInterval(checkExist);
        const elapsed = Date.now() - startTime;
        console.log(`xBooster: Found element: ${selector} (took ${elapsed}ms)`);
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkExist);
        console.warn(`xBooster: Element NOT found after ${timeout}ms: ${selector}`);
        resolve(null);
      }
    }, interval);
  });
}

/**
 * Poll for the Nth element matching a selector to appear.
 * @param selector - CSS selector
 * @param index - Zero-based index of element to wait for
 * @param timeout - Max time to wait in milliseconds
 * @param interval - Polling interval in milliseconds
 */
async function waitForElementByIndex(
  selector: string,
  index: number,
  timeout: number = 10000,
  interval: number = 300,
): Promise<HTMLElement | null> {
  const startTime = Date.now();
  console.log(`xBooster: Waiting for ${selector}[${index}] (timeout: ${timeout}ms)`);

  return new Promise((resolve) => {
    const checkExist = setInterval(() => {
      const elements = document.querySelectorAll(selector);

      if (elements.length > index) {
        clearInterval(checkExist);
        const elapsed = Date.now() - startTime;
        console.log(`xBooster: Found ${selector}[${index}] (took ${elapsed}ms, total: ${elements.length})`);
        resolve(elements[index] as HTMLElement);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkExist);
        console.warn(`xBooster: ${selector}[${index}] NOT found after ${timeout}ms (found ${elements.length})`);
        resolve(null);
      }
    }, interval);
  });
}

/**
 * Wait for the reply modal to close after submission.
 * @param timeout - Max time to wait in milliseconds (default: 10000)
 * @returns true if modal closed, false if still present
 */
async function waitForModalClose(timeout: number = 10000): Promise<boolean> {
  const startTime = Date.now();
  console.log(`xBooster: Waiting for modal [aria-labelledby="modal-header"] to close (timeout: ${timeout}ms)`);

  // Initial delay to let modal start closing
  await new Promise(r => setTimeout(r, 500));

  return new Promise((resolve) => {
    const checkClosed = setInterval(() => {
      const modal = document.querySelector('[aria-labelledby="modal-header"]');

      if (!modal) {
        clearInterval(checkClosed);
        const elapsed = Date.now() - startTime;
        console.log(`xBooster: Modal closed (took ${elapsed}ms)`);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkClosed);
        console.warn(`xBooster: Modal still open after ${timeout}ms - submission likely failed`);
        resolve(false);
      }
    }, 300);
  });
}

/**
 * Dismiss the reply modal if it's still open (e.g. after a failed attempt).
 * Clicks the close button or presses Escape.
 */
async function dismissModal(): Promise<void> {
  const modal = document.querySelector('[aria-labelledby="modal-header"]');
  if (!modal) {
    console.log("xBooster: dismissModal - No modal found, nothing to dismiss");
    return;
  }

  console.log("xBooster: dismissModal - Modal is open, attempting to dismiss...");
  // Try clicking the close button
  const closeBtn = modal.querySelector('[data-testid="app-bar-close"]') as HTMLElement | null;
  if (closeBtn) {
    console.log("xBooster: dismissModal - Found close button [data-testid='app-bar-close'], clicking...");
    closeBtn.click();
    await new Promise(r => setTimeout(r, 500));
    // Check for discard confirmation dialog
    const discardBtn = document.querySelector('[data-testid="confirmationSheetConfirm"]') as HTMLElement | null;
    if (discardBtn) {
      console.log("xBooster: dismissModal - Discard confirmation appeared, clicking confirm...");
      discardBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }
  } else {
    // Fallback: press Escape
    console.log("xBooster: dismissModal - No close button found, pressing Escape...");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await new Promise(r => setTimeout(r, 500));
    const discardBtn = document.querySelector('[data-testid="confirmationSheetConfirm"]') as HTMLElement | null;
    if (discardBtn) {
      console.log("xBooster: dismissModal - Discard confirmation appeared, clicking confirm...");
      discardBtn.click();
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Verify modal was dismissed
  const stillOpen = document.querySelector('[aria-labelledby="modal-header"]');
  if (stillOpen) {
    console.warn("xBooster: dismissModal - Modal is STILL open after dismiss attempt");
  } else {
    console.log("xBooster: dismissModal - Modal dismissed successfully");
  }
}

/**
 * Execute the full tweet posting flow once.
 * Returns success/failure for a single attempt.
 */
async function attemptPostTweet(
  tweetText: string,
  target: "mention" | "original",
): Promise<{ success: boolean; message?: string }> {
  // Snapshot tweet count before submitting (for verification later)
  const tweetCountBefore = document.querySelectorAll('[data-testid="tweet"]').length;
  console.log(`xBooster: Tweet count before submit: ${tweetCountBefore}`);

  // Step 1: Wait for and click the reply button (polling)
  const buttonIndex = target === "original" ? 0 : 1;
  console.log(`xBooster: Step 1 - Waiting for reply button [data-testid="reply"][${buttonIndex}] (target: ${target})...`);
  const replyBtn = await waitForElementByIndex('[data-testid="reply"]', buttonIndex, 10000);
  if (!replyBtn) {
    console.error(`xBooster: Step 1 FAILED - Reply button [${buttonIndex}] not found after 10s`);
    return { success: false, message: `Reply button [${buttonIndex}] not found after 10s` };
  }
  replyBtn.click();
  console.log(`xBooster: Step 1 PASSED - Clicked reply button [${buttonIndex}]`);

  // Step 2: Wait for the contenteditable textarea to appear
  console.log("xBooster: Step 2 - Waiting for textarea [data-testid='tweetTextarea_0']...");
  const editable = await waitForElement('[data-testid="tweetTextarea_0"]', 10000);
  if (!editable) {
    console.error("xBooster: Step 2 FAILED - Tweet textarea not found after 10s");
    return { success: false, message: "Tweet textarea not found after 10s" };
  }
  editable.focus();
  console.log("xBooster: Step 2 PASSED - Textarea found and focused");

  await new Promise(r => setTimeout(r, 500)); // Brief delay after focus

  // Step 3: Insert text and verify it was inserted
  console.log(`xBooster: Step 3 - Inserting text (${tweetText.length} chars)...`);
  document.execCommand("insertText", false, tweetText);
  await new Promise(r => setTimeout(r, 300)); // Let DOM update

  // Verify text was inserted by reading back from the editor
  const editorContent = editable.textContent?.trim() ?? "";
  console.log(`xBooster: Step 3 - Editor content after insert: "${editorContent.substring(0, 50)}..." (${editorContent.length} chars)`);
  if (!editorContent) {
    console.warn("xBooster: Step 3 - Text insertion FAILED, editor is empty. Trying fallback method...");
    // Fallback: try focusing inner contenteditable and re-inserting
    const editableDiv = editable.querySelector('[contenteditable="true"]') as HTMLElement | null ?? editable;
    console.log(`xBooster: Step 3 - Fallback: focusing ${editableDiv === editable ? "same element" : "inner contenteditable"}...`);
    editableDiv.focus();
    document.execCommand("selectAll");
    document.execCommand("insertText", false, tweetText);
    await new Promise(r => setTimeout(r, 300));

    const retryContent = editable.textContent?.trim() ?? "";
    console.log(`xBooster: Step 3 - Fallback result: "${retryContent.substring(0, 50)}..." (${retryContent.length} chars)`);
    if (!retryContent) {
      return { success: false, message: "Text insertion failed - editor remained empty after retry" };
    }
    console.log("xBooster: Step 3 - Fallback succeeded");
  }
  console.log(`xBooster: Step 3 PASSED - Text verified in editor (${editable.textContent?.length ?? 0} chars)`);

  // Step 4: Wait for submit button and click it
  console.log("xBooster: Step 4 - Waiting for tweet button...");
  const tweetBtn = await waitForElement('[data-testid="tweetButton"]', 10000);
  if (!tweetBtn) {
    return { success: false, message: "Tweet button not found after 10s" };
  }

  // Verify the button is enabled (not disabled)
  const ariaDisabled = tweetBtn.getAttribute("aria-disabled");
  const hasDisabled = tweetBtn.hasAttribute("disabled");
  console.log(`xBooster: Step 4 - Tweet button state: aria-disabled="${ariaDisabled}", disabled=${hasDisabled}`);

  if (ariaDisabled === "true" || hasDisabled) {
    console.warn("xBooster: Step 4 - Tweet button is DISABLED, waiting 1s for it to enable...");
    await new Promise(r => setTimeout(r, 1000));
    const ariaDisabled2 = tweetBtn.getAttribute("aria-disabled");
    const hasDisabled2 = tweetBtn.hasAttribute("disabled");
    console.log(`xBooster: Step 4 - After wait: aria-disabled="${ariaDisabled2}", disabled=${hasDisabled2}`);
    if (ariaDisabled2 === "true" || hasDisabled2) {
      return { success: false, message: "Tweet button is disabled - text may not have been recognized" };
    }
    console.log("xBooster: Step 4 - Button is now enabled");
  }

  tweetBtn.click();
  console.log("xBooster: Step 4 PASSED - Clicked submit button");

  // Step 5: Verify submission by waiting for modal to close
  console.log("xBooster: Step 5 - Waiting for modal to close (timeout: 10s)...");
  const modalClosed = await waitForModalClose(10000);
  if (!modalClosed) {
    console.error("xBooster: Step 5 FAILED - Modal did not close after 10s");
    return { success: false, message: "Modal did not close - submission may have failed" };
  }
  console.log("xBooster: Step 5 PASSED - Modal closed");

  // Step 6: Verify by matching submitted text against new tweet in DOM
  console.log("xBooster: Step 6 - Waiting 1s for DOM to update, then verifying tweet...");
  await new Promise(r => setTimeout(r, 1000)); // Let DOM update
  const tweetsAfter = document.querySelectorAll('[data-testid="tweet"]');
  console.log(`xBooster: Step 6 - Tweet count: before=${tweetCountBefore}, after=${tweetsAfter.length}`);

  if (tweetsAfter.length > tweetCountBefore) {
    // The second tweet element is our new reply
    const newTweet = tweetsAfter[1];
    const newTweetTextEl = newTweet?.querySelector('[data-testid="tweetText"]');
    const newTweetText = newTweetTextEl?.textContent?.trim() ?? "";
    console.log(`xBooster: Step 6 - New tweet text: "${newTweetText.substring(0, 80)}..."`);
    console.log(`xBooster: Step 6 - Submitted text: "${tweetText.substring(0, 80)}..."`);

    if (newTweetText === tweetText) {
      console.log('xBooster: Step 6 PASSED - Exact text match confirmed in DOM');
    } else {
      console.warn('xBooster: Step 6 WARN - Tweet appeared but text mismatch (X may have modified it)');
    }
  } else {
    console.warn('xBooster: Step 6 WARN - Modal closed but tweet count unchanged (may still be loading)');
  }

  console.log('xBooster: ===== ATTEMPT SUCCEEDED =====');
  return { success: true };
}

/**
 * Post a reply using DOM manipulation instead of GraphQL API calls.
 * Assumes the browser is already navigated to the tweet page.
 *
 * Includes automatic retry: if the first attempt fails, dismisses modal
 * and retries once before giving up.
 *
 * @param text - The reply text to post.
 * @param target - Which reply button to click:
 *   "mention" (default) = second button (replying to a reply on your tweet)
 *   "original" = first button (replying directly to the original tweet)
 */
export async function postTweetViaDOM(
  text: string,
  target: "mention" | "original" = "mention",
): Promise<{ success: boolean; message?: string }> {
  const tweetText = text.trim();
  if (!tweetText) return { success: false, message: "Empty tweet" };

  const MAX_ATTEMPTS = 3;
  let lastResult: { success: boolean; message?: string } = { success: false, message: "No attempts made" };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`xBooster: ========== Attempt ${attempt}/${MAX_ATTEMPTS} ==========`);

    try {
      const result = await attemptPostTweet(tweetText, target);

      if (result.success) {
        console.log(`xBooster: SUCCESS on attempt ${attempt}/${MAX_ATTEMPTS}`);
        return result;
      }

      lastResult = result;
      console.warn(`xBooster: FAILED attempt ${attempt}/${MAX_ATTEMPTS}: ${result.message}`);

      // If not the last attempt, dismiss any leftover modal and retry
      if (attempt < MAX_ATTEMPTS) {
        console.log(`xBooster: Cleaning up before retry attempt ${attempt + 1}...`);
        await dismissModal();
        console.log("xBooster: Waiting 3s before retry to let page stabilize...");
        await new Promise(r => setTimeout(r, 3000));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastResult = { success: false, message };
      console.error(`xBooster: EXCEPTION on attempt ${attempt}/${MAX_ATTEMPTS}:`, message);

      if (attempt < MAX_ATTEMPTS) {
        console.log(`xBooster: Cleaning up before retry attempt ${attempt + 1}...`);
        await dismissModal();
        console.log("xBooster: Waiting 3s before retry to let page stabilize...");
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  console.error(`xBooster: ALL ${MAX_ATTEMPTS} ATTEMPTS FAILED. Last error: ${lastResult.message}`);
  return lastResult;
}
