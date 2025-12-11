# Comment AI Detector - Save & Share Features Implementation Plan

**Date**: 10-12-25
**Type**: SIMPLE (one-session feature)
**Status**: Ready for Implementation

---

## Overview

Add save and share functionality to the existing AI Comment Detector tool. This enables authenticated users to save analysis results with LinkedIn comment screenshots to S3, and share results via public URLs.

**Reference Architecture**: `linkedInPreviewRouter` (packages/api/src/router/tools/linkedin-preview.ts)

**Key Features**:
1. Auto-save analysis results after evaluation (authenticated users)
2. Sign-in prompt for unauthenticated users with post-auth auto-save
3. Share dialog with "Copy link" and "View" buttons
4. Avatar upload to S3 (LinkedIn URLs expire after ~1 week)
5. Saved analyses list with delete functionality

---

## Goals

- Persist comment analysis results for authenticated users
- Enable sharing via public URLs (like linkedinpreview tool)
- Upload and store comment author avatars to S3 (avoid expired LinkedIn URLs)
- Provide user history of saved analyses
- Maintain consistency with existing linkedinpreview patterns

---

## Scope

### In Scope

- **Database**: New `CommentAnalysis` model
- **Backend**: New router endpoints for save/share/list/delete
- **S3**: Avatar upload and storage in shared bucket
- **Frontend**: Save dialog, share dialog, analyses list, share page
- **Auth**: Clerk integration with post-auth redirect

### Out of Scope

- Edit/update saved analyses (immutable after creation)
- Privacy controls (all saved analyses are public by default)
- Bulk operations (export, bulk delete)
- Analytics on saved analyses

---

## Database Schema

### New Prisma Model

**FILE**: `packages/db/prisma/schema.prisma`

**ADD AFTER** `LinkedInPostPreview` model (around line 323):

```prisma
model CommentAnalysis {
  id              String   @id @default(uuid())
  userId          String

  // Comment metadata
  commentUrl      String   @db.Text
  commentText     String   @db.Text
  authorName      String
  authorHeadline  String?
  authorProfileUrl String?
  avatarS3Key     String?  // Stored in S3 to avoid LinkedIn URL expiration
  avatarS3Url     String?  // Public S3 URL

  // Analysis results (stored as JSON for flexibility)
  analysisJson    Json     // Full AI detector output
  overallScore    Float    // Original percentage (0-100)
  aiScore         Float    // AI percentage (0-100)

  // Metadata
  isPublic        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
}
```

**MODIFY** `User` model:

**ADD** to relations section (after line 50):

```prisma
  commentAnalyses      CommentAnalysis[]
```

**Migration Steps**:

1. Run: `pnpm db:push` to create migration
2. Verify schema changes in Prisma Studio

---

## Backend Implementation

### 1. Update S3 Service for Avatar Uploads

**FILE**: `packages/s3/src/index.ts`

**ADD** new method after `generateUniqueKey` (around line 102):

```typescript
  /**
   * Generate a unique key for comment avatar uploads
   * Uses a separate folder structure: comment-screenshots/{userId}/avatar-{timestamp}-{random}.{ext}
   * @param userId - The user ID for folder organization
   * @param fileName - The original file name or default to 'avatar.jpg'
   * @returns A unique key for the avatar file
   */
  generateAvatarKey(userId: string, fileName: string = 'avatar.jpg'): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const ext = fileName.split('.').pop() || 'jpg';

    return `comment-screenshots/${userId}/avatar-${timestamp}-${randomString}.${ext}`;
  }
```

**Key Points**:
- Separate folder structure (`comment-screenshots/` instead of `images/`)
- Prefix avatars with `avatar-` for clarity
- Follows existing S3 service patterns

---

### 2. Create Avatar Upload Utility

**NEW FILE**: `packages/api/src/utils/tools/upload-avatar-to-s3.ts`

