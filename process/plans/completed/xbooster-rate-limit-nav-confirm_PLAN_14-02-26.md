# xBooster Rate Limit + Navigation Confirmation Implementation Plan

**Date**: 14-02-26
**Complexity**: SIMPLE (one-session feature)
**Estimated Duration**: 45-60 minutes

---

## Overview

This plan implements three interconnected features for the xBooster Chrome extension to improve tweet posting reliability and detection:

1. **Rate Limit + Success Toast Detection**: Enhanced post-submit DOM polling to detect both rate limit messages and success toasts immediately after submission
2. **Tweet Confirmation by Navigation**: Optional feature to navigate to the posted tweet and back for verification
3. **Unified Pause on Rate Limit**: Immediate pause when rate limit is detected (bypass 3-failure countdown)

---

## Goals

- Detect X.com rate limiting immediately when posting tweets (text: "might be automated")
- Detect successful post confirmation via toast (text: "Your post was sent")
- Provide optional navigation-based tweet confirmation for additional verification
- Pause all auto-run operations immediately upon rate limit detection
- Maintain backward compatibility with existing failure handling

---

## Scope

### In Scope
- Enhanced DOM polling for rate limit and success notifications
- New `isRateLimit` flag in return types and function signatures
- Navigation-based tweet confirmation with setting toggle
- Immediate pause logic when rate limit flag is true
- UI settings for enabling/disabling navigation confirmation
- Both Mentions and Engage auto-run hooks

### Out of Scope
- Changes to GraphQL API calls
- Modifications to retry logic (remains 3 attempts)
- UI for displaying rate limit status (handled by existing pause display)
- Changes to tweet generation or filtering logic

---

## Architecture Decisions

### Feature 1: Rate Limit + Success Toast Detection

**Approach**: Replace `waitForModalClose()` with enhanced `waitForPostOutcome()` that polls for three possible outcomes simultaneously:
1. Rate limit message (text contains "might be automated")
2. Success toast (text contains "Your post was sent")
3. Modal close (existing behavior)

**Return Type**: `{ closed: boolean; rateLimit: boolean; successToast: boolean }`

**Integration**: This combined polling happens in Step 5 of `attemptPostTweet()`, replacing the current `waitForModalClose()` call.

### Feature 2: Navigation Confirmation

**Approach**: Add optional Step 7 to `attemptPostTweet()` that:
1. Finds the new tweet element (already available as `tweetsAfter[1]`)
2. Extracts the status URL via `querySelector('a[href*="/status/"]')`
3. Clicks the anchor to navigate to the tweet
4. Waits 3s for page load
5. Navigates back using `navigateX(originalUrl)`
6. Waits 2s for page stabilization

**Configuration**: Accept `options?: { confirmByNavigation?: boolean }` parameter in `postTweetViaDOM()` and `attemptPostTweet()`.

**Default**: Enabled by default (`confirmTweetByNavigation: true` in settings).

### Feature 3: Unified Pause

**Approach**: Add `isRateLimit?: boolean` parameter to `recordFailure()`. When true:
- Skip the consecutive failure counter check
- Immediately set `pausedUntil = Date.now() + pauseMinutes * 60 * 1000`
- Log specific message about rate limit detection

**Backward Compatibility**: Existing `recordFailure()` calls without the parameter continue to work (defaults to false).

---

## Implementation Checklist

### Phase 1: Type Definitions and Return Types (5 min)

1. **Update `dom-reply.ts` return types**
   - Line 152: Change `attemptPostTweet()` return type from `Promise<{ success: boolean; message?: string }>` to `Promise<{ success: boolean; message?: string; isRateLimit?: boolean }>`
   - Line 282: Change `postTweetViaDOM()` return type to match: `Promise<{ success: boolean; message?: string; isRateLimit?: boolean }>`

### Phase 2: Enhanced Post-Submit Detection (15 min)

