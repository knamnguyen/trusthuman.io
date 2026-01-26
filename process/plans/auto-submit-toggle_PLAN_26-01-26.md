# Auto-Submit After Generate - Implementation Plan

**Date**: 26-01-26
**Type**: SIMPLE (one-session feature)
**Complexity**: Low
**Selected Approach**: Enhanced callback with guard conditions (Approach 5) WITHOUT time delay

---

## Overview

Add an "Auto-Submit After Generate" toggle to local settings that automatically triggers batch comment submission after AI generation completes during Load Posts flow. The feature uses a callback-based approach with proper verification to ensure all comments are actually generated before submitting.

---

## Goals

1. Add `autoSubmitAfterGenerate` boolean to local settings store
2. Add toggle UI to SettingsSheet Behavior tab
3. Implement callback from `loadPostsToCards` to notify generation completion
4. Verify ALL draft cards have comment content (not just `generatingCount === 0`)
5. Respect `humanOnlyMode` setting (skip auto-submit in human mode)
6. Auto-trigger `handleSubmitAll` when all conditions met
7. Only apply to Load Posts flow (not EngageButton single-post mode)

---

## Scope

### In Scope
- Local settings storage (browser.storage.local, not DB-synced)
- Toggle UI in SettingsSheet Behavior tab
- Callback mechanism in `loadPostsToCards`
- Verification logic in ComposeTab
- Proper guard conditions (human mode, all cards have content)
- Load Posts flow only

### Out of Scope
- Time delays or debouncing (removed per requirements)
- EngageButton single-post mode (manual submit remains unchanged)
- Queue processing integration (can be added later if needed)
- DB-synced setting (this is local-only preference)

---

## Implementation Checklist

### Phase 1: Settings Store Update
1. **Add `autoSubmitAfterGenerate` to `BehaviorSettings` interface** in `apps/wxt-extension/entrypoints/linkedin.content/stores/settings-local-store.ts`
   - Location: Line 28-33 (BehaviorSettings interface)
   - Add: `autoSubmitAfterGenerate: boolean;` after `postNavigator`

2. **Add default value to `DEFAULT_BEHAVIOR` object** in `settings-local-store.ts`
   - Location: Line 35-40 (DEFAULT_BEHAVIOR constant)
   - Add: `autoSubmitAfterGenerate: false,` (default to OFF for safety)

### Phase 2: Settings UI Update
3. **Add toggle to SettingsBehaviorContent component** in `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/settings/SettingsSheet.tsx`
   - Location: After "UI" section (around line 266, before closing div)
   - Add new `SettingsSection` with title "Auto-Submit"
   - Add `SettingToggle` component with:
     - Label: "Auto-Submit After Generate"
     - Description: "Automatically submit all comments after batch generation completes"
     - Checked: `behavior.autoSubmitAfterGenerate`
     - onCheckedChange: `(v) => updateBehavior("autoSubmitAfterGenerate", v)`

### Phase 3: Callback Mechanism
4. **Add optional `onGenerationComplete` callback parameter** to `LoadPostsToCardsParams` interface in `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/utils/load-posts-to-cards.ts`
   - Location: Line 33-81 (LoadPostsToCardsParams interface)
   - Add after `onProgress` parameter (around line 80):
     ```typescript
     /** Optional callback invoked after generation completes with metadata */
     onGenerationComplete?: (metadata: {
       targetCount: number;
       loadedCount: number;
       generatedCount: number;
     }) => void;
     ```

5. **Invoke callback after final flush** in `loadPostsToCards` function
   - Location: Line 360-372 (Final flush cleanup section, just before "Log summary" comment)
   - After `flushAIUpdates()` call (line 365), add:
     ```typescript
     // Notify caller that generation is complete (all AI updates flushed)
     if (onGenerationComplete) {
       const generatedCount = useComposeStore.getState().cards.filter(
         (c) => c.status === "draft" && !c.isGenerating && c.commentText.trim() !== ""
       ).length;

       console.log("[loadPostsToCards] Invoking onGenerationComplete callback", {
         targetCount,
         loadedCount,
         generatedCount,
       });

       onGenerationComplete({
         targetCount,
         loadedCount,
         generatedCount,
       });
     }
     ```