```typescript
import axios from "axios";

import { S3BucketService } from "@sassy/s3";

/**
 * Upload a LinkedIn avatar URL to S3
 * Fetches the image from LinkedIn and uploads it to S3 to avoid expiration
 *
 * @param avatarUrl - Original LinkedIn avatar URL (may expire)
 * @param userId - User ID for S3 folder organization
 * @param s3Service - Initialized S3BucketService instance
 * @returns Object with s3Key and s3Url, or null if upload fails
 */
export async function uploadAvatarToS3(
  avatarUrl: string | null,
  userId: string,
  s3Service: S3BucketService,
): Promise<{ s3Key: string; s3Url: string } | null> {
  if (!avatarUrl) {
    return null;
  }

  try {
    // Fetch image from LinkedIn URL
    const response = await axios.get(avatarUrl, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    const imageBuffer = Buffer.from(response.data);
    const contentType = response.headers["content-type"] || "image/jpeg";

    // Generate unique S3 key
    const s3Key = s3Service.generateAvatarKey(userId, "avatar.jpg");

    // Get presigned URL
    const presignedUrl = await s3Service.getPresignedUploadUrl(
      s3Key,
      contentType,
      300, // 5 min expiry (short-lived)
    );

    // Upload to S3 via presigned URL
    await axios.put(presignedUrl, imageBuffer, {
      headers: {
        "Content-Type": contentType,
      },
    });

    // Construct public S3 URL
    const region = process.env.AWS_REGION || "us-west-2";
    const bucket =
      process.env.AWS_S3_LINKEDIN_PREVIEW_BUCKET || "engagekit-linkedin-preview";
    const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

    return { s3Key, s3Url };
  } catch (error) {
    console.error("Failed to upload avatar to S3:", error);
    return null;
  }
}
```

**Key Points**:
- Downloads image from LinkedIn (arraybuffer)
- Uses presigned URL for upload (bypass Vercel limits)
- Returns null on failure (graceful degradation)
- 5-minute presigned URL expiry (upload happens immediately)

---

### 3. Create tRPC Router

**NEW FILE**: `packages/api/src/router/tools/comment-ai-detector-save.ts`

```typescript
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { S3BucketService } from "@sassy/s3";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";
import { uploadAvatarToS3 } from "../../utils/tools/upload-avatar-to-s3";

// Initialize S3 service (same bucket as linkedin-preview)
const s3Service = new S3BucketService({
  region: process.env.AWS_REGION || "us-west-2",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  bucket:
    process.env.AWS_S3_LINKEDIN_PREVIEW_BUCKET || "engagekit-linkedin-preview",
});

export const commentAiDetectorSaveRouter = createTRPCRouter({
  /**
   * Save comment analysis result
   * Uploads avatar to S3 and stores analysis in database
   */
  saveAnalysis: protectedProcedure
    .input(
      z.object({
        commentUrl: z.string().url(),
        commentText: z.string(),
        authorName: z.string(),
        authorHeadline: z.string().optional(),
        authorProfileUrl: z.string().optional(),
        avatarUrl: z.string().url().optional(),
        analysisJson: z.any(), // Full AI detector output
        overallScore: z.number().min(0).max(100),
        aiScore: z.number().min(0).max(100),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Upload avatar to S3 (if provided)
      let avatarS3Key: string | null = null;
      let avatarS3Url: string | null = null;

      if (input.avatarUrl) {
        const uploadResult = await uploadAvatarToS3(
          input.avatarUrl,
          ctx.user.id,
          s3Service,
        );
        if (uploadResult) {
          avatarS3Key = uploadResult.s3Key;
          avatarS3Url = uploadResult.s3Url;
        }
      }

      // Save to database
      const analysis = await ctx.db.commentAnalysis.create({
        data: {
          userId: ctx.user.id,
          commentUrl: input.commentUrl,
          commentText: input.commentText,
          authorName: input.authorName,
          authorHeadline: input.authorHeadline || null,
          authorProfileUrl: input.authorProfileUrl || null,
          avatarS3Key,
          avatarS3Url,
          analysisJson: input.analysisJson,
          overallScore: input.overallScore,
          aiScore: input.aiScore,
          isPublic: true,
        },
      });

      return analysis;
    }),

  /**
   * Get analysis by ID (public for sharing)
   */
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const analysis = await ctx.db.commentAnalysis.findUnique({
        where: { id: input.id },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
        },
      });

      if (!analysis) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Analysis not found",
        });
      }

      if (!analysis.isPublic) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This analysis is private",
        });
      }

      return analysis;
    }),

  /**
   * List user's saved analyses
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.commentAnalysis.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }),

  /**
   * Delete saved analysis
   * Deletes avatar from S3 and analysis from database
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const analysis = await ctx.db.commentAnalysis.findUnique({
        where: { id: input.id },
      });

      if (!analysis) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Analysis not found",
        });
      }

      if (analysis.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Delete avatar from S3 (if exists)
      if (analysis.avatarS3Key) {
        try {
          await s3Service.deleteFile(analysis.avatarS3Key);
        } catch (error) {
          console.error("Failed to delete avatar from S3:", error);
          // Continue with DB deletion even if S3 deletion fails
        }
      }

      // Delete from database
      await ctx.db.commentAnalysis.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});
```

