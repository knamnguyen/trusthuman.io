# TrustHuman Turborepo Cleanup & Setup Plan

**Date:** 18-02-26
**Type:** SIMPLE (one-session cleanup)
**Goal:** Transform engagekit turborepo into trusthuman.io codebase with simple user-based architecture

---

## Overview

Clean engagekit turborepo copied to trusthuman project. Remove organization layer, simplify API to tRPC on Vercel (like gifavatar), remove Stripe/payment for now. Establish simple user-based SaaS model for human verification platform.

### Key Changes

- **Remove:** Organization/multi-tenant layer, Stripe integration, Hono server setup
- **Keep:** ALL packages (for reference), WXT extension pattern, tRPC API, Next.js app
- **Simplify:** API to simple tRPC on Vercel (like gifavatar), database schema to user-only ownership
- **Add:** New git origin, Cloudflare tunnel for dev environment with Clerk webhooks

### Goals

1. Clean git history and establish new repository on GitHub
2. Simplify database schema to user-only model
3. Remove organization layer from API and middleware
4. Simplify API to tRPC on Vercel (like gifavatar reference)
5. Flatten Next.js route structure
6. Configure Cloudflare tunnel for local dev with Clerk webhooks
7. Deploy to Vercel and verify local dev works

---

## Reference Projects

### GifAvatar (for simple tRPC context pattern)
`/Users/knamnguyen/Documents/0-Programming/gifavatar/`

- Simple `createTRPCContext` - just `{ db, headers }`
- Simple `isAuthed` middleware - Chrome extension Bearer token + Next.js currentUser()
- Only `publicProcedure` and `protectedProcedure` - no org/account procedures

### EngageKit WXT Extension (for extension auth pattern) - KEEP THIS PATTERN
`/Users/knamnguyen/Documents/0-Programming/trusthuman/apps/wxt-extension/`

The extension auth flow works and should be preserved:
1. **Background worker** has ClerkProvider, manages auth state
2. **Content script** calls `authService.getToken()` via chrome.runtime.sendMessage
3. **tRPC client** adds `Authorization: Bearer {token}` header
4. **tRPC client** adds `x-trpc-source: "chrome-extension"` header
5. **Server** checks source header and validates Bearer token via Clerk Backend SDK

**Key files to reference:**
- `apps/wxt-extension/lib/auth-service.ts` - Message-based auth for content scripts
- `apps/wxt-extension/lib/trpc/client.tsx` - tRPC client with Bearer token headers
- `apps/wxt-extension/entrypoints/background/index.ts` - Background worker with Clerk

**Note:** EngageKit tRPC is already deployed on Vercel via Next.js API routes. The Hono server on Hetzner is separate (for DBOS actors). We're keeping the Vercel tRPC setup, just simplifying context.

---

## TrustHuman Database Schema (Clean Foundation)

Based on the viral growth plan, here's the MVP schema. This is a **fresh database** - no EngageKit tables.

### User Model (Synced from Clerk Webhook)

```prisma
// packages/db/prisma/models/user.prisma
model User {
  id            String    @id           // Clerk user ID
  email         String    @unique
  firstName     String?
  lastName      String?
  username      String?   @unique
  imageUrl      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  trustProfile  TrustProfile?
  verifications HumanVerification[]
}
```

### TrustProfile Model (Core Identity)

```prisma
// packages/db/prisma/models/trust-profile.prisma
model TrustProfile {
  id                  String    @id @default(uuid())
  humanNumber         Int       @unique @default(autoincrement())  // Human #1, #2, etc.
  userId              String    @unique
  username            String    @unique   // URL-safe: trusthuman.io/withkynam
  displayName         String?
  bio                 String?   @db.VarChar(280)
  avatarUrl           String?

  // Verification stats
  totalVerifications  Int       @default(0)
  lastVerifiedAt      DateTime?

  // Streak state (for viral growth features later)
  currentStreak       Int       @default(0)
  longestStreak       Int       @default(0)
  streakFreezeTokens  Int       @default(0)  // max 7
  lastStreakDate      DateTime?

  // Referral (for viral growth features later)
  referralCode        String    @unique      // auto: "human-{humanNumber}"
  referredById        String?
  referralCount       Int       @default(0)

  // Settings
  isPublic            Boolean   @default(true)
  cameraMode          String    @default("capture_on_submit")

  // Timestamps
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  // Relations
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  referredBy          TrustProfile?  @relation("Referrals", fields: [referredById], references: [id])
  referrals           TrustProfile[] @relation("Referrals")
  verifications       HumanVerification[]
  linkedinComments    VerifiedLinkedInComment[]
  xComments           VerifiedXComment[]
  platformLinks       PlatformLink[]

  @@index([userId])
  @@index([username])
  @@index([humanNumber])
}
```

