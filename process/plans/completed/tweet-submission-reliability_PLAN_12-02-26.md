# Tweet Submission Reliability Enhancement

**Date:** 2026-02-12
**Complexity:** SIMPLE
**Status:** ⏳ PLANNED

## Overview

Improve the xBooster Chrome extension's tweet submission reliability by replacing fixed delays with intelligent DOM polling, adding submission verification, and implementing rate-limit protection via consecutive failure tracking. This prevents failed submissions from going undetected and automatically pauses the system after repeated failures.

## Quick Links

- [Goals](#goals-and-success-metrics)
- [Execution Brief](#execution-brief)
- [Scope](#scope)
- [Requirements](#functional-requirements)
- [Acceptance Criteria](#acceptance-criteria)
- [Implementation Checklist](#implementation-checklist)
- [Integration Notes](#integration-notes)

## Status Strip

| Phase | Status |
|-------|--------|
| DOM Helper Functions | ⏳ PLANNED |
| Submission Verification | ⏳ PLANNED |
| Send Guard Module | ⏳ PLANNED |
| Hook Integration | ⏳ PLANNED |
| Status Type Updates | ⏳ PLANNED |

---

## Goals and Success Metrics

### Goals
1. Replace brittle fixed delays with robust DOM element polling
2. Verify that tweet replies are actually submitted (modal closed + tweet appears)
3. Auto-pause the system after 3 consecutive failures to prevent API abuse detection
4. Improve debugging with clear failure messages

### Success Metrics
- 95%+ reduction in "element not found" errors when DOM is slow to render
- 100% detection of failed submissions (no silent failures)
- System auto-pauses after 3 consecutive failures
- Clear console warnings and status updates when rate-limited

---

## Execution Brief

### Phase 1: DOM Reply Improvements
**What happens:** Add `waitForElement()` helper that polls for selectors with timeout. Replace fixed delays for textarea and submit button with polling. Add post-submission verification.
**Test:** Manually test tweet submission with network throttling; verify polling finds elements and submission verification works.

### Phase 2: Send Guard Module
**What happens:** Create `send-guard.ts` with module-level failure counter and pause state. Expose functions: `recordSuccess()`, `recordFailure()`, `isPaused()`, `getPausedUntil()`, `resetPause()`.
**Test:** Import and call functions; verify counter increments and pause activates after 3 failures.

### Phase 3: Hook Integration
**What happens:** Update both `use-auto-run.ts` and `use-engage-auto-run.ts` to check pause state before sending, record outcomes, and break send loop if paused. Add `"rate-limited"` to status types.
**Test:** Force 3 failures by removing tweet button from DOM; verify system pauses and status shows "rate-limited".

### Expected Outcome
- [ ] Fixed delays replaced with intelligent polling (10s timeout)
- [ ] Submission verified by modal disappearance
- [ ] System auto-pauses after 3 consecutive failures for 60 minutes
- [ ] Both auto-run hooks respect send guard
- [ ] Clear console warnings when rate-limited

---

## Scope

### In Scope
- `waitForElement()` polling helper in `dom-reply.ts`
- Replace fixed delays for textarea and submit button with polling
- Submission verification: poll for modal to disappear
- Bonus verification: check for new tweet in DOM
- Shared send guard module with consecutive failure tracking
- 60-minute pause after 3 consecutive failures
- Integration in both `use-auto-run.ts` and `use-engage-auto-run.ts`
- `"rate-limited"` status type addition

### Out of Scope
- Detecting specific API rate limit messages from X
- Configurable pause duration (hardcoded 60 minutes is fine)
- Retry logic within a single send attempt (one attempt per tweet)
- Exponential backoff (simple counter-based pause is sufficient)

---

## Assumptions and Constraints

### Assumptions
1. Modal `[aria-labelledby="modal-header"]` reliably appears when reply dialog is open
2. Modal disappearing within 10s indicates successful submission
3. Reply buttons maintain current `data-testid="reply"` selector
4. Tweet textarea maintains `data-testid="tweetTextarea_0"` selector
5. Submit button maintains `data-testid="tweetButton"` selector

### Constraints
1. Must work with DOM manipulation (no access to X's GraphQL API)
2. Cannot detect X's actual rate limit messages (working with heuristics)
3. Must preserve existing function signatures for `postTweetViaDOM()`
4. Module-level state in send guard (cannot use React state)

---

## Functional Requirements

### DOM Polling
- [ ] **FR-1:** Create `waitForElement(selector, timeout, interval)` helper function
  - Default timeout: 10000ms (10 seconds)
  - Default interval: 300ms
  - Returns found element or null on timeout

### DOM Reply Improvements
- [ ] **FR-2:** After clicking reply button, use `waitForElement` to poll for `[data-testid="tweetTextarea_0"]` (replaces fixed 1500ms delay)
- [ ] **FR-3:** After inserting text, use `waitForElement` to poll for `[data-testid="tweetButton"]` (replaces fixed 1000ms delay)
- [ ] **FR-4:** After clicking submit, poll for modal `[aria-labelledby="modal-header"]` to disappear (10s timeout)
- [ ] **FR-5:** If modal doesn't disappear, return `{ success: false, message: "Modal did not close - submission may have failed" }`
- [ ] **FR-6:** (Bonus) After modal closes, check for second `[data-testid="tweet"]` element existence
- [ ] **FR-7:** Return `{ success: true }` only when modal is gone

### Send Guard Module
- [ ] **FR-8:** Create `send-guard.ts` with module-level state:
  - `consecutiveFailures: number = 0`
  - `pausedUntil: number | null = null`
- [ ] **FR-9:** `recordSuccess()` - resets `consecutiveFailures` to 0
- [ ] **FR-10:** `recordFailure()` - increments counter; if >= 3, sets `pausedUntil` to now + 60 minutes
- [ ] **FR-11:** `isPaused()` - returns true if `pausedUntil` is set and still in future
- [ ] **FR-12:** `getPausedUntil()` - returns pause timestamp or null
- [ ] **FR-13:** `resetPause()` - clears pause state and resets counter
- [ ] **FR-14:** Console warning when pause activates: `"xBooster: 3 consecutive failures, pausing for 60 minutes"`

### Hook Integration
- [ ] **FR-15:** In `use-auto-run.ts`, before each send in loop, check `isPaused()`:
  - If paused, set status to `"rate-limited"`, break out of send loop
- [ ] **FR-16:** In `use-auto-run.ts`, after successful send, call `recordSuccess()`
- [ ] **FR-17:** In `use-auto-run.ts`, after failed send, call `recordFailure()`, then check `isPaused()` and break if now paused
- [ ] **FR-18:** Add `"rate-limited"` to `AutoRunStatus` type union
- [ ] **FR-19:** Repeat FR-15 through FR-18 for `use-engage-auto-run.ts` with `EngageAutoRunStatus` type

---

## Non-Functional Requirements

- **Reliability:** Polling must handle slow DOM rendering (common with network throttling)
- **Performance:** 300ms polling interval is fast enough without excessive CPU usage
- **Observability:** Clear console logs for timeout failures and rate-limit pauses
- **Safety:** System pauses before X can detect abuse patterns

---

## Acceptance Criteria

- [ ] **AC-1:** With network throttling (slow 3G), tweet submission succeeds (polling finds elements)
- [ ] **AC-2:** When submit button is missing, `waitForElement` returns null and error is logged
- [ ] **AC-3:** When modal doesn't close after submit, failure is detected and recorded
- [ ] **AC-4:** After 3 consecutive failures, system pauses for 60 minutes
- [ ] **AC-5:** During pause, status shows `"rate-limited"` in UI
- [ ] **AC-6:** After successful send, consecutive failure counter resets
- [ ] **AC-7:** Console shows clear warnings: "3 consecutive failures, pausing for 60 minutes"
- [ ] **AC-8:** Send loop breaks immediately when paused (doesn't attempt remaining tweets)
- [ ] **AC-9:** Next cycle scheduled normally even when rate-limited (guard blocks sends until pause expires)

---

## Implementation Checklist

Copy this checklist into Cursor Plan mode for step-by-step execution:

```
[ ] 1. In dom-reply.ts, add waitForElement() helper at top of file:
    - Parameters: selector (string), timeout (number, default 10000), interval (number, default 300)
    - Implementation: Poll with setInterval until element found or timeout
    - Return: HTMLElement | null
[ ] 2. In postTweetViaDOM(), after clicking reply button, replace fixed delay with:
    - const editable = await waitForElement('[data-testid="tweetTextarea_0"]', 10000)
    - If null, throw new Error("Tweet textarea not found after 10s")
[ ] 3. Remove the 1500ms delay after clicking reply button
[ ] 4. After document.execCommand(), replace fixed delay with:
    - const tweetBtn = await waitForElement('[data-testid="tweetButton"]', 10000) as HTMLElement | null
    - If null, throw new Error("Tweet button not found after 10s")
[ ] 5. Remove the 1000ms delay after inserting text
[ ] 6. After tweetBtn.click(), add submission verification:
    - Create waitForModalClose() helper that polls for modal to disappear
    - Wait 500ms initial delay (let modal start closing)
    - Poll for up to 10s checking if modal is gone
    - If modal still present after 10s, return { success: false, message: "Modal did not close..." }
[ ] 7. (Bonus) After modal closes, check for second [data-testid="tweet"] element
[ ] 8. Return { success: true } only when modal disappears
[ ] 9. Create new file send-guard.ts in same directory as dom-reply.ts
[ ] 10. In send-guard.ts, add module-level state:
    - let consecutiveFailures = 0
    - let pausedUntil: number | null = null
[ ] 11. Implement recordSuccess(): resets consecutiveFailures to 0
[ ] 12. Implement recordFailure():
    - Increment consecutiveFailures
    - If >= 3, set pausedUntil = Date.now() + 60 * 60 * 1000
    - Console.warn("xBooster: 3 consecutive failures, pausing for 60 minutes")
[ ] 13. Implement isPaused(): return pausedUntil !== null && Date.now() < pausedUntil
[ ] 14. Implement getPausedUntil(): return pausedUntil
[ ] 15. Implement resetPause(): clear pausedUntil and reset consecutiveFailures
[ ] 16. In use-auto-run.ts, import send guard functions at top
[ ] 17. In use-auto-run.ts, add "rate-limited" to AutoRunStatus type union
[ ] 18. In send loop (line 144), before for loop, check isPaused():
    - If paused, setStatus("rate-limited"), break out of loop
[ ] 19. After line 163 (repliesStore.markSent), add: recordSuccess()
[ ] 20. After line 170 (error setReply), add:
    - recordFailure()
    - if (isPaused()) { setStatus("rate-limited"); break; }
[ ] 21. In use-engage-auto-run.ts, import send guard functions at top
[ ] 22. In use-engage-auto-run.ts, add "rate-limited" to EngageAutoRunStatus type union
[ ] 23. In processSource send loop (line 167), before for loop, check isPaused():
    - If paused, setStatus("rate-limited"), return sentCount
[ ] 24. After line 185 (repliesStore.markSent), add: recordSuccess()
[ ] 25. After line 192 (error setReply), add:
    - recordFailure()
    - if (isPaused()) { setStatus("rate-limited"); return sentCount; }
[ ] 26. Test: Manual tweet submission with network throttling (slow 3G)
[ ] 27. Test: Force 3 failures by temporarily removing tweet button selector; verify pause activates
[ ] 28. Test: Verify status shows "rate-limited" in both auto-run UIs
```

---

## Detailed Code Changes

### 1. `/Users/knamnguyen/conductor/workspaces/engagekit-turborepo/missoula/apps/xbooster/entrypoints/x.content/utils/dom-reply.ts`

**Add at top (before postTweetViaDOM):**

```typescript
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

  return new Promise((resolve) => {
    const checkExist = setInterval(() => {
      const element = document.querySelector(selector) as HTMLElement | null;

      if (element) {
        clearInterval(checkExist);
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkExist);
        console.warn(`xBooster: Element not found after ${timeout}ms: ${selector}`);
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

  // Initial delay to let modal start closing
  await new Promise(r => setTimeout(r, 500));

  return new Promise((resolve) => {
    const checkClosed = setInterval(() => {
      const modal = document.querySelector('[aria-labelledby="modal-header"]');

      if (!modal) {
        clearInterval(checkClosed);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkClosed);
        console.warn('xBooster: Modal did not close after submission');
        resolve(false);
      }
    }, 300);
  });
}
```

**Replace postTweetViaDOM function:**

```typescript
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

    // 2. Wait for the contenteditable textarea to appear
    const editable = await waitForElement('[data-testid="tweetTextarea_0"]', 10000);
    if (!editable) throw new Error("Tweet textarea not found after 10s");
    editable.focus();

    await new Promise(r => setTimeout(r, 500)); // Brief delay after focus

    // 3. Insert text via execCommand
    document.execCommand("insertText", false, tweetText);

    // 4. Wait for submit button to appear
    const tweetBtn = await waitForElement('[data-testid="tweetButton"]', 10000);
    if (!tweetBtn) throw new Error("Tweet button not found after 10s");
    tweetBtn.click();

    // 5. Verify submission by waiting for modal to close
    const modalClosed = await waitForModalClose(10000);
    if (!modalClosed) {
      return {
        success: false,
        message: "Modal did not close - submission may have failed"
      };
    }

    // 6. Bonus verification: Check for new tweet in DOM
    await new Promise(r => setTimeout(r, 1000)); // Let DOM update
    const tweets = document.querySelectorAll('[data-testid="tweet"]');
    if (tweets.length >= 2) {
      console.log('xBooster: Tweet submission verified (found new tweet in DOM)');
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('xBooster: Tweet submission error:', message);
    return { success: false, message };
  }
}
```

---

### 2. `/Users/knamnguyen/conductor/workspaces/engagekit-turborepo/missoula/apps/xbooster/entrypoints/x.content/utils/send-guard.ts` (NEW FILE)

```typescript
/**
 * Shared send guard for tracking consecutive failures across both auto-run hooks.
 * Automatically pauses sending after 3 consecutive failures for 60 minutes.
 */

let consecutiveFailures = 0;
let pausedUntil: number | null = null;

/**
 * Record a successful send. Resets the consecutive failure counter.
 */
export function recordSuccess(): void {
  consecutiveFailures = 0;
}

/**
 * Record a failed send. Increments counter and pauses after 3 failures.
 */
export function recordFailure(): void {
  consecutiveFailures++;

  if (consecutiveFailures >= 3) {
    pausedUntil = Date.now() + 60 * 60 * 1000; // 60 minutes from now
    console.warn(
      `xBooster: 3 consecutive failures detected. Pausing all sends for 60 minutes until ${new Date(pausedUntil).toLocaleTimeString()}`
    );
  }
}

/**
 * Check if sending is currently paused due to consecutive failures.
 */
export function isPaused(): boolean {
  if (pausedUntil === null) return false;

  const now = Date.now();
  if (now >= pausedUntil) {
    // Pause expired, auto-reset
    pausedUntil = null;
    consecutiveFailures = 0;
    console.log('xBooster: Send pause expired. Resuming normal operation.');
    return false;
  }

  return true;
}

/**
 * Get the timestamp when the pause will expire, or null if not paused.
 */
export function getPausedUntil(): number | null {
  return pausedUntil;
}

/**
 * Manually reset the pause state and failure counter.
 */
export function resetPause(): void {
  pausedUntil = null;
  consecutiveFailures = 0;
  console.log('xBooster: Send guard reset manually.');
}
```

---

### 3. `/Users/knamnguyen/conductor/workspaces/engagekit-turborepo/missoula/apps/xbooster/entrypoints/x.content/hooks/use-auto-run.ts`

**Add import at top:**

```typescript
import { isPaused, recordSuccess, recordFailure } from "../utils/send-guard";
```

**Update AutoRunStatus type (line 15):**

```typescript
type AutoRunStatus = "idle" | "fetching" | "generating" | "sending" | "waiting" | "rate-limited";
```

**Update send loop (starting at line 141):**

```typescript
// 5. Send replies with randomized delays (capped by maxSendsPerCycle)
setStatus("sending");

// Check if paused before sending
if (isPaused()) {
  setStatus("rate-limited");
  return;
}

const sendableCount = Math.min(actionable.length, settings.maxSendsPerCycle);
for (let i = 0; i < sendableCount; i++) {
  if (abortRef.current) return;

  const mention = actionable[i]!;
  const reply = useRepliesStore.getState().replies[mention.tweetId];
  if (!reply?.text.trim() || reply.status !== "ready") continue;

  repliesStore.setReply(mention.tweetId, { status: "sending" });

  // Navigate to tweet page for DOM manipulation
  const tweetPath = `/${mention.authorHandle}/status/${mention.tweetId}`;
  navigateX(tweetPath);
  await new Promise((r) => setTimeout(r, 2000));
  if (abortRef.current) return;

  // Use DOM manipulation instead of GraphQL API (mimic request) to avoid detection
  const result = await postTweetViaDOM(reply.text);

  if (result.success) {
    repliesStore.markSent(mention.tweetId);
    recordSuccess(); // Reset failure counter
    sentCount++;
  } else {
    repliesStore.setReply(mention.tweetId, {
      status: "error",
      error: result.message ?? "Failed to send reply",
    });
    recordFailure(); // Increment failure counter

    // Check if now paused and break loop
    if (isPaused()) {
      setStatus("rate-limited");
      break;
    }
  }

  // Random delay between sends (skip after last)
  if (i < sendableCount - 1) {
    const delay =
      randomBetween(settings.sendDelayMin, settings.sendDelayMax) * 1000;
    await new Promise((r) => setTimeout(r, delay));
  }
}
```

---

### 4. `/Users/knamnguyen/conductor/workspaces/engagekit-turborepo/missoula/apps/xbooster/entrypoints/x.content/engage-tab/hooks/use-engage-auto-run.ts`

**Add import at top:**

```typescript
import { isPaused, recordSuccess, recordFailure } from "../../utils/send-guard";
```

**Update EngageAutoRunStatus type (line 17):**

```typescript
type EngageAutoRunStatus =
  | "idle"
  | "fetching"
  | "generating"
  | "sending"
  | "waiting"
  | "source-delay"
  | "rate-limited";
```

**Update send loop in processSource (starting at line 159):**

```typescript
// 4. Send replies (capped by maxSendsPerSource)
setStatus("sending");

// Check if paused before sending
if (isPaused()) {
  setStatus("rate-limited");
  return sentCount;
}

let sentCount = 0;
const sendableCount = Math.min(
  actionable.length,
  settings.maxSendsPerSource,
);

for (let i = 0; i < sendableCount; i++) {
  if (abortRef.current) return sentCount;

  const tweet = actionable[i]!;
  const reply =
    useEngageRepliesStore.getState().replies[tweet.tweetId];
  if (!reply?.text.trim() || reply.status !== "ready") continue;

  repliesStore.setReply(tweet.tweetId, { status: "sending" });

  // Navigate to tweet page for DOM manipulation
  navigateX(tweet.url);
  await new Promise((r) => setTimeout(r, 2000));
  if (abortRef.current) return sentCount;

  // Use DOM manipulation to post reply (target first reply button for original tweets)
  const sendResult = await postTweetViaDOM(reply.text, "original");

  if (sendResult.success) {
    repliesStore.markSent(tweet.tweetId);
    recordSuccess(); // Reset failure counter
    sentCount++;
  } else {
    repliesStore.setReply(tweet.tweetId, {
      status: "error",
      error: sendResult.message ?? "Failed to send reply",
    });
    recordFailure(); // Increment failure counter

    // Check if now paused and exit
    if (isPaused()) {
      setStatus("rate-limited");
      return sentCount;
    }
  }

  // Random delay between sends (skip after last)
  if (i < sendableCount - 1) {
    const delay =
      randomBetween(settings.sendDelayMin, settings.sendDelayMax) * 1000;
    await new Promise((r) => setTimeout(r, delay));
  }
}

return sentCount;
```

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Modal selector changes | Low | High | Monitor console warnings; easy to update selector |
| Polling timeout too short | Low | Medium | 10s timeout is generous; increase if needed |
| False positives on failure | Low | Medium | Modal verification is reliable indicator |
| Pause duration too short | Low | Low | 60 min is reasonable; can adjust if needed |

---

## Integration Notes

### Dependencies
- No new external dependencies
- Uses native DOM APIs (querySelector, setInterval)
- Works with existing store infrastructure

### Environment
- No new environment variables needed
- No API changes

### Files Modified
1. `/Users/knamnguyen/conductor/workspaces/engagekit-turborepo/missoula/apps/xbooster/entrypoints/x.content/utils/dom-reply.ts` - Add polling, verification
2. `/Users/knamnguyen/conductor/workspaces/engagekit-turborepo/missoula/apps/xbooster/entrypoints/x.content/utils/send-guard.ts` - NEW: Failure tracking
3. `/Users/knamnguyen/conductor/workspaces/engagekit-turborepo/missoula/apps/xbooster/entrypoints/x.content/hooks/use-auto-run.ts` - Guard integration
4. `/Users/knamnguyen/conductor/workspaces/engagekit-turborepo/missoula/apps/xbooster/entrypoints/x.content/engage-tab/hooks/use-engage-auto-run.ts` - Guard integration

### Testing Strategy
1. **Manual Testing:**
   - Enable Chrome DevTools network throttling (Slow 3G)
   - Trigger auto-run and verify elements are found via polling
   - Temporarily modify DOM (remove submit button) to force failures
   - Verify pause activates after 3 failures

2. **Console Verification:**
   - Check for "Element not found after Xs" warnings
   - Check for "3 consecutive failures, pausing" warnings
   - Check for "Tweet submission verified" success logs

3. **Status Verification:**
   - UI should show "rate-limited" status during pause
   - After 60 minutes, verify pause expires and sends resume

---

## Cursor + RIPER-5 Guidance

### Cursor Plan Mode
1. Import the Implementation Checklist above
2. Execute steps 1-28 sequentially
3. After each step, verify before proceeding
4. Mark steps complete as you go

### RIPER-5 Mode
- **RESEARCH:** ✅ Completed (problem identified, files analyzed)
- **INNOVATE:** ✅ Completed (polling + verification approach selected)
- **PLAN:** ✅ This document
- **EXECUTE:** Request explicitly with "ENTER EXECUTE MODE"
- **REVIEW:** After implementation, verify all acceptance criteria

### If Scope Expands
- If X changes selectors or modal behavior, pause
- Update this plan with new selectors before continuing
- Do not implement workarounds without planning

---

## Future Enhancements (Out of Scope)

- Detect X's actual rate limit error messages in modal
- Configurable pause duration via settings
- Exponential backoff (1st fail: 10 min, 2nd: 30 min, 3rd: 60 min)
- Retry failed tweets after pause expires
- UI notification showing pause expiration countdown
- Reset pause button in extension settings