**Key Points**:
- 4 endpoints: saveAnalysis, getById, list, delete
- Avatar upload happens during save (automatic)
- getById is public for sharing (checks isPublic flag)
- delete removes both S3 avatar and DB record
- Follows linkedInPreviewRouter patterns exactly

---

### 4. Register Router in Root

**FILE**: `packages/api/src/router/root.ts`

**ADD** import (around line 15):

```typescript
import { commentAiDetectorSaveRouter } from "./tools/comment-ai-detector-save";
```

**ADD** to router object (after commentAiDetector, around line 33):

```typescript
  commentAiDetectorSave: commentAiDetectorSaveRouter,
```

**Expected Result**:

```typescript
export const appRouter = createTRPCRouter({
  stripe: stripeRouter,
  aiComments: aiCommentsRouter,
  user: userRouter,
  profileImport: profileImportRouter,
  linkedinScrapeApify: linkedinScrapeApifyRouter,
  browser: browserRouter,
  autocomment: autoCommentRouter,
  targetList: targetListRouter,
  blacklist: blacklistRouter,
  account: accountRouter,
  linkedInPreview: linkedInPreviewRouter,
  commentAiDetector: commentAiDetectorRouter,
  commentAiDetectorSave: commentAiDetectorSaveRouter,
});
```

---

## Frontend Implementation

### Architecture Overview

**User Flows**:

**Flow A: Authenticated User**
1. User evaluates comment → Analysis completes
2. Automatically call `saveAnalysis` mutation
3. Show success dialog with share link
4. Display "Copy link" and "View" buttons

**Flow B: Unauthenticated User**
1. User evaluates comment → Analysis completes
2. Show sign-in prompt dialog with "Sign in to save" message
3. User clicks "Sign in" → Redirect to Clerk auth
4. After auth, detect sign-in and call `saveAnalysis`
5. Show success dialog with share link

---

### 5. Create Share Dialog Component

**NEW FILE**: `apps/nextjs/src/app/tools/ai-comment-detect/_components/share-dialog.tsx`