### HumanVerification Model (Core Verification Record)

```prisma
// packages/db/prisma/models/human-verification.prisma
model HumanVerification {
  id              String    @id @default(uuid())
  userId          String?   // Optional for MVP (no auth initially)
  trustProfileId  String?

  // Verification result
  verified        Boolean
  confidence      Float
  faceCount       Int
  rawResponse     Json?     // AWS Rekognition response
  photoS3Key      String?   // S3 key if photo stored

  // Activity type (for routing to correct table)
  activityType    String    // "linkedin_comment" | "x_comment" | future types

  // Links to platform-specific activity (one of these will be set)
  linkedinCommentId String?  @unique
  xCommentId        String?  @unique

  createdAt       DateTime  @default(now())

  // Relations
  user            User?             @relation(fields: [userId], references: [id], onDelete: Cascade)
  trustProfile    TrustProfile?     @relation(fields: [trustProfileId], references: [id], onDelete: Cascade)
  linkedinComment VerifiedLinkedInComment? @relation(fields: [linkedinCommentId], references: [id])
  xComment        VerifiedXComment?        @relation(fields: [xCommentId], references: [id])

  @@index([userId])
  @@index([trustProfileId])
  @@index([activityType])
  @@index([createdAt])
}
```

### VerifiedLinkedInComment Model (LinkedIn-Specific)

```prisma
// packages/db/prisma/models/verified-linkedin-comment.prisma
model VerifiedLinkedInComment {
  id                   String    @id @default(uuid())
  trustProfileId       String

  // User's comment
  commentText          String    @db.Text
  commentUrn           String?   // LinkedIn URN: urn:li:comment:xxx

  // Post being replied to (scraped from LinkedIn DOM)
  postUrl              String
  postUrn              String?   // urn:li:activity:xxx or urn:li:share:xxx
  postAuthorName       String?
  postAuthorProfileUrl String?
  postAuthorUrn        String?   // urn:li:member:xxx
  postAuthorAvatarUrl  String?
  postAuthorHeadline   String?   // LinkedIn headline
  postTextSnippet      String?   @db.VarChar(500)
  postImageUrl         String?

  // Metadata
  scrapedAt            DateTime  @default(now())
  createdAt            DateTime  @default(now())

  // Relations
  trustProfile         TrustProfile        @relation(fields: [trustProfileId], references: [id], onDelete: Cascade)
  verification         HumanVerification?

  @@index([trustProfileId])
  @@index([postUrn])
  @@index([createdAt])
}
```

### VerifiedXComment Model (X/Twitter-Specific)

```prisma
// packages/db/prisma/models/verified-x-comment.prisma
model VerifiedXComment {
  id                   String    @id @default(uuid())
  trustProfileId       String

  // User's reply
  replyText            String    @db.Text
  replyTweetId         String?   // Tweet ID of the reply

  // Tweet being replied to (scraped from X DOM)
  tweetUrl             String
  tweetId              String?   // Original tweet ID
  conversationId       String?   // X conversation thread ID
  tweetAuthorName      String?   // Display name
  tweetAuthorHandle    String?   // @username
  tweetAuthorProfileUrl String?
  tweetAuthorAvatarUrl String?
  tweetAuthorBio       String?   @db.VarChar(280)
  tweetTextSnippet     String?   @db.VarChar(500)
  tweetImageUrl        String?

  // Metadata
  scrapedAt            DateTime  @default(now())
  createdAt            DateTime  @default(now())

  // Relations
  trustProfile         TrustProfile       @relation(fields: [trustProfileId], references: [id], onDelete: Cascade)
  verification         HumanVerification?

  @@index([trustProfileId])
  @@index([tweetId])
  @@index([conversationId])
  @@index([createdAt])
}
```

### PlatformLink Model (Connect LinkedIn/X Account)

Each user connects ONE account per platform. Connection happens **from within the extension** because:
- Extension can detect which account user is logged into
- Extension scrapes profile info from DOM (proves ownership)
- This is how we verify "this is YOUR LinkedIn/X account"

