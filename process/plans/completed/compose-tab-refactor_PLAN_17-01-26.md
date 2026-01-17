# ComposeTab Refactoring - Implementation Plan

**Created**: 2026-01-17
**Complexity**: SIMPLE
**Status**: ✅ COMPLETED

---

## 1. Overview

This plan addresses code bloat in `ComposeTab.tsx` caused by duplicated queue building and post collection logic. The component had grown to 955 lines with significant duplication between `handleStart` and `runAutoResume` functions.

### Problem Statement

1. **Duplicated `onBatchReady` callback** - Same card creation + AI generation logic appeared twice (~60 lines each)
2. **Duplicated filter config mapping** - `PostLoadSettings` → `PostFilterConfig` mapping duplicated
3. **Large queue building block** - ~80 lines of URN fetching/caching logic inline in `handleStart`
4. **Component too large** - 955 lines made it hard to maintain and understand

---

## 2. Solution

Extract duplicated logic into reusable utility functions:

### New Files Created

1. **`compose-tab/utils/build-queue-items.ts`** (113 lines)
   - Extracts URN fetching/caching logic from `handleStart`
   - Uses cached URNs when available (from prefetch)
   - Fetches uncached URNs from API
   - Caches newly fetched URNs for future use

2. **`compose-tab/utils/load-posts-to-cards.ts`** (203 lines)
   - Extracts `collectPostsBatch` + card creation logic
   - Handles both AI mode and human-only mode
   - Includes `buildFilterConfig()` helper for settings mapping
   - Used by both `handleStart` and `runAutoResume`

---

## 3. Implementation Checklist

### Phase 1: Create Utilities ✅

#### Step 1.1: Create build-queue-items.ts
- [x] Create `buildQueueItems(targetListIds: string[]): Promise<TargetListQueueItem[]>`
- [x] Use existing `getCachedUrns()` and `cacheTargetListUrns()` functions
- [x] Fetch uncached lists via tRPC
- [x] Maintain original list order in output

#### Step 1.2: Create load-posts-to-cards.ts
- [x] Create `LoadPostsToCardsParams` interface for all dependencies
- [x] Create `buildFilterConfig(settings: PostLoadSettings): PostFilterConfig` helper
- [x] Create `loadPostsToCards(params): Promise<number>` main function
- [x] Handle human mode vs AI mode correctly
- [x] Extract adjacent comments for AI context when enabled

### Phase 2: Refactor ComposeTab ✅

#### Step 2.1: Update Imports
- [x] Remove unused imports (`collectPostsBatch`, `ReadyPost`, `DEFAULT_STYLE_GUIDE`, etc.)
- [x] Remove unused imports (`getTrpcClient`, `cacheTargetListUrns`, `getCachedUrns`)
- [x] Remove unused imports (`useSettingsLocalStore`, `createPostUtilities`)
- [x] Add imports for new utilities (`buildQueueItems`, `loadPostsToCards`)

#### Step 2.2: Refactor handleStart
- [x] Replace ~80 lines of queue building with `buildQueueItems(targetListIds)`
- [x] Replace ~100 lines of feed collection with `loadPostsToCards({...})`
- [x] Maintain same behavior and error handling

#### Step 2.3: Refactor runAutoResume (useEffect)
- [x] Replace ~100 lines of feed collection with `loadPostsToCards({...})`
- [x] Maintain same behavior for queue continuation

#### Step 2.4: Verify No Regressions
- [x] TypeScript compiles without errors in refactored files
- [x] All functionality preserved (queue building, post loading, AI generation)

---

## 4. Results

### Line Count Comparison

| File | Before | After | Change |
|------|--------|-------|--------|
| ComposeTab.tsx | 955 | 694 | -261 lines (-27%) |
| build-queue-items.ts | - | 113 | +113 lines (new) |
| load-posts-to-cards.ts | - | 203 | +203 lines (new) |
| **Total** | 955 | 1010 | +55 lines |

### Benefits

1. **Reduced duplication** - `onBatchReady` callback logic now in one place
2. **Cleaner ComposeTab** - Focused on UI/orchestration, not implementation details
3. **Reusable utilities** - Can be tested independently
4. **Better separation of concerns** - Queue building separate from post loading
5. **Easier maintenance** - Changes to post loading only need to happen in one place

---

## 5. Files Changed

### Created
- `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/utils/build-queue-items.ts`
- `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/utils/load-posts-to-cards.ts`

### Modified
- `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/ComposeTab.tsx`

---

## 6. Testing Notes

The refactoring maintains identical behavior:
- Queue building still uses cached URNs with fallback to API fetch
- Post collection still uses `collectPostsBatch` with same filter config
- AI generation still fires in parallel for AI mode
- Human mode still creates empty cards without AI generation
- Auto-resume still works with pending navigation state
- Queue continuation still opens next tab after completion