```typescript
"use client";

import { useState } from "react";
import { SignInButton } from "@clerk/nextjs";
import { Check, Copy, ExternalLink } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@sassy/ui/dialog";
import { useToast } from "@sassy/ui/hooks/use-toast";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string | null;
  isAuthenticated: boolean;
  onSignInComplete?: () => void;
}

export function ShareDialog({
  open,
  onOpenChange,
  analysisId,
  isAuthenticated,
  onSignInComplete,
}: ShareDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // If not authenticated, show sign-in prompt
  if (!isAuthenticated) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Your Analysis</DialogTitle>
            <DialogDescription>
              Sign in to save your analysis and get a shareable link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your analysis results will be saved automatically after signing in.
            </p>

            <SignInButton mode="modal">
              <Button className="w-full">Sign in to save</Button>
            </SignInButton>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If authenticated but no analysisId, show loading
  if (!analysisId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saving Analysis...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Success state with share link
  const shareUrl = `${window.location.origin}/tools/ai-comment-detect/${analysisId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard",
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleView = () => {
    window.open(shareUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Analysis Saved!</DialogTitle>
          <DialogDescription>
            Your analysis has been saved and is ready to share.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted p-3">
            <code className="text-xs break-all">{shareUrl}</code>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCopy}
              disabled={copied}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>

            <Button variant="default" className="flex-1" onClick={handleView}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Key Points**:
- Three states: unauthenticated, loading, success
- Unauthenticated: Shows Clerk SignInButton
- Loading: Shows spinner while saving
- Success: Shows share URL with copy/view buttons
- Toast notifications for feedback
- Auto-reset "Copied" state after 2 seconds

---

### 6. Create Saved Analyses List Component

**NEW FILE**: `apps/nextjs/src/app/tools/ai-comment-detect/_components/saved-analyses-list.tsx`

```typescript
"use client";

import { useTRPC } from "~/trpc/react";

import { AnalysisCard } from "./analysis-card";

export function SavedAnalysesList() {
  const trpc = useTRPC();
  const { data: analyses, isLoading } = trpc.commentAiDetectorSave.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/50 p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No saved analyses yet. Evaluate a comment to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your Saved Analyses</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {analyses.map((analysis) => (
          <AnalysisCard key={analysis.id} analysis={analysis} />
        ))}
      </div>
    </div>
  );
}
```

**Key Points**:
- Fetches user's saved analyses via tRPC
- Loading state with spinner
- Empty state with helpful message
- Grid layout (responsive: 1 col mobile, 2 cols desktop)

---

### 7. Create Analysis Card Component

**NEW FILE**: `apps/nextjs/src/app/tools/ai-comment-detect/_components/analysis-card.tsx`

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import { useToast } from "@sassy/ui/hooks/use-toast";

import { useTRPC } from "~/trpc/react";

interface AnalysisCardProps {
  analysis: {
    id: string;
    authorName: string;
    commentText: string;
    overallScore: number;
    createdAt: Date;
  };
}

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  const trpc = useTRPC();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteMutation = trpc.commentAiDetectorSave.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Analysis deleted",
        description: "The analysis has been removed from your history",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
      setIsDeleting(false);
    },
  });

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this analysis?")) {
      return;
    }

    setIsDeleting(true);
    await deleteMutation.mutateAsync({ id: analysis.id });
  };

  const scoreColor =
    analysis.overallScore >= 70
      ? "text-green-600"
      : analysis.overallScore >= 40
        ? "text-yellow-600"
        : "text-red-600";

  const scoreLabel =
    analysis.overallScore >= 70
      ? "Likely Human"
      : analysis.overallScore >= 40
        ? "Mixed"
        : "Likely AI";

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">{analysis.authorName}</CardTitle>
        <CardDescription className="line-clamp-2">
          {analysis.commentText}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Overall Score:</span>
          <span className={`font-semibold ${scoreColor}`}>
            {Math.round(analysis.overallScore)}% {scoreLabel}
          </span>
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex gap-2">
        <Button asChild variant="outline" className="flex-1" size="sm">
          <Link href={`/tools/ai-comment-detect/${analysis.id}`}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting || deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**Key Points**:
- Card-based layout with shadcn/ui components
- Shows author, comment excerpt (2 lines max), score
- Color-coded score badge (green/yellow/red)
- View button (opens share page)
- Delete button with confirmation dialog
- Loading state during deletion
- Optimistic UI (card stays visible until deletion confirms)

---

### 8. Update Main Tool Component with Save Logic

**FILE**: `apps/nextjs/src/app/tools/ai-comment-detect/_components/ai-comment-detector-tool.tsx`

**ADD** imports (top of file):

```typescript
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
```

**ADD** state after existing state declarations:

```typescript
  const { isSignedIn, user } = useUser();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [savedAnalysisId, setSavedAnalysisId] = useState<string | null>(null);
  const [pendingAnalysisData, setPendingAnalysisData] = useState<{
    commentData: CommentData;
    analysisResult: AnalysisResult;
  } | null>(null);
```

**ADD** tRPC mutation:

```typescript
  const saveAnalysisMutation = trpc.commentAiDetectorSave.saveAnalysis.useMutation({
    onSuccess: (data) => {
      setSavedAnalysisId(data.id);
      toast({
        title: "Analysis saved!",
        description: "Your analysis has been saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save analysis",
        description: error.message,
        variant: "destructive",
      });
      setShareDialogOpen(false);
    },
  });
```