```prisma
// packages/db/prisma/models/platform-link.prisma
model PlatformLink {
  id              String    @id @default(uuid())
  trustProfileId  String
  platform        String    // "linkedin" | "x"

  // Profile info (scraped from DOM by extension)
  profileUrl      String    // Full profile URL
  profileHandle   String?   // @username (X) or slug (LinkedIn)
  displayName     String?   // Name shown on profile
  avatarUrl       String?   // Profile picture URL

  // Verification
  verified        Boolean   @default(true)  // True if connected via extension (proves ownership)
  connectedAt     DateTime  @default(now())

  trustProfile    TrustProfile @relation(fields: [trustProfileId], references: [id], onDelete: Cascade)

  @@unique([trustProfileId, platform])  // ONE account per platform per user
  @@unique([platform, profileUrl])      // Each profile URL globally unique
  @@index([trustProfileId])
  @@index([platform, profileUrl])
}
```

**Connection Flow (from extension):**
1. User logs into LinkedIn/X in browser
2. Extension detects logged-in profile from DOM
3. Extension calls `platformLink.connect` tRPC mutation with scraped profile info
4. Server creates PlatformLink record (verified=true because it came from extension)
5. User's TrustProfile now linked to their LinkedIn/X account

### Schema Design Rationale

**Platform-specific activity tables** instead of generic `VerifiedActivity`:
- ✅ `VerifiedLinkedInComment` - LinkedIn-specific fields (URNs, headline)
- ✅ `VerifiedXComment` - X-specific fields (tweetId, conversationId, handle)
- Future: `VerifiedLinkedInPost`, `VerifiedXRetweet`, etc.

**Why platform-specific?**
- Different data structures per platform
- Different verification rules per activity type
- Cleaner queries ("show all my LinkedIn comments")
- Extensible for future activity types

### What's NOT in TrustHuman Schema

- ❌ `AccessType` / `subscriptionTier` - No payment for MVP
- ❌ `dailyAIcomments` / `creditConsumed` - That's EngageKit
- ❌ `stripeCustomerId` - No payment
- ❌ `Organization` / `OrganizationMember` - No org layer
- ❌ `LinkedInAccount` - That's EngageKit automation
- ❌ All LinkedIn automation models (TargetList, CommentStyle, etc.)
- ❌ Generic `VerifiedActivity` - Using platform-specific tables instead

---

## Scope

### In Scope

- Git cleanup and push to new origin
- Database schema simplification (remove Organization, OrganizationMember)
- API layer simplification (match gifavatar pattern)
- Remove Stripe integration (no payment for now)
- Next.js route flattening (remove [orgSlug] nesting)
- Cloudflare tunnel configuration for Clerk webhooks

### Out of Scope

- Package deletion (keep ALL packages for reference)
- Viral growth features (human cards, streaks, trust scores) - separate plan
- AWS Rekognition integration - separate plan
- Payment/Stripe integration - future feature

---

## Implementation Checklist

### Phase 1: Git Cleanup & New Repository (5 steps)

1. **Commit staged deletions**
   - Run: `git add -A` to stage all pending deletions
   - Commit with message: "chore: remove archive apps and unused files for trusthuman cleanup"
   - Verify: `git status` shows clean working tree

2. **Remove old git origin**
   - Run: `git remote remove origin`
   - Verify: `git remote -v` shows no remotes

3. **Add new git origin**
   - Run: `git remote add origin https://github.com/knamnguyen/trusthuman.io.git`
   - Verify: `git remote -v` shows new origin

4. **Create main branch and push**
   - Run: `git branch -M main`
   - Run: `git push -u origin main`
   - Verify: Visit https://github.com/knamnguyen/trusthuman.io to confirm push

5. **Update package.json repository field**
   - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/package.json`
   - Change `repository.url` to `https://github.com/knamnguyen/trusthuman.io.git`
   - Update `name` to `trusthuman` or similar

### Phase 2: Database Schema - Fresh TrustHuman Models (14 steps)

6. **Delete ALL existing model files**
   - Delete entire: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/db/prisma/models/`
   - This removes all EngageKit models (organization, linkedin-account, targeting, comments, etc.)
   - We're starting fresh with TrustHuman-specific models

7. **Create user.prisma**
   - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/db/prisma/models/user.prisma`
   - Simple User model synced from Clerk (see schema above)
   - Fields: id, email, firstName, lastName, username, imageUrl, timestamps
   - Relations: trustProfile, verifications

