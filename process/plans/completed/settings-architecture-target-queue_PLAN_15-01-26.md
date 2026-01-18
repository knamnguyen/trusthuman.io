# Settings Architecture + Target List Queue - Implementation Plan

**Created**: 2026-01-15
**Updated**: 2026-01-16
**Complexity**: COMPLEX
**Status**: ✅ COMPLETE - Tested and working

---

## 1. Overview

This plan implements a comprehensive settings architecture refactor and multi-target-list queue system. The architecture separates concerns between DB-synced settings (PostLoadSetting, SubmitCommentSetting, CommentGenerateSetting), local-only behavior settings, and local image storage. Additionally, it implements a queue-based system for processing multiple target lists sequentially across browser tabs.

### Key Changes

1. **DB Schema Migration**: Change `PostLoadSetting.targetListId` from single `String?` to array `targetListIds String[]`
2. **Settings Store Split**: Separate DB-synced settings from local-only behavior settings
3. **Image Storage Refactor**: Enforce single image limit, store as base64/ArrayBuffer
4. **tRPC Endpoints**: Create settings CRUD API for DB-synced settings
5. **Target List Queue**: Sequential multi-tab processing with auto-resume after navigation
6. **Auto-Resume System**: Wait for auth + account + settings stores before triggering Load Posts

---

## 2. Goals

- Support multiple target list selection (array in DB schema)
- Fetch DB settings from server on auth ready (similar to account-store pattern)
- Store behavior settings locally only (never sync to DB)
- Store single image locally with blob reference for submission
- Process multiple target lists sequentially in separate tabs
- Auto-resume Load Posts after navigation with proper dependency checks

---

## 3. Scope

### In Scope

- DB schema migration for `targetListIds String[]`
- tRPC router for settings CRUD (`post-load-setting`, `submit-comment-setting`, `comment-generate-setting`)
- Settings store refactor (DB-synced + loading states)
- Local behavior store (browser.storage.local only)
- Local image store refactor (single image enforcement)
- Queue state management (browser.storage.session)
- Multi-tab navigation and Load Posts triggering
- Auto-resume system with dependency checks (auth + account + settings)
- UI updates for multiple target list selection

### Out of Scope

- Migration of existing single target list data (will be handled manually if needed)
- Comment style CRUD (already exists, just reference)
- Blacklist CRUD (already exists, just reference)
- Advanced queue features (pause/resume, reordering)

---

## 4. Architecture Decisions

### 4.1 Settings Architecture

**Three-Store Pattern**:

1. **DB Settings Store** (`settings-db-store.ts`)
   - Fetches PostLoadSetting, SubmitCommentSetting, CommentGenerateSetting from tRPC
   - Includes `isLoading`, `isLoaded` flags (similar to account-store)
   - Auto-fetches on auth ready
   - Provides update methods that sync to DB

2. **Local Behavior Store** (`settings-local-store.ts`)
   - `humanOnlyMode`, `autoEngageOnCommentClick`, `spacebarAutoEngage`, `postNavigator`
   - Stored in `browser.storage.local` only
   - Never syncs to DB
   - Persists across page refreshes
   - Also includes single image storage (base64 + blob)

3. ~~**Local Image Store** (`comment-image-store.ts`)~~ - Merged into settings-local-store

**Rationale**: Separation of concerns - DB settings are account-specific and need server sync, behavior settings are client-side preferences, images are transient session data.

### 4.2 Target List Queue Architecture

**Queue State** (stored in `browser.storage.session`):

```typescript
interface TargetListQueueState {
  queue: Array<{
    targetListId: string;
    targetListUrns: string[];
    targetListName: string;
  }>;
  currentIndex: number;
  postLoadSettings: PostLoadSettings; // Settings snapshot for entire queue
  targetDraftCount: number;
  createdAt: number;
}
```

**Processing Flow**:

1. User selects multiple target lists in UI
2. User clicks "Load Posts"
3. For each target list:
   - Save queue state to `browser.storage.session`
   - **Use background script** to open new tab (avoids popup blocker)
   - Wait for page load + auth + account + settings loaded
   - Check for queue state
   - Auto-trigger Load Posts with settings snapshot
   - Process sequentially (only 1 focused tab at a time)
4. Tabs remain open after completion

**CRITICAL FIX - Popup Blocker Issue**:

The web `window.open()` API requires user gesture context. When opening subsequent tabs after Load Posts completes (in a callback), Chrome's popup blocker will block it.

