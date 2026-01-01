# Save Comment Draft - Implementation Plan

**Created**: 2024-12-31
**Status**: BLOCKED (dependency on account management)
**Feature**: Save comment drafts from extension explore tab to database with S3 image uploads

---

## Overview

When the AI generates a comment in the extension's explore tab, save the draft to the database immediately. Upload LinkedIn avatar images to S3 via a DBOS background workflow to prevent URL expiration.

---

## Dependencies (BLOCKING)

### Account ID Management
The extension needs to know which LinkedIn account the user is operating as. Currently:
- `ctx.account` in API just takes `linkedInAccounts[0]` (first account)
- Extension has no concept of "selected account"
- Users may have multiple LinkedIn accounts linked

**Required before implementation:**
1. Extension needs to track/detect current LinkedIn account
2. Pass `accountId` explicitly in tRPC calls
3. OR: Match logged-in LinkedIn profile URN to linked accounts

---

## Architecture

```
Extension                           API Server                      Background
─────────────────────────────────────────────────────────────────────────────────

updateCardComment()                 manageComment.saveCommentDraft
       │                                    │
       │  tRPC (JWT + accountId)            │
       ├───────────────────────────────────►│
       │                                    │
       │                              1. Validate accountId belongs to user
       │                              2. Save to DB (DRAFT status)
       │                                 - LinkedIn URLs for images
       │                                 - originalAiComment = comment
       │                                    │
       │                              3. Start DBOS workflow (async)
       │                                    │───────────────────────►┐
       │                                    │                        │
       │◄───────────────────────────────────┤                        │
       │  { commentId, status: "success" }  │                        │
       │  (~200ms)                          │                        │
       │                                    │                  uploadCommentImages
       │                                    │                  workflow
       │                                    │                        │
       │                                    │                  - Upload author avatar
       │                                    │                  - Upload N comment avatars
       │                                    │                  - Update DB with S3 URLs
       │                                    │                        │
       │                                    │                  (~2-5s, parallel)
```

---

## Data Flow

### From Extension (ComposeCard)

```typescript
interface ComposeCard {
  id: string;                    // Client-side UUID
  urn: string;                   // Post URN
  captionPreview: string;
  fullCaption: string;
  commentText: string;           // AI-generated or edited
  originalCommentText: string;   // Original AI comment
  status: "draft" | "sent";
  isGenerating: boolean;
  authorInfo: {
    name: string | null;
    photoUrl: string | null;     // LinkedIn CDN URL (expires)
    headline: string | null;
    profileUrl: string | null;
  } | null;
  postTime: {
    displayTime: string | null;
    fullTime: string | null;
  } | null;
  postUrls: {
    urn: string;
    url: string;
  }[];
  comments: {
    authorName: string | null;
    authorHeadline: string | null;
    authorProfileUrl: string | null;
    authorPhotoUrl: string | null;  // LinkedIn CDN URL (expires)
    content: string | null;
    urn: string | null;
    isReply: boolean;
  }[];
  postContainer: HTMLElement;    // Not serializable
}
```

### To Database (Comment table)

```typescript
{
  id: string;                    // Generated on server (ulid)
  postUrn: string;               // postUrls[0].urn
  postAlternateUrns: string[];   // postUrls.slice(1).map(p => p.urn)
  postContentHtml: string;       // fullCaption

  authorUrn: string | null;      // Extract from authorInfo.profileUrl
  authorName: string | null;
  authorProfileUrl: string | null;
  authorAvatarUrl: string | null; // Initially LinkedIn URL, then S3 URL
  authorHeadline: string | null;

  comment: string;               // commentText
  originalAiComment: string;     // originalCommentText
  adjacentComments: JSON;        // comments array (avatars updated by workflow)

  status: "DRAFT";               // Initial status
  isAutoCommented: false;        // Manual from explore tab
  accountId: string;             // REQUIRED - passed from extension
}
```

---

## Files to Create

### 1. DBOS Workflow: `packages/api/src/workflows/upload-comment-images.workflow.ts`

