# Target List Navigation with Auto-Resume - Implementation Plan

**Date**: 15-01-26
**Type**: SIMPLE
**Estimated Duration**: 1 session

---

## Overview

Implement auto-resume functionality for the "Load Posts" operation after navigating to a LinkedIn search URL filtered by target list members. Currently, when a target list is selected and "Load Posts" is clicked, the extension navigates to LinkedIn's search results but fails to auto-resume because auth and account/settings stores aren't loaded yet.

---

## Goals

1. Refactor `settings-store.ts` to fetch settings from database on page load (similar to `account-store.ts` pattern)
2. Add loading state management (`isLoaded`, `isLoading` flags) to settings store
3. Coordinate auto-resume to wait for all required stores (auth, account, settings) before triggering Load Posts
4. Maintain existing `navigation-state.ts` session storage pattern (already working)

---

## Current State

### Working Components
- `navigation-state.ts` - Saves/consumes pending navigation state via `browser.storage.session` ✅
- `ComposeTab.tsx` - Checks for pending navigation on mount and restores settings ✅
- `account-store.ts` - Fetches from DB with `isLoaded` flag pattern ✅
- Auth initialization flow in `index.tsx` - Coordinates auth → account fetching ✅

### Issue
- `settings-store.ts` is pure Zustand (no DB fetch, no persistence)
- Auto-resume tries to start Load Posts before stores are ready
- Auth/account stores load asynchronously, race condition causes failure

---

## Scope

### In Scope
- Add DB fetch to settings-store (3 settings tables: PostLoadSetting, SubmitCommentSetting, CommentGenerateSetting)
- Add loading state flags to settings-store
- Wire settings store into auth initialization flow
- Add dependency checks to auto-resume logic in ComposeTab
- Handle null/missing settings gracefully (use defaults if no DB record)

### Out of Scope
- Creating tRPC endpoints for settings (assume they exist or will be created)
- Modifying navigation-state.ts (already working)
- BehaviorSettings persistence (stays local-only for now)
- UI changes to settings panel

---

## Implementation Checklist

### Phase 1: Create tRPC Settings Endpoints

**File**: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/packages/api/src/router/settings.ts` (create new)

1. Create `settings.ts` router file in packages/api/src/router/
2. Add `getSettings` query procedure:
   - Accept `accountId` input (string)
   - Fetch PostLoadSetting, SubmitCommentSetting, CommentGenerateSetting for account
   - Use Prisma `findUnique` for each settings table (accountId is primary key)
   - Return all three settings (null if not found)
   - Include targetList relation when fetching PostLoadSetting (need URNs)
3. Add `updatePostLoad` mutation procedure:
   - Accept accountId + PostLoadSettings interface fields
   - Upsert PostLoadSetting record
   - Return updated settings
4. Add `updateSubmitComment` mutation procedure:
   - Accept accountId + SubmitCommentSettings interface fields
   - Upsert SubmitCommentSetting record
   - Return updated settings
5. Add `updateCommentGenerate` mutation procedure:
   - Accept accountId + CommentGenerateSettings interface fields
   - Upsert CommentGenerateSetting record
   - Return updated settings
6. Export settings router

**File**: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/packages/api/src/router.ts`

7. Import settings router
8. Add `settings: settingsRouter` to root router

---

### Phase 2: Refactor Settings Store with DB Fetch

**File**: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/wxt-extension/entrypoints/linkedin.content/stores/settings-store.ts`

9. Add import: `getTrpcClient` from `../../../lib/trpc/client`
10. Add `isLoading: boolean` to `SettingsState` interface (default: false)
11. Add `isLoaded: boolean` to `SettingsState` interface (default: false)
12. Add `error: string | null` to `SettingsState` interface (default: null)
13. Add `lastFetchedAt: number | null` to `SettingsState` interface (default: null)
14. Add `accountId: string | null` to `SettingsState` interface (tracks which account settings belong to)
15. Add `fetchSettingsFromDB: (accountId: string) => Promise<void>` to `SettingsActions` interface
16. Add `setAllSettings` action to `SettingsActions` interface (for bulk updates from DB)
17. Implement `fetchSettingsFromDB` action:
    - Check if already loading, skip if true
    - Set `isLoading: true, error: null`
    - Call `trpc.settings.getSettings.query({ accountId })`
    - Map DB response to store format:
      - PostLoadSetting → postLoad state
      - SubmitCommentSetting → submitComment state
      - CommentGenerateSetting → commentGenerate state
      - If targetList relation exists, extract URNs (max 25) to selectedTargetListUrns
    - Set `isLoaded: true, isLoading: false, accountId, lastFetchedAt: Date.now()`
    - On error: console.error, set `isLoaded: true, error: message` (use defaults)
18. Implement `setAllSettings` action (bulk setter for restored navigation state)
19. Update each individual update action (updatePostLoad, updateSubmitComment, updateCommentGenerate):
    - After updating local state, if `accountId` exists, trigger DB sync via tRPC mutation
    - Fire-and-forget (don't await), log errors
20. Add `clear` action to reset to defaults (called on sign-out)

---

### Phase 3: Initialize Settings Store Listener

**File**: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/wxt-extension/entrypoints/linkedin.content/stores/settings-store.ts`

