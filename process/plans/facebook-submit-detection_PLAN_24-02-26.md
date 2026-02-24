# Facebook Submit Detection Fix - Implementation Plan

**Date:** 24-02-26
**Complexity:** SIMPLE (one-session)
**Files Modified:** 2

---

## Overview

Fix two critical issues with Facebook comment submission detection in the TrustAHuman extension:

1. **Chat Box False Positives**: Broad selectors in `PostScraper.ts` match Messenger chat boxes, causing the typing toast to appear in personal messages where it shouldn't.

2. **Missing Enter Submissions**: Facebook uses bare Enter (not Ctrl/Cmd+Enter) to submit comments. Currently keyboard shortcuts are disabled in `index.tsx`, so we miss all Enter key submissions.

---

## Goals

1. Eliminate false positive typing detection in Messenger chat boxes
2. Enable Enter key submission detection for Facebook comments (in addition to button clicks)
3. Maintain existing button click detection functionality
4. Follow patterns used successfully in X and LinkedIn implementations

---

## Scope

### In Scope
- Remove broad selectors from `PostScraper.ts` that match Messenger chat
- Add Enter key detection to `index.tsx` (currently disabled at lines 185-188)
- Extract comment text validation (empty check)
- Dual detection: both Enter key AND button click should work independently

