# Settings Architecture + Target List Queue - Implementation Plan

**Created**: 2026-01-15
**Complexity**: COMPLEX
**Status**: ⏳ PLAN APPROVED - AWAITING EXECUTE

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

2. **Local Behavior Store** (`settings-behavior-store.ts`)
   - `humanOnlyMode`, `autoEngageOnCommentClick`, `spacebarAutoEngage`, `postNavigator`
   - Stored in `browser.storage.local` only
   - Never syncs to DB
   - Persists across page refreshes

3. **Local Image Store** (`comment-image-store.ts` - existing, needs refactor)
   - Single image only (enforce limit)
   - Store as base64/ArrayBuffer in `browser.storage.local`
   - Keep blob reference for submission
   - Recreate blob URL on demand for display

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
   - Open new tab with target list feed URL
   - Wait for page load + auth + account + settings loaded
   - Check for queue state
   - Auto-trigger Load Posts with settings snapshot
   - Process sequentially (only 1 focused tab at a time)
4. Tabs remain open after completion

**Rationale**: Sequential processing prevents rate limits and memory issues. Session storage ensures queue state survives page reloads but clears on browser close.

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

### Phase 1: DB Schema + tRPC API (Backend)

#### Step 1.1: Update Prisma Schema
- [ ] Open `/packages/db/prisma/models/comment/post-load-setting.prisma`
- [ ] Change `targetListId String? @unique` to `targetListIds String[]`
- [ ] Remove `targetList TargetList? @relation("PostLoadSetting_targetList", fields: [targetListId], references: [id], onDelete: SetNull)` line
- [ ] Keep all other fields unchanged

#### Step 1.2: Generate Migration
- [ ] Run `pnpm db:push` from root to apply schema changes
- [ ] Verify migration in database (check `PostLoadSetting` table has `targetListIds` column)

#### Step 1.3: Create tRPC Settings Router
- [ ] Create `/packages/api/src/router/settings.ts`
- [ ] Import `createTRPCRouter`, `protectedProcedure`
- [ ] Import Zod schemas from `@sassy/validators` (create schemas in next step)
- [ ] Implement router with procedures:
  - `postLoad.get` - Get current account's PostLoadSetting
  - `postLoad.upsert` - Create or update PostLoadSetting
  - `submitComment.get` - Get current account's SubmitCommentSetting
  - `submitComment.upsert` - Create or update SubmitCommentSetting
  - `commentGenerate.get` - Get current account's CommentGenerateSetting
  - `commentGenerate.upsert` - Create or update CommentGenerateSetting
- [ ] All procedures require authenticated user + selected account from context
- [ ] Use `ctx.db.postLoadSetting.upsert()` pattern with `accountId` as key

#### Step 1.4: Create Zod Validators
- [ ] Create `/packages/validators/src/settings.ts`
- [ ] Define `PostLoadSettingSchema` (matches Prisma model, `targetListIds` as `z.array(z.string())`)
- [ ] Define `SubmitCommentSettingSchema` (matches Prisma model)
- [ ] Define `CommentGenerateSettingSchema` (matches Prisma model)
- [ ] Export all schemas

#### Step 1.5: Register Settings Router
- [ ] Open `/packages/api/src/router/root.ts`
- [ ] Import `settingsRouter` from `./settings`
- [ ] Add to router: `settings: settingsRouter()`

### Phase 2: Frontend Stores (Extension)

#### Step 2.1: Create DB Settings Store
- [ ] Create `/apps/wxt-extension/entrypoints/linkedin.content/stores/settings-db-store.ts`
- [ ] Define interfaces matching Prisma models:
  - `PostLoadSettingDB` (with `targetListIds: string[]`)
  - `SubmitCommentSettingDB`
  - `CommentGenerateSettingDB`
- [ ] Create Zustand store with state:
  - `postLoad: PostLoadSettingDB | null`
  - `submitComment: SubmitCommentSettingDB | null`
  - `commentGenerate: CommentGenerateSettingDB | null`
  - `isLoading: boolean`
  - `isLoaded: boolean`
  - `error: string | null`
- [ ] Create actions:
  - `fetchSettings()` - Fetch all three settings from tRPC in parallel
  - `updatePostLoad(data: Partial<PostLoadSettingDB>)` - Update via tRPC, optimistic update
  - `updateSubmitComment(data: Partial<SubmitCommentSettingDB>)` - Update via tRPC
  - `updateCommentGenerate(data: Partial<CommentGenerateSettingDB>)` - Update via tRPC
  - `clear()` - Clear on sign out
- [ ] Add listener initialization function `initSettingsDBStoreListener()` (similar to account-store)
- [ ] Listen for `authStateChanged` message from background script
- [ ] Call `fetchSettings()` when `isSignedIn === true`