8. **Create trust-profile.prisma**
   - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/db/prisma/models/trust-profile.prisma`
   - Core identity with Human # (autoincrement)
   - Username for public URL: `trusthuman.io/withkynam`
   - Verification stats, streak state, referral fields
   - Relations: user, verifications, linkedinComments, xComments, platformLinks

9. **Create human-verification.prisma**
   - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/db/prisma/models/human-verification.prisma`
   - Core verification record (verified, confidence, faceCount, rawResponse)
   - `activityType` field: "linkedin_comment" | "x_comment" | future types
   - Links to platform-specific activity via `linkedinCommentId` or `xCommentId`

10. **Create verified-linkedin-comment.prisma**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/db/prisma/models/verified-linkedin-comment.prisma`
    - LinkedIn-specific fields: commentUrn, postUrn, postAuthorUrn, postAuthorHeadline
    - Post context: postUrl, postAuthorName, postTextSnippet, postImageUrl

11. **Create verified-x-comment.prisma**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/db/prisma/models/verified-x-comment.prisma`
    - X-specific fields: replyTweetId, tweetId, conversationId, tweetAuthorHandle
    - Tweet context: tweetUrl, tweetAuthorName, tweetTextSnippet, tweetImageUrl

12. **Create platform-link.prisma**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/db/prisma/models/platform-link.prisma`
    - Connect LinkedIn/X profiles for badge overlay
    - One link per platform per user (unique constraint)

13. **Update schema.prisma**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/db/prisma/schema.prisma`
    - Ensure generator and datasource are correct
    - Verify model imports if using modular approach

14. **Generate Prisma client**
    - Run: `cd packages/db && pnpm db:generate`
    - Verify: No TypeScript errors

15. **Push schema to new Supabase**
    - Run: `cd packages/db && pnpm db:push`
    - Verify: Tables created in Supabase dashboard

16. **Verify schema in Prisma Studio**
    - Run: `cd packages/db && pnpm db:studio`
    - Check tables exist:
      - User
      - TrustProfile
      - HumanVerification
      - VerifiedLinkedInComment
      - VerifiedXComment
      - PlatformLink
    - Check: No EngageKit tables (Organization, LinkedInAccount, etc.)

17. **Update db package exports**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/db/src/index.ts`
    - Ensure clean exports for new models

18. **Update db package name**
    - Change: `@sassy/db` → `@trusthuman/db` in package.json

19. **Test db package builds**
    - Run: `cd packages/db && pnpm build`
    - Verify: No build errors

### Phase 3: API Simplification - Fresh TrustHuman API (14 steps)

18. **Delete ALL existing routers**
    - Delete entire: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/api/src/router/`
    - This removes all EngageKit routers (organization, account, stripe, ai-comments, etc.)
    - We're starting fresh with TrustHuman-specific routers

19. **Delete ALL existing services**
    - Delete entire: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/api/src/services/`
    - Remove org-access-control, ai-quota, etc.

20. **Delete ALL existing utils**
    - Delete entire: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/api/src/utils/`
    - Remove ai-quota, etc.

21. **Simplify trpc.ts - Match gifavatar pattern**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/api/src/trpc.ts`
    - **Rewrite to match gifavatar:**
      ```typescript
      import type { User } from "@clerk/nextjs/server";
      import { createClerkClient, verifyToken } from "@clerk/backend";
      import { currentUser } from "@clerk/nextjs/server";
      import { initTRPC, TRPCError } from "@trpc/server";
      import superjson from "superjson";
      import { ZodError } from "zod";
      import { db } from "@trusthuman/db";

      export interface TRPCContext {
        db: typeof db;
        user?: User;
        headers: Headers;
      }

      export const createTRPCContext = async (opts: {
        headers: Headers;
      }): Promise<TRPCContext> => {
        return {
          db,
          headers: opts.headers,
        };
      };

      const t = initTRPC.context<typeof createTRPCContext>().create({
        transformer: superjson,
        errorFormatter: ({ shape, error }) => ({
          ...shape,
          data: {
            ...shape.data,
            zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
          },
        }),
      });

      // Simple auth middleware - handles Next.js and Chrome extension
      const isAuthed = t.middleware(async ({ ctx, next }) => {
        const source = ctx.headers.get("x-trpc-source");
        let user: User | null = null;

        if (source === "chrome-extension") {
          // Chrome extension auth via Clerk Backend SDK
          const authHeader = ctx.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            throw new TRPCError({ code: "UNAUTHORIZED" });
          }
          const token = authHeader.substring(7);
          const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
          const verifiedToken = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
          if (verifiedToken.sub) {
            user = await clerkClient.users.getUser(verifiedToken.sub);
          }
        } else {
          // Next.js auth
          user = await currentUser();
        }

        if (!user) {
          throw new TRPCError({ code: "UNAUTHORIZED" });
        }

        return next({ ctx: { ...ctx, user } });
      });

      export const createCallerFactory = t.createCallerFactory;
      export const createTRPCRouter = t.router;
      export const publicProcedure = t.procedure;
      export const protectedProcedure = t.procedure.use(isAuthed);
      ```

22. **Create user router**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/api/src/router/user.ts`
    - Simple procedures: `getMe`, `updateProfile`
    - Use `protectedProcedure`

