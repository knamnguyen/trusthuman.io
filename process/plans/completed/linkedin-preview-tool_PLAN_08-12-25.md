# LinkedIn Preview Tool - Implementation Plan

## Overview

Build a LinkedIn Preview tool with three access modes:
1. **Embed mode** - Anonymous, ephemeral preview generation (no DB persistence)
2. **Full tool** - Public access with save functionality (requires Clerk authentication)
3. **Shared view** - Public read-only access to saved generations

**Key Technical Decision**: Images uploaded directly to S3 via presigned URLs to avoid Vercel serverless payload limits.

---

## Architecture Summary

### Data Flow (Authenticated Save)
```
1. User clicks "Save Results"
2. Frontend → tRPC: generatePresignedUrl()
3. Backend returns: { presignedUrl, s3Key, generationId }
4. Frontend uploads image directly to S3
5. Frontend → tRPC: saveResult({ generationId, s3Key, contentJson, ... })
6. Backend saves to DB with S3 URL
```

### S3 Bucket Structure
```
Bucket: engagekit-linkedin-preview
└── images/
    └── {userId}/
        └── {timestamp}-{uuid}.jpg
```

---

## Phase 1: S3 Package Setup

### 1.1 Create Package Structure

**New directory**: `packages/s3/`

**Files to create**:
```
packages/s3/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   └── schema-validators.ts
```

### 1.2 Package Configuration

**`packages/s3/package.json`**:
```json
{
  "name": "@sassy/s3",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./schema-validators": "./src/schema-validators.ts"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.700.0",
    "@aws-sdk/s3-request-presigner": "^3.700.0",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@sassy/tsconfig": "workspace:*",
    "typescript": "catalog:"
  }
}
```

**`packages/s3/tsconfig.json`**:
```json
{
  "extends": "@sassy/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```

### 1.3 Implementation

**Reference**: `/Users/knamnguyen/Documents/0-Programming/viralcut/packages/s3/src/index.ts`

**`packages/s3/src/schema-validators.ts`**:
- Copy `S3Config`, `S3UploadResult` types from viralcut
- Add Zod schemas for validation

**`packages/s3/src/index.ts`** - Minimal service with only:

```typescript
export class S3BucketService {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor(config: S3Config) { /* ... */ }

  getBucket(): string { /* ... */ }

  async getPresignedUploadUrl(
    key: string,
    contentType?: string,
    expiresIn = 900, // 15 minutes
  ): Promise<string> {
    // Use PutObjectCommand + getSignedUrl
  }

  async deleteFile(key: string): Promise<boolean> {
    // Use DeleteObjectCommand
  }

  generateUniqueKey(userId: string, fileName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const ext = fileName.split('.').pop() || 'jpg';

    return `images/${userId}/${timestamp}-${randomString}.${ext}`;
  }
}
```

**Install dependencies**:
```bash
cd packages/s3
pnpm install
```

---

## Phase 2: Database Schema

### 2.1 Add Prisma Model

**File**: `packages/db/prisma/schema.prisma`

**Add new model**:
```prisma
model LinkedInPostPreview {
  id          String   @id @default(uuid())
  userId      String
  s3Key       String
  s3Url       String
  contentJson Json
  contentText String   @db.Text
  title       String?
  isPublic    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
}
```

**Update User model** - Add relation:
```prisma
model User {
  // ... existing fields ...
  linkedInPostPreviews LinkedInPostPreview[]
}
```

### 2.2 Run Migration

```bash
cd packages/db
pnpm db:push
# Or for production: pnpm db:migrate
```

---

## Phase 3: tRPC Router Implementation

### 3.1 Create Router File

**File**: `packages/api/src/router/linkedin-preview.ts`

**Pattern reference**: `/Users/knamnguyen/Documents/0-Programming/viralcut/packages/api/src/router/video.ts` (lines 17-22 for S3 service initialization)