#### Step 2.2: Create Local Behavior Store
- [ ] Create `/apps/wxt-extension/entrypoints/linkedin.content/stores/settings-behavior-store.ts`
- [ ] Define `BehaviorSettings` interface:
  - `humanOnlyMode: boolean`
  - `autoEngageOnCommentClick: boolean`
  - `spacebarAutoEngage: boolean`
  - `postNavigator: boolean`
- [ ] Create Zustand store with state from above interface
- [ ] Add `isLoaded: boolean` flag
- [ ] Create actions:
  - `loadFromStorage()` - Load from `browser.storage.local.get('behaviorSettings')`
  - `updateSetting<K>(key: K, value: BehaviorSettings[K])` - Update in-memory and save to storage
  - `resetToDefaults()` - Reset all to false
- [ ] Call `loadFromStorage()` on store initialization (in background script or content script init)

#### Step 2.3: Refactor Image Store (Single Image Enforcement)
- [ ] Open `/apps/wxt-extension/entrypoints/linkedin.content/stores/comment-image-store.ts`
- [ ] Change state interface:
  - Remove `images: CommentImage[]`
  - Add `image: CommentImage | null` (single image)
  - Remove `isLoading` (not needed for local storage)
  - Remove `attachImageEnabled` (moved to DB setting: `submitComment.attachPictureEnabled`)
- [ ] Update `CommentImage` interface:
  - Add `base64Data?: string` (for persistent storage)
  - Add `arrayBuffer?: ArrayBuffer` (for blob recreation)
  - Keep `blob?: Blob` (for submission)
- [ ] Update storage format to save base64 data, not blob URL
- [ ] Update actions:
  - `setImage(file: File)` - Convert to base64, save to storage, create blob
  - `removeImage()` - Clear image, revoke blob URL, remove from storage
  - `loadImage()` - Load from storage, recreate blob from base64
  - `getImageBlob()` - Return blob for comment submission (check DB setting for enabled)
  - Remove `addImage`, `addLocalImage`, `getRandomImage`
- [ ] Store image as `{id, name, base64Data, addedAt}` in `browser.storage.local`
- [ ] On load, recreate blob from base64 and generate blob URL

#### Step 2.4: Deprecate Old Settings Store
- [ ] Open `/apps/wxt-extension/entrypoints/linkedin.content/stores/settings-store.ts`
- [ ] Add deprecation comment at top: "// DEPRECATED: Use settings-db-store.ts and settings-behavior-store.ts instead"
- [ ] Do NOT delete yet (migration will happen in Phase 4)

### Phase 3: Target List Queue System

#### Step 3.1: Create Queue State Module
- [ ] Create `/apps/wxt-extension/entrypoints/linkedin.content/stores/target-list-queue.ts`
- [ ] Define `TargetListQueueItem` interface:
  - `targetListId: string`
  - `targetListUrns: string[]`
  - `targetListName: string`
- [ ] Define `TargetListQueueState` interface:
  - `queue: TargetListQueueItem[]`
  - `currentIndex: number`
  - `postLoadSettings: PostLoadSettings` (snapshot)
  - `targetDraftCount: number`
  - `createdAt: number`
- [ ] Create utility functions:
  - `saveQueueState(state: TargetListQueueState)` - Save to `browser.storage.session`
  - `loadQueueState(): Promise<TargetListQueueState | null>` - Load from session storage
  - `clearQueueState()` - Clear session storage
  - `getNextQueueItem(): Promise<TargetListQueueItem | null>` - Get next item, increment index
  - `isQueueComplete(): Promise<boolean>` - Check if all items processed

#### Step 3.2: Update Navigation State
- [ ] Open `/apps/wxt-extension/entrypoints/linkedin.content/stores/navigation-state.ts`
- [ ] Rename `PendingNavigationState` to `PendingNavigationStateLegacy`
- [ ] Create new `PendingNavigationState` interface:
  - `type: 'single' | 'queue'`
  - `postLoadSettings: PostLoadSettings`
  - `targetDraftCount: number`
  - `savedAt: number`
  - `queueState?: TargetListQueueState` (only for type === 'queue')
- [ ] Update `savePendingNavigation()` to accept optional `queueState` parameter
- [ ] Update `consumePendingNavigation()` to return new interface

#### Step 3.3: Create Multi-Tab Navigation Handler
- [ ] Create `/apps/wxt-extension/entrypoints/linkedin.content/utils/multi-tab-navigation.ts`
- [ ] Import `buildListFeedUrl` from `@sassy/linkedin-automation/navigate/build-list-feed-url`
- [ ] Create `processTargetListQueue(selectedLists: TargetListQueueItem[], settings: PostLoadSettings, targetDraftCount: number)`:
  - Create `TargetListQueueState` with all lists
  - Save queue state to session storage
  - Get first item from queue
  - Open new tab with `buildListFeedUrl(firstItem.targetListUrns)`
  - Auto-resume will handle the rest
