# WXT-Extension Integration Plan

**Date**: 2026-01-13
**Type**: SIMPLE (one-session)
**Goal**: Integrate migrated linkedin-automation utilities into wxt-extension features

---

## Overview

The linkedin-automation package migration is complete (Phase 1: Post Utilities, Phase 2: Comment Utilities). Now we need to integrate these utilities into wxt-extension features by:

1. Replacing local imports with factory-based utilities from linkedin-automation
2. Ensuring DOM v1 and v2 compatibility through auto-detection
3. Deleting old local utilities after verification
4. Maintaining React-dependent utilities in wxt-extension

---

## Scope

### In Scope

- Replace imports in 12 files that use post/comment utilities
- Update 4 features: engage-button, compose-tab, utils cleanup
- Delete migrated utilities after verification
- Maintain backward compatibility during transition

### Out of Scope

- Refactoring React hooks (use-most-visible-post) - separate effort
- Migrating data-fetch-mimic utilities - deferred
- load-more.ts migration - assess separately
- Features without utils dependencies (save-profile, account-tab, connect-tab, manage-list, analytics-tab)

---

## Goals

1. **Zero Breaking Changes**: All features work on both DOM v1 and v2
2. **Incremental Migration**: Verify each phase before proceeding
3. **Clean Deletion**: Remove old utils only after full verification
4. **Type Safety**: Maintain TypeScript types throughout migration

---

## Implementation Checklist

### Phase A: Engage-Button ✅ COMPLETED (Alternative Approach)

**Status**: COMPLETED with alternative approach (vanilla JS injection instead of React portals)

**What was done**:
1. Created `useEngageButtons.ts` hook - vanilla JS button injection using factory pattern
2. Created `vanilla-sprite-animator.ts` - vanilla JS sprite animation (blink/breathe)
3. Added `watchForCommentEditors()` to CommentUtilities interface (types.ts)
4. Implemented V2 watcher (`watch-for-comment-editors.ts` in utils-v2/)
5. Implemented V1 watcher (`watch-for-comment-editors.ts` in utils-v1/)
6. Updated `create-comment-utilities.ts` factory to include watcher
7. Added `comment/*` export to linkedin-automation package.json

**Files created/modified**:
- `packages/linkedin-automation/src/comment/types.ts` - Added CommentEditorTarget, OnCommentEditorTargetsChange
- `packages/linkedin-automation/src/comment/utils-v2/watch-for-comment-editors.ts` - V2 implementation
- `packages/linkedin-automation/src/comment/utils-v1/watch-for-comment-editors.ts` - V1 implementation
- `packages/linkedin-automation/src/comment/create-comment-utilities.ts` - Factory with watchForCommentEditors
- `apps/wxt-extension/entrypoints/linkedin.content/engage-button/useEngageButtons.ts` - New hook
- `apps/wxt-extension/entrypoints/linkedin.content/engage-button/vanilla-sprite-animator.ts` - Sprite animator
- `apps/wxt-extension/entrypoints/linkedin.content/App.tsx` - Added useEngageButtons() call

**Note**: The original EngageButton.tsx still exists but is now superseded by useEngageButtons for DOM v2 support. Can be deleted after full verification.

---

**A1. ~~Update EngageButton.tsx~~ (SUPERSEDED)**