```typescript
import { DBOS } from "@dbos-inc/dbos-sdk";
import { db } from "@sassy/db";
import { S3BucketService } from "@sassy/s3";
import { uploadImageToS3, generateImageKey } from "../utils/upload-image-to-s3";

interface UploadCommentImagesInput {
  commentId: string;
  authorAvatarUrl: string | null;
  adjacentComments: {
    authorPhotoUrl: string | null;
    // ... other fields
  }[];
}

export const uploadCommentImagesWorkflow = DBOS.registerWorkflow(
  async (input: UploadCommentImagesInput) => {
    const s3Service = new S3BucketService(/* config */);

    // Step 1: Upload author avatar
    const authorS3Url = await DBOS.runStep(async () => {
      if (!input.authorAvatarUrl) return null;
      const key = generateImageKey("comment-avatars", input.commentId);
      const result = await uploadImageToS3(input.authorAvatarUrl, key, s3Service);
      return result?.s3Url ?? null;
    }, { name: "upload-author-avatar" });

    // Step 2: Upload adjacent comment avatars (parallel)
    const updatedComments = await DBOS.runStep(async () => {
      const uploads = input.adjacentComments.map(async (comment, i) => {
        if (!comment.authorPhotoUrl) return comment;
        const key = generateImageKey("comment-avatars", `${input.commentId}-adj-${i}`);
        const result = await uploadImageToS3(comment.authorPhotoUrl, key, s3Service);
        return {
          ...comment,
          authorPhotoUrl: result?.s3Url ?? comment.authorPhotoUrl,
        };
      });
      return Promise.all(uploads);
    }, { name: "upload-adjacent-avatars" });

    // Step 3: Update database
    await DBOS.runStep(async () => {
      await db.comment.update({
        where: { id: input.commentId },
        data: {
          authorAvatarUrl: authorS3Url,
          adjacentComments: updatedComments,
        },
      });
    }, { name: "update-db-with-s3-urls" });

    return { status: "success" };
  },
  { name: "uploadCommentImagesWorkflow" }
);
```

### 2. Router: `packages/api/src/router/manage-comment.ts`

```typescript
import { ulid } from "ulidx";
import z from "zod";
import { protectedProcedure } from "../trpc";
import { uploadCommentImagesWorkflow } from "../workflows/upload-comment-images.workflow";
import { DBOS } from "@dbos-inc/dbos-sdk";

const adjacentCommentSchema = z.object({
  authorName: z.string().nullable(),
  authorHeadline: z.string().nullable(),
  authorProfileUrl: z.string().nullable(),
  authorPhotoUrl: z.string().nullable(),
  content: z.string().nullable(),
  urn: z.string().nullable(),
  isReply: z.boolean(),
});

export const manageCommentRouter = {
  // Save draft when AI generates comment
  saveCommentDraft: protectedProcedure
    .input(z.object({
      accountId: z.string(),  // REQUIRED - explicit account selection
      postUrn: z.string(),
      postAlternateUrns: z.array(z.string()).default([]),
      postContentHtml: z.string(),
      comment: z.string(),
      originalAiComment: z.string(),
      authorName: z.string().nullable().optional(),
      authorProfileUrl: z.string().nullable().optional(),
      authorAvatarUrl: z.string().nullable().optional(),
      authorHeadline: z.string().nullable().optional(),
      adjacentComments: z.array(adjacentCommentSchema).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. Validate accountId belongs to this user
      const account = await ctx.db.linkedInAccount.findFirst({
        where: {
          id: input.accountId,
          ownerId: ctx.user.id,
        },
      });

      if (!account) {
        return {
          status: "error",
          code: 403,
          message: "Account not found or not owned by user",
        } as const;
      }

      // 2. Check for duplicate (same postUrn + accountId)
      const existing = await ctx.db.comment.findFirst({
        where: {
          postUrn: input.postUrn,
          accountId: input.accountId,
        },
      });

      if (existing) {
        return {
          status: "error",
          code: 409,
          message: "Draft already exists for this post",
          commentId: existing.id,
        } as const;
      }

      // 3. Save to DB with DRAFT status
      const commentId = ulid();
      await ctx.db.comment.create({
        data: {
          id: commentId,
          postUrn: input.postUrn,
          postAlternateUrns: input.postAlternateUrns,
          postContentHtml: input.postContentHtml,
          comment: input.comment,
          originalAiComment: input.originalAiComment,
          authorName: input.authorName,
          authorProfileUrl: input.authorProfileUrl,
          authorAvatarUrl: input.authorAvatarUrl,  // LinkedIn URL initially
          authorHeadline: input.authorHeadline,
          adjacentComments: input.adjacentComments,
          status: "DRAFT",
          isAutoCommented: false,
          accountId: input.accountId,
        },
      });

      // 4. Start DBOS workflow for image uploads (non-blocking)
      void DBOS.startWorkflow(uploadCommentImagesWorkflow, {
        commentId,
        authorAvatarUrl: input.authorAvatarUrl ?? null,
        adjacentComments: input.adjacentComments,
      });

      return {
        status: "success",
        commentId,
      } as const;
    }),

  // Update draft when user edits comment text
  updateCommentDraft: protectedProcedure
    .input(z.object({
      commentId: z.string(),
      comment: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.db.comment.findFirst({
        where: { id: input.commentId },
        select: { accountId: true, status: true },
      });

      if (!comment) {
        return { status: "error", code: 404, message: "Comment not found" } as const;
      }

      // Verify ownership via account
      const account = await ctx.db.linkedInAccount.findFirst({
        where: { id: comment.accountId, ownerId: ctx.user.id },
      });

      if (!account) {
        return { status: "error", code: 403, message: "Not authorized" } as const;
      }

      if (comment.status !== "DRAFT") {
        return { status: "error", code: 400, message: "Can only edit drafts" } as const;
      }

      await ctx.db.comment.update({
        where: { id: input.commentId },
        data: { comment: input.comment },
      });

      return { status: "success" } as const;
    }),

  // Mark as POSTED after successful LinkedIn submission
  markCommentPosted: protectedProcedure
    .input(z.object({
      commentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Similar ownership check...
      await ctx.db.comment.update({
        where: { id: input.commentId },
        data: {
          status: "POSTED",
          commentedAt: new Date(),
        },
      });

      return { status: "success" } as const;
    }),

  // Get pending drafts for account
  getPendingDrafts: protectedProcedure
    .input(z.object({
      accountId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify ownership...
      const drafts = await ctx.db.comment.findMany({
        where: {
          accountId: input.accountId,
          status: "DRAFT",
        },
        orderBy: { id: "desc" },
        take: 50,
      });

      return drafts;
    }),
};
```

