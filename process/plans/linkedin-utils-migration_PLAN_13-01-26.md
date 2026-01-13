# LinkedIn Utils Migration Plan

**Date**: 2026-01-13
**Goal**: Migrate all utils from `wxt-extension/linkedin.content/utils/` to `linkedin-automation` package

## Overview

Migrate utilities to `linkedin-automation` package to:
- Support both DOM v1 (legacy) and v2 (React SSR + SDUI)
- Remove React dependencies for framework-agnostic reuse (browser extension, Puppeteer, etc.)
- Maintain pattern consistency with already-migrated utilities (feed, profile, account)

---

## Already Migrated ✅

| Module | Status | Files |
|--------|--------|-------|
| `dom/` | ✅ Complete | `detect.ts` |
| `feed/` | ✅ Complete | `count-posts`, `load-more`, `watch-and-remove-new-posts-pill` (v1 + v2) |
| `profile/` | ✅ Complete | `watch-for-author-profiles`, `extract-profile-info-from-save-button` (v1 + v2) |
| `account/` | ✅ Complete | `extract-current-profile` (v1 + v2) |
| `post/` | 🔄 In Progress | `find-post-container` ✅, `extract-post-url` ✅, `extract-author-info` ✅ |

### Key V2 DOM Discovery

**Post container structure (v2):**
```
div[role="listitem"]  ← POST CONTAINER (use this!)
├── div (wrapper)
│   └── div[data-view-name="feed-full-update"]  ← post content only
└── div (comment section - SIBLING, not inside feed-full-update)
    └── form
        └── div[aria-label="Text editor for creating comment"]
```

**Important**: `feed-full-update` does NOT contain comments. Use `div[role="listitem"]` as the post container.

**V2 URN extraction:**
- Uses `data-view-tracking-scope` attribute (JSON with buffer-encoded data)
- Shared utility: `utils-shared-v2/parse-tracking-scope.ts`

---

## Phase 1: Post Utilities (Foundation)

These are standalone utilities used by comment utilities. **Most need v1/v2 variants.**

### Priority Order

| # | File | DOM-Specific | Dependencies | Notes |
|---|------|--------------|--------------|-------|
| 1 | `find-post-container.ts` | **YES** | None | v1: `div[data-urn]`, `div[data-id]`; v2: `div[data-view-name="feed-full-update"]` parent |
| 2 | `extract-post-url.ts` | **YES** | None | Uses `data-urn`, `data-id` - needs v2 variant |
| 3 | `extract-author-info-from-post.ts` | Maybe | None | Uses `img[alt^="View "]` pattern - test if works for v2 |
| 4 | `extract-post-caption.ts` | Maybe | None | Uses XPath `div[@dir="ltr"]` - test if works for v2 |
| 5 | `extract-post-time.ts` | Maybe | None | Uses sibling navigation from author image - test if works for v2 |
| 6 | `extract-comment-from-post.ts` | **YES** | None | Uses `article[data-id^="urn:li:comment:"]` - v2 has different structure |
| 7 | `extract-adjacent-comments.ts` | **YES** | None | Uses `article[data-id^="urn:li:comment:"]` - v2 has different structure |

### File Structure (Target)

```
packages/linkedin-automation/src/post/
├── types.ts                              # PostUtilities interface + types
├── create-post-utilities.ts              # Factory function
├── PostUtilitiesV1.ts                    # V1 implementation
├── PostUtilitiesV2.ts                    # V2 implementation
├── utils-shared/
│   └── (common utilities if any)
├── utils-v1/
│   ├── find-post-container.ts
│   ├── extract-post-url.ts
│   ├── extract-author-info.ts
│   ├── extract-post-caption.ts
│   ├── extract-post-time.ts
│   ├── extract-comments.ts
│   └── extract-adjacent-comments.ts
└── utils-v2/
    ├── find-post-container.ts
    ├── extract-post-url.ts
    └── ... (same structure)
```

### Types Definition