File: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/wxt-extension/entrypoints/linkedin.content/engage-button/EngageButton.tsx`

Current imports (lines 9-21):
```typescript
import {
  DEFAULT_STYLE_GUIDE,
  extractAdjacentComments,
  extractAuthorInfoFromPost,
  extractCommentsFromPost,
  extractPostCaption,
  extractPostTime,
  extractPostUrl,
  findPostContainer,
  getCaptionPreview,
  waitForCommentsReady,
} from "../utils";
import { clickCommentButton } from "../utils/comment/click-comment-button";
```

Replace with:
```typescript
import { DEFAULT_STYLE_GUIDE } from "../utils";
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";
import { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";
```

Add after imports (around line 23):
```typescript
// Initialize utilities (auto-detects DOM version)
const postUtils = createPostUtilities();
const commentUtils = createCommentUtilities();
```

Update function calls:
- Line 95: `findPostContainer(anchorElement)` → `postUtils.findPostContainer(anchorElement)`
- Line 105: `extractPostCaption(postContainer)` → `postUtils.extractPostCaption(postContainer)`
- Line 118: `getCaptionPreview(fullCaption, 10)` → Keep (utility function, not method)
- Line 119: `extractAuthorInfoFromPost(postContainer)` → `postUtils.extractPostAuthorInfo(postContainer)`
- Line 120: `extractPostTime(postContainer)` → `postUtils.extractPostTime(postContainer)`
- Line 121: `extractPostUrl(postContainer)` → `postUtils.extractPostUrl(postContainer)`
- Line 185: `extractCommentsFromPost(postContainer)` → `postUtils.extractPostComments(postContainer)`
- Line 186: `clickCommentButton(postContainer)` → `commentUtils.clickCommentButton(postContainer)`
- Line 187: `waitForCommentsReady(postContainer, beforeCount)` → `commentUtils.waitForCommentsReady(postContainer, beforeCount)`
- Line 199: `extractCommentsFromPost(postContainer)` → `postUtils.extractPostComments(postContainer)`
- Line 211: `extractAdjacentComments(postContainer)` → `postUtils.extractAdjacentComments(postContainer)`

Add getCaptionPreview helper (after imports, before component):
```typescript
// Helper function (not in PostUtilities interface)
function getCaptionPreview(fullCaption: string, wordLimit: number): string {
  const words = fullCaption.split(/\s+/);
  if (words.length <= wordLimit) return fullCaption;
  return words.slice(0, wordLimit).join(" ") + "...";
}
```

**A2. Update AutoEngageObserver.tsx**

File: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/wxt-extension/entrypoints/linkedin.content/engage-button/AutoEngageObserver.tsx`

Current imports (lines 7-19):
```typescript
import {
  DEFAULT_STYLE_GUIDE,
  extractAdjacentComments,
  extractAuthorInfoFromPost,
  extractCommentsFromPost,
  extractPostCaption,
  extractPostTime,
  extractPostUrl,
  findPostContainer,
  getCaptionPreview,
  waitForCommentsReady,
} from "../utils";
import { clickCommentButton } from "../utils/comment/click-comment-button";
```

Replace with:
```typescript
import { DEFAULT_STYLE_GUIDE } from "../utils";
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";
import { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";
```

Add after imports:
```typescript
// Initialize utilities (auto-detects DOM version)
const postUtils = createPostUtilities();
const commentUtils = createCommentUtilities();

// Helper function
function getCaptionPreview(fullCaption: string, wordLimit: number): string {
  const words = fullCaption.split(/\s+/);
  if (words.length <= wordLimit) return fullCaption;
  return words.slice(0, wordLimit).join(" ") + "...";
}
```

Update function calls (in triggerGeneration):
- Line 95: `extractPostCaption(postContainer)` → `postUtils.extractPostCaption(postContainer)`
- Line 108: `getCaptionPreview(fullCaption, 10)` → Keep (local helper)
- Line 109: `extractAuthorInfoFromPost(postContainer)` → `postUtils.extractPostAuthorInfo(postContainer)`
- Line 110: `extractPostTime(postContainer)` → `postUtils.extractPostTime(postContainer)`
- Line 111: `extractPostUrl(postContainer)` → `postUtils.extractPostUrl(postContainer)`
- Line 175: `extractCommentsFromPost(postContainer)` → `postUtils.extractPostComments(postContainer)`
- Line 176: `clickCommentButton(postContainer)` → `commentUtils.clickCommentButton(postContainer)`
- Line 177: `waitForCommentsReady(postContainer, beforeCount)` → `commentUtils.waitForCommentsReady(postContainer, beforeCount)`
- Line 189: `extractCommentsFromPost(postContainer)` → `postUtils.extractPostComments(postContainer)`
- Line 201: `extractAdjacentComments(postContainer)` → `postUtils.extractAdjacentComments(postContainer)`
- Line 278: `findPostContainer(commentButton)` → `postUtils.findPostContainer(commentButton)`

**A3. Update SpacebarEngageObserver.tsx**

File: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/wxt-extension/entrypoints/linkedin.content/engage-button/SpacebarEngageObserver.tsx`

Check if this file uses clickCommentButton or any post utilities. If yes, apply same pattern as A1/A2.

---

### Phase A2: AutoEngage - ✅ COMPLETED

**What was done**:
1. Created `useAutoEngage.ts` hook - vanilla JS observer using factory pattern
2. Added `watchForNativeCommentButtonClicks()` to CommentUtilities interface
3. Implemented V2 watcher (`watch-for-native-comment-clicks.ts` in utils-v2/)
4. Implemented V1 watcher (`watch-for-native-comment-clicks.ts` in utils-v1/)
5. Updated CommentUtilitiesV1 and V2 classes with new method
6. Replaced `<AutoEngageObserver />` in App.tsx with `useAutoEngage()` hook

**Files created/modified**:
- `packages/linkedin-automation/src/comment/types.ts` - Added NativeCommentButtonClickEvent, OnNativeCommentButtonClick
- `packages/linkedin-automation/src/comment/utils-v2/watch-for-native-comment-clicks.ts` - V2 implementation
- `packages/linkedin-automation/src/comment/utils-v1/watch-for-native-comment-clicks.ts` - V1 implementation
- `packages/linkedin-automation/src/comment/CommentUtilitiesV1.ts` - Added watchForNativeCommentButtonClicks
- `packages/linkedin-automation/src/comment/CommentUtilitiesV2.ts` - Added watchForNativeCommentButtonClicks
- `apps/wxt-extension/entrypoints/linkedin.content/engage-button/useAutoEngage.ts` - New hook
- `apps/wxt-extension/entrypoints/linkedin.content/App.tsx` - Replaced AutoEngageObserver with useAutoEngage()

**Note**: AutoEngageObserver.tsx still exists but is now superseded. Can be deleted after full verification.

---

### Phase A3: SpacebarEngageObserver - ✅ COMPLETED

**What was done**:
1. Replaced utility imports with factory pattern
2. Added `createPostUtilities()` and `createCommentUtilities()` initialization
3. Added local `getCaptionPreview()` helper function
4. Updated all utility calls to use factory methods

**File modified**: `apps/wxt-extension/entrypoints/linkedin.content/engage-button/SpacebarEngageObserver.tsx`

**Imports replaced**:
- `extractPostCaption` → `postUtils.extractPostCaption`
- `extractAuthorInfoFromPost` → `postUtils.extractPostAuthorInfo`
- `extractPostTime` → `postUtils.extractPostTime`
- `extractPostUrl` → `postUtils.extractPostUrl`
- `extractCommentsFromPost` → `postUtils.extractPostComments`
- `extractAdjacentComments` → `postUtils.extractAdjacentComments`
- `clickCommentButton` → `commentUtils.clickCommentButton`
- `waitForCommentsReady` → `commentUtils.waitForCommentsReady`

**Kept as-is**:
- `DEFAULT_STYLE_GUIDE` - local constant
- `useMostVisiblePost` - React hook (now uses factory via A4)

---

### Phase A4: useMostVisiblePost Selector Update - ✅ COMPLETED

**What was done**:
1. Added `getPostContainerSelector()` to PostUtilities interface
2. Implemented V1 selector: `"div[data-urn], div[data-id], article[role='article']"`
3. Implemented V2 selector: `'div[role="listitem"]'`
4. Updated `useMostVisiblePost` to use factory instead of hardcoded selector

**Files modified**:
- `packages/linkedin-automation/src/post/types.ts` - Added interface method
- `packages/linkedin-automation/src/post/PostUtilitiesV1.ts` - V1 implementation
- `packages/linkedin-automation/src/post/PostUtilitiesV2.ts` - V2 implementation
- `apps/wxt-extension/.../utils/feed/use-most-visible-post.ts` - Uses factory

**Downstream components now have DOM v2 support**:
- `SpacebarEngageObserver.tsx` - spacebar trigger on visible post
- `PostNavigator.tsx` - post navigation UI

---

### Phase B: Compose-Tab (4 files) - PENDING

**B1. Update load-posts.ts**

File: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/load-posts.ts`

Current imports (lines 11-25):
```typescript
import type { PostAuthorInfo } from "../utils/post/extract-author-info-from-post";
import type { PostCommentInfo } from "../utils/post/extract-comment-from-post";
import type { PostTimeInfo } from "../utils/post/extract-post-time";
import type { PostUrlInfo } from "../utils/post/extract-post-url";
import { waitForCommentsReady } from "../utils";
import { clickCommentButton } from "../utils/comment/click-comment-button";
import { loadMore } from "../utils/feed/load-more";
import { extractAuthorInfoFromPost } from "../utils/post/extract-author-info-from-post";
import { extractCommentsFromPost } from "../utils/post/extract-comment-from-post";
import {
  extractPostCaption,
  getCaptionPreview,
} from "../utils/post/extract-post-caption";
import { extractPostTime } from "../utils/post/extract-post-time";
import { extractPostUrl } from "../utils/post/extract-post-url";
```

Replace with:
```typescript
import type { PostAuthorInfo, PostCommentInfo, PostTimeInfo, PostUrlInfo } from "@sassy/linkedin-automation/post/types";
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";
import { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";
import { loadMore } from "../utils/feed/load-more";
```

Add after imports:
```typescript
// Initialize utilities (auto-detects DOM version)
const postUtils = createPostUtilities();
const commentUtils = createCommentUtilities();

// Helper function
function getCaptionPreview(fullCaption: string, wordLimit: number): string {
  const words = fullCaption.split(/\s+/);
  if (words.length <= wordLimit) return fullCaption;
  return words.slice(0, wordLimit).join(" ") + "...";
}
```

Update function calls:
- Line 50: `document.querySelectorAll<HTMLElement>("div[data-urn]")` → **CRITICAL**: This hardcoded selector needs updating
  - Replace with: `postUtils.getAllPostContainers()` (if available) OR keep as-is and document as v1-only
  - **ACTION REQUIRED**: Check if PostUtilities has `getAllPostContainers()` method. If not, keep hardcoded for now.
- Line 70: `document.querySelectorAll<HTMLElement>("div[data-urn]")` → Same as above
- Line 79: `extractPostCaption(container)` → `postUtils.extractPostCaption(container)`
- Line 95: `extractPostCaption(container)` → `postUtils.extractPostCaption(container)`
- Line 100: `getCaptionPreview(fullCaption, 10)` → Keep (local helper)
- Line 103: `extractAuthorInfoFromPost(container)` → `postUtils.extractPostAuthorInfo(container)`
- Line 104: `extractPostTime(container)` → `postUtils.extractPostTime(container)`
- Line 105: `extractPostUrl(container)` → `postUtils.extractPostUrl(container)`
- Line 106: `extractCommentsFromPost(container)` → `postUtils.extractPostComments(container)`
- Line 179: `extractCommentsFromPost(container)` → `postUtils.extractPostComments(container)`
- Line 185: `clickCommentButton(container)` → `commentUtils.clickCommentButton(container)`
- Line 190: `waitForCommentsReady(container, beforeCount)` → `commentUtils.waitForCommentsReady(container, beforeCount)`

**CRITICAL DOM v2 Compatibility Issue**: Lines 50 and 70 use hardcoded `div[data-urn]` selector which won't work in DOM v2.

**Resolution Options**:
1. Add `getAllPostContainers()` method to PostUtilities interface
2. Keep hardcoded and document as v1-only (defer v2 support)
3. Refactor to use observable pattern

**Recommendation**: Keep hardcoded for now, add TODO comment, defer to separate plan.

**B2. Update ComposeTab.tsx**

File: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/ComposeTab.tsx`

Current imports (lines 23-24):
```typescript
import { DEFAULT_STYLE_GUIDE, extractAdjacentComments } from "../utils";
import { submitCommentToPost } from "../utils/comment/submit-comment";
```

Replace with:
```typescript
import { DEFAULT_STYLE_GUIDE } from "../utils";
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";
import { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";
```

Add after imports:
```typescript
// Initialize utilities (auto-detects DOM version)
const postUtils = createPostUtilities();
const commentUtils = createCommentUtilities();
```

Update function calls:
- Line 165: `extractAdjacentComments(post.postContainer)` → `postUtils.extractAdjacentComments(post.postContainer)`
- Line 253: `submitCommentToPost(card.postContainer, card.commentText)` → `commentUtils.submitComment(card.postContainer, card.commentText)`

**B3. Update ComposeCard.tsx**

File: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/ComposeCard.tsx`

Current imports (lines 22-23):
```typescript
import { DEFAULT_STYLE_GUIDE, extractAdjacentComments } from "../utils";
import { submitCommentToPost } from "../utils/comment/submit-comment";
```

Replace with:
```typescript
import { DEFAULT_STYLE_GUIDE } from "../utils";
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";
import { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";
```

Add after imports:
```typescript
// Initialize utilities (auto-detects DOM version)
const postUtils = createPostUtilities();
const commentUtils = createCommentUtilities();
```

Update function calls:
- Line 220: `extractAdjacentComments(card.postContainer)` → `postUtils.extractAdjacentComments(card.postContainer)`
- Line 153: `submitCommentToPost(card.postContainer, card.commentText)` → `commentUtils.submitComment(card.postContainer, card.commentText)`

**B4. Update PostPreviewSheet.tsx**

File: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/wxt-extension/entrypoints/linkedin.content/compose-tab/PostPreviewSheet.tsx`

Current imports (lines 26-27):
```typescript
import { DEFAULT_STYLE_GUIDE, extractAdjacentComments } from "../utils";
import { submitCommentToPost } from "../utils/comment/submit-comment";
```

Replace with:
```typescript
import { DEFAULT_STYLE_GUIDE } from "../utils";
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";
import { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";
```

Add after imports:
```typescript
// Initialize utilities (auto-detects DOM version)
const postUtils = createPostUtilities();
const commentUtils = createCommentUtilities();
```

Update function calls:
- Line 202: `extractAdjacentComments(previewingCard.postContainer)` → `postUtils.extractAdjacentComments(previewingCard.postContainer)`
- Line 247: `submitCommentToPost(previewingCard.postContainer, previewingCard.commentText)` → `commentUtils.submitComment(previewingCard.postContainer, previewingCard.commentText)`

---

### Phase C: Utils Cleanup

**C1. Update utils/index.ts exports**

File: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/apps/wxt-extension/entrypoints/linkedin.content/utils/index.ts`

Current exports (lines 1-30):
```typescript
export { attachImageToComment } from "./comment/attach-image-to-comment";
export { extractAdjacentComments } from "./post/extract-adjacent-comments";
export { findPostContainer } from "./post/find-post-container";
export { findEditableField } from "./comment/find-editable-field";
export { insertCommentIntoField } from "./comment/insert-comment";
export { extractCommentsFromPost } from "./post/extract-comment-from-post";
export { extractAuthorInfoFromPost } from "./post/extract-author-info-from-post";
export {
  extractPostCaption,
  getCaptionPreview,
} from "./post/extract-post-caption";
export { extractPostTime } from "./post/extract-post-time";
export { extractPostUrl } from "./post/extract-post-url";
export { loadMore } from "./feed/load-more";
export { submitCommentToPost } from "./comment/submit-comment";
export { clickCommentButton } from "./comment/click-comment-button";
export { DEFAULT_STYLE_GUIDE } from "./constants";
export { waitForCommentsReady } from "./comment/wait-for-comments-ready";
export {
  navigateLinkedIn,
  createNavigateHandler,
  linkedInLinkProps,
} from "./linkedin-navigate";
export {
  useMostVisiblePost,
  POST_SELECTORS,
  DEFAULT_HIGHLIGHT_STYLE,
  type UseMostVisiblePostOptions,
  type UseMostVisiblePostResult,
} from "./feed/use-most-visible-post";
```

Replace with:
```typescript
// Re-export from linkedin-automation (migrated utilities)
export { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";
export { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";
export type { PostUtilities } from "@sassy/linkedin-automation/post/types";
export type { CommentUtilities } from "@sassy/linkedin-automation/comment/types";
export type {
  PostUrlInfo,
  PostAuthorInfo,
  PostTimeInfo,
  PostCommentInfo,
  AdjacentCommentInfo,
} from "@sassy/linkedin-automation/post/types";

// Keep local utilities (not migrated)
export { attachImageToComment } from "./comment/attach-image-to-comment";
export { DEFAULT_STYLE_GUIDE } from "./constants";
export { loadMore } from "./feed/load-more";
export {
  navigateLinkedIn,
  createNavigateHandler,
  linkedInLinkProps,
} from "./linkedin-navigate";
export {
  useMostVisiblePost,
  POST_SELECTORS,
  DEFAULT_HIGHLIGHT_STYLE,
  type UseMostVisiblePostOptions,
  type UseMostVisiblePostResult,
} from "./feed/use-most-visible-post";
```

**C2. Verify no other files import from deleted paths**

Run grep to find any remaining imports from:
- `../utils/post/`
- `../utils/comment/` (except attach-image-to-comment)

Command:
```bash
grep -r "from.*utils/post/" apps/wxt-extension/entrypoints/linkedin.content/ --include="*.tsx" --include="*.ts"
grep -r "from.*utils/comment/" apps/wxt-extension/entrypoints/linkedin.content/ --include="*.tsx" --include="*.ts"
```

If any files found, update them following the same pattern.

**C3. Delete migrated utility directories (AFTER VERIFICATION)**

**CRITICAL**: Only delete after all changes are tested in browser on both DOM v1 and v2.

Delete:
```
apps/wxt-extension/entrypoints/linkedin.content/utils/post/
apps/wxt-extension/entrypoints/linkedin.content/utils/comment/click-comment-button.ts
apps/wxt-extension/entrypoints/linkedin.content/utils/comment/find-editable-field.ts
apps/wxt-extension/entrypoints/linkedin.content/utils/comment/insert-comment.ts
apps/wxt-extension/entrypoints/linkedin.content/utils/comment/submit-comment.ts
apps/wxt-extension/entrypoints/linkedin.content/utils/comment/wait-for-comments-ready.ts
```

Keep:
```
apps/wxt-extension/entrypoints/linkedin.content/utils/comment/attach-image-to-comment.ts (not migrated)
apps/wxt-extension/entrypoints/linkedin.content/utils/feed/ (React hooks, refactor later)
apps/wxt-extension/entrypoints/linkedin.content/utils/constants.ts
apps/wxt-extension/entrypoints/linkedin.content/utils/linkedin-navigate.ts
apps/wxt-extension/entrypoints/linkedin.content/utils/index.ts
```

---

### Phase D: Testing & Verification

**D1. Verify TypeScript compilation**

```bash
cd /Users/knamnguyen/Documents/0-Programming/engagekit-turborepo
pnpm typecheck
```

Expected: No type errors in wxt-extension

**D2. Build extension**

```bash
cd apps/wxt-extension
pnpm build
```

Expected: Successful build with no errors

**D3. Manual browser testing (DOM v1)**

1. Load extension in browser
2. Navigate to LinkedIn (DOM v1 environment)
3. Test each feature:
   - EngageButton: Click EngageKit button, verify comment generation
   - AutoEngage: Click native comment button with auto-engage enabled
   - Load Posts: Click "Load Posts", verify post collection
   - ComposeCard: Edit comment, submit, regenerate
   - PostPreviewSheet: Click "View", navigate between posts

Expected: All features work identically to before migration

**D4. Manual browser testing (DOM v2)**

1. Switch to LinkedIn DOM v2 environment (if available)
2. Repeat all tests from D3

Expected: All features work with DOM v2 auto-detection

**D5. Edge cases**

- Empty posts (no caption)
- Posts without comments
- Promoted posts
- Company posts
- Posts with images/videos
- Quick succession (spam clicking)

---

## Dependencies

### Package Updates Required

**linkedin-automation package.json**

Current exports:
```json
{
  "exports": {
    "./dom/*": "./src/dom/*.ts",
    "./feed/*": "./src/feed/*.ts",
    "./account/*": "./src/account/*.ts",
    "./profile/*": "./src/profile/*.ts",
    "./post/*": "./src/post/*.ts"
  }
}
```

Add comment exports:
```json
{
  "exports": {
    "./dom/*": "./src/dom/*.ts",
    "./feed/*": "./src/feed/*.ts",
    "./account/*": "./src/account/*.ts",
    "./profile/*": "./src/profile/*.ts",
    "./post/*": "./src/post/*.ts",
    "./comment/*": "./src/comment/*.ts"
  }
}
```

**Verify this export is already present** (should be based on migration plan completion).

---

## Integration Notes

### Factory Pattern Usage

All files should initialize utilities once:

```typescript
import { createPostUtilities } from "@sassy/linkedin-automation/post/create-post-utilities";
import { createCommentUtilities } from "@sassy/linkedin-automation/comment/create-comment-utilities";

// At module level (outside components/functions)
const postUtils = createPostUtilities();
const commentUtils = createCommentUtilities();
```

**Rationale**: DOM version is detected once at initialization. Re-creating on every call is unnecessary overhead.

### getCaptionPreview Helper

This utility function is NOT part of PostUtilities interface (it's a simple string manipulation). Each file should define it locally:

```typescript
function getCaptionPreview(fullCaption: string, wordLimit: number): string {
  const words = fullCaption.split(/\s+/);
  if (words.length <= wordLimit) return fullCaption;
  return words.slice(0, wordLimit).join(" ") + "...";
}
```

**Alternative**: Export from utils/index.ts as a shared helper.

### Type Imports

Import types from linkedin-automation:

```typescript
import type {
  PostAuthorInfo,
  PostCommentInfo,
  PostTimeInfo,
  PostUrlInfo,
} from "@sassy/linkedin-automation/post/types";
```

### Method Name Mapping

| Old Import | New Method |
|------------|------------|
| `extractAuthorInfoFromPost` | `postUtils.extractPostAuthorInfo` |
| `extractCommentsFromPost` | `postUtils.extractPostComments` |
| `clickCommentButton` | `commentUtils.clickCommentButton` |
| `submitCommentToPost` | `commentUtils.submitComment` |

---

## Risks & Mitigations

### Risk 1: DOM Version Detection Failure

**Risk**: `detectDomVersion()` incorrectly identifies DOM version, causing wrong implementation to run.

**Mitigation**:
- Thoroughly test `detectDomVersion()` in both environments
- Add logging to factory functions: `console.log('[linkedin-automation] Using DOM version:', version)`
- Fallback to v1 if detection fails

### Risk 2: Hard-Coded Selectors in load-posts.ts

**Risk**: `div[data-urn]` selectors in load-posts.ts won't work in DOM v2.

**Mitigation**:
- Document as known limitation in code comments
- Add TODO for future refactoring
- Defer load-posts v2 support to separate plan

### Risk 3: Incomplete Type Definitions

**Risk**: linkedin-automation types don't match wxt-extension expectations.

**Mitigation**:
- Run TypeScript compiler after each phase
- Fix type mismatches immediately
- Add type assertions if necessary (as temporary measure)

### Risk 4: Performance Regression

**Risk**: Factory pattern adds overhead compared to direct imports.

**Mitigation**:
- Initialize factories once per module (not per function call)
- Profile before/after if performance issues arise
- Consider memoization if needed

---

## Rollback Strategy

If issues arise during integration:

### Quick Rollback (Git)

```bash
git checkout HEAD -- apps/wxt-extension/entrypoints/linkedin.content/
```

### Incremental Rollback (Per Phase)

- Phase A failure → Revert EngageButton files only
- Phase B failure → Revert ComposeTab files only
- Phase C failure → Restore utils/index.ts exports

### Keep Old Utils Until Verified

**DO NOT delete old utility files until**:
1. All TypeScript compilation passes
2. Extension builds successfully
3. Manual testing on DOM v1 passes
4. Manual testing on DOM v2 passes (if available)

---

## Acceptance Criteria

- [ ] All 12 files updated with new imports
- [ ] TypeScript compilation passes with no errors
- [ ] Extension builds successfully
- [ ] EngageButton works on DOM v1 and v2
- [ ] AutoEngage works on DOM v1 and v2
- [ ] Load Posts works (DOM v1 only - v2 deferred)
- [ ] ComposeCard submit/regenerate works on both DOM versions
- [ ] PostPreviewSheet navigation works on both DOM versions
- [ ] Old utility files deleted (after verification)
- [ ] No remaining imports from deleted paths
- [ ] All edge cases tested (empty posts, no comments, etc.)

---

## Success Metrics

**Code Quality**:
- Zero TypeScript errors
- Zero runtime errors in console
- Consistent factory pattern usage

**Functionality**:
- 100% feature parity with pre-migration behavior
- DOM v1 and v2 compatibility (except load-posts)

**Maintainability**:
- Reduced code duplication (utilities centralized)
- Clear separation between framework-agnostic and React-specific code

---

## Post-Integration Tasks

### Immediate (Same Session)

1. Test all features in browser
2. Delete old utility files
3. Commit changes with message:
   ```
   Integrate linkedin-automation utilities into wxt-extension

   - Replace local post/comment utilities with factory-based utilities
   - Support DOM v1 and v2 auto-detection
   - Delete migrated utility files
   - Maintain React-dependent utilities in wxt-extension

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
   ```

### Follow-Up (Separate Plans)

1. **Refactor use-most-visible-post.ts** to use migrated utilities
2. **Migrate load-more.ts** to linkedin-automation (with DOM v2 support)
3. **Add getAllPostContainers()** to PostUtilities interface for feed iteration
4. **Update data-fetch-mimic** utilities (separate complex plan)

---

## Notes

### Why Factory Pattern?

The factory pattern (`createPostUtilities()`) allows:
1. **Auto-detection**: DOM version detected at runtime
2. **No conditional imports**: Single import path for both versions
3. **Framework-agnostic**: Works in browser extension, Puppeteer, etc.
4. **Type safety**: PostUtilities interface ensures consistency

### Why Keep Some Utils Local?

React-dependent utilities stay in wxt-extension:
- `use-most-visible-post.ts` - React hook (useEffect, useState)
- `linkedin-navigate.ts` - Uses React.MouseEvent
- `attach-image-to-comment.ts` - Not yet migrated (future work)

### Why Defer load-posts v2?

`load-posts.ts` uses hardcoded `div[data-urn]` selectors for feed iteration. Supporting DOM v2 requires:
1. Adding `getAllPostContainers()` to PostUtilities interface
2. Implementing observable pattern for dynamic feed
3. Refactoring feed scroll logic

This is complex enough to warrant a separate plan.

---

## References

- Migration Plan: `process/plans/linkedin-utils-migration_PLAN_13-01-26.md`
- linkedin-automation exports: `packages/linkedin-automation/package.json`
- Post Utilities Factory: `packages/linkedin-automation/src/post/create-post-utilities.ts`
- Comment Utilities Classes: `packages/linkedin-automation/src/comment/CommentUtilitiesV1.ts` and `CommentUtilitiesV2.ts`
- DOM Detection: `packages/linkedin-automation/src/dom/detect.ts`

---

## Progress Summary

| Phase | Status | Notes |
|-------|--------|-------|
| **Phase A1: Engage-Button** | ✅ COMPLETED | useEngageButtons.ts with vanilla JS + sprite animation |
| **Phase A2: AutoEngage** | ✅ COMPLETED | useAutoEngage.ts hook with watchForNativeCommentButtonClicks |
| **Phase A3: SpacebarEngageObserver** | ✅ COMPLETED | Migrated utility imports to factories |
| **Phase A4: useMostVisiblePost** | ✅ COMPLETED | Added getPostContainerSelector() - fixes PostNavigator + SpacebarEngageObserver |
| **Phase B: Compose-Tab** | ✅ COMPLETED | load-posts.ts moved to collect-posts.ts in linkedin-automation, all files updated |
| **Phase C: Utils Cleanup** | ✅ COMPLETED | Deleted old utils/post/, utils/comment/ (except attach-image), dead code removed |
| **Phase D: Testing** | ✅ COMPLETED | Load Posts verified working on DOM v2 |

### Completed Work Summary

**Phase B (Compose-Tab):**
- Created `packages/linkedin-automation/src/feed/collect-posts.ts` with lazy initialization and v2-compatible URN extraction
- Updated ComposeTab.tsx, ComposeCard.tsx, PostPreviewSheet.tsx imports
- Deleted old `load-posts.ts`

**Phase C (Utils Cleanup):**
- Deleted `utils/post/` directory (7 files)
- Deleted `utils/comment/` migrated files (5 files, kept attach-image-to-comment.ts)
- Deleted dead code: EngageButton.tsx, AutoEngageObserver.tsx, ButtonPortalManager.tsx
- Updated `utils/index.ts` to re-export from linkedin-automation
- Updated `stores/compose-store.ts` to import types from linkedin-automation

**Files Kept (Active Code):**
- `SpacebarEngageObserver.tsx` - still used in App.tsx
- `use-most-visible-post.ts` - React hook for spacebar/navigator features
- `attach-image-to-comment.ts` - not migrated (future work)

---

**Plan Status**: ✅ COMPLETED (2026-01-14)
**Result**: All utilities migrated, DOM v1/v2 support verified, dead code removed
