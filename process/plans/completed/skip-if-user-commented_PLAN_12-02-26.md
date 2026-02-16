# Skip If Found Existing Comment

**Date:** 2026-02-12
**Complexity:** SIMPLE
**Status:** ⏳ PLANNED

## Overview

Add a "Skip if I already commented" filter setting to the WXT extension. When enabled, the system will force-load comments for each post during collection, check if any comment's author matches the current user's profile URL, and skip posts where the user has already commented. This prevents duplicate engagement and saves time by filtering out previously-engaged posts.

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
| Database Schema | ⏳ PLANNED |
| Type Definitions | ⏳ PLANNED |
| Filter Logic | ⏳ PLANNED |
| UI Toggle | ⏳ PLANNED |
| Testing | ⏳ PLANNED |

---

## Goals and Success Metrics

### Goals
1. Prevent users from accidentally engaging with posts they've already commented on
2. Save time during post loading by filtering out previously-engaged posts
3. Maintain consistent UX with existing filter settings

### Success Metrics
- Posts where user has commented are correctly skipped during collection
- `skipCommentsLoading` is auto-disabled when this feature is enabled
- No regression in post loading when feature is disabled
- Clear UI indication of the speed trade-off

---

## Execution Brief

### Phase 1: Database & Types
**What happens:** Add `skipIfUserCommented` boolean field to `PostLoadSetting` Prisma model and update the `PostLoadSettingDB` TypeScript interface.
**Test:** Run `pnpm db:generate` successfully, verify type shows in settings store.

### Phase 2: Filter Config & Data Passing
**What happens:** Add `skipIfUserCommented` to `PostFilterConfig`, add `currentUserProfileUrl` parameter to `collectPostsBatch()`, and pass both from `loadPostsToCards()`.
**Test:** Console log confirms `currentUserProfileUrl` is passed correctly.

### Phase 3: Filter Logic Implementation
**What happens:** In `collect-posts.ts`, after comments are loaded, check if any comment's `authorProfileUrl` matches `currentUserProfileUrl`. Skip post if match found. Force `skipCommentsLoading: false` when feature enabled.
**Test:** Load posts with feature enabled, verify posts with user's comments are skipped (check console logs).

### Phase 4: UI Toggle
**What happens:** Add toggle switch in SettingsSheet Filters tab. When enabled, auto-disable and grey out `skipCommentsLoading` toggle. Add tooltip explaining speed trade-off.
**Test:** Toggle works, mutual exclusivity with skipCommentsLoading works, setting persists.

### Expected Outcome
- [ ] New DB field `skipIfUserCommented` exists and syncs
- [ ] Posts where user commented are skipped during "Load Posts"
- [ ] `skipCommentsLoading` is auto-disabled when feature is on
- [ ] UI toggle in Filters tab with clear trade-off indication
- [ ] Console logs show filtering in action

---

## Scope

### In Scope
- New `skipIfUserCommented` boolean in PostLoadSetting schema
- Type updates to `PostLoadSettingDB` and `PostFilterConfig`
- Filter logic in `collect-posts.ts` comparing comment authors to current user
- UI toggle in SettingsSheet Filters tab
- Auto-disable `skipCommentsLoading` when feature enabled
- Tooltip/helper text explaining speed impact

### Out of Scope
- Checking comments on replies (only top-level comments)
- Persisting which posts were skipped (just skip during collection)
- Advanced URL normalization (simple string comparison is sufficient)
- Batch processing optimization (will load comments for all posts)

---

## Assumptions and Constraints

### Assumptions
1. `authorProfileUrl` in `PostCommentInfo` is reliably populated
2. `currentLinkedIn.profileUrl` in account store matches LinkedIn's comment author URLs
3. Comment loading infrastructure is stable and performant

### Constraints
1. Must force comment loading when enabled (cannot work with `skipCommentsLoading: true`)
2. Will slow down post loading (trade-off is acceptable per user choice)
3. Must follow existing filter pattern (Approach 1: pass data)

---

## Functional Requirements

- [ ] **FR-1:** Add `skipIfUserCommented Boolean @default(false)` to PostLoadSetting model
- [ ] **FR-2:** Add field to `PostLoadSettingDB` interface with default `false`
- [ ] **FR-3:** Add `skipIfUserCommented` to `PostFilterConfig` interface
- [ ] **FR-4:** Add `currentUserProfileUrl?: string` parameter to `collectPostsBatch()`
- [ ] **FR-5:** Pass `currentUserProfileUrl` from `loadPostsToCards()` (from account store)
- [ ] **FR-6:** In `collectPostsBatch`, when `skipIfUserCommented` is true:
  - Force comment loading (override `skipCommentsLoading`)
  - After loading comments, check if any `authorProfileUrl === currentUserProfileUrl`
  - Skip post if match found
- [ ] **FR-7:** Add toggle in SettingsSheet Filters tab labeled "Skip posts where I already commented"
- [ ] **FR-8:** When toggle is ON, disable and grey out `skipCommentsLoading` toggle
- [ ] **FR-9:** Show tooltip: "Requires loading comments (slower collection)"