21. Create `initSettingsStoreListener()` function at bottom of file (export it)
22. Listen for `authStateChanged` messages from background
23. On sign-in (isSignedIn === true):
    - Wait for account store to load (`useAccountStore.getState().isLoaded`)
    - Get currentLinkedIn.profileUrn from account store
    - Call `fetchSettingsFromDB(profileUrn)`
24. On sign-out: call `clear()`
25. Return cleanup function to remove listener

---

### Phase 4: Wire Settings Store into Initialization Flow

**File**: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/wxt-extension/entrypoints/linkedin.content/index.tsx`

26. Import `initSettingsStoreListener, useSettingsStore` from `./stores/settings-store`
27. Call `initSettingsStoreListener()` in main() after auth listener setup (line ~82)
28. Store cleanup function in variable: `const cleanupSettingsStore = initSettingsStoreListener()`
29. Add cleanupSettingsStore to onRemove callback (line ~177)
30. Update auth listener's onSignIn callback:
    - After `fetchAccountData()`, wait for account load to complete
    - Then fetch settings: `useSettingsStore.getState().fetchSettingsFromDB(accountId)`
31. Update auth listener's onSignOut callback:
    - Add `useSettingsStore.getState().clear()` after account clear

---

### Phase 5: Update Auto-Resume Logic in ComposeTab

**File**: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/ComposeTab.tsx`

32. Import `useAuthStore` from `../../../lib/auth-store` (line ~6 already exists, verify)
33. Add subscriptions to loading states:
    - `const authIsLoaded = useAuthStore(state => state.isLoaded)`
    - `const accountIsLoaded = useAccountStore(state => state.isLoaded)`
    - `const settingsIsLoaded = useSettingsStore(state => state.isLoaded)`
34. Update `checkAndResume` async function (line ~134):
    - Remove individual setting restoration loop (lines 146-151)
    - Replace with: `useSettingsStore.getState().setAllSettings(pending.postLoadSettings)`
35. Remove `useEffect` hook at lines 337-352 (old auto-start logic)
36. Create new `useEffect` for dependency-based auto-resume:
    - Dependencies: `[authIsLoaded, accountIsLoaded, settingsIsLoaded, pendingTargetCountRef.current]`
    - Guard: only run if all three stores are loaded AND pendingTargetCountRef.current is not null
    - Guard: only run if targetDraftCount matches pendingTargetCountRef.current
    - Clear pendingTargetCountRef.current
    - Wait 2000ms for LinkedIn page load
    - Call handleStart()
37. Update console logs to show which stores are waiting

---

### Phase 6: Handle Edge Cases

**File**: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/wxt-extension/entrypoints/linkedin.content/stores/settings-store.ts`

38. In `fetchSettingsFromDB`: Handle null response (no settings in DB)
    - Use DEFAULT_POST_LOAD, DEFAULT_SUBMIT_COMMENT, DEFAULT_COMMENT_GENERATE
    - Still set isLoaded: true (successfully loaded, just no custom settings)
39. In `fetchSettingsFromDB`: Handle targetList relation null/undefined
    - Set selectedTargetListId: null, selectedTargetListUrns: []
40. Add stale data check: Skip fetch if lastFetchedAt < 30 seconds ago (prevent duplicate fetches)

**File**: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/ComposeTab.tsx`

41. Add timeout guard to auto-resume useEffect (max 10s wait for stores)
    - If stores don't load within 10s, log warning and abort auto-resume
42. Add console log when all stores ready: "All stores loaded, auto-resuming Load Posts"

---

## Database Schema Reference

Settings tables are keyed by `accountId` (LinkedInAccount.id):

```sql
-- PostLoadSetting (1:1 with LinkedInAccount)
accountId (PK)
targetListId (FK to TargetList, optional)
timeFilterEnabled, minPostAge
skipFriendActivitiesEnabled, skipCompanyPagesEnabled, skipPromotedPostsEnabled
skipblacklistEnabled, blacklistId
skipFirstDegree, skipSecondDegree, skipThirdDegree, skipFollowing

-- SubmitCommentSetting (1:1 with LinkedInAccount)
accountId (PK)
submitDelayRange (string)
likePostEnabled, likeCommentEnabled
tagPostAuthorEnabled, attachPictureEnabled
defaultPictureAttachUrl (optional)

-- CommentGenerateSetting (1:1 with LinkedInAccount)
accountId (PK)
commentStyleId (FK to CommentStyle, optional)
dynamicChooseStyleEnabled
adjacentCommentsEnabled
```