**Solution**: Use `chrome.tabs.create()` from background script instead:

```
Content Script                    Background Script
     │                                  │
     │  "open-target-list-tab" ────────►│
     │                                  │ chrome.tabs.create({ url })
     │                                  │ (privileged, no popup blocker)
     │◄──────────── response ───────────│
```

**Rationale**: Sequential processing prevents rate limits and memory issues. Session storage ensures queue state survives page reloads but clears on browser close. Background script tab creation bypasses popup blocker.

### 4.3 DB Schema Change

**Before**:
```prisma
model PostLoadSetting {
  targetListId String? @unique // Single target list
  targetList   TargetList? @relation("PostLoadSetting_targetList", fields: [targetListId], references: [id], onDelete: SetNull)
}
```

**After**:
```prisma
model PostLoadSetting {
  targetListIds String[] // Array of target list IDs
  // Remove unique constraint and direct relation
}
```

**Rationale**: PostgreSQL native array support is efficient and simple. Removes @unique constraint to allow multiple lists. Direct relation removed (lists fetched separately by IDs).

---

## 5. Implementation Checklist

### Phase 1: DB Schema + tRPC API (Backend) ✅ COMPLETE

#### Step 1.1: Update Prisma Schema
- [x] Open `/packages/db/prisma/models/comment/post-load-setting.prisma`
- [x] Change `targetListId String? @unique` to `targetListIds String[]`
- [x] **ADD**: `targetListEnabled Boolean @default(false)` - toggle independent of selection
- [x] Remove `targetList TargetList? @relation(...)` line
- [x] Keep all other fields unchanged

#### Step 1.2: Generate Migration
- [x] Run `pnpm db:push` from root to apply schema changes
- [x] Verify migration in database

#### Step 1.3: Create tRPC Settings Router
- [x] Create `/packages/api/src/router/settings.ts`
- [x] Implement router with procedures (get + upsert for all three settings)
- [x] All procedures require authenticated user + selected account from context

#### Step 1.4: Create Zod Validators
- [x] Create `/packages/validators/src/settings.ts`
- [x] Define all setting schemas

#### Step 1.5: Register Settings Router
- [x] Add to router in `/packages/api/src/router/root.ts`

### Phase 2: DB Settings Store (Extension) ✅ COMPLETE

#### Step 2.1: Create DB Settings Store
- [x] Create `/apps/wxt-extension/entrypoints/linkedin.content/stores/settings-db-store.ts`
- [x] Define interfaces matching Prisma models
- [x] Create Zustand store with `isLoading`, `isLoaded` flags
- [x] Create actions: `fetchSettings()`, `updatePostLoad()`, `updateSubmitComment()`, `updateCommentGenerate()`, `clear()`
- [x] Add listener initialization function `initSettingsDBStoreListener()`

### Phase 3: UI Updates ✅ COMPLETE

#### Step 3.1: Update ComposeTab for Multiple Target Lists
- [x] Connect to `useSettingsDBStore()` for DB-synced settings

#### Step 3.2: Create Target List Multi-Select Component
- [x] Create `/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/settings/TargetListSelector.tsx`
- [x] Fetch target lists from tRPC
- [x] Display as checkbox list with multi-select support

#### Step 3.3: Create Blacklist Selector Component
- [x] Create `/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/settings/BlacklistSelector.tsx`
- [x] Single-select dropdown

#### Step 3.4: Create Default Comment Style Selector
- [x] Create `/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/settings/CommentStyleSelector.tsx`
- [x] Single-select dropdown

#### Step 3.5: Update Settings Tags Display
- [x] Update `/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/settings/SettingsTags.tsx`
- [x] Read from both `settings-db-store` and `settings-local-store`

### Phase 4: Local Stores (Behavior + Image) ✅ COMPLETE

#### Step 4.1: Create Local Settings Store
- [x] Create `/apps/wxt-extension/entrypoints/linkedin.content/stores/settings-local-store.ts`
- [x] Combined behavior settings + single image storage
- [x] `humanOnlyMode`, `autoEngageOnCommentClick`, `spacebarAutoEngage`, `postNavigator`
- [x] Single image with base64 persistence + blob for submission

#### Step 4.2: Deprecate Old Settings Store
- [x] Deleted `/apps/wxt-extension/entrypoints/linkedin.content/stores/settings-store.ts`

### Phase 5: Target List Queue System ✅ COMPLETE