- [ ] Create `continueQueueProcessing()`:
  - Load queue state from session storage
  - Check if complete (return if done)
  - Get next item
  - Update queue state (increment index)
  - Save updated state
  - Open new tab with next feed URL

### Phase 4: Auto-Resume System

#### Step 4.1: Create Dependency Checker
- [ ] Create `/apps/wxt-extension/entrypoints/linkedin.content/utils/auto-resume-checker.ts`
- [ ] Create `waitForStoresReady(): Promise<void>`:
  - Check `useAuthStore.getState().isAuthReady === true`
  - Check `useAccountStore.getState().isLoaded === true`
  - Check `useSettingsDBStore.getState().isLoaded === true`
  - Poll every 100ms with 30 second timeout
  - Throw error if timeout exceeded
- [ ] Create `checkAndResumeLoadPosts()`:
  - Call `waitForStoresReady()`
  - Call `consumePendingNavigation()`
  - If navigation state found and type === 'single':
    - Restore settings to settings-db-store
    - Trigger Load Posts with restored settings
  - If navigation state found and type === 'queue':
    - Check if queue complete (if yes, clear and return)
    - Restore settings to settings-db-store
    - Trigger Load Posts with current queue item settings
    - On Load Posts completion, call `continueQueueProcessing()`

#### Step 4.2: Integrate Auto-Resume into Content Script
- [ ] Open `/apps/wxt-extension/entrypoints/linkedin.content/index.tsx` (or main content script)
- [ ] Import `initSettingsDBStoreListener` from `settings-db-store`
- [ ] Import `checkAndResumeLoadPosts` from `auto-resume-checker`
- [ ] Call `initSettingsDBStoreListener()` on content script mount
- [ ] After auth + account + settings stores initialized, call `checkAndResumeLoadPosts()`
- [ ] Ensure this runs on every LinkedIn page load (not just first mount)

### Phase 5: UI Updates

#### Step 5.1: Update ComposeTab for Multiple Target Lists
- [ ] Open `/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/ComposeTab.tsx`
- [ ] Replace `selectedTargetListId` usage with `selectedTargetListIds: string[]`
- [ ] Update Load Posts click handler:
  - If `selectedTargetListIds.length === 1`: Use existing single navigation (backward compat)
  - If `selectedTargetListIds.length > 1`: Call `processTargetListQueue()` with all selected lists
- [ ] Update UI to show selected count (e.g., "Load Posts (3 lists)")

#### Step 5.2: Create Target List Multi-Select Component
- [ ] Create `/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/TargetListSelector.tsx`
- [ ] Fetch target lists from tRPC (`targetList.list`)
- [ ] Display as checkbox list (not dropdown - multiple selection)
- [ ] Show selected count in header ("3 of 10 selected")
- [ ] Update `settings-db-store` on selection change
- [ ] Display selected list names in compact chips/badges below selector

#### Step 5.3: Update Settings UI (Image Upload)
- [ ] Open settings panel component (find via grep for "attachPictureEnabled")
- [ ] Replace image gallery with single image upload
- [ ] Show "1/1" when image uploaded
- [ ] Show "No image" placeholder when empty
- [ ] Disable upload button when image exists (enforce single image)
- [ ] Add "Remove Image" button
- [ ] Update to use `comment-image-store.setImage()` and `removeImage()`

#### Step 5.4: Update Settings UI (Behavior Settings)
- [ ] Find settings panel component
- [ ] Add section titled "Behavior Settings (Local Only)"
- [ ] Add toggles for:
  - Human Only Mode
  - Auto-engage on Comment Click
  - Spacebar Auto-engage
  - Post Navigator
- [ ] Connect toggles to `settings-behavior-store.updateSetting()`
- [ ] Add tooltip: "These settings are stored locally and never synced to the cloud"

#### Step 5.5: Update Settings Tags Display
- [ ] Open `/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/SettingsTags.tsx` (or equivalent)
- [ ] Update to read from both `settings-db-store` and `settings-behavior-store`
- [ ] Update tag generation logic:
  - For multiple target lists: Show "Target Lists (3)" instead of "Target List"
  - For attach image: Check `settings-db-store.submitComment.attachPictureEnabled` AND `comment-image-store.image !== null`

### Phase 6: Migration and Cleanup

#### Step 6.1: Migrate ComposeTab from Old Settings Store
- [ ] Open `/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/ComposeTab.tsx`
- [ ] Replace all `useSettingsStore()` calls with:
  - `useSettingsDBStore()` for DB settings
  - `useSettingsBehaviorStore()` for behavior settings