---

## Files to Modify

### 1. `packages/api/src/workflows/index.ts`

```typescript
import { uploadCommentImagesWorkflow } from "./upload-comment-images.workflow";
export { uploadCommentImagesWorkflow };
// ... existing exports
```

### 2. `packages/api/src/router/index.ts`

```typescript
import { manageCommentRouter } from "./manage-comment";
// Add to appRouter:
manageComment: manageCommentRouter,
```

### 3. Extension: Call tRPC on `updateCardComment`

Location: `apps/wxt-extension/entrypoints/linkedin.content/explore-tab/ExploreTab.tsx`

```typescript
// In the generateComment().then() callback:
.then((result) => {
  updateCardComment(cardId, result.comment);

  // Save draft to DB (fire-and-forget, don't block UI)
  void trpc.manageComment.saveCommentDraft.mutate({
    accountId: selectedAccountId,  // NEEDS ACCOUNT MANAGEMENT
    postUrn: post.urn,
    postAlternateUrns: post.postUrls.slice(1).map(p => p.urn),
    postContentHtml: post.fullCaption,
    comment: result.comment,
    originalAiComment: result.comment,
    authorName: post.authorInfo?.name ?? null,
    authorProfileUrl: post.authorInfo?.profileUrl ?? null,
    authorAvatarUrl: post.authorInfo?.photoUrl ?? null,
    authorHeadline: post.authorInfo?.headline ?? null,
    adjacentComments: post.comments,
  });
})
```

---

## Latency Analysis

| Phase | Time | Blocking UI? |
|-------|------|--------------|
| tRPC call + DB write | ~200ms | No (fire-and-forget) |
| DBOS workflow start | ~50ms | No (async) |
| Upload author avatar | ~800ms | No (background) |
| Upload 5-10 comment avatars (parallel) | ~1-2s | No (background) |

**User perceives**: 0ms additional latency (fire-and-forget)
**Background completes**: ~2-5s total

---

## Environment Variables

Ensure these are set for DBOS:
```
DBOS_SYSTEM_DATABASE_URL="postgresql://user:pass@localhost:5432/engagekit_dbos"
```

---

## Next Steps (After Account Management)

1. [ ] Create `upload-comment-images.workflow.ts`
2. [ ] Create `manage-comment.ts` router
3. [ ] Register workflow in `workflows/index.ts`
4. [ ] Register router in `router/index.ts`
5. [ ] Run `pnpm prisma generate` (schema already updated)
6. [ ] Add extension integration (requires accountId)
7. [ ] Test end-to-end flow

---

## Related Files

- Schema: `packages/db/prisma/models/comment.prisma`
- S3 Upload: `packages/api/src/utils/upload-image-to-s3.ts`
- Existing DBOS pattern: `packages/api/src/workflows/build-target-list.workflow.ts`
- Existing router pattern: `packages/api/src/router/autocomment.ts`