**ADD** effect for post-auth save (after mutations):

```typescript
  // Auto-save after sign-in
  useEffect(() => {
    if (isSignedIn && pendingAnalysisData && !savedAnalysisId) {
      const { commentData, analysisResult } = pendingAnalysisData;

      saveAnalysisMutation.mutate({
        commentUrl: url,
        commentText: commentData.text,
        authorName: commentData.author.name,
        authorHeadline: commentData.author.headline,
        authorProfileUrl: commentData.author.profileUrl,
        avatarUrl: commentData.author.avatarUrl,
        analysisJson: analysisResult,
        overallScore: analysisResult.overallHumanScore,
        aiScore: 100 - analysisResult.overallHumanScore,
      });

      setPendingAnalysisData(null);
    }
  }, [isSignedIn, pendingAnalysisData, savedAnalysisId]);
```

**MODIFY** `handleEvaluateComment` function:

```typescript
  const handleEvaluateComment = async () => {
    if (!commentData) return;

    try {
      const result = await detectAIMutation.mutateAsync({
        text: commentData.text,
      });

      if (result.success && result.data) {
        const transformedResult = {
          overallHumanScore: result.data.original,
          blocks: result.data.blocks.map((block) => ({
            text: block.text,
            aiProbability: block.ai,
            isLikelyHuman: block.original > block.ai,
          })),
        };

        setAnalysisResult(transformedResult);

        // Auto-save logic
        if (isSignedIn) {
          // User is authenticated - save immediately
          saveAnalysisMutation.mutate({
            commentUrl: url,
            commentText: commentData.text,
            authorName: commentData.author.name,
            authorHeadline: commentData.author.headline,
            authorProfileUrl: commentData.author.profileUrl,
            avatarUrl: commentData.author.avatarUrl,
            analysisJson: result.data,
            overallScore: result.data.original,
            aiScore: result.data.ai,
          });
          setShareDialogOpen(true);
        } else {
          // User is not authenticated - store data and show sign-in prompt
          setPendingAnalysisData({
            commentData,
            analysisResult: transformedResult,
          });
          setShareDialogOpen(true);
        }
      } else {
        toast({
          title: "Analysis failed",
          description: result.error?.message || "Failed to analyze comment",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to analyze comment",
        variant: "destructive",
      });
    }
  };
```

**ADD** ShareDialog component to JSX (before closing container div):

```typescript
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        analysisId={savedAnalysisId}
        isAuthenticated={!!isSignedIn}
      />
```

**Key Points**:
- Detects authentication state with `useUser()`
- Saves immediately after analysis if authenticated
- Stores pending data if unauthenticated
- Shows sign-in prompt via ShareDialog
- Auto-saves after sign-in via useEffect
- Opens share dialog with success state

---

### 9. Create Share Page

**NEW FILE**: `apps/nextjs/src/app/tools/ai-comment-detect/[id]/page.tsx`