**Structure**:
```typescript
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { S3BucketService } from "@sassy/s3";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

// Initialize S3 service (follows viralcut pattern)
const s3Service = new S3BucketService({
  region: process.env.AWS_REGION || "us-west-2",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  bucket: process.env.AWS_S3_LINKEDIN_PREVIEW_BUCKET || "engagekit-linkedin-preview",
});

export const linkedInPreviewRouter = {
  // Generate presigned URL for S3 upload
  generatePresignedUrl: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      contentType: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const s3Key = s3Service.generateUniqueKey(ctx.user.id, input.fileName);
      const presignedUrl = await s3Service.getPresignedUploadUrl(
        s3Key,
        input.contentType || "image/jpeg",
        900, // 15 min expiry
      );

      const s3Url = `https://${s3Service.getBucket()}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

      return {
        presignedUrl,
        s3Key,
        s3Url,
      };
    }),

  // Save generation after S3 upload completes
  saveResult: protectedProcedure
    .input(z.object({
      s3Key: z.string(),
      s3Url: z.string(),
      contentJson: z.any(),
      contentText: z.string(),
      title: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const generation = await ctx.db.linkedInPostPreview.create({
        data: {
          userId: ctx.user.id,
          s3Key: input.s3Key,
          s3Url: input.s3Url,
          contentJson: input.contentJson,
          contentText: input.contentText,
          title: input.title,
          isPublic: true,
        },
      });

      return generation;
    }),

  // Get generation by ID (public for sharing)
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const generation = await ctx.db.linkedInPostPreview.findUnique({
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

      if (!generation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
      }

      if (!generation.isPublic) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This generation is private" });
      }

      return generation;
    }),

  // List user's generations
  list: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db.linkedInPostPreview.findMany({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
    }),

  // Delete generation
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const generation = await ctx.db.linkedInPostPreview.findUnique({
        where: { id: input.id },
      });

      if (!generation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Generation not found" });
      }

      if (generation.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Delete from S3
      await s3Service.deleteFile(generation.s3Key);

      // Delete from DB
      await ctx.db.linkedInPostPreview.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
} satisfies TRPCRouterRecord;
```

### 3.2 Export from Root Router

**File**: `packages/api/src/router/root.ts`

**Add import**:
```typescript
import { linkedInPreviewRouter } from "./linkedin-preview";
```

**Add to router**:
```typescript
export const appRouter = createTRPCRouter({
  // ... existing routers ...
  linkedInPreview: linkedInPreviewRouter,
});
```

---

## Phase 4: Component Migration

### 4.1 Copy Existing Components

**Source**: `apps/ghost-blog/src/tools/linkedinpreview/`
**Destination**: `apps/nextjs/src/app/tools/linkedinpreview/_components/`

**Files to copy** (minimal changes):
- `linkedin-preview-tool.tsx`
- `editor-panel.tsx`
- `preview-panel.tsx`
- `toolbar.tsx`
- `icons.tsx`
- `utils.ts`
- `editor-loading.tsx`
- `preview/` (all 7 files)

**Import adjustments**:
- Change relative imports to use `~/` alias or relative paths
- Update `@sassy/ui` imports if needed

### 4.2 Update Main Tool Component

**File**: `apps/nextjs/src/_components/linkedin-preview/linkedin-preview-tool.tsx`

**Changes**:
1. Add `imageFile` state alongside `image` (base64)
2. Update `handleImageChange` to store both:
   ```typescript
   const handleImageChange = (imageSrc: string | null, file: File | null) => {
     setImage(imageSrc); // base64 for preview
     setImageFile(file);  // File object for S3 upload
   }
   ```
3. Add `saveButtonSlot` prop for injecting save button

### 4.3 New Component: Save Generation Button

**File**: `apps/nextjs/src/app/tools/linkedinpreview/_components/save-generation-button.tsx`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Button } from "@sassy/ui/button";
import { api } from "~/trpc/react";

interface Props {
  contentJson: any;
  contentText: string;
  imageFile: File | null;
  title?: string;
}

export function SaveGenerationButton({ contentJson, contentText, imageFile, title }: Props) {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);

  const generatePresignedUrl = api.linkedInPreview.generatePresignedUrl.useMutation();
  const saveResult = api.linkedInPreview.saveResult.useMutation();

  const handleSave = async () => {
    if (!imageFile) {
      alert("Please upload an image first");
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Get presigned URL
      const { presignedUrl, s3Key, s3Url } = await generatePresignedUrl.mutateAsync({
        fileName: imageFile.name,
        contentType: imageFile.type,
      });

      // Step 2: Upload to S3
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: imageFile,
        headers: {
          "Content-Type": imageFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image to S3");
      }

      // Step 3: Save metadata
      const generation = await saveResult.mutateAsync({
        s3Key,
        s3Url,
        contentJson,
        contentText,
        title,
      });

      // Redirect to saved generation
      router.push(`/tools/linkedinpreview/${generation.id}`);
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <Button>Sign in to Save</Button>
      </SignInButton>
    );
  }

  return (
    <Button onClick={handleSave} disabled={isUploading || !imageFile}>
      {isUploading ? "Saving..." : "Save Results"}
    </Button>
  );
}
```

