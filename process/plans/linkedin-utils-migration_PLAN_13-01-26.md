# LinkedIn Utils Migration Plan

**Date**: 2026-01-13
**Goal**: Migrate all utils from `wxt-extension/linkedin.content/utils/` to `linkedin-automation` package

## Overview

Migrate utilities to `linkedin-automation` package to:
- Support both DOM v1 (legacy) and v2 (React SSR + SDUI)
- Remove React dependencies for framework-agnostic reuse (browser extension, Puppeteer, etc.)
- Maintain pattern consistency with already-migrated utilities (feed, profile, account)

---

## Phase 1: Post Utilities - ✅ COMPLETE

All post utilities have been migrated with V1/V2 support.

### Completed Files

| # | Utility | V1 | V2 | Notes |
|---|---------|----|----|-------|
| 1 | `find-post-container.ts` | ✅ | ✅ | v1: `div[data-urn]`, v2: `div[role="listitem"]` |
| 2 | `extract-post-url.ts` | ✅ | ✅ | v1: `data-urn`/`data-id`, v2: `data-view-tracking-scope` |
| 3 | `extract-post-author-info.ts` | ✅ | ✅ | v1: `img[alt^="View "]`, v2: `a[data-view-name="feed-actor-image"]` |
| 4 | `extract-post-caption.ts` | ✅ | ✅ | XPath for v1, `data-testid="expandable-text-box"` for v2 |
| 5 | `extract-post-time.ts` | ✅ | ✅ | v1: sibling navigation, v2: `<p>` with time pattern |
| 6 | `detect-company-post.ts` | ✅ | ✅ | Check href for `/company/` |
| 7 | `detect-promoted-post.ts` | ✅ | ✅ | v1: `.update-components-actor__sub-description`, v2: check `<p>` for "promoted" |
| 8 | `extract-post-comments.ts` | ✅ | ✅ | v1: `article[data-id]`, v2: `a[data-view-name="comment-actor-picture"]` |
| 9 | `extract-adjacent-comments.ts` | ✅ | ✅ | For AI context - includes `totalReactions`/`totalReplies` from tracking scope |

### Final File Structure

```
packages/linkedin-automation/src/post/
├── types.ts                              # PostUtilities interface + all types
├── PostUtilitiesV1.ts                    # V1 implementation
├── PostUtilitiesV2.ts                    # V2 implementation
├── utils-shared/
│   └── (none currently)
├── utils-v1/
│   ├── find-post-container.ts
│   ├── extract-post-url.ts
│   ├── extract-post-author-info.ts
│   ├── extract-post-caption.ts
│   ├── extract-post-time.ts
│   ├── detect-company-post.ts
│   ├── detect-promoted-post.ts
│   ├── extract-post-comments.ts
│   └── extract-adjacent-comments.ts
└── utils-v2/
    ├── find-post-container.ts
    ├── extract-post-url.ts
    ├── extract-post-author-info.ts
    ├── extract-post-caption.ts
    ├── extract-post-time.ts
    ├── detect-company-post.ts
    ├── detect-promoted-post.ts
    ├── extract-post-comments.ts
    └── extract-adjacent-comments.ts
```

### Types (Implemented)

```typescript
// post/types.ts
export interface PostUrlInfo { urn: string; url: string; }
export interface PostAuthorInfo { name, photoUrl, headline, profileUrl }
export interface PostTimeInfo { displayTime, fullTime }
export interface PostCommentInfo { authorName, authorHeadline, authorProfileUrl, authorPhotoUrl, content, urn, isReply }
export interface AdjacentCommentInfo { commentContent, likeCount, replyCount }

export interface PostUtilities {
  findPostContainer(anchorElement: Element): Element | null;
  extractPostUrl(postContainer: HTMLElement): PostUrlInfo[];
  extractPostAuthorInfo(postContainer: HTMLElement): PostAuthorInfo;
  extractPostCaption(postContainer: Element): string;
  extractPostTime(postContainer: HTMLElement): PostTimeInfo;
  detectCompanyPost(postContainer: HTMLElement): boolean;
  detectPromotedPost(postContainer: HTMLElement): boolean;
  extractPostComments(postContainer: HTMLElement): PostCommentInfo[];
  extractAdjacentComments(postContainer: HTMLElement): AdjacentCommentInfo[];
}
```

### Key V2 DOM Discoveries

| Element | V1 Selector | V2 Selector |
|---------|-------------|-------------|
| Post container | `div[data-urn]`, `div[data-id]` | `div[role="listitem"]` |
| Author photo | `img[alt^="View "]` | `a[data-view-name="feed-actor-image"]` |
| Comment picture | `article[data-id]` | `a[data-view-name="comment-actor-picture"]` |
| Reply picture | - | `a[data-view-name="reply-actor-picture"]` |
| Comment description | - | `a[data-view-name="comment-actor-description"]` |
| Reply description | - | `a[data-view-name="reply-actor-description"]` |
| URN extraction | `data-urn`, `data-id` | `data-view-tracking-scope` (buffer-encoded JSON) |
| Engagement counts | `aria-label` on buttons | `data-view-tracking-scope` → `totalReactions`, `totalReplies` |

---

## Phase 2: Comment Utilities - ✅ COMPLETE

Handle DOM interactions for commenting.

### Important: Assume ALL Need V1/V2 Variants

**Do NOT assume any utility can be shared.** The V2 DOM structure is different (e.g., no `<form>` elements for comments).

