# LinkedIn DOM Compatibility Plan

**Date**: January 11, 2026
**Status**: IN PROGRESS
**Package Created**: `@sassy/linkedin-automation`

---

## Problem Statement

LinkedIn changed their DOM structure on the feed page (2024+):
- **Old DOM (dom-v1)**: Form-based editor with `data-urn`, `data-placeholder`, `[aria-label="Add a photo"]`
- **New DOM (dom-v2)**: TipTap-based editor with `data-view-name`, `componentkey`, `[aria-label="Share photo"]`

The WXT extension's DOM utilities break completely on the new DOM.

### Key Differences

| Aspect | dom-v1 (Old) | dom-v2 (New) |
|--------|--------------|--------------|
| Post container | `div[data-urn]`, `div[data-id]` | `[data-view-name="feed-full-update"]` |
| URN location | `data-urn` attribute | Embedded in `componentkey` or tracking JSON |
| Comment box | `form` + `[data-placeholder="Add a comment…"]` | `[data-view-name="comment-box"]` + TipTap |
| Photo button | `[aria-label="Add a photo"]` | `[aria-label="Share photo"]` |
| Submit button | Inside `form`, text "Comment"/"Reply" | `[data-view-name="feed-comment-button"]` |

### Scope of DOM Change

- **Feed page**: May use dom-v2 (A/B tested)
- **Search/Profile pages**: Still use dom-v1
- **Some data missing in dom-v2**: Author URN not directly in DOM (needs API fallback)

---

## Files Requiring Updates

24 files with DOM selectors in `apps/wxt-extension/entrypoints/linkedin.content/`:

### High Priority (Injection/Core)
1. `engage-button/useButtonInjection.ts` - Engage button injection
2. `save-profile/useSaveProfileInjection.ts` - Save profile button
3. `utils/comment/submit-comment.ts` - Uses `form` to find submit button
4. `utils/comment/attach-image-to-comment.ts` - Uses `form` + old photo selector
5. `utils/post/find-post-container.ts` - Falls back to `form`

### Medium Priority (Extraction)
6. `utils/post/extract-author-info-from-post.ts`
7. `utils/post/extract-post-caption.ts`
8. `utils/post/extract-post-url.ts`
9. `utils/post/extract-comment-from-post.ts`
10. `utils/comment/click-comment-button.ts`

### Lower Priority (Feed/Detection)
11. `utils/feed/use-most-visible-post.ts`
12. `utils/feed/load-more.ts`
13. `engage-button/AutoEngageObserver.tsx`
14. `comment-detection/detection-observer.ts`

---

## Chosen Architecture: Simple Auto-Detection

After discussing multiple approaches, we chose the simplest:

### Rejected Approaches

1. **OOP Strategy Pattern** (Cofounder's idea)
   ```ts
   interface PostUtilities { extractPost(): ReadyPost }
   class NewDomPostUtilities implements PostUtilities { ... }
   class OldDomPostUtilities implements PostUtilities { ... }
   ```
   - Con: Every new feature requires updating 2 classes

2. **Layered Architecture** (4-layer abstraction)
   - Primitives → Extractors → Facade → Consumers
   - Con: Overcomplicated for the problem

### Chosen Approach: Detect Once, Branch in Functions

```ts
// Detect which DOM version we're on
const dom = getDomVersion(); // "dom-v1" | "dom-v2"

// Each utility function branches based on version
function findCommentBoxTargets() {
  const dom = getDomVersion();
  return dom === "dom-v2" ? findV2Targets() : findV1Targets();
}
```

**Benefits:**
- No new abstractions
- Changes are localized to each utility
- Easy to delete v1 code when LinkedIn fully migrates
- Detection cached, only re-runs on navigation

---

## Implementation Progress

### Completed

- [x] Created `packages/linkedin-automation/` package
- [x] Implemented `src/dom/detect.ts` with:
  - `detectDomVersion()` - Returns `"dom-v1"` | `"dom-v2"`
  - `redetectDomVersion()` - Force re-detection
  - `onDomVersionChange(callback)` - Subscribe to navigation changes
  - `debugDomDetection()` - Console logging for debugging
- [x] Added package to wxt-extension dependencies
- [x] Integrated detection into content script entry point

### Pending

- [ ] Update `useButtonInjection.ts` to use detection
- [ ] Update `submit-comment.ts` to handle both DOMs
- [ ] Update `attach-image-to-comment.ts` for new photo button
- [ ] Update `find-post-container.ts` for new container selectors
- [ ] Update remaining extraction utilities
- [ ] Test on LinkedIn feed with both DOM versions
- [ ] Handle API fallback for missing data in dom-v2

---

## Package Structure

```
packages/linkedin-automation/
├── package.json
├── tsconfig.json
└── src/
    └── dom/
        └── detect.ts      # DOM version detection
        # Future files:
        # └── selectors.ts # Centralized selectors (optional)
        # └── primitives.ts # Shared query helpers (optional)
```

### Export Pattern

```json
{
  "exports": {
    "./dom/*": "./src/dom/*.ts"
  }
}
```

### Usage

```ts
import { detectDomVersion, onDomVersionChange } from "@sassy/linkedin-automation/dom/detect";

// Get current version
const version = detectDomVersion(); // "dom-v1" | "dom-v2"

// Subscribe to changes on navigation
const cleanup = onDomVersionChange((version) => {
  console.log("DOM version:", version);
});
```

---

## Detection Logic

```ts
function detectFromDom(): DomVersion {
  // dom-v2 signature: TipTap-based editor
  const hasV2Signatures =
    document.querySelector('[data-view-name="feed-full-update"]') !== null ||
    document.querySelector('[data-view-name="comment-box"]') !== null;

  if (hasV2Signatures) {
    return "dom-v2";
  }

  return "dom-v1";
}
```

---

## Next Steps

1. **Test detection** - Run extension on LinkedIn, verify console output
2. **Update useButtonInjection.ts** - First utility to migrate
3. **Iterate** - Update remaining utilities one by one
4. **Handle missing data** - Add API fallback for author URN in dom-v2

---

## Code Considerations for Puppeteer

This package will also be used in Puppeteer/Hyperbrowser:
- No browser extension APIs (chrome.*, browser.*)
- Pure DOM operations only
- Can be bundled and injected via `page.evaluateOnNewDocument()`

Current 3 copies of DOM utilities:
1. `apps/wxt-extension/entrypoints/linkedin.content/utils/`
2. `apps/chrome-extension/` (legacy)
3. `browser-session.ts` (manually injected)

Goal: Consolidate into `packages/linkedin-automation/` and share across all consumers.

---

## Related Files

- New DOM sample: `process/new-feed.html` (114k lines)
- Old DOM utilities: `apps/wxt-extension/entrypoints/linkedin.content/utils/`
- Content script entry: `apps/wxt-extension/entrypoints/linkedin.content/index.tsx`