2. **Create `waitForPostOutcome()` helper in `dom-reply.ts`**
   - Add after `waitForModalClose()` function (after line 96)
   - Function signature: `async function waitForPostOutcome(timeout: number = 10000): Promise<{ closed: boolean; rateLimit: boolean; successToast: boolean }>`
   - Poll every 300ms for three conditions simultaneously:
     - Check if modal `[aria-labelledby="modal-header"]` is gone (closed)
     - Check for rate limit: `Array.from(document.querySelectorAll('span')).some(span => span.textContent?.includes('might be automated'))`
     - Check for success toast: `Array.from(document.querySelectorAll('span')).some(span => span.textContent?.includes('Your post was sent'))`
   - Return immediately when any condition is met (priority order: rateLimit > successToast > closed)
   - On timeout, return `{ closed: false, rateLimit: false, successToast: false }`
   - Include console logging for each outcome detection

3. **Replace `waitForModalClose()` with `waitForPostOutcome()` in `attemptPostTweet()`**
   - Line 236: Replace `const modalClosed = await waitForModalClose(10000);` with `const outcome = await waitForPostOutcome(10000);`
   - Line 237-240: Update logic:
     ```typescript
     if (outcome.rateLimit) {
       console.error("xBooster: Step 5 FAILED - Rate limit detected (might be automated)");
       return { success: false, message: "Rate limit detected - might be automated", isRateLimit: true };
     }
     if (!outcome.closed && !outcome.successToast) {
       console.error("xBooster: Step 5 FAILED - Modal did not close after 10s");
       return { success: false, message: "Modal did not close - submission may have failed" };
     }
     if (outcome.successToast) {
       console.log("xBooster: Step 5 PASSED - Success toast detected");
     }
     ```
   - Line 241: Keep existing "Modal closed" log

### Phase 3: Navigation Confirmation (15 min)

4. **Add options parameter to `attemptPostTweet()`**
   - Line 149: Update signature to `async function attemptPostTweet(tweetText: string, target: "mention" | "original", options?: { confirmByNavigation?: boolean })`

5. **Implement Step 7: Navigation Confirmation**
   - Add after Step 6 (after line 264), before the final success return (line 267)
   - Guard with `if (options?.confirmByNavigation && tweetsAfter.length > tweetCountBefore)`
   - Implementation:
     ```typescript
     // Step 7: Optional navigation confirmation
     if (options?.confirmByNavigation && tweetsAfter.length > tweetCountBefore) {
       console.log("xBooster: Step 7 - Navigation confirmation enabled, navigating to tweet...");
       const newTweet = tweetsAfter[1];
       const tweetAnchor = newTweet?.querySelector('a[href*="/status/"]') as HTMLAnchorElement | null;

       if (tweetAnchor) {
         const tweetUrl = tweetAnchor.href;
         const currentUrl = window.location.pathname + window.location.search;
         console.log(`xBooster: Step 7 - Navigating to ${tweetUrl}`);

         tweetAnchor.click();
         await new Promise(r => setTimeout(r, 3000)); // Wait for page load

         console.log(`xBooster: Step 7 - Navigating back to ${currentUrl}`);
         navigateX(currentUrl);
         await new Promise(r => setTimeout(r, 2000)); // Wait for page stabilization

         console.log("xBooster: Step 7 PASSED - Navigation confirmation complete");
       } else {
         console.warn("xBooster: Step 7 WARN - Tweet anchor not found, skipping navigation confirmation");
       }
     }
     ```

6. **Update `postTweetViaDOM()` to accept and pass options**
   - Line 282: Update signature to `export async function postTweetViaDOM(text: string, target: "mention" | "original" = "mention", options?: { confirmByNavigation?: boolean })`
   - Line 296: Update call to `attemptPostTweet()`: `const result = await attemptPostTweet(tweetText, target, options);`
   - Line 298-301: Ensure return statement passes through `isRateLimit` flag (already handled by spread)

### Phase 4: Unified Pause Logic (5 min)

