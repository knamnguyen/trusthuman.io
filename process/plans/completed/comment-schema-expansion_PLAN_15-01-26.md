# Comment Schema Expansion Plan

**Created:** 2026-01-15
**Status:** DRAFT
**Type:** SIMPLE

## Overview

Expand the Comment database schema to fully capture all scraped data from LinkedIn posts and submitted comments. Currently, some extracted data (touch score, post time, full comment info) is being discarded.

## Goals

<!-- @import "[TOC]" {cmd="toc" depthFrom=1 depthTo=6 orderedList=false} -->

1. Add `peakTouchScore` field to track user personalization
2. Rename `adjacentComments` → `postComments` with expanded `PostCommentInfo[]` schema
3. Convert and save `postCreatedAt` from WXT extension (currently only Puppeteer saves this)
4. Remove redundant `postCaptionPreview` field (derive in UI)
5. Remove `postContentHtml` field - redundant since `postFullCaption` handles line breaks with `\n`

---

## Execution Brief

### Phase 1: Database Schema Migration

**What happens:** Update `comment.prisma` (add `peakTouchScore`, rename `adjacentComments` → `postComments`, remove `postCaptionPreview`, remove `postContentHtml`), run migration.

**Test:** Migration completes, `schema.sql` reflects changes.

### Phase 2: API Layer Updates

**What happens:** Update `comment.ts` and `autocomment.ts` - new input schemas, remove old fields.

**Test:** TypeScript compiles, tRPC endpoints accept new field names.

### Phase 3: WXT Extension Updates

**What happens:** Update `save-comment-to-db.ts` - add `peakTouchScore`, `postCreatedAt`, use full `postComments` schema.

**Test:** Submit comment from WXT → DB has `peakTouchScore` (0-100), `postCreatedAt` (DateTime), `postComments` (full author info).

### Phase 4: Dashboard UI Updates

**What happens:** Update `history/page.tsx` - derive caption preview from `postFullCaption`.

**Test:** History page loads, captions display correctly (truncated).

### Phase 5: Puppeteer/Chrome Extension Cleanup

**What happens:** Update `browser-session.ts` and chrome-extension files - remove `postContentHtml`, update tests.

**Test:** Puppeteer auto-comment works, chrome-extension target-list works, tests pass.

### Expected Outcome

- WXT comments save: `peakTouchScore`, `postCreatedAt`, full `postComments[]`
- DB is leaner: no `postContentHtml` (big HTML), no `postCaptionPreview` (redundant)
- History page derives preview from `postFullCaption`
- Puppeteer uses `postFullCaption` instead of `postContentHtml`

---

## Implementation Steps

### Step 1: Update Prisma Schema

**File:** `packages/db/prisma/models/comment.prisma`

Changes:

```prisma
model Comment {
  // ... existing fields ...

  // RENAME: adjacentComments → postComments
  // Expand schema to include full PostCommentInfo data
  postComments Json?  // Was: adjacentComments

  // ADD: Touch score tracking
  peakTouchScore Int?  // 0-100, user personalization score

  // REMOVE: postCaptionPreview (will derive in UI from postFullCaption)
  // - postCaptionPreview String  // DELETE THIS LINE

  // REMOVE: postContentHtml (redundant - postFullCaption handles \n line breaks)
  // - postContentHtml String?  // DELETE THIS LINE
}
```

**PostComments JSON Schema:**

```typescript
interface PostCommentInfo {
  authorName: string | null;
  authorHeadline: string | null;
  authorProfileUrl: string | null;
  authorPhotoUrl: string | null;
  content: string | null;
  urn: string | null;
  isReply: boolean;
}
// Store as: PostCommentInfo[]
```

### Step 2: Create Database Migration

```bash
cd packages/db
pnpm prisma migrate dev --name expand_comment_schema
```

Migration will:

- Add `peakTouchScore` column (nullable Int)
- Rename `adjacentComments` → `postComments`
- Remove `postCaptionPreview` column

### Step 3: Update API Router - saveSubmitted

**File:** `packages/api/src/router/comment.ts`

Update input schema:

