# Post Loading Performance Optimization

| Field | Value |
|-------|-------|
| **Date** | 2026-01-23 |
| **Complexity** | Simple |
| **Status** | ⏳ PLANNED |

## Overview

Optimize LinkedIn post loading performance in the compose tab sidebar when loading 50-100+ posts with filters. Currently, the sidebar freezes and loading takes 150-200 seconds due to three bottlenecks: (1) state update storm causing 300+ React re-renders, (2) duplicate DOM queries extracting same data twice per post, and (3) fixed 1500ms scroll delays regardless of actual content load time.

## Quick Links

- [Goals and Success Metrics](#goals-and-success-metrics)
- [Execution Brief](#execution-brief)
- [Scope](#scope)
- [Functional Requirements](#functional-requirements)
- [Implementation Checklist](#implementation-checklist)
- [Risks and Mitigations](#risks-and-mitigations)

---

## Goals and Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Eliminate UI freezing | Sidebar remains responsive during load | No freezes > 100ms |
| Reduce state updates | Zustand set() calls per 100 posts | 300+ → ~100 (67% reduction) |
| Reduce DOM queries | Redundant extractions per 100 posts | 1,700+ → 0 |
| Faster scroll loading | Average wait per scroll cycle | 1500ms → ~300-500ms |
| Overall load time | Time to load 100 posts with filters | 150-200s → 60-100s (50% faster) |

---

## Execution Brief

### Phase 1: State Update Batching (Highest Impact)
**What happens**: Add `addCards()` batch method to compose-store that adds multiple cards in one state update. Add `updateCardCommentAndStyle()` that combines comment and style updates. Refactor `load-posts-to-cards.ts` to use these batch methods instead of calling `addCard()` in a loop.

**Test**: Load 100 posts, observe React DevTools - should see ~100 state updates instead of 300+. Sidebar should not freeze during loading.

### Phase 2: DOM Query Caching (Medium Impact)
**What happens**: Modify `findNewPosts()` in collect-posts.ts to return cached extraction data (caption, author, time, URLs) instead of just URN/container. Modify `extractPostData()` to accept and use this cached data instead of re-querying DOM.

**Test**: Add console.time around extraction calls. Load 50 posts - extraction time should be ~50% faster. All post data should still be correct.

### Phase 3: Smart Scroll Waiting (Lower Impact)
**What happens**: Create `waitForNewPosts()` utility using MutationObserver to detect when new posts appear in DOM. Replace fixed 1500ms delays in `load-more.ts` with smart waiting that resolves early when content loads. Keep fixed delay as fallback.

**Test**: Load posts on fast connection - should see scroll cycles completing in 200-500ms instead of fixed 1500ms. On slow connection, fallback should still work.

### Expected Outcome
- Sidebar remains responsive while loading 100+ posts
- Total load time reduced by ~50%
- No regression in post data accuracy or filter functionality
- Fire-and-forget AI generation pattern preserved

---

## Scope

### In Scope
- Batch state update methods in compose-store.ts
- DOM query caching in collect-posts.ts
- MutationObserver-based smart waiting in load-more.ts
- Both v1 and v2 utility versions

### Out of Scope
- Comment loading optimization (waitForCommentsReady) - lower impact, can be future work
- Virtual scrolling for card list - different optimization approach
- AI generation parallelization - already fire-and-forget
- Filter logic changes - only caching, not modifying filters

---

## Assumptions and Constraints

### Assumptions
- LinkedIn DOM structure remains stable during extraction (~100ms window)
- MutationObserver reliably detects LinkedIn's post rendering
- Zustand batch updates are atomic

### Constraints
- Must maintain backward compatibility with existing card operations
- Cannot break fire-and-forget AI generation pattern
- v1 and v2 utilities must both be updated for consistency

---

## Functional Requirements

### FR-1: Batch Card Addition
- `addCards(cards: ComposeCard[])` adds N cards in single state update
- Creates one new array reference instead of N
- Maintains card order as provided

### FR-2: Combined Comment/Style Update
- `updateCardCommentAndStyle(id, comment, styleInfo)` updates both in one call
- Sets `isGenerating: false` atomically with content update
- Handles error case (empty comment, null style)

### FR-3: Cached Post Data Flow
- `findNewPosts()` returns extracted data alongside container
- `CachedPostData` interface holds: urn, container, fullCaption, authorInfo, postTime, postUrls
- `extractPostData()` accepts cache, only extracts comments (new data)

### FR-4: Smart Scroll Waiting
- `waitForNewPosts(initialCount, getPostCount)` returns Promise<boolean>
- Resolves immediately when new posts detected (after MIN_WAIT_MS)
- Falls back to MAX_WAIT_MS timeout if no detection
- Uses MutationObserver on document.body

---

## Non-Functional Requirements

- **Performance**: No individual operation should block main thread > 50ms
- **Reliability**: Fallback mechanisms for all smart waiting
- **Maintainability**: Clear interfaces between cached/non-cached code paths

---

## Acceptance Criteria

1. ✅ Loading 100 posts does not freeze sidebar for > 100ms
2. ✅ State update count reduced from 300+ to ~100 for 100 posts
3. ✅ No duplicate DOM queries for caption, author, time, URL
4. ✅ Scroll cycles complete in < 500ms on fast connections
5. ✅ All existing post data (captions, authors, comments) remains accurate
6. ✅ All filters (company, time, connection degree) still work correctly
7. ✅ AI comment generation still fires and completes for each card
8. ✅ Preview card selection works after batch add
9. ✅ Progress indicator updates correctly during load
10. ✅ No TypeScript errors or type regressions

---

## Implementation Checklist

### Phase 1: State Update Batching
- [ ] 1.1 Add `addCards` method to compose-store.ts (after line 159)
- [ ] 1.2 Add `updateCardCommentAndStyle` method to compose-store.ts (after line 313)
- [ ] 1.3 Export new methods from store
- [ ] 1.4 Update `LoadPostsToCardsParams` interface in load-posts-to-cards.ts
- [ ] 1.5 Refactor `onBatchReady` to build cards array, then call `addCards` once
- [ ] 1.6 Update AI generation `.then()` to use `updateCardCommentAndStyle`
- [ ] 1.7 Update `handleStart` in ComposeTab.tsx to pass new batch functions
- [ ] 1.8 Update `runAutoResume` in ComposeTab.tsx to pass new batch functions
- [ ] 1.9 Test: Load 10 posts, verify cards render correctly
- [ ] 1.10 Test: Load 100 posts, verify no UI freeze

### Phase 2: DOM Query Caching
- [ ] 2.1 Add `CachedPostData` interface to collect-posts.ts
- [ ] 2.2 Modify `findNewPosts` return type to `CachedPostData[]`
- [ ] 2.3 Extract caption, authorInfo, postTime, postUrls during filtering loop
- [ ] 2.4 Update filter logic to use extracted data (time filter, blacklist)
- [ ] 2.5 Modify `extractPostData` signature to accept `CachedPostData`
- [ ] 2.6 Update `extractPostData` to use cached fields, only extract comments
- [ ] 2.7 Update `collectPostsBatch` main loop to pass cache through pipeline
- [ ] 2.8 Remove duplicate `extractPostComments` call at line 368
- [ ] 2.9 Test: Load 50 posts with filters, verify all data correct
- [ ] 2.10 Test: Measure extraction time reduction

### Phase 3: Smart Scroll Waiting
- [ ] 3.1 Create `packages/linkedin-automation/src/feed/utils-shared/wait-for-new-posts.ts`
- [ ] 3.2 Implement MutationObserver with MIN_WAIT (100ms), MAX_WAIT (2000ms), DEBOUNCE (200ms)
- [ ] 3.3 Update `load-more.ts` (v2) to use `waitForNewPosts` after button click
- [ ] 3.4 Update `load-more.ts` (v2) to use `waitForNewPosts` after scroll
- [ ] 3.5 Keep fixed delay as fallback if observer doesn't detect
- [ ] 3.6 Apply same changes to `load-more.ts` (v1)
- [ ] 3.7 Test: Load posts, verify early resolution on fast loads
- [ ] 3.8 Test: Throttle network, verify fallback works

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI promises resolve out of order | Medium | Low | Card ID-based updates handle this naturally |
| DOM changes between cache and use | Low | Low | Window is < 100ms; data is static after render |
| MutationObserver misses posts | Low | Medium | Fallback to fixed delay ensures reliability |
| Existing code depends on individual addCard | Low | Medium | Search for usages before removing |

---

## Integration Notes

### Files Modified

**apps/wxt-extension/**
- `entrypoints/linkedin.content/stores/compose-store.ts` - Add batch methods
- `entrypoints/linkedin.content/compose-tab/utils/load-posts-to-cards.ts` - Use batch methods
- `entrypoints/linkedin.content/compose-tab/ComposeTab.tsx` - Pass new functions

**packages/linkedin-automation/**
- `src/feed/collect-posts.ts` - Cache pattern for DOM queries
- `src/feed/utils-v2/load-more.ts` - Smart waiting
- `src/feed/utils-v1/load-more.ts` - Smart waiting
- `src/feed/utils-shared/wait-for-new-posts.ts` - New utility (create)

### Dependencies
- No new packages required
- MutationObserver is native browser API
- Zustand already supports batch updates natively

### Data Model
- No database changes
- New `CachedPostData` interface is internal to collect-posts.ts
- `ComposeCard` interface unchanged

---

## Cursor + RIPER-5 Guidance

### For Cursor Plan Mode
1. Import this checklist into Cursor Plan mode
2. Execute phases sequentially (1 → 2 → 3)
3. After each phase, run the associated tests before proceeding
4. Update status markers (⏳ → 🚧 → ✅) as you progress

### For RIPER-5 Mode
- **RESEARCH**: ✅ Complete - bottlenecks identified and analyzed
- **INNOVATE**: ✅ Complete - solutions designed with code examples
- **PLAN**: ✅ Complete - this document
- **EXECUTE**: Request "ENTER EXECUTE MODE" to begin implementation
- **REVIEW**: After each phase, verify changes match plan

### If Scope Expands
- If new bottlenecks discovered → pause, document, continue
- If architectural changes needed → convert to COMPLEX, add RFCs
- Mid-implementation check-in at Phase 2 completion

---

## Next Step

**Attach this plan to a new session and request: "ENTER EXECUTE MODE - Phase 1: State Update Batching"**