7. **Update `recordFailure()` in `send-guard.ts`**
   - Line 20: Update signature to `export function recordFailure(pauseMinutes: number = 60, isRateLimit: boolean = false): void`
   - Line 21-29: Replace entire function body with:
     ```typescript
     if (isRateLimit) {
       // Immediate pause on rate limit detection
       const pauseMs = pauseMinutes * 60 * 1000;
       pausedUntil = Date.now() + pauseMs;
       consecutiveFailures = 0; // Don't count rate limits as failures
       console.warn(
         `xBooster: Rate limit detected. Pausing all sends immediately for ${pauseMinutes} minutes until ${new Date(pausedUntil).toLocaleTimeString()}`
       );
       return;
     }

     consecutiveFailures++;

     if (consecutiveFailures >= 3) {
       const pauseMs = pauseMinutes * 60 * 1000;
       pausedUntil = Date.now() + pauseMs;
       console.warn(
         `xBooster: 3 consecutive failures detected. Pausing all sends for ${pauseMinutes} minutes until ${new Date(pausedUntil).toLocaleTimeString()}`
       );
     }
     ```

### Phase 5: Settings Store Updates (5 min)

8. **Add `confirmTweetByNavigation` to `XBoosterSettings` interface**
   - File: `apps/xbooster/entrypoints/x.content/stores/settings-store.ts`
   - Line 26: Add after `failPauseMinutes`:
     ```typescript
     /** Navigate to posted tweet and back for confirmation */
     confirmTweetByNavigation: boolean;
     ```
   - Line 41: Add to `DEFAULT_SETTINGS`:
     ```typescript
     confirmTweetByNavigation: true,
     ```

9. **Add `confirmTweetByNavigation` to `EngageSettings` interface**
   - File: `apps/xbooster/entrypoints/x.content/engage-tab/stores/engage-settings-store.ts`
   - Line 29: Add after `failPauseMinutes`:
     ```typescript
     /** Navigate to posted tweet and back for confirmation */
     confirmTweetByNavigation: boolean;
     ```
   - Line 46: Add to `DEFAULT_ENGAGE_SETTINGS`:
     ```typescript
     confirmTweetByNavigation: true,
     ```

### Phase 6: Auto-Run Hook Updates (10 min)

10. **Update `use-auto-run.ts` to use new features**
    - Line 184: Update `postTweetViaDOM()` call to pass options:
      ```typescript
      const result = await postTweetViaDOM(reply.text, "mention", {
        confirmByNavigation: settings.confirmTweetByNavigation
      });
      ```
    - Line 208: Update `recordFailure()` call to pass rate limit flag:
      ```typescript
      recordFailure(settings.failPauseMinutes, result.isRateLimit ?? false);
      ```

11. **Update `use-engage-auto-run.ts` to use new features**
    - Line 207: Update `postTweetViaDOM()` call to pass options:
      ```typescript
      const sendResult = await postTweetViaDOM(reply.text, "original", {
        confirmByNavigation: settings.confirmTweetByNavigation
      });
      ```
    - Line 228: Update `recordFailure()` call to pass rate limit flag:
      ```typescript
      recordFailure(settings.failPauseMinutes, sendResult.isRateLimit ?? false);
      ```

### Phase 7: UI Settings (5 min)

12. **Add navigation confirmation toggle to `MentionsSettings` component**
    - File: `apps/xbooster/entrypoints/x.content/_components/SettingsSheet.tsx`
    - Add after "Fail Pause" section (after line 342, before "Auto-Prune" section)
    - Implementation:
      ```tsx
      {/* Navigation Confirmation */}
      <SettingsSection title="Navigation Confirmation">
        <p className="text-xs text-muted-foreground">
          Navigate to posted tweet and back for verification
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="mentions-nav-confirm"
            checked={settings.confirmTweetByNavigation}
            onChange={(e) =>
              updateSettings({
                confirmTweetByNavigation: e.target.checked,
              })
            }
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="mentions-nav-confirm" className="text-xs">
            Enable navigation confirmation
          </Label>
        </div>
      </SettingsSection>
      ```