#### Step 5.1: Create Queue State Module
- [x] Create `/apps/wxt-extension/entrypoints/linkedin.content/stores/target-list-queue.ts`
- [x] Define `TargetListQueueItem`, `TargetListQueueState` interfaces
- [x] Create utility functions: `saveQueueState()`, `loadQueueState()`, `clearQueueState()`, `getNextQueueItem()`, `isQueueComplete()`

#### Step 5.2: Update Navigation State
- [x] Update `/apps/wxt-extension/entrypoints/linkedin.content/stores/navigation-state.ts`
- [x] Support `type: 'single' | 'queue'` with optional `queueState`
- [x] Update `savePendingNavigation()` and `consumePendingNavigation()`

#### Step 5.3: Create Multi-Tab Navigation Handler
- [x] Create `/apps/wxt-extension/entrypoints/linkedin.content/utils/multi-tab-navigation.ts`
- [x] Create `processTargetListQueue()` and `continueQueueProcessing()`
- [x] Create `buildListFeedUrl()` in `/packages/linkedin-automation/src/navigate/build-list-feed-url.ts`

### Phase 6: Auto-Resume System ✅ COMPLETE

#### Step 6.1: Create Dependency Checker
- [x] Create `/apps/wxt-extension/entrypoints/linkedin.content/utils/auto-resume-checker.ts`
- [x] Create `waitForStoresReady()` - polls auth + account + settings stores
- [x] Create `checkAndResumeLoadPosts()` - main entry point

#### Step 6.2: Integrate Auto-Resume into Content Script
- [ ] Wire up to content script initialization (needs verification)

### Phase 7: Migration and Cleanup ✅ COMPLETE

#### Step 7.1: Migrate ComposeTab from Old Settings Store
- [x] Replace all `useSettingsStore()` calls with new stores

#### Step 7.2: Migrate Other Components
- [x] Migrated: SpacebarEngageObserver, useAutoEngage, useEngageButtons, PostNavigator
- [x] Migrated: ComposeCard, PostPreviewSheet, SettingsTags

#### Step 7.3: Delete Old Settings Store
- [x] Deleted `/apps/wxt-extension/entrypoints/linkedin.content/stores/settings-store.ts`

#### Step 7.4: Refactor Submit Flow
- [x] Created `/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/utils/submit-comment-full-flow.ts`
- [x] Updated `save-comment-to-db.ts` to accept `commentUrl` from `SubmitCommentResult`
- [x] Consolidated duplicate submit logic across ComposeCard, PostPreviewSheet, ComposeTab

### Phase 8: Background Script Tab Creation + Auto-Resume Wiring ✅ COMPLETE

**Purpose**:
1. Fix popup blocker issue when opening tabs after Load Posts completes (no user gesture context)
2. Wire up auto-resume so Load Posts actually starts after navigation

#### Step 8.1: Add Background Script Message Handler
- [x] Updated `/apps/wxt-extension/entrypoints/background/background-types.ts` - Added `openTargetListTab` action
- [x] Updated `/apps/wxt-extension/entrypoints/background/message-router.ts` - Added `handleOpenTargetListTab` handler

#### Step 8.2: Create Tab Opening Utility
- [x] Created `/apps/wxt-extension/entrypoints/linkedin.content/utils/open-tab-via-background.ts`

#### Step 8.3: Update Multi-Tab Navigation
- [x] Updated `/apps/wxt-extension/entrypoints/linkedin.content/utils/multi-tab-navigation.ts`
- [x] Replaced `window.open()` with `openTabViaBackground()` in both functions
- [x] Added `savePendingNavigation()` calls before opening tabs (triggers auto-resume)

#### Step 8.4: Wire Up ComposeTab to Queue System
- [x] Updated `/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/ComposeTab.tsx`
- [x] Always use queue system for target lists (even for 1 list - consistency)
- [x] Build `TargetListQueueItem[]` from fetched profiles
- [x] Call `processTargetListQueue()` instead of direct navigation
- [x] Removed legacy single-list navigation path

#### Step 8.5: Wire Up Auto-Resume to ComposeTab
- [x] Updated ComposeTab's useEffect to use `checkAndResumeLoadPosts()`
- [x] Auto-resume now waits for all stores (auth, account, settings) before triggering
- [x] Callback triggers full Load Posts flow with proper settings
- [x] Fixed `isAuthReady` → `isLoaded` in auto-resume-checker.ts