### Phase 4: ComposeTab Integration
6. **Create verification helper function** in `ComposeTab.tsx`
   - Location: After `handleStop` function (around line 437)
   - Add:
     ```typescript
     /**
      * Verify all draft cards have generated comment content
      * Returns true if ALL drafts are ready (not generating, have content)
      */
     const verifyAllCardsReady = useCallback(() => {
       const cards = getCards;
       const draftCards = cards.filter((c) => c.status === "draft");

       if (draftCards.length === 0) {
         console.log("[ComposeTab] verifyAllCardsReady: No draft cards");
         return false;
       }

       const readyCards = draftCards.filter(
         (c) => !c.isGenerating && c.commentText.trim() !== ""
       );

       const allReady = readyCards.length === draftCards.length;

       console.log("[ComposeTab] verifyAllCardsReady:", {
         draftCards: draftCards.length,
         readyCards: readyCards.length,
         allReady,
       });

       return allReady;
     }, [getCards]);
     ```

7. **Create auto-submit callback handler** in `ComposeTab.tsx`
   - Location: After `verifyAllCardsReady` function
   - Add:
     ```typescript
     /**
      * Callback invoked when loadPostsToCards completes generation
      * Checks conditions and triggers auto-submit if enabled
      */
     const handleGenerationComplete = useCallback(
       (metadata: { targetCount: number; loadedCount: number; generatedCount: number }) => {
         console.log("[ComposeTab] handleGenerationComplete:", metadata);

         // Get current settings
         const isHumanMode = useSettingsLocalStore.getState().behavior.humanOnlyMode;
         const autoSubmitEnabled = useSettingsLocalStore.getState().behavior.autoSubmitAfterGenerate;

         // Check guard conditions
         if (!autoSubmitEnabled) {
           console.log("[ComposeTab] Auto-submit disabled in settings");
           return;
         }

         if (isHumanMode) {
           console.log("[ComposeTab] Auto-submit skipped (human mode)");
           return;
         }

         // Verify generatingCount is 0 (all AI requests finished)
         const generatingCount = useComposeStore.getState().cards.filter((c) => c.isGenerating).length;
         if (generatingCount > 0) {
           console.log("[ComposeTab] Auto-submit skipped (still generating):", generatingCount);
           return;
         }

         // Verify all draft cards have comment content
         if (!verifyAllCardsReady()) {
           console.log("[ComposeTab] Auto-submit skipped (not all cards ready)");
           return;
         }

         console.log("[ComposeTab] All conditions met, triggering auto-submit");
         void handleSubmitAll();
       },
       [handleSubmitAll, verifyAllCardsReady]
     );
     ```

8. **Pass callback to `loadPostsToCards` in `handleStart` function** in `ComposeTab.tsx`
   - Location: Line 403-415 (loadPostsToCards call in handleStart)
   - Add `onGenerationComplete: handleGenerationComplete,` to params object (after `onProgress` line)

9. **Pass callback to `loadPostsToCards` in `runAutoResume` function** in `ComposeTab.tsx`
   - Location: Line 234-247 (loadPostsToCards call in runAutoResume)
   - Add `onGenerationComplete: handleGenerationComplete,` to params object (after `onProgress` line)

---

## Acceptance Criteria

### Functional Requirements
- [ ] Toggle appears in SettingsSheet > Behavior tab
- [ ] Toggle state persists in browser.storage.local
- [ ] Toggle defaults to OFF (false)
- [ ] Auto-submit only triggers when toggle is ON
- [ ] Auto-submit skips when `humanOnlyMode` is enabled
- [ ] Auto-submit only triggers after `generatingCount === 0`
- [ ] Auto-submit verifies ALL draft cards have `commentText.trim() !== ""`
- [ ] Auto-submit works for both `handleStart` and `runAutoResume` flows
- [ ] Auto-submit does NOT trigger for EngageButton single-post cards