13. **Add navigation confirmation toggle to `EngageSettingsPanel` component**
    - File: `apps/xbooster/entrypoints/x.content/_components/SettingsSheet.tsx`
    - Add after "Fail Pause" section (after line 673, before "History Cleanup" section)
    - Implementation:
      ```tsx
      {/* Navigation Confirmation */}
      <SettingsSection title="Navigation Confirmation">
        <p className="text-xs text-muted-foreground">
          Navigate to posted tweet and back for verification
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="engage-nav-confirm"
            checked={settings.confirmTweetByNavigation}
            onChange={(e) =>
              updateSettings({
                confirmTweetByNavigation: e.target.checked,
              })
            }
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="engage-nav-confirm" className="text-xs">
            Enable navigation confirmation
          </Label>
        </div>
      </SettingsSection>
      ```

---

## Acceptance Criteria

### Feature 1: Rate Limit Detection
- [ ] Rate limit message containing "might be automated" is detected within 5 seconds of submission
- [ ] Success toast containing "Your post was sent" is detected within 5 seconds of submission
- [ ] Rate limit detection returns `{ success: false, isRateLimit: true }` immediately
- [ ] Success toast detection allows normal flow to continue
- [ ] Console logs clearly indicate which outcome was detected

### Feature 2: Navigation Confirmation
- [ ] When enabled, extension navigates to posted tweet URL after successful post
- [ ] Navigation waits 3s for page load
- [ ] Extension navigates back to original page after viewing tweet
- [ ] Navigation back waits 2s for page stabilization
- [ ] Feature can be toggled on/off in both Mentions and Engage settings
- [ ] Default setting is enabled (`true`)
- [ ] Navigation only occurs when `confirmTweetByNavigation` setting is true
- [ ] Gracefully handles missing tweet anchor (logs warning, continues)

### Feature 3: Unified Pause
- [ ] When `isRateLimit: true`, pause occurs immediately (no 3-failure wait)
- [ ] Rate limit pause does NOT increment consecutive failure counter
- [ ] Regular failures still use 3-failure countdown logic
- [ ] Console log distinguishes rate limit pause from failure pause
- [ ] Existing auto-run hooks pass `isRateLimit` flag to `recordFailure()`
- [ ] Pause duration respects `failPauseMinutes` setting value

### Integration
- [ ] Both `use-auto-run.ts` and `use-engage-auto-run.ts` pass settings correctly
- [ ] Return types propagate `isRateLimit` flag through entire call chain
- [ ] Existing retry logic (3 attempts) still works with new features
- [ ] Settings persist across Chrome extension restarts
- [ ] UI toggles update settings store immediately

---

## Dependencies

### Internal
- `dom-reply.ts`: Core posting logic
- `send-guard.ts`: Failure tracking and pause management
- `settings-store.ts`: Mentions settings persistence
- `engage-settings-store.ts`: Engage settings persistence
- `use-auto-run.ts`: Mentions auto-run hook
- `use-engage-auto-run.ts`: Engage auto-run hook
- `SettingsSheet.tsx`: Settings UI components
- `navigate-x.ts`: SPA navigation utility

### External
- None (all changes are self-contained within xBooster extension)

---

## Risks and Mitigations

### Risk 1: X.com UI Changes
**Impact**: High
**Probability**: Medium
**Description**: X.com could change the text of rate limit messages or success toasts.

**Mitigation**:
- Use partial text matching ("might be automated" is distinctive)
- Log detected text to console for debugging
- Fall back to existing modal close detection if no text match

### Risk 2: Navigation Timing Issues
**Impact**: Medium
**Probability**: Low
**Description**: Fixed delays (3s, 2s) may be insufficient on slow connections.

**Mitigation**:
- Current delays are conservative (tested values)
- Navigation failure doesn't affect core posting (already succeeded)
- Can be disabled via settings if causing issues

### Risk 3: False Positive Rate Limit Detection
**Impact**: Medium
**Probability**: Low
**Description**: Text matching could theoretically match unrelated content.