23. **Create verification router**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/api/src/router/verification.ts`
    - `analyzePhoto` - publicProcedure (MVP, no auth required)
    - Uses AWS Rekognition DetectFaces
    - Stores in HumanVerification table

24. **Create trust-profile router**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/api/src/router/trust-profile.ts`
    - `getByUsername` - publicProcedure (for public profiles)
    - `create` - protectedProcedure (create on first verification)
    - `update` - protectedProcedure

25. **Create platform-link router**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/api/src/router/platform-link.ts`
    - `connect` - protectedProcedure (called from extension with scraped profile info)
    - `disconnect` - protectedProcedure
    - `getMyLinks` - protectedProcedure (get user's connected accounts)
    - `lookupByProfileUrl` - publicProcedure (for badge overlay - check if profile is verified)

26. **Create root.ts**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/api/src/router/root.ts`
    - 4 routers: `user`, `verification`, `trustProfile`, `platformLink`

26. **Update index.ts exports**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/api/src/index.ts`
    - Clean exports matching gifavatar pattern

27. **Create/update clerk webhook handler**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/packages/api/src/webhooks/clerk.ts`
    - Simple user upsert on `user.created`, `user.updated`
    - Delete user on `user.deleted`
    - No organization logic

28. **Update api/package.json**
    - Remove: EngageKit-specific deps
    - Add: `@aws-sdk/client-rekognition`
    - Keep: Core tRPC, Clerk deps

29. **Clean TypeScript errors**
    - Run: `cd packages/api && pnpm typecheck`
    - Fix: Import errors
    - Goal: Clean typecheck

30. **Test API exports**
    - Run: `cd packages/api && pnpm build`
    - Verify: No build errors

31. **Update package name**
    - Change: `@sassy/api` → `@trusthuman/api` in package.json

### Phase 4: Next.js App Simplification (12 steps)

31. **Delete [orgSlug] nested route directory**
    - Delete: `/Users/knamnguyen/Documents/0-Programming/trusthuman/apps/nextjs/src/app/(new-dashboard)/[orgSlug]/`
    - This removes ALL org-level and account-level pages

32. **Create simple dashboard page**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/apps/nextjs/src/app/(new-dashboard)/dashboard/page.tsx`
    - Simple placeholder: "TrustHuman Dashboard - Coming Soon"
    - Will be built out in viral growth plan

33. **Create simple settings page**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/apps/nextjs/src/app/(new-dashboard)/settings/page.tsx`
    - Simple placeholder with user info from Clerk

34. **Update layout.tsx for new-dashboard**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/apps/nextjs/src/app/(new-dashboard)/layout.tsx`
    - Remove: Organization switcher component
    - Remove: Account switcher component
    - Keep: Simple user menu (from Clerk)
    - Simplify: Single-user layout

35. **Update root page.tsx**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/apps/nextjs/src/app/page.tsx`
    - Change: Redirect to `/dashboard` for authenticated users
    - Show: Landing page for unauthenticated users