- [ ] Update all setting reads and writes to use new stores
- [ ] Test Load Posts with new store integration

#### Step 6.2: Migrate Other Components
- [ ] Grep for `useSettingsStore` across all extension files
- [ ] Update each component to use new stores:
  - `SpacebarEngageObserver.tsx` → use `settings-behavior-store`
  - `useAutoEngage.ts` → use `settings-behavior-store`
  - `useEngageButtons.ts` → use `settings-db-store` for comment generate settings
- [ ] Update imports

#### Step 6.3: Delete Old Settings Store
- [ ] Delete `/apps/wxt-extension/entrypoints/linkedin.content/stores/settings-store.ts`
- [ ] Verify no remaining imports (TypeScript will error if any exist)

#### Step 6.4: Update Documentation
- [ ] Update `process/context/all-context.md`:
  - Document new settings architecture (3-store pattern)
  - Document target list queue system
  - Document auto-resume dependencies
- [ ] Add inline code comments explaining queue flow

---

## 6. Acceptance Criteria

### Functional Requirements

- [ ] User can select multiple target lists in UI (checkbox list)
- [ ] Clicking "Load Posts" with multiple lists opens sequential tabs (one per list)
- [ ] Each tab auto-resumes Load Posts after page navigation
- [ ] Tabs remain open after Load Posts completes
- [ ] Queue state persists across page reloads (session storage)
- [ ] Settings are fetched from DB on auth ready (loading states work)
- [ ] Behavior settings persist in local storage only
- [ ] Single image upload enforced (cannot upload second image)
- [ ] Image stored as base64, blob recreated on load
- [ ] `attachPictureEnabled` toggle in UI controls whether image is attached
- [ ] Settings UI shows "Behavior Settings (Local Only)" section
- [ ] Settings tags display correctly for multiple lists ("Target Lists (3)")

### Technical Requirements

- [ ] DB schema migration applied successfully (`targetListIds String[]`)
- [ ] tRPC settings router works (get + upsert for all three settings)
- [ ] `settings-db-store` includes `isLoading`, `isLoaded` flags
- [ ] `settings-behavior-store` never calls tRPC (local only)
- [ ] `comment-image-store` enforces single image limit
- [ ] Queue state saved to `browser.storage.session`
- [ ] Auto-resume waits for auth + account + settings loaded
- [ ] Old `settings-store.ts` deleted (no remaining imports)
- [ ] No TypeScript errors
- [ ] No console errors during Load Posts

### Edge Cases

- [ ] If queue state expires (30 seconds), auto-resume does nothing
- [ ] If user closes tab mid-queue, next tab continues from correct index
- [ ] If user manually navigates away, queue state is cleared
- [ ] If settings fail to load, UI shows error message
- [ ] If no target lists selected, Load Posts shows validation error
- [ ] If single target list selected, uses legacy single navigation (backward compat)

---

## 7. Dependencies

### External Dependencies

- PostgreSQL array support (native, no changes needed)
- `browser.storage.session` API (available in Manifest V3)
- tRPC v11 (already in use)
- Zustand (already in use)

### Internal Dependencies

- Existing `account-store` pattern (reference for loading states)
- Existing `navigation-state` module (extend for queue)
- Existing `buildListFeedUrl` utility (no changes needed)
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

---

## 14. Implementation Notes

### Important Patterns to Follow

1. **Store Initialization**: All stores must have explicit `isLoaded` flag
2. **Error Handling**: All tRPC calls must have try/catch with user-facing error messages
3. **Optimistic Updates**: Update store immediately, sync to DB async, revert on error
4. **Logging**: Add console.log for all queue state transitions (debug aid)

### File Naming Conventions

- DB stores: `*-db-store.ts`
- Local stores: `*-behavior-store.ts`, `*-image-store.ts`
- Utils: `*-navigation.ts`, `*-checker.ts`

### TypeScript Strictness

- All store interfaces must be exported (used by components)
- All tRPC inputs must have Zod validators
- All async functions must have explicit return types

---

## 15. Related Documentation

- [Target List Auto-Resume Plan](/process/plans/target-list-auto-resume_PLAN_15-01-26.md)
- [Compose Settings UI Plan](/process/plans/compose-settings-ui_PLAN_14-01-26.md)
- [Account Store Pattern](/apps/wxt-extension/entrypoints/linkedin.content/stores/account-store.ts)

---

**Plan complete. Review carefully.**

**Say 'ENTER EXECUTE MODE' when ready to implement.**

**Note: This is a critical safety checkpoint. EXECUTE mode will follow this plan with 100% fidelity.**