```typescript
// post/types.ts
export interface PostUrlInfo {
  urn: string;
  url: string;
}

export interface PostAuthorInfo {
  name: string | null;
  photoUrl: string | null;
  headline: string | null;
  profileUrl: string | null;
}

export interface PostTimeInfo {
  displayTime: string | null;
  fullTime: string | null;
}

export interface PostCommentInfo {
  authorName: string | null;
  authorHeadline: string | null;
  authorProfileUrl: string | null;
  authorPhotoUrl: string | null;
  content: string | null;
  urn: string | null;
  isReply: boolean;
}

export interface AdjacentComment {
  commentContent: string;
  likeCount: number;
  replyCount: number;
}

export interface PostUtilities {
  findPostContainer(anchorElement: Element): Element | null;
  extractPostUrl(postContainer: HTMLElement): PostUrlInfo[];
  extractAuthorInfo(postContainer: HTMLElement): PostAuthorInfo;
  extractPostCaption(postContainer: Element): string;
  extractPostTime(postContainer: HTMLElement): PostTimeInfo;
  extractComments(postContainer: HTMLElement): PostCommentInfo[];
  extractAdjacentComments(postContainer: Element): AdjacentComment[];
}
```

---

## Phase 2: Comment Utilities

These handle DOM interactions for commenting. **Likely work for both DOM versions** (use contenteditable, aria-labels).

### Priority Order

| # | File | DOM-Specific | Dependencies | Notes |
|---|------|--------------|--------------|-------|
| 1 | `find-editable-field.ts` | No | None | `div[contenteditable="true"]` - same for both |
| 2 | `click-comment-button.ts` | Maybe | None | Uses aria-label patterns - test for v2 |
| 3 | `insert-comment.ts` | No | None | Creates paragraphs, dispatches events - same for both |
| 4 | `attach-image-to-comment.ts` | Maybe | None | Uses aria-label `[aria-label="Add a photo"]` - test for v2 |
| 5 | `submit-comment.ts` | Maybe | `insert-comment` | Uses contenteditable + form buttons |
| 6 | `wait-for-comments-ready.ts` | **YES** | `extract-comment-from-post` | Depends on Phase 1 |

### File Structure (Target)

```
packages/linkedin-automation/src/comment/
├── types.ts                              # CommentUtilities interface
├── create-comment-utilities.ts           # Factory function
├── CommentUtilitiesV1.ts                 # V1 implementation
├── CommentUtilitiesV2.ts                 # V2 implementation
├── utils-shared/
│   ├── find-editable-field.ts            # Same for both
│   ├── insert-comment.ts                 # Same for both
│   └── attach-image-to-comment.ts        # Likely same for both
├── utils-v1/
│   ├── click-comment-button.ts
│   ├── submit-comment.ts
│   └── wait-for-comments-ready.ts
└── utils-v2/
    └── ... (if different from v1)
```

### Types Definition

```typescript
// comment/types.ts
export interface CommentUtilities {
  findEditableField(form: Element | null): HTMLElement | null;
  clickCommentButton(postContainer: HTMLElement): boolean;
  insertComment(editableField: HTMLElement, comment: string): Promise<void>;
  submitComment(postContainer: HTMLElement, commentText: string): Promise<boolean>;
  waitForCommentsReady(container: HTMLElement, beforeCount: number): Promise<void>;
  attachImage(form: HTMLFormElement, imageUrl: string): Promise<boolean>;
}
```

---

## Phase 3: React-Dependent Utilities (Keep in wxt-extension)

These have React dependencies and should **NOT** be migrated to linkedin-automation.

| File | Reason | Action |
|------|--------|--------|
| `use-most-visible-post.ts` | React hook (useState, useEffect, useCallback, useRef) | Keep in wxt-extension, refactor to use migrated post utilities |
| `linkedin-navigate.ts` | React.MouseEvent types | Keep in wxt-extension |
| `constants.ts` | Simple constant, no DOM access | Move to shared package or keep where needed |

### Refactoring `use-most-visible-post.ts`

After Phase 1, update to use `createPostUtilities()`:

```typescript
// Before
const POST_SELECTORS = "div[data-urn], div[data-id], article[role='article']";

// After
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";
const postUtilities = createPostUtilities();
// Use postUtilities.findPostContainer() instead of direct selectors
```

---

## Phase 4: data-fetch-mimic/ (Separate Migration)

These are complex utilities with backend dependencies. **Defer to separate plan.**

| Type | Files | Notes |
|------|-------|-------|
| React Hooks | `use-*.ts` (6 files) | Keep in wxt-extension |
| Collectors | `*-collector.ts` (6 files) | May move if framework-agnostic |
| Fetchers | `linkedin-*-fetcher.ts` (6 files) | LinkedIn API calls - can migrate |
| Config | `auto-fetch-config.ts`, `unified-auto-fetch.ts` | Backend coordination |

---

## Migration Steps (Per Utility)

### Step-by-Step Process

1. **Create types.ts** - Define interface and types
2. **Create utils-v1/** - Copy existing code, update imports
3. **Create utils-v2/** - Analyze v2 DOM, implement variant
4. **Create V1/V2 classes** - Implement interface
5. **Create factory** - `createPostUtilities()` with auto-detection
6. **Update exports** - Add to package.json exports
7. **Update wxt-extension** - Import from package, remove old file
8. **Test** - Verify in browser for both DOM versions

---

## Recommended Execution Order

### Week 1: Post Utilities

```
1. find-post-container.ts → Create post/ module structure
2. extract-post-url.ts → Add to post utilities
3. extract-author-info-from-post.ts
4. extract-post-caption.ts
5. extract-post-time.ts
6. extract-comment-from-post.ts
7. extract-adjacent-comments.ts
```

### Week 2: Comment Utilities

```
8. find-editable-field.ts → Create comment/ module structure
9. click-comment-button.ts
10. insert-comment.ts
11. attach-image-to-comment.ts
12. submit-comment.ts
13. wait-for-comments-ready.ts
```

### Week 3: Cleanup & Refactoring

```
14. Update use-most-visible-post.ts to use migrated utilities
15. Clean up old utils/ folder
16. Update index.ts exports
```

---

## V2 DOM Research Needed

Before implementing v2 variants, need to identify:

| Utility | v1 Selector | v2 Selector (TBD) |
|---------|-------------|-------------------|
| Post container | `div[data-urn]`, `div[data-id]` | `div[data-view-name="feed-full-update"]` parent |
| Post URL | `data-urn`, `data-id` attributes | `data-view-tracking-scope` (decoded) or other |
| Comments | `article[data-id^="urn:li:comment:"]` | TBD - inspect v2 DOM |
| Comment button | `button[aria-label*="comment"]` | Likely same |

---

## Success Criteria

- [ ] All post utilities migrated with v1/v2 support
- [ ] All comment utilities migrated with v1/v2 support
- [ ] Factory functions auto-detect DOM version
- [ ] wxt-extension imports from linkedin-automation
- [ ] Old utils/ files removed (except React hooks)
- [ ] Tests pass in both DOM versions (manual browser testing)

---

## Files to Delete After Migration

```
apps/wxt-extension/entrypoints/linkedin.content/utils/
├── post/                    # DELETE (migrated)
│   ├── find-post-container.ts
│   ├── extract-author-info-from-post.ts
│   ├── extract-comment-from-post.ts
│   ├── extract-adjacent-comments.ts
│   ├── extract-post-caption.ts
│   ├── extract-post-time.ts
│   └── extract-post-url.ts
├── comment/                 # DELETE (migrated)
│   ├── find-editable-field.ts
│   ├── insert-comment.ts
│   ├── click-comment-button.ts
│   ├── submit-comment.ts
│   ├── attach-image-to-comment.ts
│   └── wait-for-comments-ready.ts
├── feed/
│   ├── count-posts.ts       # DELETE (already migrated)
│   ├── load-more.ts         # DELETE (already migrated)
│   └── use-most-visible-post.ts  # KEEP (React hook)
├── constants.ts             # KEEP or move
├── linkedin-navigate.ts     # KEEP (React dependency)
└── index.ts                 # UPDATE exports
```