### Non-Functional Requirements
- [ ] No console errors during normal operation
- [ ] Callback is optional (backward compatible if not provided)
- [ ] Verification logic is accurate (checks actual comment content)
- [ ] Logging statements aid debugging

---

## Dependencies

### Internal Dependencies
- `useSettingsLocalStore` (already exists)
- `useComposeStore` (already exists)
- `loadPostsToCards` utility (already exists)
- `handleSubmitAll` function (already exists)
- `SettingToggle` component (already exists)
- `SettingsSection` component (already exists)

### External Dependencies
- None (all functionality uses existing infrastructure)

---

## Risks and Mitigation

### Risk 1: Race Condition (AI generation finishes after callback fires)
**Likelihood**: Low
**Impact**: Medium (some comments not submitted)
**Mitigation**:
- Callback fires AFTER final flush (`flushAIUpdates()`)
- Verify `generatingCount === 0` in handler
- Verify actual `commentText` content exists for all drafts

### Risk 2: False Positive (callback fires when cards aren't ready)
**Likelihood**: Low
**Impact**: Medium (empty comments submitted, or submission fails)
**Mitigation**:
- Triple verification: toggle ON, not human mode, generatingCount === 0, all cards have content
- `handleSubmitAll` already skips empty comments (line 462)

### Risk 3: User Confusion (auto-submit triggers unexpectedly)
**Likelihood**: Low
**Impact**: Low (users can disable toggle)
**Mitigation**:
- Default to OFF for safety
- Clear description in UI: "Automatically submit all comments after batch generation completes"

### Risk 4: Performance Impact
**Likelihood**: Very Low
**Impact**: Very Low
**Mitigation**:
- Callback logic is lightweight (few conditionals)
- No timers or intervals (removed per requirements)
- Verification happens once after generation complete

---

## Integration Notes

### EngageButton Flow
Auto-submit intentionally does NOT trigger for EngageButton cards because:
1. EngageButton creates single-post cards tracked in `singlePostCardIds`
2. Submit All button is disabled when `hasEngageButtonCards` is true (line 654)
3. Callback only fires from `loadPostsToCards` which is NOT used by EngageButton
4. This maintains existing UX: EngageButton users manually submit individual variations

### Queue Processing Flow
Auto-submit will work with queue processing because:
1. Queue uses `runAutoResume` which calls `loadPostsToCards`
2. Callback will fire after each list's generation completes
3. Queue waits for submission to complete before opening next tab (via existing delay logic)
4. No changes needed to queue logic

### Human Only Mode
Auto-submit respects human mode:
1. When `humanOnlyMode` is true, cards are created with `isGenerating: false` (line 260 in load-posts-to-cards.ts)
2. No AI generation fires, so callback invokes immediately after cards are created
3. Handler checks `isHumanMode` and skips auto-submit
4. Users type comments manually and use Submit All button as before

---

## Testing Checklist

### Manual Testing
- [ ] Toggle appears in SettingsSheet Behavior tab
- [ ] Toggle state persists after closing and reopening settings
- [ ] Toggle OFF: Load Posts → generation completes → NO auto-submit
- [ ] Toggle ON: Load Posts → generation completes → auto-submit triggers
- [ ] Toggle ON + Human Mode: Load Posts → NO auto-submit (guard condition)
- [ ] Toggle ON + Mixed Ready/Not Ready: Verify only ready cards submit
- [ ] Toggle ON + All Cards Empty: Verify no submission (handleSubmitAll skips empty)
- [ ] EngageButton: Verify auto-submit does NOT trigger (single-post flow)
- [ ] Auto-resume: Verify callback fires and auto-submit works
- [ ] Queue: Verify auto-submit works for each list in queue