```typescript
saveSubmitted: accountProcedure.input(
  z.object({
    postUrn: z.string(),
    postFullCaption: z.string(),
    // REMOVE: postCaptionPreview
    postCreatedAt: z.date().optional(), // ADD
    comment: z.string(),
    originalAiComment: z.string().optional(),
    peakTouchScore: z.number().int().min(0).max(100).optional(), // ADD
    postAlternateUrns: z.array(z.string()).optional(),
    // RENAME & EXPAND: adjacentComments → postComments
    postComments: z
      .array(
        z.object({
          authorName: z.string().nullable(),
          authorHeadline: z.string().nullable(),
          authorProfileUrl: z.string().nullable(),
          authorPhotoUrl: z.string().nullable(),
          content: z.string().nullable(),
          urn: z.string().nullable(),
          isReply: z.boolean(),
        }),
      )
      .optional(),
    authorName: z.string().nullable().optional(),
    authorProfileUrl: z.string().nullable().optional(),
    authorAvatarUrl: z.string().nullable().optional(),
    authorHeadline: z.string().nullable().optional(),
  }),
);
```

Update mutation to use new field names.

### Step 4: Update WXT Extension - save-comment-to-db.ts

**File:** `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/save-comment-to-db.ts`

```typescript
import { parseTimeToHours } from "@sassy/linkedin-automation/post/utils-shared/parse-time-to-hours";

export async function saveCommentToDb(card: ComposeCard): Promise<void> {
  try {
    const trpc = getTrpcClient();

    // Convert display time to Date
    let postCreatedAt: Date | undefined;
    if (card.postTime?.displayTime) {
      const hoursAgo = parseTimeToHours(card.postTime.displayTime);
      if (hoursAgo !== null) {
        postCreatedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
      }
    }

    await trpc.comment.saveSubmitted.mutate({
      postUrn: card.urn,
      postFullCaption: card.fullCaption,
      // REMOVE: postCaptionPreview
      postCreatedAt, // ADD
      comment: card.commentText,
      originalAiComment: card.originalCommentText || undefined,
      peakTouchScore: card.peakTouchScore, // ADD
      postAlternateUrns: card.postUrls.map((p) => p.urn),
      // RENAME & EXPAND: full PostCommentInfo[]
      postComments: card.comments.map((c) => ({
        authorName: c.authorName,
        authorHeadline: c.authorHeadline,
        authorProfileUrl: c.authorProfileUrl,
        authorPhotoUrl: c.authorPhotoUrl,
        content: c.content,
        urn: c.urn,
        isReply: c.isReply,
      })),
      authorName: card.authorInfo?.name ?? null,
      authorProfileUrl: card.authorInfo?.profileUrl ?? null,
      authorAvatarUrl: card.authorInfo?.photoUrl ?? null,
      authorHeadline: card.authorInfo?.headline ?? null,
    });

    console.log("EngageKit: Comment saved to DB", card.urn);
  } catch (error) {
    console.error("EngageKit: Failed to save comment to DB", error);
  }
}
```

### Step 5: Update History Page UI

**File:** `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/history/page.tsx`

Replace `postCaptionPreview` with derived value:

```tsx
// Helper to get caption preview
const getCaptionPreview = (fullCaption: string, maxLength = 100): string => {
  if (fullCaption.length <= maxLength) return fullCaption;
  return fullCaption.slice(0, maxLength) + "...";
};

// In JSX:
<p className="mb-2 line-clamp-1 text-xs text-muted-foreground">
  On: {getCaptionPreview(comment.postFullCaption)}
</p>;
```

Update the `listByAccount` query select to include `postFullCaption` instead of `postCaptionPreview`.

### Step 6: Update API Router - listByAccount

**File:** `packages/api/src/router/comment.ts`

```typescript
listByAccount: accountProcedure
  .query(async ({ ctx, input }) => {
    const comments = await ctx.db.comment.findMany({
      // ... existing where/orderBy ...
      select: {
        id: true,
        postUrn: true,
        postFullCaption: true,  // Changed from postCaptionPreview
        comment: true,
        commentedAt: true,
        authorName: true,
        authorAvatarUrl: true,
        peakTouchScore: true,  // ADD for potential display
      },
    });
    // ...
  }),
```

### Step 7: Update Autocomment Router (Puppeteer)

**File:** `packages/api/src/router/autocomment.ts`