### Out of Scope
- Shift+Enter handling (already works for newlines)
- Ctrl/Cmd+Enter detection (Facebook doesn't use this pattern)
- Changes to verification flow logic
- UI/toast modifications

---

## Technical Analysis

### Issue 1: Chat Box False Positives

**Root Cause:**
Lines 40-41 in `PostScraper.ts` contain selectors that are too broad:
```typescript
'[data-lexical-editor="true"][role="textbox"]',      // Matches EVERYTHING with Lexical
'[contenteditable="true"][role="textbox"]',          // Matches EVERYTHING contenteditable
```

These match:
- Facebook post comment boxes (intended)
- Facebook Messenger chat boxes (unintended)
- Any other Lexical editor on Facebook

**Solution:**
Keep only the aria-label-based selectors that specifically target comment inputs:
```typescript
'[data-lexical-editor="true"][aria-label^="Comment as"]',
'[data-lexical-editor="true"][aria-label^="Reply to"]',
```

These are specific to comment contexts and won't match Messenger.

### Issue 2: Missing Enter Submissions

**Root Cause:**
Lines 185-188 in `index.tsx` show keyboard shortcut detection is explicitly disabled:
```typescript
// NOTE: Keyboard shortcut (Ctrl+Enter) detection DISABLED for Facebook
// Facebook's Ctrl+Enter behavior is inconsistent and causes issues.
// Users must click the submit button to trigger verification.
```

However, Facebook uses **bare Enter** (not Ctrl+Enter) to submit comments. This is different from:
- X: Uses Ctrl/Cmd+Enter (lines 135-140 in x.content/index.tsx)
- LinkedIn: Uses Ctrl/Cmd+Enter (lines 212-254 in linkedin.content/index.tsx)

**Solution:**
Add Enter key detection in `instrumentCommentBox()` function:
```typescript
element.addEventListener("keydown", (e) => {
  handleTypingStart();

  // Facebook uses bare Enter to submit (not Ctrl+Enter)
  if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
    // Get comment text to validate it's not empty
    const commentText = extractCommentText(element);
    if (commentText.trim().length > 0) {
      console.log("TrustAHuman FB: Enter detected with content, triggering verification");
      handleVerification(element as HTMLElement).catch(console.error);
    }
  }
});
```

**Key Differences from X/LinkedIn:**
- No `e.ctrlKey || e.metaKey` check (Facebook uses plain Enter)
- Must exclude Shift+Enter (that's for newlines)
- Must validate comment has content before triggering

---

## Implementation Checklist

### Step 1: Fix Chat Box False Positives (PostScraper.ts)

1. Open `/Users/knamnguyen/Documents/0-Programming/trusthuman/apps/trustahuman-ext/entrypoints/facebook.content/PostScraper.ts`

2. Locate lines 37-42 (the `commentInput` selector array)

3. Remove lines 40-41:
   - DELETE: `'[data-lexical-editor="true"][role="textbox"]',`
   - DELETE: `'[contenteditable="true"][role="textbox"]',`

4. Keep only lines 38-39:
   - KEEP: `'[data-lexical-editor="true"][aria-label^="Comment as"]',`
   - KEEP: `'[data-lexical-editor="true"][aria-label^="Reply to"]',`

5. Update array closing (remove trailing comma if needed for clean formatting)

6. Verify final `commentInput` array has exactly 2 selectors with aria-label patterns

### Step 2: Add Helper Function for Text Extraction (index.tsx)

1. Open `/Users/knamnguyen/Documents/0-Programming/trusthuman/apps/trustahuman-ext/entrypoints/facebook.content/index.tsx`

2. Import `extractTextFromEditor` from PostScraper at top of file (line 13):
   ```typescript
   import { scrapeCommentContext, setLastSubmitButton, SELECTORS } from "./PostScraper";
   ```
   Change to:
   ```typescript
   import { scrapeCommentContext, setLastSubmitButton, SELECTORS, extractTextFromEditor } from "./PostScraper";
   ```

   **Note:** Need to export `extractTextFromEditor` from PostScraper.ts first

3. If `extractTextFromEditor` is not exported, add to PostScraper.ts exports (line 492):
   ```typescript
   export { SELECTORS, extractTextFromEditor };
   ```

### Step 3: Add Local Text Extraction Helper (index.tsx)

Since `extractTextFromEditor` is a private function in PostScraper.ts and we want to keep separation of concerns, create a local helper in index.tsx:

1. Add helper function after `instrumentCommentBox()` function (around line 128):
   ```typescript
   function getCommentText(element: HTMLElement): string {
     // For Lexical editors, extract from paragraphs
     const paragraphs = element.querySelectorAll("p");
     if (paragraphs.length > 0) {
       const text = Array.from(paragraphs)
         .map((p) => p.textContent?.trim() || "")
         .filter(Boolean)
         .join("\n");
       if (text) return text;
     }

     // Fallback to innerText
     return element.innerText?.trim() || element.textContent?.trim() || "";
   }
   ```

### Step 4: Enable Enter Key Detection (index.tsx)

1. Locate `instrumentCommentBox()` function (lines 120-127)

2. Replace the current `keydown` listener (line 126) with enhanced version:
   ```typescript
   element.addEventListener("keydown", (e) => {
     handleTypingStart();

     // Facebook uses bare Enter to submit (not Ctrl+Enter like X/LinkedIn)
     if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
       // Validate comment has content before triggering verification
       const commentText = getCommentText(element);
       if (commentText.trim().length > 0) {
         console.log("TrustAHuman FB: Enter detected with content, triggering verification");

         // Find associated submit button
         const submitContainer = document.querySelector("#focused-state-composer-submit") as HTMLElement;
         if (submitContainer) {
           setLastSubmitButton(submitContainer);
           handleVerification(submitContainer).catch(console.error);
         } else {
           console.warn("TrustAHuman FB: Could not find submit container for Enter key");
         }
       } else {
         console.log("TrustAHuman FB: Enter detected but comment is empty, skipping");
       }
     }
   });
   ```

### Step 5: Update Keyboard Detection Comment (index.tsx)

1. Locate lines 185-188 (the disabled keyboard detection comment)

2. Replace comment with:
   ```typescript
   // NOTE: Facebook uses BARE Enter (not Ctrl+Enter) to submit comments
   // Enter key detection is handled in instrumentCommentBox() function
   // This differs from X and LinkedIn which use Ctrl/Cmd+Enter
   ```

### Step 6: Add Pending Verification Guard to Enter Handler

1. The Enter key handler needs access to `pendingVerification` flag to prevent duplicates

2. In `instrumentCommentBox()` function, update the Enter handler to check the flag:
   ```typescript
   element.addEventListener("keydown", (e) => {
     handleTypingStart();

     // Facebook uses bare Enter to submit (not Ctrl+Enter like X/LinkedIn)
     if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
       // Guard against duplicate submissions
       if (pendingVerification) {
         console.log("TrustAHuman FB: Enter detected but verification pending, skipping");
         return;
       }

       // Validate comment has content before triggering verification
       const commentText = getCommentText(element);
       if (commentText.trim().length > 0) {
         console.log("TrustAHuman FB: Enter detected with content, triggering verification");

         // Find associated submit button
         const submitContainer = document.querySelector("#focused-state-composer-submit") as HTMLElement;
         if (submitContainer) {
           setLastSubmitButton(submitContainer);
           handleVerification(submitContainer).catch(console.error);
         } else {
           console.warn("TrustAHuman FB: Could not find submit container for Enter key");
         }
       } else {
         console.log("TrustAHuman FB: Enter detected but comment is empty, skipping");
       }
     }
   });
   ```

### Step 7: Test Edge Cases

1. Verify Shift+Enter does NOT trigger verification (creates newline)
2. Verify empty comments do NOT trigger verification (length check)
3. Verify Enter AND button click both work independently
4. Verify no false positives in Messenger chat
5. Verify typing toast appears only in comment boxes, not Messenger

---

## Acceptance Criteria

### Issue 1: Chat Box False Positives
- [ ] Typing in Messenger chat does NOT show Triss typing toast
- [ ] Typing in Facebook post comments DOES show Triss typing toast
- [ ] No regression: comment box detection still works on posts
- [ ] Console logs confirm only aria-label-based selectors are matching

### Issue 2: Enter Key Submissions
- [ ] Pressing Enter in comment box with text triggers verification flow
- [ ] Pressing Enter in empty comment box does NOT trigger verification
- [ ] Pressing Shift+Enter does NOT trigger verification (creates newline)
- [ ] Clicking submit button still triggers verification (no regression)
- [ ] Both Enter and button click can work independently in same session
- [ ] pendingVerification flag prevents duplicate submissions
- [ ] Console logs show "Enter detected with content" when appropriate

### General
- [ ] No TypeScript errors
- [ ] No console errors during normal operation
- [ ] Verification flow completes successfully for both Enter and button click
- [ ] Toast transitions are smooth and correct

---

## Dependencies

- No new dependencies required
- Uses existing PostScraper functions
- Uses existing handleVerification flow

---

## Risks

### Low Risk
- **Selector specificity**: The aria-label patterns are stable and specific to comment contexts
- **Enter key detection**: Simple event detection with clear guards (Shift, content validation)

### Mitigation
- Test thoroughly in Messenger to ensure no false positives
- Test on various Facebook page types (feed, profile, groups)
- Verify Shift+Enter still creates newlines (don't prevent default for that case)

---

## Integration Notes

### Pattern Consistency
This implementation maintains consistency with X and LinkedIn but adapts to Facebook's specific submission pattern:

| Platform | Submission Pattern | Implementation |
|----------|-------------------|----------------|
| X | Ctrl/Cmd+Enter | `e.ctrlKey \|\| e.metaKey` |
| LinkedIn | Ctrl/Cmd+Enter | `e.ctrlKey \|\| e.metaKey` |
| Facebook | Bare Enter | `!e.shiftKey && !e.ctrlKey && !e.metaKey` |

### Selector Improvements
Before (4 selectors):
```typescript
'[data-lexical-editor="true"][aria-label^="Comment as"]',
'[data-lexical-editor="true"][aria-label^="Reply to"]',
'[data-lexical-editor="true"][role="textbox"]',        // TOO BROAD
'[contenteditable="true"][role="textbox"]',            // TOO BROAD
```

After (2 selectors):
```typescript
'[data-lexical-editor="true"][aria-label^="Comment as"]',
'[data-lexical-editor="true"][aria-label^="Reply to"]',
```

This reduces false positives while maintaining 100% coverage of actual comment inputs.

---

## Testing Checklist

### Messenger Chat (False Positive Test)
- [ ] Open Messenger in Facebook
- [ ] Start typing in a chat conversation
- [ ] Verify NO Triss typing toast appears
- [ ] Verify NO console logs from TrustAHuman

### Post Comments (Happy Path)
- [ ] Navigate to Facebook feed
- [ ] Click "Comment" on a post
- [ ] Start typing
- [ ] Verify Triss "typing" toast appears
- [ ] Type a comment with content
- [ ] Press Enter key
- [ ] Verify verification flow starts
- [ ] Verify "submitted" toast appears
- [ ] Complete verification flow

### Button Click (Regression Test)
- [ ] Click "Comment" on a post
- [ ] Type a comment
- [ ] Click the submit button (don't use Enter)
- [ ] Verify verification flow starts
- [ ] Verify flow completes successfully

### Edge Cases
- [ ] Empty comment + Enter = no verification
- [ ] Comment with content + Shift+Enter = newline, no verification
- [ ] Comment with content + Enter = verification
- [ ] Rapid Enter presses = only one verification (pendingVerification guard)

---

## Rollback Plan

If issues arise:

1. **Revert PostScraper.ts**: Add back the two broad selectors
2. **Revert index.tsx**: Restore keyboard shortcuts disabled comment
3. **Revert keyboard detection**: Remove Enter key handler from instrumentCommentBox

All changes are localized to two functions in two files, making rollback straightforward.

---

## Notes

- Facebook's submission pattern (bare Enter) is different from X and LinkedIn (Ctrl/Cmd+Enter)
- The aria-label selectors are more reliable than role-based selectors because they're specific to comment contexts
- The `getCommentText()` helper duplicates some logic from PostScraper but maintains separation of concerns
- pendingVerification flag is crucial to prevent double-submissions when Enter triggers a click

---

## Implementation Time Estimate

- Step 1 (Selector fix): 5 minutes
- Steps 2-3 (Helper function): 10 minutes
- Steps 4-6 (Enter detection): 15 minutes
- Step 7 (Testing): 20 minutes

**Total: ~50 minutes**

---

## Change Summary

| File | Lines Changed | Type | Description |
|------|---------------|------|-------------|
| PostScraper.ts | 40-41 | DELETE | Remove broad selectors |
| index.tsx | 120-127 | MODIFY | Add Enter key detection to instrumentCommentBox |
| index.tsx | 128-140 | ADD | Add getCommentText helper function |
| index.tsx | 185-188 | MODIFY | Update keyboard detection comment |

**Total Changes: 2 files, ~15 lines modified/added, 2 lines deleted**