36. **Update tRPC React client - Simplify headers**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/apps/nextjs/src/trpc/react.tsx`
    - Remove: `x-org-id` header
    - Remove: `x-account-id` header
    - Keep: Only auth-related headers

37. **Delete org/account switcher components**
    - Search: Components in `_components` directories
    - Delete: Org switcher, account switcher files

38. **Update navigation components**
    - Find: Components using `[orgSlug]/[accountSlug]` in hrefs
    - Change: Flat routes `/dashboard`, `/settings`

39. **Create public profile route (placeholder)**
    - Directory: `/Users/knamnguyen/Documents/0-Programming/trusthuman/apps/nextjs/src/app/(public)/[username]/`
    - File: `page.tsx` with placeholder: "Public profile for {username} - Coming Soon"
    - Purpose: Future `trusthuman.io/withkynam` style URLs

40. **Update middleware.ts**
    - File: `/Users/knamnguyen/Documents/0-Programming/trusthuman/apps/nextjs/src/middleware.ts`
    - Remove: Org-based redirects
    - Simplify: User authentication only
    - Match: Clerk's standard Next.js middleware pattern

41. **Update Next.js app/package.json**
    - Remove: Unused dependencies
    - Keep: Core Next.js, Clerk, tRPC dependencies

42. **Clean TypeScript errors in nextjs app**
    - Run: `cd apps/nextjs && pnpm typecheck`
    - Fix: Route import errors, missing components
    - Goal: Clean typecheck

### Phase 5: Cloudflare Tunnel Setup (8 steps)

43. **Check cloudflared installation**
    - Run: `cloudflared --version`
    - If not installed: `brew install cloudflare/cloudflare/cloudflared`

44. **Authenticate Cloudflare account (if needed)**
    - Run: `cloudflared tunnel login`
    - Select domain: `trusthuman.io`
    - Verify: Certificate saved to `~/.cloudflared/`

45. **Create tunnel**
    - Run: `cloudflared tunnel create trusthuman-dev`
    - Note: Save tunnel ID from output

46. **Create tunnel configuration file**
    - File: `~/.cloudflared/config-trusthuman.yml` (separate from engagekit)
    - Content:
      ```yaml
      tunnel: <TUNNEL_ID>
      credentials-file: /Users/knamnguyen/.cloudflared/<TUNNEL_ID>.json

      ingress:
        - hostname: api-dev.trusthuman.io
          service: http://localhost:3000
        - service: http_status:404
      ```

47. **Create DNS record**
    - Run: `cloudflared tunnel route dns trusthuman-dev api-dev.trusthuman.io`
    - Verify: DNS record created in Cloudflare dashboard

48. **Test tunnel**
    - Terminal 1: `pnpm dev` (starts Next.js on localhost:3000)
    - Terminal 2: `cloudflared tunnel --config ~/.cloudflared/config-trusthuman.yml run trusthuman-dev`
    - Test: Visit `https://api-dev.trusthuman.io`

49. **Configure Clerk webhook endpoint**
    - Clerk Dashboard → Webhooks → Create endpoint
    - URL: `https://api-dev.trusthuman.io/api/webhooks/clerk`
    - Events: `user.created`, `user.updated`, `user.deleted`
    - Get webhook signing secret

50. **Update .env with webhook secret**
    - Add: `CLERK_WEBHOOK_SECRET=whsec_...`
    - Verify: Webhook handler reads this secret

### Phase 6: Environment & Final Testing (8 steps)

51. **Verify .env file**
    - Check: `DATABASE_URL` points to new Supabase
    - Check: `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` are new instance
    - Add: `NEXTJS_URL=https://api-dev.trusthuman.io`
    - Remove: Stripe keys (no payment for now)

52. **Update .env.example**
    - Remove: Org-specific vars, Stripe keys
    - Add: Cloudflare tunnel notes
    - Document: What each var is for

53. **Update README.md**
    - Change: Project name to TrustHuman
    - Update: Description
    - Add: Local dev setup with Cloudflare tunnel
    - Add: Clerk webhook setup instructions

54. **Run full typecheck**
    - Run: `pnpm typecheck` at root
    - Fix: Any remaining errors
    - Goal: 0 errors

55. **Test database connection**
    - Run: `pnpm db:studio`
    - Verify: Tables visible, User model correct

56. **Test local dev**
    - Run: `pnpm dev`
    - Visit: `http://localhost:3000`
    - Verify: Next.js starts, can view pages

57. **Test tunnel + webhook**
    - Start tunnel
    - Sign up new user in Clerk
    - Check: User synced to database
    - This validates entire flow works