**Note**: BehaviorSettings is NOT in DB (local-only), stays in Zustand state.

---

## Data Flow

### Initial Load (No Navigation)
1. Content script mounts → `index.tsx` runs
2. Auth store fetches auth status
3. If signed in → Account store fetches org/accounts
4. After account load → Settings store fetches settings from DB
5. All stores ready, UI renders with correct settings

### Navigation + Auto-Resume Flow
1. User selects target list + clicks "Load Posts"
2. `handleStart()` checks: target list enabled + not on search page
3. Saves state to `browser.storage.session` via `savePendingNavigation()`
4. Navigates to LinkedIn search URL (full page reload)
5. Content script re-mounts on new page
6. `checkAndResume()` finds pending navigation in session storage
7. Restores targetDraftCount + stores settings via `setAllSettings()`
8. Sets `pendingTargetCountRef.current`
9. Auto-resume useEffect waits for all stores to load (auth, account, settings)
10. Once all loaded, triggers `handleStart()` after 2s delay
11. Load Posts runs with correct settings

---

## Acceptance Criteria

### Functional Requirements
- [ ] Settings are fetched from DB on page load (when auth confirmed)
- [ ] Settings store has `isLoaded` flag that accurately reflects load state
- [ ] Auto-resume waits for all three stores (auth, account, settings) before starting
- [ ] Target list navigation completes successfully and auto-resumes Load Posts
- [ ] If no settings in DB, defaults are used (no crash)
- [ ] Settings changes sync to DB (fire-and-forget)
- [ ] On sign-out, settings store clears

### Edge Cases
- [ ] Rapid navigation (duplicate fetch prevention via lastFetchedAt)
- [ ] Missing target list relation (graceful null handling)
- [ ] Store loading timeout (10s max wait, log warning)
- [ ] Race condition between stores (all must be loaded before resume)

### Testing Scenarios
1. **First-time user (no DB settings)**: Should use defaults, no errors
2. **Existing user with settings**: Should load from DB, apply correctly
3. **Target list navigation**: Should save state, navigate, auto-resume
4. **Non-target-list Load Posts**: Should work normally (no navigation)
5. **Sign out → Sign in**: Should clear then refetch settings

---

## Dependencies

### External Dependencies
- tRPC endpoints for settings CRUD (created in Phase 1)
- Prisma schema tables: PostLoadSetting, SubmitCommentSetting, CommentGenerateSetting (already exist)

### Internal Dependencies
- Auth store must be loaded before settings fetch
- Account store must be loaded before settings fetch (need accountId)
- Navigation state must be consumed before auto-resume starts

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Store loading race condition | Auto-resume fails | Use explicit `isLoaded` checks + timeout guard |
| Missing tRPC endpoints | Fetch fails | Create endpoints in Phase 1, test independently |
| Stale accountId in settings store | Wrong settings loaded | Clear accountId on sign-out, validate on fetch |
| LinkedIn page not ready after nav | Auto-start fails | Keep 2s delay before handleStart() |
| Session storage cleared by browser | No auto-resume | Acceptable (30s expiry already in place) |

---

## Integration Notes

### Files Modified
- `/packages/api/src/router/settings.ts` (new)
- `/packages/api/src/router.ts` (add router export)
- `/apps/wxt-extension/entrypoints/linkedin.content/stores/settings-store.ts` (major refactor)
- `/apps/wxt-extension/entrypoints/linkedin.content/index.tsx` (wire listener)
- `/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/ComposeTab.tsx` (update auto-resume logic)

### No Changes Required
- `navigation-state.ts` (already working)
- `account-store.ts` (reference pattern only)
- Database schema (tables already exist)

---

## Post-Implementation Validation

1. Test fresh account (no settings in DB) → Should use defaults
2. Test existing account → Should load from DB
3. Test target list navigation:
   - Select target list
   - Click Load Posts
   - Verify navigation to search URL
   - Verify auto-resume after page reload
   - Verify settings preserved
4. Test sign-out → settings clear
5. Test sign-in → settings refetch
6. Check console logs for timing (auth → account → settings → auto-resume)

---

## Notes

- Settings store follows exact same pattern as account-store (consistency)
- Auto-resume coordination uses explicit loading flags (no timing hacks)
- BehaviorSettings stays local-only (not persisted to DB)
- tRPC mutations are fire-and-forget (don't block UI updates)
- 30s stale data check prevents duplicate fetches on rapid navigation

---

## Deviations Log

(To be filled during implementation if any deviations from plan occur)

---

**Plan Status**: Ready for Review
**Next Step**: Review with user, then "ENTER EXECUTE MODE"