---

## Non-Functional Requirements

- **Performance:** Accept ~50% slower collection when enabled (comment loading overhead)
- **Reliability:** Must not break collection if comment extraction fails for a post
- **UX:** Clear visual indication of mutual exclusivity with skip comments setting

---

## Acceptance Criteria

- [ ] **AC-1:** With feature OFF, post loading behavior unchanged
- [ ] **AC-2:** With feature ON, posts where user has commented are skipped
- [ ] **AC-3:** With feature ON, `skipCommentsLoading` is forced to false
- [ ] **AC-4:** UI toggle persists across page reloads (DB sync works)
- [ ] **AC-5:** Console logs show "Skipping post - user already commented" messages
- [ ] **AC-6:** Target count of posts still collected (skipped posts don't count toward target)
- [ ] **AC-7:** If user has no comments on any post, all posts collected normally
- [ ] **AC-8:** Toggle disabled state is visually clear for skipCommentsLoading

---

## Implementation Checklist

Copy this checklist into Cursor Plan mode for step-by-step execution:

```
[ ] 1. Add `skipIfUserCommented Boolean @default(false)` to post-load-setting.prisma
[ ] 2. Run `pnpm db:generate` to update Prisma client
[ ] 3. Add `skipIfUserCommented: boolean` to PostLoadSettingDB interface in settings-db-store.ts
[ ] 4. Add default value `skipIfUserCommented: false` to defaultPostLoadSetting
[ ] 5. Add `skipIfUserCommented?: boolean` to PostFilterConfig in collect-posts.ts
[ ] 6. Add `currentUserProfileUrl?: string` parameter to collectPostsBatch() signature
[ ] 7. Add `currentUserProfileUrl?: string` parameter to findNewPosts() signature
[ ] 8. In findNewPosts(), add filter logic after comment check section:
    - If skipIfUserCommented && currentUserProfileUrl && comments loaded
    - Check if any comment.authorProfileUrl === currentUserProfileUrl
    - Skip post if match found
[ ] 9. In buildFilterConfig() in load-posts-to-cards.ts, map skipIfUserCommented from settings
[ ] 10. In loadPostsToCards(), get currentUserProfileUrl from useAccountStore
[ ] 11. Pass currentUserProfileUrl to collectPostsBatch() call
[ ] 12. If skipIfUserCommented is true, override skipCommentsLoading to false in filterConfig
[ ] 13. Add toggle UI in SettingsSheet.tsx Filters tab:
    - Label: "Skip posts where I already commented"
    - Description: "Requires loading comments (slower)"
[ ] 14. Add logic to disable skipCommentsLoading toggle when skipIfUserCommented is ON
[ ] 15. Test: Enable feature, load posts, verify posts with user's comments are skipped
```

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Profile URL mismatch (normalization) | Low | Medium | Test with real LinkedIn URLs; add logging to debug |
| Comment loading fails silently | Low | Low | Graceful fallback: if comments fail, don't skip post |
| Performance worse than expected | Medium | Low | User opted in with clear warning; acceptable |

---

## Integration Notes

### Dependencies
- `@engagekit/db` - Prisma schema changes
- `@engagekit/linkedin-automation` - Filter logic changes
- WXT extension stores - Settings sync

### Environment
- No new environment variables needed
- No new API endpoints needed

### Data Model Changes
```prisma
// packages/db/prisma/models/comment/post-load-setting.prisma
model PostLoadSetting {
  // ... existing fields
  skipIfUserCommented Boolean @default(false)  // NEW
}
```

### Files Modified
1. `packages/db/prisma/models/comment/post-load-setting.prisma` - Schema
2. `apps/wxt-extension/.../stores/settings-db-store.ts` - Types
3. `packages/linkedin-automation/src/feed/collect-posts.ts` - Filter logic
4. `apps/wxt-extension/.../utils/load-posts-to-cards.ts` - Config building
5. `apps/wxt-extension/.../settings/SettingsSheet.tsx` - UI

---

## Cursor + RIPER-5 Guidance

### Cursor Plan Mode
1. Import the Implementation Checklist above
2. Execute steps 1-15 sequentially
3. After each step, verify before proceeding
4. Mark steps complete as you go

### RIPER-5 Mode
- **RESEARCH:** ✅ Completed (see innovation discussion above)
- **INNOVATE:** ✅ Completed (Approach 1 selected)
- **PLAN:** ✅ This document
- **EXECUTE:** Request explicitly with "ENTER EXECUTE MODE"
- **REVIEW:** After implementation, verify all acceptance criteria

### If Scope Expands
- If additional complexity discovered (e.g., URL normalization needed), pause
- Update this plan before continuing
- Do not implement unplanned features

---

## Future Enhancements (Out of Scope)

- Check reply comments, not just top-level
- Show count of skipped posts in UI
- Option to see which posts were skipped
- Smart URL normalization for edge cases