58. **Commit and push cleanup**
    - Commit: "chore: simplify to user-only architecture, remove org layer"
    - Push to GitHub
    - Set up Vercel deployment (connect to repo)

---

## Acceptance Criteria

### Git & Repository
- [ ] Code pushed to https://github.com/knamnguyen/trusthuman.io.git
- [ ] Clean git history with staged deletions committed

### Database (Fresh TrustHuman Schema)
- [ ] User model: simple Clerk sync (id, email, name, imageUrl)
- [ ] TrustProfile model: Human #, username, verification stats, streak, referral
- [ ] HumanVerification model: verified, confidence, faceCount, activityType, links to platform activities
- [ ] VerifiedLinkedInComment model: LinkedIn-specific (commentUrn, postUrn, postAuthorHeadline)
- [ ] VerifiedXComment model: X-specific (tweetId, conversationId, tweetAuthorHandle)
- [ ] PlatformLink model: connect LinkedIn/X profiles for badge overlay
- [ ] NO EngageKit tables (Organization, LinkedInAccount, etc.)
- [ ] Schema pushed to new Supabase instance

### API (Simple, Fresh)
- [ ] Simple TRPCContext: `{ db, user?, headers }`
- [ ] Only `publicProcedure` and `protectedProcedure`
- [ ] 4 routers: `user`, `verification`, `trustProfile`, `platformLink`
- [ ] Extension auth pattern preserved (Bearer token + x-trpc-source header)
- [ ] NO EngageKit routers (organization, stripe, ai-comments, etc.)
- [ ] Clerk webhook syncs User only (no org logic)
- [ ] Clean typecheck

### Next.js App
- [ ] [orgSlug] route directory deleted
- [ ] Simple routes: /dashboard, /settings
- [ ] Public profile route: /[username]
- [ ] Simple layout (no org/account switchers)
- [ ] Clean typecheck

### Cloudflare Tunnel
- [ ] Tunnel 'trusthuman-dev' created
- [ ] DNS: api-dev.trusthuman.io → tunnel
- [ ] Tunnel proxies localhost:3000
- [ ] Clerk webhook configured to tunnel URL

### Development Environment
- [ ] `pnpm dev` starts without errors
- [ ] User can sign up via Clerk
- [ ] Clerk webhook syncs user to database
- [ ] Prisma Studio shows TrustHuman schema (User, TrustProfile, etc.)

---

## What's Kept for Reference

All packages kept (not deleted, but not used):
- `packages/linkedin-automation/` - LinkedIn automation utilities
- `packages/apify-runners/` - Apify integration
- `packages/actors/` - DBOS actors
- `packages/posthog-proxy/` - Analytics proxy
- `packages/social-referral/` - Referral system (will repurpose)
- `packages/stripe/` - Stripe integration (for later)
- `packages/s3/` - S3 utilities (for photo storage later)
- `packages/feature-flags/` - Feature flags

All apps kept:
- `apps/wxt-extension/` - EngageKit WXT extension (reference)
- `apps/trustahuman-ext/` - TrustHuman extension (will build out in MVP plan)

---

## Notes

- **Fresh database** - delete ALL EngageKit models, create TrustHuman-specific models
- **Fresh API** - delete ALL EngageKit routers, create minimal TrustHuman routers
- **NO Stripe** - no payment integration for MVP
- **Simple tRPC** - match gifavatar's clean pattern (publicProcedure + protectedProcedure only)
- **Package namespace** - change `@sassy/*` to `@trusthuman/*`
- Cloudflare tunnel is for local dev with Clerk webhooks
- Production will deploy to Vercel (standard Next.js deployment)
- Viral growth features come in separate plan after this cleanup

---

## Completion Checklist

After all steps:

- [ ] `pnpm typecheck` passes
- [ ] `pnpm dev` starts successfully
- [ ] User can sign up at api-dev.trusthuman.io via Clerk
- [ ] Clerk webhook syncs user to Supabase (User table)
- [ ] Database has TrustHuman schema (User, TrustProfile, HumanVerification, VerifiedLinkedInComment, VerifiedXComment, PlatformLink)
- [ ] Database has NO EngageKit tables (Organization, LinkedInAccount, etc.)
- [ ] API has 4 routers: user, verification, trustProfile, platformLink
- [ ] Code pushed to GitHub: https://github.com/knamnguyen/trusthuman.io.git

**Plan complete. Say 'ENTER EXECUTE MODE' when ready to implement.**