```typescript
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { trpcStandalone } from "~/trpc/react";

import { CommentPreview } from "../_components/preview/comment-preview";
import { AnalysisPanel } from "../_components/analysis-panel";

interface SharePageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({
  params,
}: SharePageProps): Promise<Metadata> {
  try {
    const analysis = await trpcStandalone.commentAiDetectorSave.getById.query({
      id: params.id,
    });

    const scoreLabel =
      analysis.overallScore >= 70
        ? "Likely Human"
        : analysis.overallScore >= 40
          ? "Mixed"
          : "Likely AI";

    return {
      title: `AI Comment Analysis - ${analysis.authorName} | EngageKit`,
      description: `AI detection analysis for comment by ${analysis.authorName}: ${Math.round(analysis.overallScore)}% ${scoreLabel}`,
      openGraph: {
        title: `AI Comment Analysis - ${analysis.authorName}`,
        description: `AI detection analysis: ${Math.round(analysis.overallScore)}% ${scoreLabel}`,
        images: analysis.avatarS3Url ? [analysis.avatarS3Url] : [],
      },
      twitter: {
        card: "summary",
        title: `AI Comment Analysis - ${analysis.authorName}`,
        description: `AI detection analysis: ${Math.round(analysis.overallScore)}% ${scoreLabel}`,
        images: analysis.avatarS3Url ? [analysis.avatarS3Url] : [],
      },
    };
  } catch {
    return {
      title: "AI Comment Analysis | EngageKit",
      description: "View AI detection analysis for LinkedIn comment",
    };
  }
}

export default async function SharePage({ params }: SharePageProps) {
  let analysis;

  try {
    analysis = await trpcStandalone.commentAiDetectorSave.getById.query({
      id: params.id,
    });
  } catch {
    notFound();
  }

  // Transform data for CommentPreview
  const commentData = {
    author: {
      name: analysis.authorName,
      headline: analysis.authorHeadline || "",
      avatarUrl: analysis.avatarS3Url, // Use S3 URL (won't expire)
      profileUrl: analysis.authorProfileUrl || "",
    },
    text: analysis.commentText,
    reactions: 0, // Not stored in analysis
    timestamp: analysis.createdAt.toISOString(),
  };

  // Transform data for AnalysisPanel
  const analysisResult = {
    overallHumanScore: analysis.overallScore,
    blocks: (analysis.analysisJson as any).blocks.map((block: any) => ({
      text: block.text,
      aiProbability: block.ai,
      isLikelyHuman: block.original > block.ai,
    })),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">AI Comment Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Shared analysis by {analysis.user.firstName} {analysis.user.lastName}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Comment Preview */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Comment</h2>
          <CommentPreview data={commentData} />
        </div>

        {/* Analysis Results */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">AI Detection Results</h2>
          <AnalysisPanel result={analysisResult} isLoading={false} />
        </div>
      </div>
    </div>
  );
}
```

