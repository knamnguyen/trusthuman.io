# WXT Extension Popup Migration Feature - Plan

**Date:** 16-01-26
**Complexity:** Simple
**Status:** ⏳ PLANNED

## Overview

Build a production-ready popup for the WXT extension that handles migration from the old Chrome extension to the new WXT-based architecture. The popup guides users through the migration flow: detect old extension data (personas, target lists, profiles) in `chrome.storage.local`, check if they have a registered LinkedIn account in the new system, and migrate data to the database via tRPC APIs. The popup also serves as the main entry point for users to access key extension features after migration.

## Quick Links

- [Goals and Success Metrics](#goals-and-success-metrics)
- [Execution Brief](#execution-brief)
- [Scope](#scope)
- [Assumptions and Constraints](#assumptions-and-constraints)
- [Functional Requirements](#functional-requirements)
- [Non-Functional Requirements](#non-functional-requirements)
- [Acceptance Criteria](#acceptance-criteria)
- [Implementation Checklist](#implementation-checklist)
- [Risks and Mitigations](#risks-and-mitigations)
- [Integration Notes](#integration-notes)

## Goals and Success Metrics

**Goals:**
- Replace POC popup with production-ready migration flow
- Detect and migrate old extension data (`customStyleGuides`, `engagekit-profile-lists`, `engagekit-profile-data`)
- Prevent duplicate migrations with per-account migration flags
- Guide users to register LinkedIn account if not already registered
- Provide clear status feedback throughout migration process
- Serve as entry point to webapp features after migration

**Success Metrics:**
- Users with old data successfully migrate personas, lists, and profiles to database
- Users without registered LinkedIn accounts see clear CTA to register at webapp
- Migration only runs once per account (tracked via `wxt-migration-complete-{accountId}`)
- No data loss during migration
- Clear error handling for API failures
- Smooth transition from old extension to new WXT extension

---

## Execution Brief

### Phase 1: Popup Layout & Auth Detection
**What happens:** Create popup layout with auth status detection. Check if user is signed in via `authService.getAuthStatus()`, show sign-in CTA if not.

**Test:** Popup opens, detects auth status, shows appropriate UI for signed-in vs signed-out users.

### Phase 2: Old Data Detection
**What happens:** Read `chrome.storage.local` for old extension keys (`customStyleGuides`, `engagekit-profile-lists`, `engagekit-profile-data`). Parse and count items.

**Test:** Popup correctly detects old data and displays counts (X personas, Y lists, Z profiles).

### Phase 3: Account Registration Check
**What happens:** Use `accountStore` to check if user has a registered LinkedIn account. If not, show CTA to register at `{orgSlug}/accounts` page.

**Test:** Popup detects missing account and shows registration CTA with correct webapp link.

### Phase 4: Migration State Check
**What happens:** Check if migration already completed via `chrome.storage.local.get('wxt-migration-complete-{accountId}')`. If yes, show completion summary instead of migration button.

**Test:** After migration, reopening popup shows "Migration complete" instead of repeating migration.

### Phase 5: Migration Logic
**What happens:** On "Migrate Now" button click, call tRPC mutations (`persona.commentStyle.create`, `targetList.addList`, `targetList.updateProfileLists`) to migrate data. Show progress indicator. Set migration flag on success.

**Test:** Data migrates successfully, appears in webapp, popup shows success message with summary.

### Phase 6: Post-Migration UI
**What happens:** After migration (or if no data to migrate), show links to key webapp features (personas, target lists, dashboard).

**Test:** Links navigate to correct webapp pages with proper org context.

### Expected Outcome
- Production-ready popup that handles 100% of old extension users
- Clear migration flow with zero ambiguity
- No duplicate migrations
- Error handling for all edge cases
- Users successfully transition to new WXT extension

---

## Scope

**In-Scope:**
- Popup UI with migration flow
- Auth status detection via `authService`
- Old extension data detection (`customStyleGuides`, `engagekit-profile-lists`, `engagekit-profile-data`)
- LinkedIn account registration status check via `accountStore`
- Migration to database via tRPC (`persona.commentStyle.create`, `targetList.addList`, `targetList.updateProfileLists`)
- Migration completion tracking (per-account flag)
- Error handling for API failures
- Links to webapp features post-migration
- Loading states and progress indicators

**Out-of-Scope:**
- LinkedIn account registration flow (handled by webapp at `{orgSlug}/accounts`)
- API endpoint creation (all required endpoints already exist)
- Old extension data cleanup (keep data in storage for safety)
- Multi-account migration (current version migrates to `matchingAccount` only)
- Undo/rollback migration feature

## Assumptions and Constraints

**Assumptions:**
- User already has Clerk account with org created
- User has signed into extension at least once (auth token exists)
- Old extension data format is stable (`customStyleGuides` is array of `{name: string, prompt: string}`, `engagekit-profile-lists` is array of strings, `engagekit-profile-data` is object with profile URLs as keys)
- User must register LinkedIn account at webapp before migration can run
- tRPC client already configured with auth and `x-account-id` headers
- APIs (`persona.commentStyle.create`, `targetList.addList`, `targetList.updateProfileLists`) are production-ready

**Constraints:**
- Migration requires `matchingAccount` (user must be logged into registered LinkedIn profile)
- Cannot migrate if `ctx.activeAccount` is null (APIs will fail)
- Must track migration per-account (multiple LinkedIn accounts = multiple migrations)
- Popup must be performant (no blocking operations)
- All UI components must fit in popup dimensions (min-width: 360px, recommended: 400-500px)

## Functional Requirements

1. **Auth Detection**
   - On popup open, call `authService.getAuthStatus()` to check auth
   - If `!isSignedIn`, show "Sign in to migrate your data" with CTA to open webapp sign-in
   - If `isSignedIn`, proceed to data detection

2. **Old Data Detection**
   - Read `chrome.storage.local` for keys: `customStyleGuides`, `engagekit-profile-lists`, `engagekit-profile-data`
   - Parse `customStyleGuides` as `Array<{name: string, prompt: string}>`
   - Parse `engagekit-profile-lists` as `Array<string>` (list names)
   - Parse `engagekit-profile-data` as `Record<string, {profileUrn?: string, lists?: string[], ...}>`
   - Count items: personas = `customStyleGuides.length`, lists = `engagekit-profile-lists.length`, profiles = `Object.keys(engagekit-profile-data).length`
   - If all counts are 0, show "Nothing to migrate" state

3. **Account Registration Check**
   - Use `accountStore.matchingAccount` to check if user has registered LinkedIn account
   - If `matchingAccount === null`, show "Register your LinkedIn account to migrate data" with link to `{orgSlug}/accounts` (use `authStore.organization.slug`)
   - Link should open in new tab via `chrome.tabs.create({ url: ... })`
   - Refresh account store when popup reopens (via `accountStore.fetchAccountData()`)

4. **Migration Status Check**
   - If `matchingAccount` exists, check `chrome.storage.local.get('wxt-migration-complete-{matchingAccount.id}')`
   - If flag exists (value = `true`), show "Migration complete ✓" with summary (X personas, Y lists, Z profiles migrated on {date})
   - If flag does not exist, show migration preview with "Migrate Now" button

5. **Migration Preview**
   - Display:
     - "Ready to migrate your data"
     - "{X} personas (comment styles)"
     - "{Y} target lists"
     - "{Z} profiles"
     - "Migrate Now" button (primary, prominent)
   - Disable button during migration (show loading spinner)

6. **Migration Execution**
   - On "Migrate Now" click:
     1. Set loading state (`isMigrating = true`)
     2. Get old data from storage
     3. Migrate personas: for each `customStyle`, call `trpc.persona.commentStyle.create.mutate({ name: style.name, description: '', content: style.prompt })`
     4. Migrate lists: for each list name, call `trpc.targetList.addList.mutate({ name: listName })`
     5. Migrate profiles: for each profile in `engagekit-profile-data`, extract `linkedinUrl`, `lists`, and call `trpc.targetList.updateProfileLists.mutate({ linkedinUrl, addToListIds: [listIds from names], removeFromListIds: [], profileData: { name, profileSlug, profileUrn, headline, photoUrl } })`
     6. On success: set `chrome.storage.local.set({ 'wxt-migration-complete-{accountId}': true, 'wxt-migration-date-{accountId}': Date.now() })`
     7. On error: show error message with retry button
     8. Clear loading state
   - Show progress: "Migrating personas... (1/3)" → "Migrating lists... (2/3)" → "Migrating profiles... (3/3)"

7. **Migration Success State**
   - Display:
     - "Migration complete ✓"
     - "{X} personas migrated"
     - "{Y} target lists created"
     - "{Z} profiles added"
     - "View in Dashboard" button (link to webapp)
   - Store migration metadata: `{ completed: true, date: Date.now(), counts: { personas: X, lists: Y, profiles: Z } }`

8. **Error Handling**
   - API failure: show "Migration failed: {error message}" with "Retry" button
   - Network error: show "Network error. Please check your connection and retry."
   - Missing account: show "Please register your LinkedIn account first" (should not happen if checks work correctly)
   - Partial migration: log which items succeeded, allow retry (APIs are idempotent)

9. **Post-Migration UI**
   - After migration (or if no data to migrate), show:
     - Quick links: "Manage Personas", "Manage Target Lists", "View Dashboard"
     - Each link opens webapp in new tab
     - Use org slug from `authStore.organization.slug` for URLs

## Non-Functional Requirements

- **Performance:** Popup opens instantly, data detection <100ms, migration progress visible
- **UI/UX:** Clean, clear instructions, prominent CTAs, visual progress indicators
- **Error Handling:** All API errors caught and displayed with actionable messages
- **Reliability:** Migration is idempotent (can retry safely), atomic per-item (partial success tracked)
- **Accessibility:** Semantic HTML, keyboard navigation, screen reader support
- **Code Quality:** TypeScript strict mode, clean component structure, proper error boundaries

## Acceptance Criteria

1. ✅ Popup opens and detects auth status correctly
2. ✅ Not signed in → Shows sign-in CTA
3. ✅ Signed in + no old data → Shows "Nothing to migrate" state
4. ✅ Signed in + old data + no account → Shows "Register account" CTA with link to webapp
5. ✅ Signed in + old data + account + not migrated → Shows migration preview with "Migrate Now" button
6. ✅ "Migrate Now" button triggers migration, shows progress
7. ✅ Migration succeeds → All data appears in webapp (personas, lists, profiles)
8. ✅ Migration succeeds → Sets migration flag in storage
9. ✅ Reopening popup after migration → Shows "Migration complete" summary
10. ✅ Migration fails → Shows error message with "Retry" button
11. ✅ Links to webapp features work correctly
12. ✅ No duplicate migrations (flag prevents re-run)
13. ✅ TypeScript compiles without errors
14. ✅ No console errors during migration

## Implementation Checklist

1. **Create Popup Layout Component**
   - Replace POC counter demo in `apps/wxt-extension/entrypoints/popup/App.tsx`
   - Create layout with header (EngageKit logo + title), main content area, footer
   - Add container with max-width, padding, responsive design
   - Import `Button`, `Card`, `Badge` from `@sassy/ui`

2. **Set Up Auth Detection**
   - Import `authService` from `../../lib/auth-service`
   - Import `useAuthStore` from `../../lib/auth-store`
   - Create `useEffect` to call `authStore.fetchAuthStatus()` on mount
   - Check `authStore.isSignedIn` and `authStore.isLoaded`
   - Render sign-in UI if `!isSignedIn` (show "Sign in to continue" with button to open webapp)

3. **Set Up Account Store Integration**
   - Import `useAccountStore` from `../../entrypoints/linkedin.content/stores/account-store`
   - Create `useEffect` to call `accountStore.fetchAccountData()` after auth confirmed
   - Access `accountStore.matchingAccount`, `accountStore.organization`, `accountStore.currentLinkedInStatus`
   - Handle loading state while account data fetches

4. **Create Old Data Detection Logic**
   - Create `utils/detect-old-data.ts` with:
     - `detectOldExtensionData()` function that reads `chrome.storage.local`
     - Returns `{ personas: CustomStyle[], lists: string[], profiles: Record<string, ProfileData>, counts: { personas: number, lists: number, profiles: number } }`
     - Type definitions: `CustomStyle`, `ProfileData` matching old extension format
   - Create `useOldExtensionData` hook that calls detection on mount and returns data + loading state

5. **Create Migration Status Check Logic**
   - Create `utils/migration-status.ts` with:
     - `checkMigrationStatus(accountId: string)` function that reads `chrome.storage.local.get('wxt-migration-complete-{accountId}')`
     - Returns `{ completed: boolean, date: number | null, counts: { personas: number, lists: number, profiles: number } | null }`
     - `setMigrationComplete(accountId: string, counts: { personas: number, lists: number, profiles: number })` function that saves flag + metadata
   - Create `useMigrationStatus` hook that checks status for current `matchingAccount.id`

6. **Build Migration UI States**
   - Create `components/popup/MigrationStates.tsx` with:
     - `SignInRequired` component (shows when `!isSignedIn`)
     - `NoDataToMigrate` component (shows when all counts are 0)
     - `AccountRegistrationRequired` component (shows when `matchingAccount === null` but has old data)
     - `MigrationPreview` component (shows data counts + "Migrate Now" button)
     - `MigrationInProgress` component (shows progress steps with loading spinner)
     - `MigrationComplete` component (shows success summary + links to webapp)
     - `MigrationError` component (shows error message + "Retry" button)

7. **Create Migration Orchestrator Hook**
   - Create `hooks/use-migration.ts` with `useMigration` hook:
     - State: `isMigrating`, `progress`, `error`
     - Function: `executeMigration(oldData: OldExtensionData, accountId: string)`
     - Steps:
       1. Set `isMigrating = true`, `progress = 'personas'`
       2. Migrate personas: loop through `oldData.personas`, call `trpc.persona.commentStyle.create.mutate()`
       3. Set `progress = 'lists'`
       4. Migrate lists: loop through `oldData.lists`, call `trpc.targetList.addList.mutate()`, store `{ listName -> listId }` mapping
       5. Set `progress = 'profiles'`
       6. Migrate profiles: loop through `oldData.profiles`, build `linkedinUrl` from key, extract `lists` from profile data, map list names to IDs, call `trpc.targetList.updateProfileLists.mutate()`
       7. Set migration complete flag: `setMigrationComplete(accountId, oldData.counts)`
       8. Set `isMigrating = false`, `progress = null`
     - Error handling: catch errors, set `error` state, keep `isMigrating = false`
     - Return: `{ executeMigration, isMigrating, progress, error, retry: () => executeMigration(oldData, accountId) }`

8. **Implement Persona Migration**
   - In `useMigration` hook, create `migratePersonas` function:
     - Loop through `oldData.personas` (array of `{name: string, prompt: string}`)
     - For each persona, call `trpc.persona.commentStyle.create.mutate({ name: persona.name, description: '', content: persona.prompt })`
     - Use `await Promise.all()` for parallel execution (faster)
     - Catch individual errors, log which personas failed, continue with others
     - Return count of successful migrations

9. **Implement Target List Migration**
   - In `useMigration` hook, create `migrateTargetLists` function:
     - Loop through `oldData.lists` (array of strings)
     - For each list name, call `trpc.targetList.addList.mutate({ name: listName })`
     - Store mapping: `listNameToId = { [listName]: response.id }`
     - Use `await Promise.all()` for parallel execution
     - Return `{ listNameToId, successCount }`

10. **Implement Profile Migration**
    - In `useMigration` hook, create `migrateProfiles` function:
      - Loop through `Object.entries(oldData.profiles)` (key = LinkedIn URL, value = profile data)
      - For each profile:
        - Extract `linkedinUrl` from key (normalize: ensure https, remove query params)
        - Extract `lists` array from profile data (array of list names)
        - Map list names to IDs using `listNameToId` from previous step
        - Extract profile metadata: `{ name, profileSlug, profileUrn, headline, photoUrl }` from profile data
        - Call `trpc.targetList.updateProfileLists.mutate({ linkedinUrl, addToListIds: mappedListIds, removeFromListIds: [], profileData: metadata })`
      - Use `await Promise.all()` for parallel execution (with chunking if >50 profiles)
      - Return count of successful migrations

11. **Wire Migration Hook to UI**
    - In `App.tsx`, use `useMigration` hook
    - Pass `executeMigration` to `MigrationPreview` component
    - Render `MigrationInProgress` when `isMigrating === true`
    - Show current `progress` step with icon + text
    - Render `MigrationComplete` when migration succeeds
    - Render `MigrationError` when `error !== null`, pass `retry` function to error component

12. **Add Post-Migration Links**
    - In `MigrationComplete` component, add quick links:
      - "Manage Personas" → `{VITE_APP_URL}/{orgSlug}/personas`
      - "Manage Target Lists" → `{VITE_APP_URL}/{orgSlug}/target-lists`
      - "View Dashboard" → `{VITE_APP_URL}/{orgSlug}/dashboard`
    - Use `chrome.tabs.create({ url: ... })` to open links
    - Get `orgSlug` from `authStore.organization.slug`
    - Get `VITE_APP_URL` from env (use `import.meta.env.VITE_APP_URL`)

13. **Add Account Registration CTA**
    - In `AccountRegistrationRequired` component:
      - Show message: "To migrate your data, please register your LinkedIn account first"
      - Show button: "Register LinkedIn Account"
      - On click: `chrome.tabs.create({ url: `${VITE_APP_URL}/${orgSlug}/accounts` })`
      - Show refresh hint: "After registration, close and reopen this popup"

14. **Implement Error Handling**
    - Wrap all tRPC calls in try-catch
    - Catch `TRPCError` and extract `message` for user-friendly display
    - For network errors, show "Network error. Please check your connection."
    - For auth errors (401), show "Session expired. Please sign in again."
    - For permission errors (403), show "You don't have permission to perform this action."
    - Add "Retry" button that calls `executeMigration` again with same data

15. **Add Loading States**
    - Create `LoadingSpinner` component (use `@sassy/ui/spinner` or Lucide `Loader2` icon with spin animation)
    - Show spinner while auth loading: `authStore.isLoading || !authStore.isLoaded`
    - Show spinner while account loading: `accountStore.isLoading || !accountStore.isLoaded`
    - Show spinner during migration: `isMigrating === true`
    - Use skeleton loaders for data preview while old data detection runs

16. **Add Migration Progress Indicator**
    - In `MigrationInProgress` component:
      - Show steps: "1. Migrating personas", "2. Migrating target lists", "3. Migrating profiles"
      - Highlight current step based on `progress` prop
      - Show checkmark for completed steps
      - Use `@sassy/ui/progress` bar (0% → 33% → 66% → 100%)
      - Show counts: "Migrating 5 personas..." → "5 personas migrated ✓"

17. **Test Full Migration Flow**
    - Test 1: User not signed in → Shows sign-in CTA
    - Test 2: User signed in, no old data → Shows "Nothing to migrate"
    - Test 3: User signed in, old data exists, no account registered → Shows "Register account" CTA
    - Test 4: User signed in, old data exists, account registered, not migrated → Shows migration preview
    - Test 5: Click "Migrate Now" → Progress indicator shows → Data migrates → Success screen shows
    - Test 6: Verify data in webapp (personas, lists, profiles)
    - Test 7: Reopen popup → Shows "Migration complete" (no duplicate migration)
    - Test 8: Test error handling: disconnect network, trigger migration → Error screen shows → Reconnect → Click retry → Migration succeeds
    - Test 9: Test with large dataset (100+ profiles) → Verify chunking works, no timeout
    - Test 10: Test with missing list names → Verify profiles still migrate (skip invalid lists)

## Risks and Mitigations

**Risk 1:** User opens popup while not logged into registered LinkedIn account
- **Mitigation:** `accountStore.matchingAccount` will be `null`, show "Register account" CTA (even if they have an account, but wrong LinkedIn profile is active)

**Risk 2:** Partial migration (some items succeed, some fail)
- **Mitigation:** Catch errors per-item, log failed items, allow retry. APIs are idempotent (create operations use `skipDuplicates` or check existence).

**Risk 3:** Large dataset (1000+ profiles) causes popup timeout
- **Mitigation:** Chunk profile migrations (50 at a time), show progress. Consider moving migration to background worker for large datasets (out of scope for v1).

**Risk 4:** Old extension data format changes
- **Mitigation:** Add version detection to old data, handle missing fields gracefully with defaults.

**Risk 5:** User closes popup during migration
- **Mitigation:** Migration state is tracked in `isMigrating` flag. Next open, check if migration incomplete, allow resume or retry.

**Risk 6:** tRPC client not configured with `x-account-id` header
- **Mitigation:** Verify `getTrpcClient()` in `lib/trpc/client.tsx` reads `accountStore.matchingAccount.id` and adds header (already implemented).

**Risk 7:** User has multiple LinkedIn accounts registered
- **Mitigation:** v1 only migrates to `matchingAccount` (currently active LinkedIn). Show warning if user wants to migrate to different account (out of scope for v1).

## Integration Notes

- **Auth Flow:** Use existing `authService` and `authStore` (already configured for background worker auth)
- **Account Store:** Use `accountStore.matchingAccount` to get active account ID for tRPC header
- **tRPC Client:** Already configured in `lib/trpc/client.tsx`, automatically adds `Authorization` and `x-account-id` headers
- **APIs:** All required endpoints exist:
  - `persona.commentStyle.create` (input: `{ name, description, content }`)
  - `targetList.addList` (input: `{ name }`)
  - `targetList.updateProfileLists` (input: `{ linkedinUrl, addToListIds, removeFromListIds, profileData }`)
- **Old Extension Data Format:**
  - `customStyleGuides`: `Array<{ name: string, prompt: string }>`
  - `engagekit-profile-lists`: `Array<string>` (list names)
  - `engagekit-profile-data`: `Record<string, { profileUrn?: string, lists?: string[], name?: string, headline?: string, photoUrl?: string, ... }>`
- **Migration Flag:** Store per-account in `chrome.storage.local` with key `wxt-migration-complete-{accountId}` (value = `true`)
- **Environment Variables:** Use `import.meta.env.VITE_APP_URL` for webapp base URL (configured in `.env.local`)

---

## Cursor + RIPER-5 Guidance

**RIPER-5 Mode:**
- **RESEARCH:** ✅ Complete - Reviewed old popup, WXT popup, auth flow, APIs, account store
- **INNOVATE:** ✅ Complete - Decided on migration flow, error handling strategy, UI states
- **PLAN:** ✅ Current - This plan document
- **EXECUTE:** Next - Implement following checklist exactly (steps 1-17)
- **REVIEW:** After execution - Validate against acceptance criteria

**Next Step:** Begin implementation with Step 1: Create Popup Layout Component

---

## IMPLEMENTATION CHECKLIST (from wxt-popup-migration_PLAN_16-01-26.md):

1. Create Popup Layout Component in `apps/wxt-extension/entrypoints/popup/App.tsx`
2. Set Up Auth Detection using `authService` and `useAuthStore`
3. Set Up Account Store Integration with `useAccountStore`
4. Create Old Data Detection Logic in `utils/detect-old-data.ts`
5. Create Migration Status Check Logic in `utils/migration-status.ts`
6. Build Migration UI States in `components/popup/MigrationStates.tsx`
7. Create Migration Orchestrator Hook in `hooks/use-migration.ts`
8. Implement Persona Migration logic in `useMigration` hook
9. Implement Target List Migration logic in `useMigration` hook
10. Implement Profile Migration logic in `useMigration` hook
11. Wire Migration Hook to UI in `App.tsx`
12. Add Post-Migration Links in `MigrationComplete` component
13. Add Account Registration CTA in `AccountRegistrationRequired` component
14. Implement Error Handling for all tRPC calls
15. Add Loading States with spinners and skeletons
16. Add Migration Progress Indicator with step highlights
17. Test Full Migration Flow (10 test scenarios)

Each item is atomic, specific, and ordered logically for execution.