**Mitigation**:
- Text "might be automated" is highly specific to rate limit messages
- Detection only happens in post-submit polling window (10s after submit)
- Pause is temporary and will auto-expire

---

## Testing Approach

### Manual Testing Scenarios

**Test 1: Rate Limit Detection**
1. Trigger rate limit by posting multiple tweets rapidly
2. Verify console shows "Rate limit detected" message
3. Verify auto-run enters "rate-limited" status immediately
4. Verify pause persists for configured duration

**Test 2: Success Toast Detection**
1. Post a single tweet successfully
2. Verify console shows "Success toast detected" message
3. Verify tweet appears in timeline
4. Verify auto-run continues normally (no pause)

**Test 3: Navigation Confirmation (Enabled)**
1. Enable "Navigation Confirmation" in settings
2. Post a tweet successfully
3. Observe navigation to tweet page
4. Observe navigation back to original page
5. Verify 3s delay before return, 2s delay after return
6. Verify console logs show Step 7 completion

**Test 4: Navigation Confirmation (Disabled)**
1. Disable "Navigation Confirmation" in settings
2. Post a tweet successfully
3. Verify NO navigation occurs
4. Verify Step 7 is skipped in console logs

**Test 5: Unified Pause (Rate Limit)**
1. Trigger rate limit
2. Verify pause happens immediately (not after 3 failures)
3. Check consecutive failure counter remains at 0

**Test 6: Unified Pause (Regular Failure)**
1. Cause 3 consecutive failures (not rate limit)
2. Verify pause happens after 3rd failure
3. Check consecutive failure counter increments properly

**Test 7: Settings Persistence**
1. Toggle navigation confirmation setting
2. Reload Chrome extension
3. Verify setting persisted correctly

**Test 8: Both Modes**
1. Test all features in Mentions tab
2. Test all features in Engage tab
3. Verify settings are independent between tabs

---

## Integration Notes

### Backward Compatibility
- All new parameters are optional with sensible defaults
- Existing `recordFailure()` calls work without changes (defaults to `isRateLimit: false`)
- Settings default to enabled (`confirmTweetByNavigation: true`) for best user experience
- Return types are extended (additive) not changed (breaking)

### Performance Impact
- DOM polling runs for max 10s per post (same as before)
- Navigation confirmation adds 5s per successful post when enabled
- Minimal impact: feature only activates during active posting

### Browser Compatibility
- Uses standard DOM APIs (querySelectorAll, textContent)
- History API for navigation (already in use)
- Chrome extension storage API (already in use)

---

## Implementation Order Rationale

**Phase 1-2 (Types + Detection)**: Core functionality foundation. Must be completed first as all other features depend on the new return type.

**Phase 3 (Navigation)**: Can be implemented and tested independently once return types exist. Optional feature that doesn't affect core posting.

**Phase 4 (Unified Pause)**: Simple change to existing function. Can be done independently of detection logic.

**Phase 5-6 (Settings + Hooks)**: Integration layer that wires everything together. Requires all core features to be complete.

**Phase 7 (UI)**: Final polish. Pure UI layer with no business logic dependencies.

---

## Completion Checklist

- [ ] All 13 implementation steps completed
- [ ] All 18 acceptance criteria verified
- [ ] All 8 manual testing scenarios passed
- [ ] No TypeScript errors in modified files
- [ ] Chrome extension reloaded successfully
- [ ] Both Mentions and Engage tabs functional
- [ ] Settings persist across reload
- [ ] Console logs provide clear debugging information

---

## Notes

- The navigation confirmation feature is enabled by default to provide maximum reliability, but can be disabled for users who prefer faster posting
- Rate limit detection bypasses the failure counter to avoid conflating temporary platform restrictions with actual posting problems
- Success toast detection provides an additional confidence signal beyond modal close detection
- All console logging includes "xBooster:" prefix for easy filtering in DevTools
- Fixed timing delays (300ms polling, 3s page load, 2s stabilization) are based on empirical testing but may need adjustment for slower connections