#### Step 8.6: Fix Storage Issues
- [x] Fixed `browser.storage.session` hanging in content scripts
- [x] Switched to `browser.storage.local` for both queue state and navigation state
- [x] Added 5-second timeout detection for storage operations

#### Step 8.7: Fix Auto-Resume at Content Script Level
- [x] Moved auto-resume check from ComposeTab (React) to content script (index.tsx)
- [x] Content script now sets `window.__engagekit_pending_navigation` global
- [x] Auto-opens sidebar and switches to Compose tab when pending navigation found
- [x] ComposeTab checks global variable and triggers Load Posts

#### Step 8.8: Add URN Pre-fetching
- [x] Added in-memory URN cache with 5-minute TTL (`cacheTargetListUrns`, `getCachedUrns`)
- [x] TargetListSelector pre-fetches URNs when popover closes (fire-and-forget)
- [x] ComposeTab uses cached URNs first, only fetches uncached lists
- [x] Results in near-instant "Load Posts" when target lists are selected

#### Step 8.9: Fix Queue Timeout
- [x] Increased queue timeout from 30 seconds to 5 minutes per tab
- [x] Reset `createdAt` timestamp when advancing to next queue item (fresh timeout per tab)

#### Step 8.10: Test Full Queue Flow ✅
- [x] Test with 1 target list (uses queue system, auto-resume works)
- [x] Test with 7 target lists (sequential tabs, all processed)
- [x] Verify tabs open without popup blocker
- [x] Verify auto-resume triggers Load Posts in each tab
- [x] Verify queue completes successfully

---

## 6. Acceptance Criteria

### Functional Requirements

- [x] User can select multiple target lists in UI (checkbox list)
- [x] User can select single blacklist in UI (dropdown, single-select)
- [x] User can select single default comment style in UI (dropdown, enforced single)
- [x] Clicking "Load Posts" with multiple lists opens sequential tabs (one per list)
- [x] Each tab auto-resumes Load Posts after page navigation
- [x] Tabs remain open after Load Posts completes
- [x] Queue state persists across page reloads (local storage)
- [x] Settings are fetched from DB on auth ready (loading states work)
- [x] Behavior settings persist in local storage only
- [x] Single image upload enforced (cannot upload second image)
- [x] Image stored as base64, blob recreated on load
- [x] `attachPictureEnabled` toggle in UI controls whether image is attached
- [x] Settings tags display correctly for multiple lists

### Technical Requirements

- [x] DB schema migration applied successfully (`targetListIds String[]`)
- [x] tRPC settings router works (get + upsert for all three settings)
- [x] `settings-db-store` includes `isLoading`, `isLoaded` flags
- [x] `settings-local-store` never calls tRPC (local only)
- [x] Single image enforcement in local store
- [x] Queue state saved to `browser.storage.local` (session storage hangs in content scripts)
- [x] Auto-resume waits for auth + account + settings loaded
- [x] Old `settings-store.ts` deleted (no remaining imports)
- [x] Background script handles tab creation (no popup blocker)
- [x] No TypeScript errors
- [x] No console errors during Load Posts

### Edge Cases

- [x] If queue state expires (5 minutes per tab), auto-resume does nothing
- [x] If user closes tab mid-queue, next tab continues from correct index
- [x] If user manually navigates away, queue state is cleared
- [x] If settings fail to load, UI shows error message
- [x] If no target lists selected but target list enabled, Load Posts shows validation error
- [x] Single target list uses same queue system as multiple (consistency, no legacy path)

---

## 7. Dependencies

### External Dependencies

- PostgreSQL array support (native, no changes needed)
- `browser.storage.session` API (available in Manifest V3)
- `browser.tabs.create` API (for background script tab creation)
- tRPC v11 (already in use)
- Zustand (already in use)

### Internal Dependencies

- Existing `account-store` pattern (reference for loading states)
- Existing `navigation-state` module (extended for queue)
- Existing `buildListFeedUrl` utility (created)
- Existing `targetList` tRPC router (for fetching lists)

---

## 8. Risks and Mitigations

### Risk 1: Session Storage Quota Exceeded

**Impact**: Queue state could fail to save if too many target lists selected

**Mitigation**:
- Enforce max 10 target lists per queue in UI
- Store only essential data (IDs and URNs, not full objects)

### Risk 2: Race Condition on Store Initialization

**Impact**: Auto-resume might trigger before stores fully loaded

**Mitigation**:
- Use explicit `isLoaded` flags in all stores
- `waitForStoresReady()` polls all three flags with timeout
- Log all state transitions for debugging

