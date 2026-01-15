# Comment Schema Expansion Plan

**Created:** 2026-01-15
**Status:** DRAFT
**Type:** SIMPLE

## Overview

Expand the Comment database schema to fully capture all scraped data from LinkedIn posts and submitted comments. Currently, some extracted data (touch score, post time, full comment info) is being discarded.

## Goals

1. Add `peakTouchScore` field to track user personalization
2. Rename `adjacentComments` → `postComments` with expanded `PostCommentInfo[]` schema
3. Convert and save `postCreatedAt` from WXT extension (currently only Puppeteer saves this)
4. Remove redundant `postCaptionPreview` field (derive in UI)
5. Keep `postContentHtml` for backward compatibility (Puppeteer fix is separate task)

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

  // KEEP: postContentHtml for backward compatibility
  // TODO: Consolidate with postFullCaption when fixing Puppeteer
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
saveSubmitted: accountProcedure
  .input(
    z.object({
      postUrn: z.string(),
      postFullCaption: z.string(),
      // REMOVE: postCaptionPreview
      postCreatedAt: z.date().optional(),  // ADD
      comment: z.string(),
      originalAiComment: z.string().optional(),
      peakTouchScore: z.number().int().min(0).max(100).optional(),  // ADD
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
  )
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
      postCreatedAt,  // ADD
      comment: card.commentText,
      originalAiComment: card.originalCommentText || undefined,
      peakTouchScore: card.peakTouchScore,  // ADD
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
<p className="text-muted-foreground mb-2 line-clamp-1 text-xs">
  On: {getCaptionPreview(comment.postFullCaption)}
</p>
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

### Step 7: Update Autocomment Router (Puppeteer compatibility)

**File:** `packages/api/src/router/autocomment.ts`

Update `saveComments` and `generateCommentAndSave` to use new field names:
- Rename `adjacentComments` → `postComments` in input schemas
- Keep accepting both formats during transition (optional)
- Remove `postCaptionPreview` from inputs (derive if needed)

---

## Files to Modify

1. `packages/db/prisma/models/comment.prisma` - Schema changes
2. `packages/api/src/router/comment.ts` - saveSubmitted, listByAccount
3. `packages/api/src/router/autocomment.ts` - saveComments, generateCommentAndSave
4. `apps/wxt-extension/entrypoints/linkedin.content/compose-tab/save-comment-to-db.ts` - Add fields
5. `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/[accountSlug]/history/page.tsx` - Derive preview
6. `packages/api/src/utils/browser-session.ts` - Update insertCommentOnNonPreviouslyCommentedPosts (remove postCaptionPreview)

---

## Testing Checklist

- [ ] Run prisma migrate successfully
- [ ] WXT extension saves comments with all new fields
- [ ] Touch score persists in database
- [ ] postCreatedAt is correctly calculated from display time
- [ ] History page displays correctly without postCaptionPreview
- [ ] Puppeteer auto-comment flow still works (backward compatible)
- [ ] PostPreviewSheet renders comments from postComments field

---

## Future Work (Out of Scope)

- Consolidate `postContentHtml` with `postFullCaption` (requires Puppeteer refactor)
- Remove `postContentHtml` after Puppeteer migration
- Add analytics dashboard using stored touch scores

---

## Notes

- `postContentHtml` kept for backward compatibility with Puppeteer flows
- `postCaptionPreview` removal is safe - only used for display, easily derived
- Migration should be additive first (add new columns), then remove old ones in separate migration if needed for safety