Update `saveComments` and `generateCommentAndSave`:

- Rename `adjacentComments` → `postComments` in input schemas
- Remove `postCaptionPreview` from inputs (derive if needed)
- Remove `postContentHtml` from input schema - use `postFullCaption` instead

Lines to update:

- Line 128: Remove `postContentHtml: z.string().nullable()`
- Lines 167-177: Use `postFullCaption` directly, remove `postContentHtml` fallback
- Line 211: Remove `postContentHtml: z.string()`
- Line 265: Change `postContent: input.postContentHtml` → `postContent: input.postFullCaption`
- Lines 276-286: Remove `postContentHtml` references

### Step 8: Update browser-session.ts (Puppeteer internals)

**File:** `packages/api/src/utils/browser-session.ts`

Update `insertCommentOnNonPreviouslyCommentedPosts`:

- Remove `postContentHtml` from function parameter type (line 1647)
- Remove from INSERT columns (line 1676)
- Remove from VALUES select (line 1690)

Update `loadFeedAndSavePosts` (line 959):

- Remove `postContentHtml: post.contentHtml` from mapping

Update `Post` interface (around line 1048):

- Remove `contentHtml: string` field

Update `engagekitInternals.extractPostData` (around line 1445):

- Remove `contentHtml: container.innerHTML` from return

### Step 9: Update Chrome Extension (old extension, Puppeteer mode)

**Files:**

- `apps/chrome-extension/src/pages/content/index.tsx` (line 1349)
- `apps/chrome-extension/src/pages/content/attach-engage-button.ts` (line 371)
- `apps/chrome-extension/src/pages/content/profile-target-list/run-target-list-mode.ts` (lines 308, 402)

Changes:

- Remove `postContentHtml` from API calls
- Use extracted `content` (plain text) as `postFullCaption` instead
- Remove `extractPostContent().html` usage, only use `.content`

### Step 10: Update Tests

**File:** `packages/api/src/utils/browser-session.test.ts`

- Remove `postContentHtml` from test data (lines 160, 175, 200, 215)

---

## Files to Modify

1. `packages/db/prisma/models/comment.prisma` - Schema changes
2. `packages/api/src/router/comment.ts` - saveSubmitted, listByAccount
3. `packages/api/src/router/autocomment.ts` - Remove postContentHtml, rename adjacentComments
4. `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/save-comment-to-db.ts` - Add peakTouchScore, postCreatedAt, postComments
5. `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/history/page.tsx` - Derive captionPreview in UI
6. `packages/api/src/utils/browser-session.ts` - Remove postContentHtml, contentHtml from Post interface
7. `apps/chrome-extension/src/pages/content/index.tsx` - Remove postContentHtml usage
8. `apps/chrome-extension/src/pages/content/attach-engage-button.ts` - Remove postContentHtml usage
9. `apps/chrome-extension/src/pages/content/profile-target-list/run-target-list-mode.ts` - Remove postContentHtml usage
10. `packages/api/src/utils/browser-session.test.ts` - Update test data

---

## Testing Checklist

- [ ] Run prisma migrate successfully
- [ ] WXT extension saves comments with all new fields (peakTouchScore, postCreatedAt, postComments)
- [ ] Touch score persists in database
- [ ] postCreatedAt is correctly calculated from display time ("2h" → now - 2 hours)
- [ ] History page displays correctly without postCaptionPreview (derives from postFullCaption)
- [ ] Puppeteer auto-comment flow still works WITHOUT postContentHtml
- [ ] Chrome extension target-list mode works WITHOUT postContentHtml
- [ ] PostPreviewSheet renders comments from postComments field
- [ ] browser-session.test.ts passes with updated test data

---

## Future Work (Out of Scope)

- Add analytics dashboard using stored touch scores
- Consider removing `postAlternateUrns` redundancy (currently includes `postUrn` again)

---

## Notes

- `postContentHtml` removal saves significant bandwidth in Puppeteer mode (was storing full HTML)
- `postFullCaption` with `\n` line breaks is sufficient for all display needs
- `postCaptionPreview` removal is safe - only used for display, easily derived
- Migration should be additive first (add new columns), then remove old ones in separate migration if needed for safety