### Risk 3: Migration Data Loss

**Impact**: Existing `targetListId` data could be lost during migration

**Mitigation**:
- Manually migrate existing data before schema change (if production data exists)
- Add migration script if needed (separate from this plan)

### Risk 4: Tab Limit Exceeded

**Impact**: Too many tabs could cause memory issues

**Mitigation**:
- Enforce max 10 target lists in UI
- Close tabs automatically after Load Posts completes (optional, out of scope for V1)

### Risk 5: Popup Blocker (RESOLVED)

**Impact**: `window.open()` blocked when called outside user gesture context

**Mitigation**:
- Use `chrome.tabs.create()` from background script instead
- Background script APIs are privileged and not subject to popup blocker

---

## 9. Testing Strategy

### Unit Tests

- [ ] Test `saveQueueState()` and `loadQueueState()` with mock session storage
- [ ] Test `waitForStoresReady()` with mock store states
- [ ] Test `getNextQueueItem()` increments index correctly
- [ ] Test `isQueueComplete()` returns true when all processed

### Integration Tests

- [ ] Test full queue flow: Select 3 lists → Load Posts → Verify 3 tabs open
- [ ] Test auto-resume: Navigate to list → Verify Load Posts triggers
- [ ] Test settings fetch: Sign in → Verify settings loaded from DB
- [ ] Test behavior settings persistence: Toggle setting → Reload page → Verify persisted

### Manual Testing

- [ ] Test with 1 target list (backward compat)
- [ ] Test with 3 target lists (queue)
- [ ] Test with no target lists (validation error)
- [ ] Test image upload (single image enforced)
- [ ] Test settings sync (update in UI → Verify in DB)
- [ ] Test behavior settings (toggle → Verify NOT in DB)

---

## 10. Rollout Plan

### Phase 1: Backend (No User Impact)

- Deploy DB schema migration
- Deploy tRPC settings router
- Verify endpoints work via Postman/tRPC playground

### Phase 2: Frontend Stores (Feature Flag)

- Deploy new stores behind feature flag
- Test with internal users only
- Monitor logs for errors

### Phase 3: UI Updates (Gradual Rollout)

- Enable target list multi-select for beta users
- Enable queue processing for beta users
- Monitor tab count and session storage usage

### Phase 4: Full Release

- Enable for all users
- Deprecate old settings store
- Remove feature flags

---

## 11. Open Questions

### Q1: Should tabs auto-close after Load Posts completes?

**Answer**: Out of scope for V1. Users may want to review tabs manually.

### Q2: What happens if user selects 20+ target lists?

**Answer**: Enforce max 10 in UI. Show validation error if exceeded.

### Q3: Should queue support pause/resume?

**Answer**: Out of scope for V1. Users can close tabs to stop queue.

### Q4: Should settings have optimistic updates?

**Answer**: Yes. Update store immediately, then sync to DB. Revert on error.

### Q5: How to handle popup blocker for subsequent tabs?

**Answer**: Use `chrome.tabs.create()` from background script instead of `window.open()`. Background script APIs are privileged and bypass popup blocker.

---

## 12. Future Enhancements

- Advanced queue features (pause, resume, reorder)
- Queue progress indicator in UI
- Auto-close tabs after completion (configurable)
- Target list search/filter in selector
- Bulk settings update (apply same settings to multiple accounts)
- Settings history/versioning
- Settings import/export

---

## 13. Success Metrics

- Settings load time < 500ms after auth ready
- Queue processing time < 2 seconds per tab open
- Zero session storage quota errors
- Zero race conditions on auto-resume
- 100% backward compatibility with single target list selection
- Zero TypeScript errors after migration
- Zero popup blocker issues

---

## 14. Implementation Notes

### Important Patterns to Follow

1. **Store Initialization**: All stores must have explicit `isLoaded` flag
2. **Error Handling**: All tRPC calls must have try/catch with user-facing error messages
3. **Optimistic Updates**: Update store immediately, sync to DB async, revert on error
4. **Logging**: Add console.log for all queue state transitions (debug aid)
5. **Tab Creation**: Always use background script for programmatic tab creation

### File Naming Conventions

- DB stores: `*-db-store.ts`
- Local stores: `*-local-store.ts`
- Utils: `*-navigation.ts`, `*-checker.ts`

### TypeScript Strictness

- All store interfaces must be exported (used by components)
- All tRPC inputs must have Zod validators
- All async functions must have explicit return types