**Key Points**:
- Server component (uses `trpcStandalone`)
- Dynamic metadata for SEO and social sharing
- Uses S3 avatar URL (won't expire like LinkedIn URLs)
- Reuses existing CommentPreview and AnalysisPanel components
- Shows analysis creator's name
- Two-column responsive layout
- Returns 404 if analysis not found

---

### 10. Update Embed Page with Saved Analyses

**FILE**: `apps/nextjs/src/app/tools/ai-comment-detect/embed/page.tsx`

**REPLACE** placeholder section with:

```typescript
        {userId && (
          <div className="rounded-lg border bg-card p-6">
            <SavedAnalysesList />
          </div>
        )}
```

**ADD** import:

```typescript
import { SavedAnalysesList } from "../_components/saved-analyses-list";
```

**Key Points**:
- Shows saved analyses for authenticated users only
- Integrated into embed page (authenticated context)
- Uses existing layout structure

---

## Implementation Checklist

Execute in this order:

### Database (Steps 1-3)

1. ✅ Modify `packages/db/prisma/schema.prisma`:
   - Add `CommentAnalysis` model after `LinkedInPostPreview`
   - Add `commentAnalyses` relation to `User` model
2. ✅ Run `pnpm db:push` to create migration
3. ✅ Verify schema in Prisma Studio (`pnpm db:studio`)

### Backend (Steps 4-10)

4. ✅ Update `packages/s3/src/index.ts`:
   - Add `generateAvatarKey()` method
5. ✅ Create `packages/api/src/utils/tools/upload-avatar-to-s3.ts`
6. ✅ Create `packages/api/src/router/tools/comment-ai-detector-save.ts`
7. ✅ Modify `packages/api/src/router/root.ts`:
   - Import `commentAiDetectorSaveRouter`
   - Register in router object
8. ✅ Run `pnpm typecheck` to verify backend changes
9. ✅ Run `pnpm dev` and test tRPC endpoints via Prisma Studio
10. ✅ Test avatar upload manually (use test script if needed)

### Frontend (Steps 11-18)

11. ✅ Create `apps/nextjs/src/app/tools/ai-comment-detect/_components/share-dialog.tsx`
12. ✅ Create `apps/nextjs/src/app/tools/ai-comment-detect/_components/saved-analyses-list.tsx`
13. ✅ Create `apps/nextjs/src/app/tools/ai-comment-detect/_components/analysis-card.tsx`
14. ✅ Modify `apps/nextjs/src/app/tools/ai-comment-detect/_components/ai-comment-detector-tool.tsx`:
    - Add imports, state, mutations
    - Add auto-save effect
    - Modify `handleEvaluateComment`
    - Add ShareDialog component to JSX
15. ✅ Create `apps/nextjs/src/app/tools/ai-comment-detect/[id]/page.tsx`
16. ✅ Modify `apps/nextjs/src/app/tools/ai-comment-detect/embed/page.tsx`:
    - Import `SavedAnalysesList`
    - Replace placeholder section
17. ✅ Run `pnpm typecheck` to verify frontend changes
18. ✅ Test end-to-end flow in browser

### Testing (Steps 19-22)

19. ✅ Test authenticated user flow:
    - Evaluate comment
    - Verify auto-save
    - Verify share dialog with link
    - Copy link and open in new tab
    - Verify share page renders correctly
20. ✅ Test unauthenticated user flow:
    - Evaluate comment
    - Verify sign-in prompt dialog
    - Sign in via Clerk modal
    - Verify auto-save after sign-in
    - Verify share dialog appears
21. ✅ Test saved analyses list:
    - Navigate to embed page
    - Verify analyses appear in grid
    - Test delete functionality
    - Verify empty state
22. ✅ Test share page:
    - Verify SEO metadata
    - Test with expired LinkedIn avatar (should use S3 URL)
    - Test social sharing preview

---

## Acceptance Criteria

### Database

- ✅ `CommentAnalysis` model exists with correct fields
- ✅ User relation configured with cascade delete
- ✅ Indexes created on userId and createdAt
- ✅ Migration runs without errors

### Backend

- ✅ `generateAvatarKey()` method follows S3 service patterns
- ✅ `uploadAvatarToS3()` utility downloads and uploads avatars successfully
- ✅ `saveAnalysis` endpoint creates DB record and uploads avatar
- ✅ `getById` endpoint returns public analyses (throws for private)
- ✅ `list` endpoint returns user's analyses (sorted by createdAt desc)
- ✅ `delete` endpoint removes both S3 avatar and DB record
- ✅ Router registered in root.ts
- ✅ No TypeScript errors in backend

### Frontend

- ✅ ShareDialog shows three states correctly (unauthenticated, loading, success)
- ✅ Sign-in prompt works with Clerk modal
- ✅ Copy link functionality works with toast notification
- ✅ View button opens share page in new tab
- ✅ SavedAnalysesList fetches and displays user's analyses
- ✅ AnalysisCard shows correct color-coded score
- ✅ Delete functionality works with confirmation
- ✅ Share page renders with correct metadata
- ✅ Share page uses S3 avatar URL (not LinkedIn URL)
- ✅ Auto-save triggers after analysis completion
- ✅ Post-auth auto-save works correctly
- ✅ No TypeScript errors in frontend

### User Experience

- ✅ Authenticated users see share dialog immediately after analysis
- ✅ Unauthenticated users see sign-in prompt
- ✅ Post-auth users see share dialog with saved analysis link
- ✅ Share links work correctly and show analysis
- ✅ Saved analyses list shows in embed page
- ✅ Delete confirmations prevent accidental deletion
- ✅ Toast notifications provide clear feedback
- ✅ Loading states show during async operations

---

## Testing Steps

### 1. Database Setup

```bash
# Run migration
pnpm db:push

# Open Prisma Studio
pnpm db:studio

# Verify CommentAnalysis table exists
```

### 2. Backend Testing

```bash
# Typecheck
pnpm typecheck

# Start dev server
pnpm dev
```

**Test via Prisma Studio**:
- Create test CommentAnalysis record manually
- Verify userId relation works
- Test cascade delete (delete user, verify analyses deleted)

### 3. Frontend Testing (Authenticated)

1. Sign in to app
2. Navigate to `/tools/ai-comment-detect`
3. Enter LinkedIn comment URL
4. Click "Fetch" and verify comment preview
5. Click "Evaluate Comment"
6. Verify share dialog appears with link
7. Click "Copy Link" and verify toast
8. Click "View" and verify share page opens
9. Navigate to `/tools/ai-comment-detect/embed`
10. Verify saved analysis appears in list
11. Click delete icon and confirm
12. Verify analysis removed from list

### 4. Frontend Testing (Unauthenticated)

1. Sign out of app
2. Navigate to `/tools/ai-comment-detect`
3. Enter LinkedIn comment URL and fetch
4. Click "Evaluate Comment"
5. Verify sign-in prompt dialog appears
6. Click "Sign in to save"
7. Complete Clerk sign-in flow
8. Verify share dialog appears with link
9. Verify analysis was saved (check embed page)

### 5. Share Page Testing

1. Get share link from saved analysis
2. Open in incognito/private window
3. Verify page renders without authentication
4. Verify SEO metadata (view source)
5. Test social share preview (use Twitter Card Validator)
6. Verify S3 avatar displays (even if LinkedIn URL expired)

---

## Environment Variables

**Required** (already configured for linkedinpreview):

```bash
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_LINKEDIN_PREVIEW_BUCKET=engagekit-linkedin-preview
```

**No new environment variables required** - uses same S3 bucket as linkedinpreview.

---

## Dependencies

**Existing Dependencies** (no new packages required):

- `@aws-sdk/client-s3` (in @sassy/s3)
- `@aws-sdk/s3-request-presigner` (in @sassy/s3)
- `@clerk/nextjs` (in @sassy/nextjs)
- `axios` (in @sassy/api)
- `lucide-react` (in @sassy/nextjs)

**Workspace References**:

- `@sassy/s3` (already in @sassy/api)

---

## Risks & Mitigations

**Risk**: LinkedIn avatar URLs expire after ~1 week
- **Mitigation**: Upload avatars to S3 during save; use S3 URLs in share pages

**Risk**: Avatar upload fails (network error, invalid URL)
- **Mitigation**: `uploadAvatarToS3` returns null gracefully; analysis saves without avatar

**Risk**: User signs in but auto-save fails
- **Mitigation**: Error toast shown; user can re-evaluate to retry save

**Risk**: S3 deletion fails during analysis delete
- **Mitigation**: Log error and continue with DB deletion; orphaned S3 files cleaned up later

**Risk**: Share page accessed by unauthenticated user
- **Mitigation**: `getById` is public procedure; no authentication required for viewing

---

## Integration Notes

### Import Patterns

```typescript
// Backend
import { S3BucketService } from "@sassy/s3";
import { uploadAvatarToS3 } from "@sassy/api/utils/tools/upload-avatar-to-s3";

// Frontend
import { useTRPC } from "~/trpc/react";
import { trpcStandalone } from "~/trpc/react";
import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
```

### tRPC Usage

```typescript
// Save analysis
const saveAnalysisMutation = trpc.commentAiDetectorSave.saveAnalysis.useMutation();

// Get by ID (server)
const analysis = await trpcStandalone.commentAiDetectorSave.getById.query({ id });

// List user's analyses
const { data: analyses } = trpc.commentAiDetectorSave.list.useQuery();

// Delete analysis
const deleteMutation = trpc.commentAiDetectorSave.delete.useMutation();
```

---

## Notes

- **S3 Bucket**: Shared with linkedinpreview (`engagekit-linkedin-preview`)
- **Folder Structure**: `comment-screenshots/{userId}/avatar-{timestamp}-{random}.{ext}`
- **Avatar Upload**: Happens automatically during `saveAnalysis` mutation
- **Public Sharing**: All saved analyses are public by default (`isPublic: true`)
- **Cascade Delete**: Deleting user automatically deletes all their analyses
- **Avatar Fallback**: If avatar upload fails, analysis saves without avatar (null values)
- **Post-Auth Flow**: Uses `useEffect` to detect sign-in and trigger auto-save
- **Share URLs**: Format: `/tools/ai-comment-detect/{uuid}`
- **SEO**: Share pages have dynamic metadata with OpenGraph and Twitter Card support

---

## Plan Complete

This plan provides complete specification for adding save and share features to the AI Comment Detector tool. All implementation details follow existing linkedinpreview patterns for consistency.

**Status**: Ready for Implementation

Review carefully.

Say **'ENTER EXECUTE MODE'** when ready to implement.

Note: This is a critical safety checkpoint. EXECUTE mode will follow this plan with 100% fidelity.