### Edge Cases
- [ ] Stop button clicked mid-generation → callback fires with partial results → verify guard conditions prevent premature submit
- [ ] Clear All clicked before generation complete → verify callback doesn't error
- [ ] User edits comment after generation → verify submission includes edited text (not original)
- [ ] Multiple rapid Load Posts clicks → verify each callback runs independently

### Console Verification
- [ ] `[loadPostsToCards] Invoking onGenerationComplete callback` appears with metadata
- [ ] `[ComposeTab] handleGenerationComplete:` appears with metadata
- [ ] `[ComposeTab] All conditions met, triggering auto-submit` appears when conditions pass
- [ ] Guard condition logs appear when conditions fail (disabled, human mode, still generating, not ready)

---

## Rollback Plan

If issues arise:
1. Set `autoSubmitAfterGenerate` default to `false` (already planned)
2. Users can manually disable toggle in settings
3. Remove callback invocation in `load-posts-to-cards.ts` (lines added in step 5)
4. Remove callback handler in `ComposeTab.tsx` (lines added in steps 6-9)
5. Feature gracefully degrades to previous behavior (manual Submit All only)

---

## Future Enhancements

### Possible Phase 2 Features
- Add auto-submit delay slider (5-60 seconds) for users who want review time
- Add notification/toast when auto-submit triggers
- Add auto-submit counter in UI ("X comments auto-submitted")
- Add per-queue auto-submit override (disable for specific lists)
- Add dry-run mode (show what would be submitted without actually submitting)

### Related Features
- Auto-clear sent cards after submission
- Auto-navigate to next tab after submission completes
- Auto-retry failed submissions

---

## File Summary

### Files to Modify (4 files)

1. **`apps/wxt-extension/entrypoints/linkedin.content/stores/settings-local-store.ts`**
   - Lines to modify: 28-40
   - Changes: Add `autoSubmitAfterGenerate` to interface and default object

2. **`apps/wxt-extension/entrypoints/linkedin.content/compose-tab/settings/SettingsSheet.tsx`**
   - Lines to modify: 266+ (new section)
   - Changes: Add "Auto-Submit" settings section with toggle

3. **`apps/wxt-extension/entrypoints/linkedin.content/compose-tab/utils/load-posts-to-cards.ts`**
   - Lines to modify: 80 (interface), 365-372 (callback invocation)
   - Changes: Add callback parameter and invoke after final flush

4. **`apps/wxt-extension/entrypoints/linkedin.content/compose-tab/ComposeTab.tsx`**
   - Lines to modify: 437+ (new functions), 247, 415
   - Changes: Add verification + callback handler, pass callback to loadPostsToCards

### Files NOT Modified
- `compose-store.ts` (no state changes needed)
- `settings-db-store.ts` (local setting only, not DB-synced)
- `submitCommentFullFlow` utility (unchanged)
- `handleSubmitAll` function (unchanged, already handles empty comments)

---

## Estimated Effort

- **Implementation Time**: 30-45 minutes
- **Testing Time**: 20-30 minutes
- **Total Time**: 50-75 minutes

---

## Notes

### Why Callback Instead of Polling?
- Callback fires exactly once after generation completes (efficient)
- No timers or intervals to clean up (simpler)
- No arbitrary delays (faster)
- Deterministic behavior (easier to test and debug)

### Why Verify Content Instead of Just generatingCount?
- `generatingCount === 0` means AI requests finished, but doesn't guarantee content exists
- Some requests could fail silently (network error, API error, etc.)
- Checking `commentText.trim() !== ""` ensures cards are actually ready to submit
- Guards against submitting empty comments (though handleSubmitAll already skips them)

### Why Default to OFF?
- Auto-submit is powerful but potentially surprising behavior
- Users should opt-in consciously after understanding feature
- Prevents accidental submissions during initial testing/configuration
- Follows principle of least surprise

---

## Plan Status

- [x] Plan created
- [ ] Plan reviewed by user
- [ ] Implementation started
- [ ] Implementation completed
- [ ] Testing completed
- [ ] Plan archived to `process/plans/completed/`