---

## 15. Related Documentation

- ~~[Target List Auto-Resume Plan](/process/plans/target-list-auto-resume_PLAN_15-01-26.md)~~ - Superseded, archived
- [Account Store Pattern](/apps/wxt-extension/entrypoints/linkedin.content/stores/account-store.ts)

---

## 16. Progress Summary

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: DB Schema + tRPC | ✅ Complete | Schema migrated, router created |
| Phase 2: DB Settings Store | ✅ Complete | `settings-db-store.ts` created |
| Phase 3: UI Updates | ✅ Complete | Selectors created, tags updated |
| Phase 4: Local Stores | ✅ Complete | `settings-local-store.ts` created |
| Phase 5: Queue System | ✅ Complete | Queue state + navigation handlers |
| Phase 6: Auto-Resume | ✅ Complete | Dependency checker created |
| Phase 7: Migration | ✅ Complete | Old store deleted, submit flow refactored |
| Phase 8: Background Tab Creation | ✅ Complete | Popup blocker fixed, auto-resume wired |

---

**All Phases Complete and Tested!**

---

## 17. Implementation Summary

### Files Created

| File | Purpose |
|------|---------|
| `stores/target-list-queue.ts` | Queue state management + URN caching |
| `stores/navigation-state.ts` | Pending navigation state for auto-resume |
| `utils/multi-tab-navigation.ts` | Tab orchestration (`processTargetListQueue`, `continueQueueProcessing`) |
| `utils/open-tab-via-background.ts` | Popup blocker bypass via background script |
| `utils/auto-resume-checker.ts` | Store readiness detection (`waitForStoresReady`) |

### Key Functions

| Function | Location | Purpose |
|----------|----------|---------|
| `cacheTargetListUrns()` | target-list-queue.ts | Store pre-fetched URNs (5-min TTL) |
| `getCachedUrns()` | target-list-queue.ts | Retrieve cached URNs |
| `saveQueueState()` | target-list-queue.ts | Save queue to browser.storage.local |
| `loadQueueState()` | target-list-queue.ts | Load queue (null if expired/missing) |
| `getNextQueueItem()` | target-list-queue.ts | Get next list + increment index + reset timeout |
| `savePendingNavigation()` | navigation-state.ts | Save state before opening new tab |
| `consumePendingNavigation()` | navigation-state.ts | Read + clear pending state (one-time use) |
| `processTargetListQueue()` | multi-tab-navigation.ts | Start queue: save state → open first tab |
| `continueQueueProcessing()` | multi-tab-navigation.ts | Called after load completes → open next tab |
| `openTabViaBackground()` | open-tab-via-background.ts | Send message to background script to open tab |
| `waitForStoresReady()` | auto-resume-checker.ts | Poll until auth/account/settings loaded |

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  1. USER SELECTS TARGET LISTS (TargetListSelector.tsx)                  │
│     └─ On popover close → prefetchUrns() → cacheTargetListUrns()        │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  2. USER CLICKS "LOAD POSTS" (ComposeTab.tsx)                           │
│     └─ getCachedUrns() for each list (instant if pre-fetched)           │
│     └─ Build queue items with URNs                                      │
│     └─ processTargetListQueue() → saves queue + opens Tab 1             │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  3. NEW TAB OPENS (index.tsx content script)                            │
│     └─ waitForStoresReady() (polls until auth/account/settings loaded)  │
│     └─ consumePendingNavigation() → finds queue state                   │
│     └─ Sets window.__engagekit_pending_navigation                       │
│     └─ Auto-opens sidebar + switches to Compose tab                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  4. COMPOSE TAB MOUNTS (ComposeTab.tsx useEffect)                       │
│     └─ Checks window.__engagekit_pending_navigation                     │
│     └─ Triggers collectPostsBatch() with saved settings                 │
│     └─ On complete → continueQueueProcessing()                          │
│           └─ getNextQueueItem() (resets timeout)                        │
│           └─ Opens Tab 2 via background script                          │
│           └─ Repeat steps 3-4 until queue complete                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `browser.storage.local` instead of `session` | Session storage hangs in content scripts |
| 5-minute timeout per tab (reset on advance) | Prevents stale queues while allowing time for loading |
| URN pre-fetching on selector close | Eliminates API wait when clicking Load Posts |
| Background script for tab creation | Bypasses popup blocker (privileged API) |
| Global variable handoff | Bridges content script → React component |