**Migration Process for Each Utility:**
1. Read current usage in wxt-extension (V1 DOM patterns)
2. User provides V2 DOM sample
3. Create V1 implementation (from existing code)
4. Create V2 implementation (based on V2 DOM)
5. Test both versions

### Priority Order

| # | File | Dependencies | Status |
|---|------|--------------|--------|
| 1 | `find-editable-field.ts` | None | ✅ Complete |
| 2 | `click-comment-button.ts` | None | ✅ Complete |
| 3 | `insert-comment.ts` | None | ✅ Complete |
| 4 | `submit-comment.ts` | `insert-comment`, `find-editable-field` | ✅ Complete |
| 5 | `wait-for-comments-ready.ts` | `PostUtilities.extractPostComments` | ✅ Complete |

*Note: `attach-image-to-comment.ts` skipped - not migrating*

### Target File Structure

```
packages/linkedin-automation/src/comment/
├── types.ts                              # CommentUtilities interface
├── CommentUtilitiesV1.ts                 # V1 implementation
├── CommentUtilitiesV2.ts                 # V2 implementation
├── utils-v1/
│   ├── find-editable-field.ts
│   ├── click-comment-button.ts
│   ├── insert-comment.ts
│   ├── submit-comment.ts
│   └── wait-for-comments-ready.ts
└── utils-v2/
    ├── find-editable-field.ts
    ├── click-comment-button.ts
    ├── insert-comment.ts
    ├── submit-comment.ts
    └── wait-for-comments-ready.ts
```

### Types Definition (Implemented)

```typescript
// comment/types.ts
export interface CommentUtilities {
  findEditableField(postContainer: HTMLElement): HTMLElement | null;
  clickCommentButton(postContainer: HTMLElement): boolean;
  insertComment(editableField: HTMLElement, comment: string): Promise<void>;
  submitComment(postContainer: HTMLElement, commentText: string): Promise<boolean>;
  waitForCommentsReady(container: HTMLElement, beforeCount: number): Promise<void>;
}
```

---

## Phase 3: React-Dependent Utilities (Keep in wxt-extension)

| File | Reason | Action |
|------|--------|--------|
| `use-most-visible-post.ts` | React hook | Keep, refactor to use migrated utilities |
| `linkedin-navigate.ts` | React.MouseEvent | Keep in wxt-extension |
| `constants.ts` | Simple constant | Move to shared or keep |

---

## Phase 4: data-fetch-mimic/ (Separate Migration - Deferred)

Complex utilities with backend dependencies. Defer to separate plan.

---

## Progress Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Post Utilities | ✅ Complete | 9/9 utilities migrated |
| Phase 2: Comment Utilities | ✅ Complete | 5/5 utilities migrated |
| Phase 3: React Utilities | ⏳ Pending | Refactoring needed |
| Phase 4: data-fetch-mimic | ⏳ Deferred | Separate plan |

**PLAN STATUS: ✅ MIGRATION COMPLETE - See new plan for wxt-extension integration**

---

## What's Next

### Immediate Next Steps (Phase 2)

1. **Create comment/ module structure**
   - `types.ts` with CommentUtilities interface
   - `utils-v1/` and `utils-v2/` directories

2. **For each utility, follow this process:**
   - Read current wxt-extension code (understand V1 DOM patterns)
   - User provides V2 DOM sample for that feature
   - Create V1 implementation (copy from existing)
   - Create V2 implementation (based on V2 DOM)
   - Add to CommentUtilitiesV1/V2 classes
   - Provide test code for verification

3. **Migration order:**
   1. `find-editable-field.ts` - Find comment input box
   2. `click-comment-button.ts` - Click to open comment section
   3. `insert-comment.ts` - Insert text into comment field
   4. `attach-image-to-comment.ts` - Attach image to comment
   5. `submit-comment.ts` - Full comment submission flow
   6. `wait-for-comments-ready.ts` - Wait for comments to load

### After Phase 2

1. Update wxt-extension imports to use `@sassy/linkedin-automation/post/*`
2. Refactor `use-most-visible-post.ts` to use migrated utilities
3. Delete old utils files from wxt-extension
4. Update index.ts exports

---

## Files to Delete After Migration

```
apps/wxt-extension/entrypoints/linkedin.content/utils/
├── post/                    # DELETE (migrated in Phase 1)
│   ├── find-post-container.ts
│   ├── extract-author-info-from-post.ts
│   ├── extract-comment-from-post.ts
│   ├── extract-adjacent-comments.ts
│   ├── extract-post-caption.ts
│   ├── extract-post-time.ts
│   └── extract-post-url.ts
├── comment/                 # DELETE after Phase 2
│   ├── find-editable-field.ts
│   ├── insert-comment.ts
│   ├── click-comment-button.ts
│   ├── submit-comment.ts
│   ├── attach-image-to-comment.ts
│   └── wait-for-comments-ready.ts
├── feed/
│   └── use-most-visible-post.ts  # KEEP (React hook, refactor)
├── constants.ts             # KEEP or move
├── linkedin-navigate.ts     # KEEP (React dependency)
└── index.ts                 # UPDATE exports
```

---

## Success Criteria

- [x] All post utilities migrated with v1/v2 support
- [ ] All comment utilities migrated with v1/v2 support
- [ ] Factory functions auto-detect DOM version
- [ ] wxt-extension imports from linkedin-automation
- [ ] Old utils/ files removed (except React hooks)
- [ ] Tests pass in both DOM versions (manual browser testing)