### 4.4 New Component: Generation List

**File**: `apps/nextjs/src/app/tools/linkedinpreview/_components/generation-list.tsx`

```typescript
"use client";

import { api } from "~/trpc/react";
import { GenerationCard } from "./generation-card";

export function GenerationList() {
  const { data: generations, isLoading } = api.linkedInPreview.list.useQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!generations || generations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No saved previews yet. Create your first one above!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {generations.map((generation) => (
        <GenerationCard key={generation.id} generation={generation} />
      ))}
    </div>
  );
}
```

### 4.5 New Component: Generation Card

**File**: `apps/nextjs/src/app/tools/linkedinpreview/_components/generation-card.tsx`

```typescript
"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@sassy/ui/button";
import { Card } from "@sassy/ui/card";
import { api } from "~/trpc/react";

export function GenerationCard({ generation }) {
  const utils = api.useUtils();
  const [isCopied, setIsCopied] = useState(false);

  const deleteMutation = api.linkedInPreview.delete.useMutation({
    onSuccess: () => {
      utils.linkedInPreview.list.invalidate();
    },
  });

  const handleCopyLink = () => {
    const url = `${window.location.origin}/tools/linkedinpreview/${generation.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDelete = () => {
    if (confirm("Delete this preview?")) {
      deleteMutation.mutate({ id: generation.id });
    }
  };

  return (
    <Card className="overflow-hidden">
      <img src={generation.s3Url} alt="" className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="font-semibold truncate">{generation.title || "Untitled"}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
          {generation.contentText}
        </p>
        <p className="text-xs text-gray-400 mt-2">
          {formatDistanceToNow(new Date(generation.createdAt), { addSuffix: true })}
        </p>
        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" onClick={handleCopyLink}>
            {isCopied ? "Copied!" : "Copy Link"}
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

---

## Phase 5: Route Implementation

### 5.1 Embed Route

**File**: `apps/nextjs/src/app/tools/linkedinpreview/embed/page.tsx`

```typescript
"use client";

import { LinkedInPreviewTool } from "./_components/linkedin-preview-tool";

export default function LinkedInPreviewEmbedPage() {
  return (
    <div className="min-h-screen bg-white">
      <LinkedInPreviewTool />
    </div>
  );
}
```

### 5.2 Full Tool Route

**File**: `apps/nextjs/src/app/tools/linkedinpreview/page.tsx`

```typescript
import { currentUser } from "@clerk/nextjs/server";
import { LinkedInPreviewTool } from "./_components/linkedin-preview-tool";
import { GenerationList } from "./_components/generation-list";
import { SaveGenerationButton } from "./_components/save-generation-button";

export default async function LinkedInPreviewPage() {
  const user = await currentUser();

  return (
    <div className="min-h-screen bg-gray-50">
      <LinkedInPreviewTool
        saveButtonSlot={<SaveGenerationButton />}
      />

      {user && (
        <section className="container max-w-7xl py-16">
          <h2 className="mb-8 text-2xl font-bold">Your Saved Previews</h2>
          <GenerationList />
        </section>
      )}
    </div>
  );
}
```

### 5.3 Shared Route

**File**: `apps/nextjs/src/app/tools/linkedinpreview/[id]/page.tsx`

```typescript
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@sassy/ui/button";
import { api } from "~/trpc/server";
import { PreviewPanel } from "../_components/preview-panel";

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const generation = await api.linkedInPreview.getById({ id: params.id });
    return {
      title: generation.title || "LinkedIn Preview",
      description: generation.contentText.slice(0, 160),
      openGraph: {
        images: [generation.s3Url],
      },
    };
  } catch {
    return {
      title: "LinkedIn Preview",
    };
  }
}

export default async function SharedPreviewPage({
  params
}: {
  params: { id: string }
}) {
  let generation;

  try {
    generation = await api.linkedInPreview.getById({ id: params.id });
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="container max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">LinkedIn Post Preview</h1>
          <p className="text-gray-600 mb-6">
            Created by {generation.user?.firstName} {generation.user?.lastName}
          </p>
          <Link href="/tools/linkedinpreview">
            <Button>Create Your Own</Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <PreviewPanel
            content={generation.contentJson}
            image={generation.s3Url}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 6: Configuration & Environment

### 6.1 Update Middleware

**File**: `apps/nextjs/src/middleware.ts`

**Change**:
```typescript
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/trpc(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/tools/linkedinpreview(.*)", // Add this line
]);
```

### 6.2 Environment Variables

**File**: `.env` (root)

**Add**:
```bash
# AWS S3 for LinkedIn Preview Tool
AWS_REGION="us-west-2"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_LINKEDIN_PREVIEW_BUCKET="engagekit-linkedin-preview"
```

**File**: `.env.example`

**Add same variables with empty values**.

### 6.3 AWS S3 Setup (Step-by-Step Guide)

#### Step 1: Create AWS Account & IAM User

**If you don't have an AWS account:**
1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Follow signup process (requires credit card)
4. Sign in to AWS Console

**Create IAM User for S3 Access:**
1. Sign in to AWS Console: https://console.aws.amazon.com/
2. Search for "IAM" in the top search bar
3. Click **IAM** (Identity and Access Management)
4. In left sidebar, click **Users**
5. Click **Create user** button
6. Enter username: `engagekit-s3-user`
7. Click **Next**
8. Select **Attach policies directly**
9. In search box, type: `AmazonS3FullAccess`
10. Check the box next to **AmazonS3FullAccess**
11. Click **Next**
12. Click **Create user**

**Get Access Keys:**
1. Click on the newly created user: `engagekit-s3-user`
2. Go to **Security credentials** tab
3. Scroll to **Access keys** section
4. Click **Create access key**
5. Select use case: **Application running outside AWS**
6. Click **Next**
7. (Optional) Add description tag
8. Click **Create access key**
9. **IMPORTANT**: Copy both:
   - **Access key ID** (starts with `AKIA...`)
   - **Secret access key** (click "Show" to reveal)
10. Save these credentials securely (you won't be able to see secret key again)

#### Step 2: Create S3 Bucket

**Via AWS Console (Recommended for first-time):**
1. Search for "S3" in AWS Console
2. Click **S3**
3. Click **Create bucket**
4. Enter bucket name: `engagekit-linkedin-preview`
5. Select region: **US West (Oregon) us-west-2**
6. **Block Public Access settings**: Uncheck "Block all public access"
   - Check the box "I acknowledge that the current settings might result in this bucket and the objects within becoming public"
7. Leave other settings as default
8. Click **Create bucket**

**Or via AWS CLI:**
```bash
aws s3 mb s3://engagekit-linkedin-preview --region us-west-2
```

#### Step 3: Configure CORS

**Via AWS Console:**
1. Click on your bucket: `engagekit-linkedin-preview`
2. Go to **Permissions** tab
3. Scroll to **Cross-origin resource sharing (CORS)**
4. Click **Edit**
5. Paste the following JSON:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "https://engagekit.io",
      "https://*.engagekit.io",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

6. Click **Save changes**

**Or via AWS CLI - Save as `cors.json`**:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedOrigins": [
      "https://engagekit.io",
      "https://*.engagekit.io",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**Apply**:
```bash
aws s3api put-bucket-cors --bucket engagekit-linkedin-preview --cors-configuration file://cors.json
```

#### Step 4: Configure Bucket Policy (Public Read for images/)

**Via AWS Console:**
1. Still in **Permissions** tab
2. Scroll to **Bucket policy**
3. Click **Edit**
4. Paste the following JSON (replace bucket name if different):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::engagekit-linkedin-preview/images/*"
    }
  ]
}
```

5. Click **Save changes**

**Or via AWS CLI - Save as `bucket-policy.json`**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::engagekit-linkedin-preview/images/*"
    }
  ]
}
```

**Apply**:
```bash
aws s3api put-bucket-policy --bucket engagekit-linkedin-preview --policy file://bucket-policy.json
```

#### Step 5: Verify Setup

**Test bucket access:**
1. In S3 bucket, click **Upload**
2. Upload a test image
3. Click on uploaded file
4. Copy **Object URL**
5. Try opening in browser - should show the image

#### Step 6: Add Credentials to .env

**Update `.env` in project root:**
```bash
AWS_REGION="us-west-2"
AWS_ACCESS_KEY_ID="AKIA..." # From Step 1
AWS_SECRET_ACCESS_KEY="..." # From Step 1
AWS_S3_LINKEDIN_PREVIEW_BUCKET="engagekit-linkedin-preview"
```

**Security Note**: Never commit `.env` file to git. Ensure `.gitignore` includes `.env`

---

## Testing Strategy

### Phase-by-Phase Validation

**After Phase 1**:
```bash
cd packages/s3
pnpm install
pnpm typecheck
```

**After Phase 2**:
```bash
cd packages/db
pnpm db:push
pnpm db:studio  # Verify schema in Prisma Studio
```

**After Phase 3**:
```bash
cd packages/api
pnpm typecheck
```

**After Phase 4**:
```bash
cd apps/nextjs
pnpm install  # If new deps added
pnpm typecheck
pnpm lint
```

**After Phase 5**:
```bash
cd apps/nextjs
pnpm dev
# Visit http://localhost:3000/tools/linkedinpreview
```

### End-to-End Test Scenarios

1. **Anonymous Embed**:
   - Visit `/tools/linkedinpreview/embed`
   - Create preview with text + image
   - Verify preview displays correctly
   - Confirm no save button visible

2. **Unauthenticated Full Tool**:
   - Visit `/tools/linkedinpreview`
   - Verify "Sign in to Save" button appears
   - Create preview
   - Click save → should show Clerk modal

3. **Authenticated Save Flow**:
   - Sign in via Clerk
   - Create preview with image
   - Click "Save Results"
   - Verify S3 upload (check Network tab)
   - Verify redirect to `/tools/linkedinpreview/[id]`
   - Check S3 bucket for uploaded file
   - Check database for new record

4. **Shared Link**:
   - Copy link from saved generation
   - Open in incognito/private window
   - Verify public access (no auth required)
   - Verify preview displays correctly

5. **Generation List**:
   - Sign in as user with saved generations
   - Visit `/tools/linkedinpreview`
   - Scroll to "Your Saved Previews" section
   - Verify list displays
   - Test "Copy Link" button
   - Test "Delete" button
   - Verify list updates after deletion

6. **Error Handling**:
   - Try saving without image → should show error
   - Try accessing non-existent generation ID → 404
   - Try accessing private generation (if implemented) → 403
   - Test S3 upload failure scenarios

---

## Critical Files Reference

### Files to Read (Reference Only)
- `/Users/knamnguyen/Documents/0-Programming/viralcut/packages/s3/src/index.ts` - S3 service pattern
- `/Users/knamnguyen/Documents/0-Programming/viralcut/packages/api/src/router/video.ts` - Router pattern with S3 init

### Files to Modify
- `packages/db/prisma/schema.prisma` - Add LinkedInPostGeneration model
- `packages/api/src/router/root.ts` - Export linkedInPreviewRouter
- `apps/nextjs/src/middleware.ts` - Add public routes
- `.env` - Add AWS credentials
- `.env.example` - Document required vars

### Files to Create (Priority Order)
1. `packages/s3/src/index.ts` - Core S3 service
2. `packages/s3/src/schema-validators.ts` - Type definitions
3. `packages/api/src/router/linkedin-preview.ts` - Core router
4. `apps/nextjs/src/app/tools/linkedinpreview/_components/save-generation-button.tsx` - Upload flow
5. `apps/nextjs/src/app/tools/linkedinpreview/_components/generation-list.tsx` - List view
6. `apps/nextjs/src/app/tools/linkedinpreview/_components/generation-card.tsx` - Card component
7. `apps/nextjs/src/app/tools/linkedinpreview/page.tsx` - Main route
8. `apps/nextjs/src/app/tools/linkedinpreview/embed/page.tsx` - Embed route
9. `apps/nextjs/src/app/tools/linkedinpreview/[id]/page.tsx` - Shared route

---

## Success Criteria

- ✅ Anonymous users can generate previews in embed mode (ephemeral, no save)
- ✅ Authenticated users can save previews to DB + S3
- ✅ Saved previews are shareable via public links
- ✅ Images upload directly to S3 (bypass Vercel serverless limits)
- ✅ All patterns follow existing codebase conventions
- ✅ No breaking changes to existing features
- ✅ Type-safe end-to-end (tRPC + Prisma)
- ✅ CORS configured correctly for cross-origin uploads
- ✅ User can delete their own generations
- ✅ Proper error handling throughout

---

## Dependencies to Install

```bash
# Root workspace
pnpm add @aws-sdk/client-s3@^3.700.0 @aws-sdk/s3-request-presigner@^3.700.0 -w

# If date-fns not already installed in Next.js app
cd apps/nextjs
pnpm add date-fns
```

---

## Estimated Implementation Time

- Phase 1 (S3 Package): 1-2 hours
- Phase 2 (Database): 30 minutes
- Phase 3 (tRPC Router): 1-2 hours
- Phase 4 (Components): 2-3 hours
- Phase 5 (Routes): 1-2 hours
- Phase 6 (Config): 1 hour
- Testing: 2 hours

**Total**: 8-12 hours for complete implementation

---

## Post-Implementation

### Ghost Blog Integration

Once the Next.js tool is deployed:

1. Create Ghost post at `blog.engagekit.io/linkedin-post-previewer/`
2. Add content/FAQ sections via Ghost editor
3. Inject iframe via code injection:
   ```html
   <iframe
     src="https://engagekit.io/tools/linkedinpreview/embed"
     style="width: 100%; height: 800px; border: none;"
     title="LinkedIn Preview Tool"
   ></iframe>
   ```

### Future Enhancements

- Add title field to save dialog
- Implement "Make Private" toggle
- Add export as image functionality
- Add analytics tracking
- Implement pagination for generation list
- Add search/filter for saved generations
