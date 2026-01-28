# Social Referral System

**Date:** 2026-01-27
**Updated:** 2026-01-28 (Version 1.2 - UI Complete, Rewards Updated)
**Complexity:** Complex (Multi-phase implementation)
**Status:** ✅ Phase 1 UI Complete → Ready for Backend Integration

---

## 🎉 Phase 1 UI Completion Summary (2026-01-28)

### ✅ What's Complete

**UI Implementation (RFC-005):**
- Full earn-premium page with professional, production-ready design
- Collapsible "How It Works" card with 2-column responsive layout
- Premium status badge in top-right corner
- 2-step submission flow (caption editor + URL submission)
- Submissions history table with real-time status updates
- Platform-specific keywords (@engagekit_io for X/Threads, #engagekit_io for LinkedIn/Facebook)
- Auto-detection of platform from URL
- Independent page scrolling (fixed sidebar scroll issue)
- Copy caption with toast notifications
- Responsive design (mobile + desktop)

**Reward Structure Updated:**
- 1 verified post = **7 days** (updated from 3 days)
- +1 day per **3 likes** (updated from 5 likes)
- +1 day per **1 comment** (updated from 2 comments)
- Posts rescanned every 24 hours for 2 more times (3 total scans)

**Files Modified:**
- `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/earn-premium/page.tsx` ✅
- `packages/api/src/services/social-referral-verification.ts` (DAYS_PER_VERIFIED_POST = 7) ✅

### 🚀 What's Next (Phase 2)

**Backend Integration Needed:**
1. RFC-001: Database Schema (SocialSubmission table, Organization fields)
2. RFC-002: Package Migration (Gifavatar social-referral package)
3. RFC-003: Core API Routes (tRPC submit/status/list endpoints)
4. RFC-004: Verification Service (immediate verification + rewards)
5. RFC-006: Cron Job (daily rescans, engagement bonuses, post deletion detection)

**Deferred UI Features:**
- Settings page earned premium section
- Sidebar "Organization Tools" section
- Eligibility banner (when backend validation ready)

### 📋 Implementation Status

| RFC | Status | Notes |
|-----|--------|-------|
| RFC-001 | ⏳ TODO | Database schema design |
| RFC-002 | ⏳ TODO | Package migration from Gifavatar |
| RFC-003 | ⏳ TODO | tRPC API routes |
| RFC-004 | ⏳ TODO | Verification service (FREE tier functional, PREMIUM stubbed) |
| **RFC-005** | **✅ COMPLETE** | **UI fully implemented** |
| RFC-006 | 🔌 DEFERRED | Phase 2: Cron job + rescans |

---

## Quick Links

- [Overview](#overview)
- [Development Phases](#development-phases)
- [Scope for Independent Development](#scope-for-independent-development-phase-1)
- [Execution Brief](#execution-brief)
- [Phased Execution Workflow](#phased-execution-workflow)
- [Architecture Decisions](#architecture-decisions-final)
- [Component Details](#component-details)
- [Database Schema](#database-schema)
- [Phased Delivery Plan](#phased-delivery-plan)
- [RFCs](#rfcs)
- [Implementation Checklist](#implementation-checklist)

---

## Overview

**Goal:** Implement viral growth mechanism where users earn premium access by sharing EngageKit on social media (X, LinkedIn, Threads, Facebook).

**Key Features:**
- Both FREE and PREMIUM users with exactly 1 account can participate
- Immediate rewards upon post verification (+3 days)
- ~~Rescan feature (up to 3 scans per post with bonus days for engagement growth)~~ **[DEFERRED - Phase 2]**
- ~~Daily engagement-based bonuses~~ **[DEFERRED - Phase 2]**
- Credits apply to org determined by URL (`/[orgSlug]/earn-premium`)
- ~~Stripe customer balance credits for premium users~~ **[STUBBED - Phase 2 Integration]**
- Extended premium access for free users **[FULLY FUNCTIONAL - Phase 1]**
- ~~Post deletion detection with credit revocation~~ **[DEFERRED - Phase 2]**

**Development Split:**
- **Phase 1 (Independent - You):** UI + Verification + FREE tier logic
- **Phase 2 (Integration - With Cofounder):** PREMIUM Stripe credits + Cron job + Engagement bonuses

**Integration Points:**
- Existing org payment system (references @org-payment-system_PLAN_19-01-26.md) **[Minimal stub in Phase 1]**
- Stripe billing and webhooks **[Deferred to Phase 2]**
- Gifavatar social referral package (migration) **[Phase 1]**
- Sidebar navigation enhancement **[Phase 1]**

---

## Development Phases

### Phase 1: Independent Development (Your Work - No Payment System Dependency)

**Scope:**
- ✅ Database schema (minimal payment fields stubbed)
- ✅ Gifavatar package migration
- ✅ tRPC API routes (submit, status, list)
- ✅ Immediate verification service
- ✅ FREE tier reward logic (100% functional)
- ✅ PREMIUM tier reward logic (stubbed with console logs)
- ✅ UI for `/[orgSlug]/earn-premium` page
- ✅ Settings page enhancement
- ✅ Sidebar navigation update
- ✅ Eligibility checks
- ✅ Rate limiting

**What Works Immediately:**
- FREE users can submit posts, get verified, earn +3 days premium
- PREMIUM users can submit posts, see verification (credits stubbed)
- Full UI experience
- All 4 social platforms supported

**What's Stubbed/Deferred:**
- Stripe customer balance credits (console.log only)
- Rescan feature (up to 3 scans per post)
- Engagement bonuses based on likes/comments growth
- Post deletion detection

### Phase 2: Payment Integration (Later - With Cofounder)

**Scope:**
- 🔌 Connect Stripe credit system for PREMIUM users
- 🔌 Implement rescan feature (up to 3 total scans per post, award bonus days based on engagement growth)
- 🔌 Add rescan triggers (manual user action or scheduled cron)
- 🔌 Add engagement bonus logic (10 credits per 10 additional interactions in Gifavatar model)
- 🔌 Add post deletion detection with credit revocation
- 🔌 Calculate daily rate from Stripe subscription
- 🔌 Convert earned days to dollar credits

**Database Schema Prepared for Phase 2:**
- `lastScannedAt` - Tracks when last scan occurred
- `nextScanAt` - Controls when next rescan is allowed
- These fields are ready but unused in Phase 1

**Integration Points (Clearly Marked in Code):**
```typescript
// TODO: Phase 2 - Connect with payment system
if (org.subscriptionTier === "PREMIUM") {
  console.log(`[STUB] Would credit ${daysToAward} days to Stripe customer`);
  // await stripe.customers.createBalanceTransaction(...)
}

// TODO: Phase 2 - Rescan feature
// Will use lastScannedAt and nextScanAt fields
// Award bonus days based on engagement delta
```

---

## Scope for Independent Development (Phase 1)

### What You Can Build Independently (90% of System)

**✅ Fully Independent:**
1. **SocialSubmission table** - Complete schema with all fields
2. **Gifavatar package migration** - All 4 platform verifiers working
3. **tRPC routes** - submit, getStatus, listSubmissions, getEarningsSummary
4. **Immediate verification** - Post validation on submission
5. **FREE tier rewards** - Extends `earnedPremiumExpiresAt` (100% functional)
6. **UI pages** - `/[orgSlug]/earn-premium` complete
7. **Settings enhancement** - Shows earned premium status
8. **Sidebar navigation** - Organization Tools section
9. **Eligibility enforcement** - accountCount === 1 check
10. **Rate limiting** - 1 post/platform/day

**🟡 Partially Independent (Stub PREMIUM):**
11. **PREMIUM tier rewards** - Stub with console.log, implement later

**❌ Deferred (Phase 2):**
12. **Cron job for rescanning** - Requires consultation with cofounder
13. **Engagement bonuses** - Part of cron job
14. **Post deletion detection** - Part of cron job
15. **Stripe credit calculation** - Needs payment system context

### Minimal Schema Stubs Needed

Add these 4 fields to Organization table to support Phase 1:

```prisma
model Organization {
  // Minimal stubs (from org-payment-system plan)
  subscriptionTier        String?   @default("FREE")
  purchasedSlots          Int       @default(1)
  subscriptionExpiresAt   DateTime?
  stripeCustomerId        String?   @unique

  // Social referral fields (yours - fully functional)
  earnedPremiumDays       Int       @default(0)
  earnedPremiumExpiresAt  DateTime?
  socialSubmissions       SocialSubmission[]
}
```

**Why These Work:**
- `subscriptionTier` - Determines if FREE or PREMIUM (stub defaults to FREE)
- `stripeCustomerId` - Nullable, checked before Stripe calls (stub = null)
- `subscriptionExpiresAt` - Used for combined expiry calculation
- Phase 1 works 100% for FREE tier without actual payment system

---

## Execution Brief

### Phase 1A: Foundation (Schema + Package Migration) **[INDEPENDENT]**
**What happens:** Database schema created with minimal payment stubs, Gifavatar social-referral package migrated to EngageKit monorepo, all 4 platform verifiers working.

**Test:** Run `pnpm db:push`, verify SocialSubmission table exists, import social-referral package, test verifiers.

### Phase 1B: Core Backend (API + Verification) **[INDEPENDENT]**
**What happens:** tRPC routes for submission/status/listing created, immediate verification service integrated, FREE tier reward logic 100% functional, PREMIUM tier stubbed with console logs.

**Test:** Submit post URL via API, verify immediate validation for FREE users, check `earnedPremiumExpiresAt` extends correctly. PREMIUM users see stub logs.

### Phase 1C: UI Implementation **[INDEPENDENT]**
**What happens:** `/[orgSlug]/earn-premium` page built with submission form, dashboard, and submissions table. Settings page enhanced with earned premium section. Sidebar navigation updated with Organization Tools.

**Test:** Submit post through UI, see real-time status updates, verify FREE user flow end-to-end, check responsive design.

### Phase 2: Payment Integration **[DEFERRED - WITH COFOUNDER]**
**What happens:** Stripe credit system connected for PREMIUM users, daily cron job deployed for engagement rescanning, post deletion detection with revocation logic.

**Test:** Submit as PREMIUM user → verify Stripe credits applied. Trigger cron manually → verify engagement bonuses. Delete post → verify credits revoked.

### Expected Outcome (Phase 1)
- ✅ FREE users can submit posts and earn premium time (FULLY FUNCTIONAL)
- ✅ PREMIUM users can submit posts (verification works, credits stubbed)
- ✅ UI complete with all features visible
- ✅ Eligibility enforcement (1 account only)
- ✅ Rate limiting (1 post/platform/day)
- ✅ All 4 platforms supported (X, LinkedIn, Threads, Facebook)
- ✅ Sidebar navigation includes org-level utilities
- ✅ Settings page shows earned premium status
- 🔌 Stripe credits (stubbed for later)
- 🔌 Daily rescanning (deferred)
- 🔌 Engagement bonuses (deferred)
- 🔌 Post deletion detection (deferred)

### Expected Outcome (Phase 2 - After Integration)
- ✅ PREMIUM users get Stripe credits (automatic invoice deduction)
- ✅ Daily rescan awards engagement bonuses for 3 days
- ✅ Deleted posts trigger credit revocation
- ✅ Complete system operational for both FREE and PREMIUM users

---

## Phased Execution Workflow

**IMPORTANT:** This plan uses a phase-by-phase execution model with built-in approval gates.

### Workflow for Each RFC

**Step 1: Pre-Phase Research**
- Read existing code patterns (e.g., existing Stripe integration, tRPC patterns)
- Analyze Gifavatar reference implementation
- Identify potential blockers (API rate limits, webhook idempotency)
- Present findings to user for review

**Step 2: Detailed Planning**
- Create detailed implementation steps (file-by-file)
- Specify exact function signatures and data structures
- Define success criteria and test scenarios
- Get user approval before proceeding

**Step 3: Implementation**
- Execute approved plan exactly as specified
- No deviations without returning to planning
- Mid-implementation check-in at ~50% completion

**Step 4: Testing**
- Execute specific test scenarios defined in RFC
- Verify acceptance criteria met
- Document any issues discovered
- Show results to user

**Step 5: Phase Approval**
- User reviews implementation and test results
- Approves to proceed to next phase OR requests changes
- Update plan with "What's Functional Now"

### Benefits
- **User Control:** Explicit approval gates prevent scope creep
- **Early Feedback:** Catch issues before building on wrong foundation
- **Visibility:** Clear status at each milestone
- **Quality:** Testing built into every phase
- **Flexibility:** Easy to adjust course between phases

### Example Phase Execution

```
RFC-001: Database Schema
├── Step 1: Research
│   └── Read org-payment-system plan, analyze Organization table
├── Step 2: Plan
│   └── Design SocialSubmission schema, get approval
├── Step 3: Implement
│   └── Add schema files, run migration
├── Step 4: Test
│   └── Verify tables exist, test constraints
└── Step 5: Approve
    └── User confirms, proceed to RFC-002
```

---

## Architecture Decisions (Final)

### ADR 1: Universal Eligibility (1 Account Only)

**Decision:** Both FREE and PREMIUM orgs can participate if they have exactly 1 LinkedIn account.

**Rationale:**
- Simplifies eligibility check: `accountCount === 1` (no tier check needed)
- Reduces churn for single-user premium customers
- Prevents money bleeding (restricted to 1 account)
- Incentivizes existing premium users to promote EngageKit

**Implementation:**
```typescript
async function isEligible(orgId: string): Promise<boolean> {
  const accountCount = await db.linkedInAccount.count({
    where: { organizationId: orgId },
  });
  return accountCount === 1;
}
```

---

### ADR 2: Stripe Credits for Premium Users

**Decision:** Use Stripe customer balance (credit system) for premium users instead of pausing billing.

**Rationale:**
- Stripe handles everything (credits, invoices, carryover)
- No pause/resume state tracking needed
- No edge cases with billing cycle switches
- Credits stack naturally (60 days = $60 = 2 free months)
- If user cancels, credits remain (can be converted to free premium)

**Implementation:**
```typescript
async function awardDaysToPremiumUser(orgId: string, daysEarned: number) {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { stripeCustomerId: true, stripeSubscriptionId: true },
  });

  const subscription = await stripe.subscriptions.retrieve(
    org.stripeSubscriptionId,
  );

  // Calculate credit based on billing cycle
  const pricePerDay = subscription.items.data[0].price.recurring.interval === "month"
    ? 29.99 / 30  // $1.00/day
    : 299.99 / 365;  // $0.82/day

  const creditAmount = Math.round(daysEarned * pricePerDay * 100);

  await stripe.customers.createBalanceTransaction(org.stripeCustomerId, {
    amount: -creditAmount, // Negative = credit
    currency: "usd",
    description: `Social referral: ${daysEarned} days earned`,
  });
}
```

**Edge Cases Handled:**
- Premium user cancels → credits remain, convert to free premium on deletion
- Premium user downgrades → convert credits to `earnedPremiumExpiresAt`
- Credits exceed invoice → automatically carry forward

---

### ADR 3: Simplified Reward Structure (UPDATED 2026-01-28)

**Decision:**
- Verified post: +7 days (UPDATED from 3 days)
- Every 3 likes: +1 day (UPDATED from 5 likes)
- Every 1 comment: +1 day (UPDATED from 2 comments)
- Posts rescanned every 24 hours for 2 more times (3 total scans)
- No shares (not supported across all platforms)
- No per-post cap (unlimited earning during 3-day rescan window)
- No global cap (unlimited viral potential)

**Rationale:**
- More generous initial reward (7 days) to incentivize participation
- Lower like threshold (3 vs 5) for faster reward accumulation
- Lower comment threshold (1 vs 2) to maximize engagement quality
- Remove shares for platform parity
- No caps = maximum viral potential

---

### ADR 4: Organization Assignment via URL

**Decision:** The `orgSlug` in URL determines which org receives credit.

**Flow:**
1. User navigates to `/[orgSlug]/earn-premium`
2. System knows: "Credits go to this org"
3. User submits post → credits applied to that org
4. Want different org? Switch orgs first

**Benefits:**
- Simple - URL determines org
- No ambiguity
- User has full control
- Clear which org receives credit

---

### ADR 5: Limited Rescan Window (3 Days Only)

**Decision:** Only rescan posts < 3 days old. Stop after 3 days.

**Rationale:**
- Most engagement happens in first 72 hours
- Reduces API calls to social platforms
- Simpler cron job logic

**Implementation:**
```typescript
const submissions = await db.socialSubmission.findMany({
  where: {
    status: "VALIDATED",
    createdAt: { gte: subDays(new Date(), 3) },
  },
});
```

---

### ADR 6: Revoke Credits for Deleted Posts

**Decision:** If post deleted during rescan, revoke all previously awarded days (minimum 0).

**Implementation:**
```typescript
async function rescanSubmission(submissionId: string) {
  try {
    const result = await verifier.verifyKeywords(...);
    // Normal rescan logic
  } catch (error) {
    if (error.code === "POST_NOT_FOUND") {
      await revokeEarnedDays(submission.orgId, submission.daysAwarded);
      await db.socialSubmission.update({
        where: { id: submissionId },
        data: { status: "INVALID", errorMessage: "Post deleted" },
      });
    }
  }
}
```

**Result:** Prevents abuse (post → earn → delete)

---

### ADR 7: Sidebar Navigation Enhancement

**Decision:** Add dedicated "Organization Tools" section to sidebar for org-level utilities.

**Structure:**
```
Sidebar
├── Account-specific (when on /[orgSlug]/[accountSlug])
│   ├── Dashboard
│   ├── Targets
│   └── History
├── Organization Tools (always visible)
│   ├── Accounts (/[orgSlug]/accounts)
│   ├── Settings (/[orgSlug]/settings)
│   └── Earn Premium (/[orgSlug]/earn-premium) [NEW]
└── [Org Switcher]
```

**Rationale:**
- Users can access org-level pages even when viewing account details
- Clear separation: account tools vs org tools
- Earn Premium prominently displayed

---

## Component Details

### 1. Social Referral Package (`packages/social-referral`)

**Migrated from Gifavatar:** `/Users/knamnguyen/Documents/0-Programming/gifavatar/packages/social-referral`

**Structure:**
```
packages/social-referral/
├── src/
│   ├── social-referral-service.ts  # Main service
│   ├── types.ts                     # Platform types, result interfaces
│   ├── verifiers/
│   │   ├── x-verifier.ts
│   │   ├── linkedin-verifier.ts
│   │   ├── threads-verifier.ts
│   │   └── facebook-verifier.ts
│   └── utils/
│       ├── normalize-url.ts
│       └── detect-platform.ts
├── package.json
└── tsconfig.json
```

**Key Responsibilities:**
- Verify post URLs contain required keywords
- Extract engagement metrics (likes, comments)
- Platform-specific API integrations
- URL normalization and validation

---

### 2. tRPC Routes (`packages/api/src/router/social-referral.ts`)

**Endpoints:**

```typescript
export const socialReferralRouter = createTRPCRouter({
  // Submit new social post
  submit: protectedProcedure
    .input(z.object({
      orgId: z.string(),
      platform: z.enum(["X", "LINKEDIN", "THREADS", "FACEBOOK"]),
      postUrl: z.string().url(),
    }))
    .mutation(async ({ ctx, input }) => { /* ... */ }),

  // Get submission status
  getStatus: protectedProcedure
    .input(z.object({ submissionId: z.string() }))
    .query(async ({ ctx, input }) => { /* ... */ }),

  // List org submissions
  listSubmissions: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => { /* ... */ }),

  // Get org earnings summary
  getEarningsSummary: protectedProcedure
    .input(z.object({ orgId: z.string() }))
    .query(async ({ ctx, input }) => { /* ... */ }),
});
```

---

### 3. UI Pages

#### `/[orgSlug]/earn-premium` - Main Referral Dashboard

**Sections:**
1. **Eligibility Banner** (if not eligible)
2. **Current Stats** (earned days, premium status, active posts)
3. **Submit New Post Form** (2-step: copy caption, submit URL)
4. **Submissions Table** (platform, status, engagement, days earned)

**Features:**
- Real-time status updates (polling or websocket)
- Platform-specific suggested captions
- Rate limit warnings (1 post/platform/day)
- Ineligibility reasons (multiple accounts, not member)

#### `/[orgSlug]/settings` - Enhanced Settings Page

**New Section:** Earned Premium Status
```tsx
<Card>
  <CardHeader>
    <CardTitle>Earned Premium</CardTitle>
    <CardDescription>
      Rewards from social sharing
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <p>Total earned: <strong>{org.earnedPremiumDays} days</strong></p>
      {org.subscriptionTier === "FREE" && org.earnedPremiumExpiresAt && (
        <p>Premium until: {formatDate(org.earnedPremiumExpiresAt)}</p>
      )}
      {org.subscriptionTier === "PREMIUM" && (
        <p>Credits applied: <strong>${earnedCredits.toFixed(2)}</strong></p>
      )}
      <Button variant="outline" onClick={() => router.push(`/${orgSlug}/earn-premium`)}>
        Earn More
      </Button>
    </div>
  </CardContent>
</Card>
```

---

### 4. Daily Rescan Cron Job

**Route:** `/api/cron/rescan-social-submissions`

**Logic:**
```typescript
export async function GET(request: NextRequest) {
  // Security check
  if (request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const threeDaysAgo = subDays(new Date(), 3);
  const submissions = await db.socialSubmission.findMany({
    where: {
      status: "VALIDATED",
      createdAt: { gte: threeDaysAgo },
    },
  });

  for (const submission of submissions) {
    await rescanSubmission(submission.id);
  }
}
```

**Vercel Cron Config:**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/rescan-social-submissions",
    "schedule": "0 2 * * *"  // 2 AM daily
  }]
}
```

---

## Database Schema

### New Table: `SocialSubmission`

```prisma
model SocialSubmission {
  id                  String                  @id @default(cuid())
  orgId               String
  userId              String
  platform            SocialPlatform
  originalUrl         String
  urlNormalized       String                  @unique
  status              SocialSubmissionStatus  @default(VERIFYING)

  // Verification
  requiredKeywords    String[]                @default(["engagekit_io"])
  postText            String?

  // Engagement metrics
  likes               Int                     @default(0)
  comments            Int                     @default(0)

  // Rewards tracking
  daysAwarded         Int                     @default(0)
  lastRewardedLikes   Int                     @default(0)
  lastRewardedComments Int                    @default(0)

  // Meta
  rescanCount         Int                     @default(0)
  verifiedAt          DateTime?
  lastScannedAt       DateTime?
  errorMessage        String?
  createdAt           DateTime                @default(now())
  updatedAt           DateTime                @updatedAt

  organization        Organization            @relation(fields: [orgId], references: [id], onDelete: Cascade)
  user                User                    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([orgId])
  @@index([status])
  @@index([platform, orgId, createdAt]) // Rate limiting
  @@index([status, createdAt])          // Rescan query
}

enum SocialPlatform {
  X
  LINKEDIN
  THREADS
  FACEBOOK
}

enum SocialSubmissionStatus {
  VERIFYING
  VALIDATED
  INVALID
  DUPLICATE
  VALIDATION_FAILED
}
```

### Organization Table Updates

```prisma
model Organization {
  // ... existing fields ...

  // Social referral (unified for FREE and PREMIUM)
  earnedPremiumDays       Int                @default(0)   // Lifetime total
  earnedPremiumExpiresAt  DateTime?                        // For FREE users only

  socialSubmissions       SocialSubmission[]
}
```

### User Table Updates

```prisma
model User {
  // ... existing fields ...

  socialSubmissions  SocialSubmission[]
}
```

---

## Phased Delivery Plan

### Current Status (Phase 1 - Independent Development)
⏳ **RFC-001:** Database Schema **[PHASE 1]**
⏳ **RFC-002:** Package Migration **[PHASE 1]**
⏳ **RFC-003:** Core API Routes **[PHASE 1]**
⏳ **RFC-004:** Verification Service (FREE tier functional, PREMIUM stubbed) **[PHASE 1]**
⏳ **RFC-005:** UI Implementation **[PHASE 1]**
🔌 **RFC-006:** Cron Job & Testing **[PHASE 2 - DEFERRED]**

---

### RFC-001: Database Schema **[PHASE 1 - INDEPENDENT]**

**Overview:** Add social referral tables with minimal payment system stubs.

**Files/Modules:**
- `packages/db/prisma/models/social-submission.prisma` (NEW)
- `packages/db/prisma/models/organization.prisma` (UPDATE - add 4 stub fields + social fields)
- `packages/db/prisma/models/user.prisma` (UPDATE - add relation)

**Stub Fields Added:**
```prisma
// Minimal stubs for Phase 1
subscriptionTier        String?   @default("FREE")
stripeCustomerId        String?   @unique
subscriptionExpiresAt   DateTime?
purchasedSlots          Int       @default(1)

// Phase 1 functionality (fully independent)
earnedPremiumDays       Int       @default(0)
earnedPremiumExpiresAt  DateTime?
socialSubmissions       SocialSubmission[]
```

**What's Functional:**
- SocialSubmission table with all fields
- Organization has payment stubs + social fields
- FREE tier logic works 100%
- PREMIUM tier can check subscriptionTier (defaults to FREE)

**Ready For:** RFC-002 (Package Migration)

---

### RFC-002: Package Migration **[PHASE 1 - INDEPENDENT]**

**Overview:** Copy Gifavatar social-referral package, update for EngageKit.

**Files/Modules:**
- `packages/social-referral/` (NEW - entire package)
- `packages/social-referral/package.json` (UPDATE dependencies)
- Root `package.json` (ADD workspace reference)

**Changes from Gifavatar:**
- Replace "gifavatar" keywords with "engagekit_io"
- Update imports to EngageKit conventions
- Test all 4 verifiers (X, LinkedIn, Threads, Facebook)

**What's Functional:**
- social-referral package builds successfully
- All 4 platform verifiers functional
- Type exports available for import
- No Gifavatar-specific code remains

**Ready For:** RFC-003 (Core API Routes)

---

### RFC-003: Core API Routes **[PHASE 1 - INDEPENDENT]**

**Overview:** Create tRPC routes for submission, status, listing with full validation.

**Files/Modules:**
- `packages/api/src/router/social-referral.ts` (NEW)
- `packages/api/src/router/index.ts` (UPDATE - add router)

**Endpoints:**
- `submit` - Submit new post with eligibility + rate limit checks
- `getStatus` - Get single submission status
- `listSubmissions` - List org submissions
- `getEarningsSummary` - Get org earned premium summary

**What's Functional:**
- Eligibility enforcement (accountCount === 1)
- Rate limiting (1 post/platform/day)
- URL normalization and duplicate detection
- Submission tracking
- Works without payment system

**Ready For:** RFC-004 (Verification Service)

---

### RFC-004: Verification Service **[PHASE 1 - PARTIAL]**

**Overview:** Immediate verification on submission. FREE tier 100% functional, PREMIUM tier stubbed.

**Files/Modules:**
- `packages/api/src/services/verify-submission.ts` (NEW)
- `packages/api/src/services/award-premium-days.ts` (NEW - with stub for PREMIUM)
- `packages/api/src/services/revoke-premium-days.ts` (NEW - for Phase 2)

**What's Functional (Phase 1):**
- ✅ Immediate post verification on submission
- ✅ Keyword validation ("engagekit_io")
- ✅ Engagement metrics extraction (likes, comments)
- ✅ FREE user rewards: Extends `earnedPremiumExpiresAt` (+3 days)
- ✅ Error handling for invalid posts

**What's Stubbed (Phase 2):**
```typescript
if (org.subscriptionTier === "PREMIUM") {
  // TODO: Phase 2 - Connect with payment system
  console.log(`[STUB] Would credit ${daysToAward} days to Stripe customer ${org.stripeCustomerId}`);
  console.log(`[STUB] Calculated amount: $${(daysToAward * 1.00).toFixed(2)}`);

  // Still track for analytics
  await db.organization.update({
    where: { id: orgId },
    data: { earnedPremiumDays: { increment: daysToAward } },
  });
}
```

**Ready For:** RFC-005 (UI Implementation)

---

### RFC-005: UI Implementation **[PHASE 1 - COMPLETE ✅]**

**Overview:** Build complete UI for social referral system.

**Completed:** 2026-01-28

**Files/Modules:**
- `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/earn-premium/page.tsx` ✅ COMPLETE
- `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/settings/page.tsx` (DEFERRED)
- `apps/nextjs/src/components/sidebar/sidebar.tsx` (DEFERRED)
- `packages/api/src/services/social-referral-verification.ts` ✅ UPDATED (7 days reward)

**What's Implemented (2026-01-28):**
- ✅ **Full earn-premium page** with professional, production-ready UI
- ✅ **Collapsible "How It Works" card** (2-column responsive layout):
  - 🎁 Rewards: 7 days per verified post, +1 day per 3 likes, +1 day per 1 comment, 3 total rescans
  - ⚖️ Limits: 1 post/platform/day, 1 account eligibility required
  - ✅ Verification Rules: Platform-specific keywords (@engagekit_io for X/Threads, #engagekit_io for LinkedIn/Facebook)
  - ❌ Why Posts Fail: Comprehensive list of failure reasons
  - 🚀 Phase 2 Preview: Coming features section
- ✅ **Premium status badge** - Compact green pill in top-right corner showing days remaining
- ✅ **2-step submission flow:**
  - Step 1: Editable caption textarea with vertical social share buttons (Copy, X, LinkedIn, Threads, Facebook)
  - Step 2: URL input with automatic platform detection from pasted link
- ✅ **Submissions history table** with columns:
  - Platform | Link (truncated) | Status (with badges) | Days Earned | Likes | Comments | Submitted Date
- ✅ **Platform-specific keywords enforced:**
  - X/Threads: @engagekit_io
  - LinkedIn/Facebook: #engagekit_io
- ✅ **Auto-detection** of platform from URL (no manual dropdown needed)
- ✅ **Copy caption button** with toast success notification
- ✅ **Independent page scrolling** (fixed h-screen overflow issue)
- ✅ **Responsive design** (2-column on md+, stacks on mobile)
- ✅ **Real-time status updates** with 3-second auto-refresh for VERIFYING submissions

**NOT Yet Implemented (Deferred to Future Phases):**
- ❌ Settings page earned premium section
- ❌ Sidebar "Organization Tools" section with "Earn Premium" link
- ❌ Eligibility banner (will add when backend validation is ready)
- ❌ Stats cards (Total Earned, Premium Until, Active Posts, Verifying) - can add later if needed

**PREMIUM User Experience (Stubbed in Phase 2 section):**
- Phase 2 callout in "How It Works" explains PREMIUM Stripe credit system
- Days tracked in `earnedPremiumDays` for analytics

**Ready For:** Backend Integration (RFC-001 to RFC-004) or Direct Production Launch

---

### RFC-006: Cron Job & Rescan **[PHASE 2 - DEFERRED]**

**⚠️ DEFERRED TO PHASE 2 - Requires consultation with cofounder**

**Overview:** Daily rescan for engagement bonuses, post deletion detection, credit revocation.

**Why Deferred:**
- Requires Stripe subscription context for accurate credit calculation
- Needs cron infrastructure discussion
- Post deletion revocation affects payment system
- Can be added seamlessly later without breaking Phase 1 work

**Files/Modules (Phase 2):**
- `packages/api/src/services/rescan-submission.ts` (NEW)
- `apps/nextjs/src/app/api/cron/rescan-social-submissions/route.ts` (NEW)
- `vercel.json` (UPDATE - add cron config)

**What Will Be Added:**
- Daily cron at 2 AM
- Rescan posts < 3 days old (2 additional scans after initial verification)
- Award engagement bonuses (UPDATED: 3 likes = +1 day, 1 comment = +1 day)
- Detect deleted posts
- Revoke credits (Stripe debit for PREMIUM, reduce earnedPremiumExpiresAt for FREE)

**Integration Point:**
```typescript
// Phase 2 - Connect this to existing verification service
export async function rescanSubmission(submissionId: string) {
  // Calculate new rewards (UPDATED THRESHOLDS)
  const newLikes = result.likes - submission.lastRewardedLikes;
  const newComments = result.comments - submission.lastRewardedComments;
  const newDaysToAward = Math.floor(newLikes / 3) * 1 + Math.floor(newComments / 1) * 1;

  // Award using existing awardPremiumDays (just needs Stripe stub removed)
  await awardPremiumDays(submission.orgId, newDaysToAward);
}
```

**Ready For:** Production launch after Phase 2 integration complete

---

## RFCs

### RFC-001: Database Schema and Migration

**Summary:** Add SocialSubmission table and update Organization/User tables to support social referral system.

**Dependencies:** None

**Stage 0: Pre-Phase Research**
- Review org-payment-system plan for Organization schema
- Analyze existing Prisma models for naming patterns
- Check index strategies for performance

**Stage 1: Schema Design (2 steps)**

**Step 1.1:** Create SocialSubmission model
- Create `packages/db/prisma/models/social-submission.prisma`
- Define all fields per schema specification above
- Add enums for SocialPlatform and SocialSubmissionStatus

**Step 1.2:** Update Organization and User models
- Add `earnedPremiumDays`, `earnedPremiumExpiresAt` to Organization
- Add `socialSubmissions` relation to both models
- Verify relations are bidirectional

**Stage 2: Migration Execution (1 step)**

**Step 2.1:** Run migration
- Execute `pnpm db:push` from root
- Verify tables created in database
- Test foreign key constraints

**Post-Phase Testing:**
- Query SocialSubmission table exists
- Insert test record, verify cascade delete works
- Check indexes created correctly

**Acceptance Criteria:**
- [ ] SocialSubmission table exists with all fields
- [ ] Organization table has earnedPremium fields
- [ ] Relations work bidirectionally
- [ ] Indexes created for performance

**What's Functional Now:**
- Database schema ready for API implementation

**Ready For:**
- RFC-002: Package Migration

---

### RFC-002: Gifavatar Package Migration

**Summary:** Copy social-referral package from Gifavatar to EngageKit, update dependencies, ensure builds.

**Dependencies:** RFC-001

**Stage 0: Pre-Phase Research**
- Read Gifavatar package structure
- Identify EngageKit-specific modifications needed
- Check dependency versions compatibility
- Review new Apify actors and response formats

---

### Apify Actor Configuration

| Platform | EngageKit Actor ID | Gifavatar Actor ID | Status |
|----------|-------------------|-------------------|--------|
| X (Twitter) | `CJdippxWmn9uRfooo` | `CJdippxWmn9uRfooo` | ✅ **REUSE** - Same actor, copy directly |
| LinkedIn | `Wpp1BZ6yGWjySadk3` | `Wpp1BZ6yGWjySadk3` | ✅ **REUSE** - Same actor, copy directly |
| Facebook | (new actor - TBD) | `kbzX2pUZc7cRZIwZc` | 🔴 **NEW** - Different actor + response format |
| Threads | `7xFgGDhba8W5ZvOke` | (old actor) | 🔴 **NEW** - Different actor + response format |

**Reference Files:**
- Sample responses: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/packages/social-referral/sample-response-format/`
- Gifavatar verifiers: `/Users/knamnguyen/Documents/0-Programming/gifavatar/packages/social-referral/src/platforms/`

---

### Response Format Mappings

**X (Twitter):**
```typescript
// Response fields
{
  id: string | number,        // Filter out id: -1 (mock data)
  text: string,
  likeCount: number,
  replyCount: number,
  retweetCount: number
}
// Input: { tweetIDs: [tweetId], maxItems: 1 }
```

**LinkedIn:**
```typescript
// Response fields
{
  text: string,
  numLikes: number,
  numComments: number,
  numShares: number
}
// Input: { deepScrape: true, urls: [url] }
```

**Facebook (NEW - Requires New Verifier):**
```typescript
// NEW response format (completely different structure from Gifavatar)
{
  url: string,
  text: string,                // ⚠️ Changed from "content" in old actor
  likes: number,               // ⚠️ Changed from top-level to simple field
  comments: number,            // ⚠️ Changed from "num_comments"
  shares: number,              // ⚠️ Changed from "num_shares"
  media?: Array<{              // NEW - media array with thumbnails
    thumbnail: string,
    url: string,
    // ...other media fields
  }>
}
// Input format: TBD (check new actor documentation)
// Cannot reuse Gifavatar facebook-verifier - needs new implementation
// Reference: /Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/packages/social-referral/sample-response-format/facebook.json
```

**Threads (NEW - Requires New Verifier):**
```typescript
// NEW response format (different structure)
{
  thread: {
    text: string,
    like_count: number,        // ⚠️ Different naming convention
    reply_count: number,       // ⚠️ Different naming convention
    username: string,
    url: string
  },
  replies: [...]
}
// Input: { startUrls: [{ url }], proxyConfiguration: { useApifyProxy: true } }
// Cannot reuse Gifavatar threads-verifier - needs new implementation
```

---

**Stage 1: Package Copy (2 steps)**

**Step 1.1:** Copy package directory
- Copy `/Users/knamnguyen/Documents/0-Programming/gifavatar/packages/social-referral` to `packages/social-referral`
- Review package.json dependencies
- Update to match EngageKit workspace versions

**Step 1.2:** Configure workspace
- Add `"packages/social-referral"` to root package.json workspaces
- Update tsconfig paths if needed
- Run `pnpm install` to link package

**Stage 2: Adaptation (6 steps)**

**Step 2.1:** Update imports and keywords
- Replace Gifavatar-specific imports with EngageKit equivalents
- Update any hardcoded URLs or references
- **CRITICAL:** Change keyword from "gifavatar" to "engagekit_io" in X and LinkedIn verifiers only (Facebook and Threads will be rewritten)

**Step 2.2:** Rewrite Facebook verifier for new actor
- Open `packages/social-referral/src/platforms/facebook-verifier.ts`
- **Complete rewrite required** - new actor has different response format
- Update `DEFAULT_ACTOR_ID` to new actor ID (TBD - check actor documentation)
- Update `callActor` input format (check actor documentation for requirements)
- Update response parsing to handle new format:
  ```typescript
  const text = item.text;             // Changed from "content"
  const likes = item.likes ?? 0;      // Simple field now
  const comments = item.comments ?? 0; // Changed from "num_comments"
  const shares = item.shares ?? 0;    // Changed from "num_shares"
  ```
- Handle optional `media` array if present
- Reference: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/packages/social-referral/sample-response-format/facebook.json`

**Step 2.3:** Rewrite Threads verifier for new actor
- Open `packages/social-referral/src/platforms/threads-verifier.ts`
- Update `DEFAULT_ACTOR_ID` to `7xFgGDhba8W5ZvOke`
- Update `callActor` input format:
  ```typescript
  {
    startUrls: [{ url }],
    proxyConfiguration: { useApifyProxy: true }
  }
  ```
- Update response parsing to handle new format:
  ```typescript
  const text = item.thread.text;
  const likes = item.thread.like_count ?? 0;
  const comments = item.thread.reply_count ?? 0;
  ```
- Reference: `/Users/knamnguyen/Documents/0-Programming/engagekit-turborepo/packages/social-referral/sample-response-format/threads.json`

**Step 2.4:** Update X and LinkedIn verifiers with keyword
- X verifier: Already has correct actor, just update keyword to "engagekit_io"
- LinkedIn verifier: Already has correct actor, just update keyword to "engagekit_io"
- Both should work without other changes

**Step 2.5:** Test verifiers individually
- Create test script for X verifier (should work with keyword change only)
- Test LinkedIn verifier with sample URL (should work with keyword change only)
- Test Facebook verifier with new actor (completely new implementation)
- Test Threads verifier with new actor (completely new implementation)

**Step 2.6:** Build and export
- Run `pnpm build` in social-referral package
- Verify types are exported correctly
- Test import in another package

**Post-Phase Testing:**
- Import SocialReferralService in API package
- Call verifyKeywords with test URL
- Verify result structure matches expected types

**Acceptance Criteria:**
- [ ] Package builds without errors
- [ ] All 4 platform verifiers functional
- [ ] Types exported and importable
- [ ] No Gifavatar-specific code remains

**What's Functional Now:**
- Social verification library ready for integration

**Ready For:**
- RFC-003: Core API Routes

---

### RFC-003: Core API Routes

**Summary:** Create tRPC routes for submission, status, and listing with eligibility enforcement.

**Dependencies:** RFC-001, RFC-002

**Stage 1: Route Structure (2 steps)**

**Step 1.1:** Create router file
- Create `packages/api/src/router/social-referral.ts`
- Import necessary types from social-referral package
- Set up basic router structure with createTRPCRouter

**Step 1.2:** Add router to index
- Update `packages/api/src/router/index.ts`
- Export socialReferral router
- Verify TypeScript types propagate to frontend

**Stage 2: Submit Endpoint (4 steps)**

**Step 2.1:** Create eligibility check function
```typescript
async function checkEligibility(orgId: string, userId: string) {
  // Verify user is member
  const membership = await db.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  });
  if (!membership) throw new TRPCError({ code: "FORBIDDEN" });

  // Check account count
  const accountCount = await db.linkedInAccount.count({
    where: { organizationId: orgId },
  });
  if (accountCount !== 1) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Only orgs with exactly 1 account are eligible"
    });
  }
}
```

**Step 2.2:** Implement rate limiting check
```typescript
async function checkRateLimit(orgId: string, platform: SocialPlatform) {
  const today = startOfDay(new Date());
  const existing = await db.socialSubmission.findFirst({
    where: { orgId, platform, createdAt: { gte: today } },
  });
  if (existing) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "You can only submit 1 post per platform per day",
    });
  }
}
```

**Step 2.3:** Implement URL normalization and duplicate check
```typescript
import { normalizeUrl } from "@engagekit/social-referral";

const normalized = normalizeUrl(input.postUrl);
const duplicate = await db.socialSubmission.findUnique({
  where: { urlNormalized: normalized },
});
if (duplicate) {
  throw new TRPCError({ code: "CONFLICT", message: "Post already submitted" });
}
```

**Step 2.4:** Create submission record
```typescript
const submission = await db.socialSubmission.create({
  data: {
    orgId: input.orgId,
    userId: ctx.user.id,
    platform: input.platform,
    originalUrl: input.postUrl,
    urlNormalized: normalized,
    status: "VERIFYING",
    requiredKeywords: ["engagekit_io"],
  },
});

// Trigger async verification (RFC-004)
verifySubmissionAsync(submission.id);

return submission;
```

**Stage 3: Query Endpoints (2 steps)**

**Step 3.1:** Implement getStatus
```typescript
getStatus: protectedProcedure
  .input(z.object({ submissionId: z.string() }))
  .query(async ({ ctx, input }) => {
    const submission = await db.socialSubmission.findUnique({
      where: { id: input.submissionId },
      include: { organization: true, user: true },
    });

    // Verify user has access to this submission
    if (!submission || submission.userId !== ctx.user.id) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    return submission;
  }),
```

**Step 3.2:** Implement listSubmissions
```typescript
listSubmissions: protectedProcedure
  .input(z.object({ orgId: z.string() }))
  .query(async ({ ctx, input }) => {
    // Verify membership
    await checkEligibility(input.orgId, ctx.user.id);

    const submissions = await db.socialSubmission.findMany({
      where: { orgId: input.orgId },
      orderBy: { createdAt: "desc" },
      include: { user: { select: { firstName: true, lastName: true } } },
    });

    return submissions;
  }),
```

**Post-Phase Testing:**
- Call submit with valid org (1 account) → succeeds
- Call submit with multi-account org → fails with appropriate error
- Call submit twice same platform same day → rate limit error
- Call submit with duplicate URL → conflict error
- Query submission status → returns correct data
- List submissions for org → returns all submissions

**Acceptance Criteria:**
- [ ] Submit endpoint enforces eligibility (1 account only)
- [ ] Rate limiting works (1 post/platform/day)
- [ ] Duplicate detection works (normalized URLs)
- [ ] Status and list endpoints functional
- [ ] Proper error messages for all failure cases

**What's Functional Now:**
- Users can submit posts via API
- Submissions tracked in database
- Basic validation and rate limiting active

**Ready For:**
- RFC-004: Verification Service

---

### RFC-004: Verification Service Integration

**Summary:** Implement immediate post verification, reward calculation, and Stripe credit integration.

**Dependencies:** RFC-003

**Stage 1: Verification Service (3 steps)**

**Step 1.1:** Create verification service
- Create `packages/api/src/services/verify-submission.ts`
- Import SocialReferralService from social-referral package
- Implement verifySubmissionAsync function

```typescript
import { SocialReferralService } from "@engagekit/social-referral";

export async function verifySubmissionAsync(submissionId: string) {
  const submission = await db.socialSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) return;

  try {
    const verifier = new SocialReferralService();
    const result = await verifier.verifyKeywords({
      url: submission.urlNormalized,
      platform: submission.platform,
      keywords: submission.requiredKeywords,
    });

    if (result.containsAll) {
      await handleValidatedSubmission(submission, result);
    } else {
      await db.socialSubmission.update({
        where: { id: submissionId },
        data: {
          status: "INVALID",
          errorMessage: `Missing keywords: ${result.missingKeywords.join(", ")}`,
        },
      });
    }
  } catch (error) {
    await db.socialSubmission.update({
      where: { id: submissionId },
      data: {
        status: "VALIDATION_FAILED",
        errorMessage: error.message,
      },
    });
  }
}
```

**Step 1.2:** Implement handleValidatedSubmission
```typescript
async function handleValidatedSubmission(
  submission: SocialSubmission,
  result: VerifyKeywordsResult,
) {
  const INITIAL_REWARD_DAYS = 3;

  await db.$transaction(async (tx) => {
    // Update submission
    await tx.socialSubmission.update({
      where: { id: submission.id },
      data: {
        status: "VALIDATED",
        postText: result.text,
        likes: result.likes,
        comments: result.comments,
        daysAwarded: INITIAL_REWARD_DAYS,
        lastRewardedLikes: result.likes,
        lastRewardedComments: result.comments,
        verifiedAt: new Date(),
        lastScannedAt: new Date(),
      },
    });

    // Award premium days
    await awardPremiumDays(submission.orgId, INITIAL_REWARD_DAYS, tx);
  });
}
```

**Step 1.3:** Test verification flow
- Submit test post with valid keywords → validates
- Submit test post without keywords → marks invalid
- Submit test post with API error → marks validation_failed

**Stage 2: Reward Service (4 steps)**

**Step 2.1:** Create reward service file
- Create `packages/api/src/services/award-premium-days.ts`
- Import stripe client
- Define awardPremiumDays function

**Step 2.2:** Implement FREE user reward logic
```typescript
export async function awardPremiumDays(
  orgId: string,
  daysToAward: number,
  tx?: PrismaTransactionClient,
) {
  const db = tx ?? prisma;

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: {
      subscriptionTier: true,
      earnedPremiumExpiresAt: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  if (!org) throw new Error("Organization not found");

  if (org.subscriptionTier === "FREE") {
    // Extend earned premium expiration
    const now = new Date();
    const currentExpiry = org.earnedPremiumExpiresAt || now;
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = addDays(baseDate, daysToAward);

    await db.organization.update({
      where: { id: orgId },
      data: {
        earnedPremiumDays: { increment: daysToAward },
        earnedPremiumExpiresAt: newExpiry,
      },
    });
  }
}
```

**Step 2.3:** Implement PREMIUM user Stripe credits **[STUBBED FOR PHASE 1]**
```typescript
if (org.subscriptionTier === "PREMIUM") {
  // TODO: Phase 2 - Connect with payment system
  // For now, just log and track the days earned
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[STUB - Phase 2] PREMIUM User Credit Award`);
  console.log(`Organization: ${orgId}`);
  console.log(`Days to Award: ${daysToAward}`);
  console.log(`Stripe Customer: ${org.stripeCustomerId || 'NOT SET'}`);
  console.log(`Estimated Credit: $${(daysToAward * 1.00).toFixed(2)}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\nThis will be implemented in Phase 2 after payment system integration:`);
  console.log(`1. Fetch subscription to get billing cycle`);
  console.log(`2. Calculate daily rate (monthly: $1.00/day, yearly: $0.82/day)`);
  console.log(`3. Create Stripe customer balance transaction`);
  console.log(`4. Credits auto-apply to next invoice\n`);

  // Still track in DB for analytics
  await db.organization.update({
    where: { id: orgId },
    data: {
      earnedPremiumDays: { increment: daysToAward },
    },
  });

  // UNCOMMENT IN PHASE 2:
  /*
  const subscription = await stripe.subscriptions.retrieve(
    org.stripeSubscriptionId,
  );

  const pricePerDay = subscription.items.data[0].price.recurring.interval === "month"
    ? 29.99 / 30
    : 299.99 / 365;

  const creditAmount = Math.round(daysToAward * pricePerDay * 100);

  await stripe.customers.createBalanceTransaction(org.stripeCustomerId, {
    amount: -creditAmount,
    currency: "usd",
    description: `Social referral: ${daysToAward} days earned`,
  });
  */
}
```

**Step 2.4:** Test reward flow
- Award to FREE org → earnedPremiumExpiresAt extends
- Award to PREMIUM org → Stripe customer balance updated
- Verify DB earnedPremiumDays increments for both

**Stage 3: Revocation Service (2 steps)**

**Step 3.1:** Create revocation service
- Create `packages/api/src/services/revoke-premium-days.ts`
- Implement revokePremiumDays function

```typescript
export async function revokePremiumDays(
  orgId: string,
  daysToRevoke: number,
  tx?: PrismaTransactionClient,
) {
  const db = tx ?? prisma;

  const org = await db.organization.findUnique({
    where: { id: orgId },
  });

  if (!org) return;

  if (org.subscriptionTier === "FREE") {
    // Subtract days from expiration (can't go below now)
    const currentExpiry = org.earnedPremiumExpiresAt || new Date();
    const newExpiry = subDays(currentExpiry, daysToRevoke);
    const finalExpiry = newExpiry > new Date() ? newExpiry : new Date();

    await db.organization.update({
      where: { id: orgId },
      data: {
        earnedPremiumExpiresAt: finalExpiry,
        earnedPremiumDays: Math.max(0, org.earnedPremiumDays - daysToRevoke),
      },
    });
  } else {
    // PREMIUM: Remove Stripe credit
    const pricePerDay = 1.00; // Estimate
    const creditAmount = Math.round(daysToRevoke * pricePerDay * 100);

    await stripe.customers.createBalanceTransaction(org.stripeCustomerId, {
      amount: creditAmount, // Positive = debit
      currency: "usd",
      description: `Revoked: Post deleted (${daysToRevoke} days)`,
    });

    await db.organization.update({
      where: { id: orgId },
      data: {
        earnedPremiumDays: Math.max(0, org.earnedPremiumDays - daysToRevoke),
      },
    });
  }
}
```

**Step 3.2:** Test revocation
- Revoke from FREE org → expiration reduced
- Revoke from PREMIUM org → Stripe balance debited
- Verify can't go below 0 days

**Post-Phase Testing:**
- Submit post → immediate verification runs
- Valid post → user receives 3 days instantly
- FREE user → check earnedPremiumExpiresAt updated
- PREMIUM user → check Stripe customer balance
- Invalid post → submission marked invalid
- Test with all 4 platforms

**Acceptance Criteria:**
- [ ] Immediate verification on submission
- [ ] Valid posts award 3 days
- [ ] FREE users get extended earnedPremiumExpiresAt
- [ ] PREMIUM users get Stripe credits
- [ ] Invalid posts marked correctly
- [ ] Error handling for API failures

**What's Functional Now:**
- Complete submission-to-reward flow functional
- Both FREE and PREMIUM users receive rewards
- Stripe billing integration active

**Ready For:**
- RFC-005: UI Implementation

---

### RFC-005: UI Implementation

**Summary:** Build earn-premium page, enhance settings page, update sidebar navigation.

**Dependencies:** RFC-004

---

### Design Reference & Simplifications

**Gifavatar Reference Implementation:**
- Path: `/Users/knamnguyen/Documents/0-Programming/gifavatar/apps/nextjs/src/app/social-referral/page.tsx`
- Full-featured referral dashboard with GIF avatar preview/download functionality

**EngageKit Simplifications (What to Keep vs Remove):**

✅ **KEEP from Gifavatar:**
1. **Layout Structure:**
   - Page header with title ("Earn Premium" instead of "Referral Dashboard")
   - Hero message card explaining the system
   - Two-column grid layout for main content
   - Stats/analytics cards (4 small cards in grid)
   - Submission history table at bottom

2. **Step 1: Caption & Share Card:**
   - Read-only textarea with suggested caption
   - Copy button (with toast notification on success)
   - Share platform buttons (X, LinkedIn, Threads, Facebook) with brand colors
   - Simple-icons for platform logos
   - Platform detection from URL

3. **Step 2: Submit Card:**
   - URL input field with validation
   - Submit button with loading state (Loader2 icon)
   - Success/error toast notifications
   - Platform auto-detection from URL

4. **Stats Cards:**
   - Card component with icon + number + label
   - Color-coded by status (yellow for verifying, green for validated, etc.)
   - Uses lucide-react icons (CheckCircle2, Loader2, XCircle, etc.)

5. **Submission Table:**
   - Platform column (with badge/icon)
   - Link column (truncated URL with external link)
   - Status badge with icon (formatted by submission status)
   - Engagement metrics (likes, comments, shares)
   - Last scanned date (formatted with date-fns)
   - Reason for failure column (shows error message if any)

6. **Status Badges:**
   - Verifying: Yellow badge with Loader2 spinning icon
   - Validated: Green badge with CheckCircle2 icon (shows "Validated X/3" for rescan count)
   - Invalid: Pink/red badge with XCircle icon ("Missing keywords")
   - Duplicate: Gray badge with Clock icon
   - Validation Failed: Orange badge with AlertTriangle icon

❌ **REMOVE from Gifavatar:**
1. **Platform Selection Grid** (Row 2, left card)
   - NO platform selector for avatars (Gmail, Linktree, Beacons, etc.)
   - NO GIF avatar preview components

2. **Preview Card** (Row 2, right card)
   - NO visual preview with platform-specific rendering
   - NO GmailThreadPreview, LinktreePreview, etc. components

3. **Download GIF Preview:**
   - NO "Download GIF preview" button
   - NO capturePreviewAsGif functionality
   - NO Dialog for selecting different gifavatars

4. **UserButton** (Clerk component)
   - EngageKit doesn't use Clerk, skip this

5. **Gifavatar-Specific:**
   - NO Openpeeps avatar integration
   - NO platform preview generation
   - NO "Recommended" section for posting GIF previews

**Simplified EngageKit Layout:**
```
┌─────────────────────────────────────────────┐
│ Header: "Earn Premium" + description        │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Eligibility Banner (if not eligible)        │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ Hero Message: "Share on X, LinkedIn..."     │
└─────────────────────────────────────────────┘
┌──────────────────┬──────────────────────────┐
│ Step 1: Caption  │ Step 2: Submit + Stats   │
│ • Textarea       │ • URL input              │
│ • Copy button    │ • Submit button          │
│ • Share buttons  │ • 4 stats cards (grid)   │
└──────────────────┴──────────────────────────┘
┌─────────────────────────────────────────────┐
│ Submission History Table                    │
│ (Platform, Link, Status, Days, Engagement)  │
└─────────────────────────────────────────────┘
```

**Key Adaptations:**
1. **Caption keyword:** Change from "gifavatar[dot]app" to "engagekit_io"
2. **Currency:** Change from "credits" to "days" (earned premium days)
3. **Metrics:** Adapt analytics to show:
   - Verifying (count)
   - Validated (count)
   - Rejected (count)
   - **Total Days Earned** (instead of "Current Credits")
4. **Table columns:** Adjust to show "Days Earned" instead of "Credits Earned"
5. **No GIF download:** Skip entire preview/download workflow

**Component Reuse from @sassy/ui:**
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Button (with variant="outline" and loading states)
- Input, Textarea, Label
- Table, TableHeader, TableBody, TableRow, TableCell, TableHead
- Badge (with custom className for colors)
- Alert, AlertDescription (for eligibility banner)
- Dialog (not needed for preview, but may use for other purposes)

**Icons from lucide-react:**
- Copy, Loader2, CheckCircle2, XCircle, Clock, AlertTriangle, AlertCircle
- Trophy, Calendar, Share2 (for stats cards)
- Gift (for sidebar navigation)

**Platform Icons:**
- Use simple-icons for X (`siX`), Threads (`siThreads`), Facebook (`siFacebook`)
- Use FontAwesome for LinkedIn (`faLinkedin` from `@fortawesome/free-brands-svg-icons`)
- Reference pattern: [table-content-component.tsx](packages/ui/src/components/table-content-component.tsx:248-272)

**Platform Share URLs (from table-content-component.tsx):**
```typescript
// X: https://x.com/intent/tweet?text={encodedText}%20{encodedUrl}
// Facebook: https://www.facebook.com/share_channel/?type=reshare&link={encodedUrl}&app_id=542599432471018&source_surface=external_reshare&display=page
// LinkedIn: https://www.linkedin.com/sharing/share-offsite?mini=true&url={encodedUrl}
// Threads: https://www.threads.net/intent/post?text={encodedText}%20{encodedUrl}
// All open with: window.open(shareUrl, "_blank", "width=550,height=420")
```

---

**Stage 1: Earn Premium Page (5 steps)**

**Step 1.1:** Create page structure
- Create `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/earn-premium/page.tsx`
- Set up basic layout with Suspense boundaries
- Add tRPC hooks for data fetching

**Step 1.2:** Build eligibility banner
```tsx
{!isEligible && (
  <Alert variant="warning">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      {accountCount === 0 && "Add a LinkedIn account to start earning."}
      {accountCount > 1 && `Only orgs with 1 account can earn rewards. You have ${accountCount} accounts.`}
      {!isMember && "You must be a member of this organization."}
    </AlertDescription>
  </Alert>
)}
```

**Step 1.3:** Build stats cards
```tsx
<div className="grid grid-cols-4 gap-4">
  <StatCard
    label="Total Earned"
    value={`${org.earnedPremiumDays} days`}
    icon={<Trophy />}
  />
  <StatCard
    label="Premium Until"
    value={org.earnedPremiumExpiresAt ? formatDate(org.earnedPremiumExpiresAt) : "N/A"}
    icon={<Calendar />}
  />
  <StatCard
    label="Active Posts"
    value={validatedCount}
    icon={<Share2 />}
  />
  <StatCard
    label="Verifying"
    value={verifyingCount}
    icon={<Clock />}
  />
</div>
```

**Step 1.4:** Build submission form with editable caption and share buttons
```tsx
// State for editable caption
const [caption, setCaption] = useState(DEFAULT_CAPTION);

<Tabs value={step}>
  <TabsList>
    <TabsTrigger value="write">1. Write Caption & Share</TabsTrigger>
    <TabsTrigger value="submit">2. Submit Post URL</TabsTrigger>
  </TabsList>

  <TabsContent value="write">
    <div className="space-y-4">
      <Label>Caption (must include "engagekit_io")</Label>
      <Textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        rows={6}
        className="font-mono text-sm"
        placeholder="Write your caption here..."
      />
      <p className="text-xs text-muted-foreground">
        Tip: Your caption must include the word "engagekit_io" to be verified.
      </p>

      {/* Share buttons - opens share dialog with caption pre-filled */}
      <div>
        <Label>Share to</Label>
        <div className="mt-2 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => handleShareX(caption)}
            title="Share on X"
          >
            <svg role="img" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d={siX.path} />
            </svg>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => handleShareLinkedIn(caption)}
            title="Share on LinkedIn"
          >
            <FontAwesomeIcon icon={faLinkedin} className="h-5 w-5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => handleShareThreads(caption)}
            title="Share on Threads"
          >
            <svg role="img" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d={siThreads.path} />
            </svg>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => handleShareFacebook(caption)}
            title="Share on Facebook"
          >
            <svg role="img" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d={siFacebook.path} />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  </TabsContent>

  <TabsContent value="submit">
    <form onSubmit={handleSubmit}>
      <Select value={platform} onValueChange={setPlatform}>
        <SelectItem value="X">X (Twitter)</SelectItem>
        <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
        <SelectItem value="THREADS">Threads</SelectItem>
        <SelectItem value="FACEBOOK">Facebook</SelectItem>
      </Select>
      <Input
        type="url"
        placeholder="https://twitter.com/..."
        value={postUrl}
        onChange={(e) => setPostUrl(e.target.value)}
      />
      <Button type="submit">Submit for Verification</Button>
    </form>
  </TabsContent>
</Tabs>

// Share handler implementations (reference: table-content-component.tsx)
const handleShareX = (text: string) => {
  const encodedText = encodeURIComponent(text);
  const shareUrl = `https://x.com/intent/tweet?text=${encodedText}`;
  window.open(shareUrl, "_blank", "width=550,height=420");
};

const handleShareLinkedIn = (text: string) => {
  // Note: LinkedIn doesn't support pre-filled text via URL
  // User will need to paste caption manually after clicking share
  const url = encodeURIComponent(window.location.origin);
  const shareUrl = `https://www.linkedin.com/sharing/share-offsite?mini=true&url=${url}`;
  window.open(shareUrl, "_blank", "width=550,height=420");
  toast.info("Paste your caption in the LinkedIn share dialog");
};

const handleShareThreads = (text: string) => {
  const encodedText = encodeURIComponent(text);
  const shareUrl = `https://www.threads.net/intent/post?text=${encodedText}`;
  window.open(shareUrl, "_blank", "width=550,height=420");
};

const handleShareFacebook = (text: string) => {
  // Note: Facebook doesn't support pre-filled text via URL (policy restriction)
  // User will need to paste caption manually after clicking share
  const url = encodeURIComponent(window.location.origin);
  const shareUrl = `https://www.facebook.com/share_channel/?type=reshare&link=${url}&app_id=542599432471018&source_surface=external_reshare&display=page`;
  window.open(shareUrl, "_blank", "width=550,height=420");
  toast.info("Paste your caption in the Facebook share dialog");
};
```

**Step 1.5:** Build submissions table
```tsx
<DataTable
  columns={[
    { id: "platform", header: "Platform" },
    { id: "status", header: "Status" },
    { id: "daysEarned", header: "Days Earned" },
    { id: "engagement", header: "Engagement", cell: (row) => (
      <div>👍 {row.likes} 💬 {row.comments}</div>
    )},
    { id: "lastScanned", header: "Last Scanned" },
  ]}
  data={submissions}
/>
```

**Stage 2: Settings Page Enhancement (2 steps)**

**Step 2.1:** Add earned premium section
- Update `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/settings/page.tsx`
- Add new card section for earned premium status
- Show different content for FREE vs PREMIUM users

**Step 2.2:** Implement premium status display
```tsx
<Card>
  <CardHeader>
    <CardTitle>Earned Premium</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <p>Total earned: <strong>{org.earnedPremiumDays} days</strong></p>

      {org.subscriptionTier === "FREE" && org.earnedPremiumExpiresAt && (
        <p>Premium access until: {formatDate(org.earnedPremiumExpiresAt)}</p>
      )}

      {org.subscriptionTier === "PREMIUM" && (
        <p>Credits applied: <strong>${(org.earnedPremiumDays * 1.00).toFixed(2)}</strong></p>
      )}

      <Button variant="outline" onClick={() => router.push("earn-premium")}>
        Earn More →
      </Button>
    </div>
  </CardContent>
</Card>
```

**Stage 3: Sidebar Navigation (2 steps)**

**Step 3.1:** Update sidebar component
- Update `apps/nextjs/src/components/sidebar/sidebar.tsx`
- Add "Organization Tools" section
- Include Accounts, Settings, Earn Premium links

**Step 3.2:** Implement org tools section
```tsx
<SidebarSection title="Organization Tools">
  <SidebarLink
    href={`/${orgSlug}/accounts`}
    icon={<Users />}
    label="Accounts"
    active={pathname.includes("/accounts")}
  />
  <SidebarLink
    href={`/${orgSlug}/settings`}
    icon={<Settings />}
    label="Settings"
    active={pathname.includes("/settings")}
  />
  <SidebarLink
    href={`/${orgSlug}/earn-premium`}
    icon={<Gift />}
    label="Earn Premium"
    active={pathname.includes("/earn-premium")}
    badge={isEligible ? "NEW" : undefined}
  />
</SidebarSection>
```

**Post-Phase Testing:**
- Navigate to `/[orgSlug]/earn-premium` → page loads
- Check eligibility banner shows correct message
- Submit post via UI → see status update to "Verifying"
- Wait for verification → status updates to "Validated"
- Check stats cards reflect new submission
- Navigate to settings → see earned premium section
- Verify sidebar shows org tools section
- Test on mobile viewport

**Acceptance Criteria:**
- [ ] Earn premium page functional with all sections
- [ ] Eligibility checks show correct messages
- [ ] Submission form validates and submits
- [ ] Submissions table displays all submissions
- [ ] Settings page shows earned premium status
- [ ] Sidebar navigation updated with org tools
- [ ] Responsive design works on mobile

**What's Functional Now:**
- Users can submit posts via UI
- Real-time status tracking
- Earned premium visible in settings
- Navigation enhanced

**Ready For:**
- RFC-006: Cron Job Implementation

---

### RFC-006: Cron Job Implementation

**Summary:** Implement daily rescan job for engagement bonuses and post deletion detection.

**Dependencies:** RFC-005

**Stage 1: Rescan Service (3 steps)**

**Step 1.1:** Create rescan service
- Create `packages/api/src/services/rescan-submission.ts`
- Implement rescanSubmission function

```typescript
export async function rescanSubmission(submissionId: string) {
  const submission = await db.socialSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission || submission.status !== "VALIDATED") {
    return { newDaysAwarded: 0 };
  }

  try {
    const verifier = new SocialReferralService();
    const result = await verifier.verifyKeywords({
      url: submission.urlNormalized,
      platform: submission.platform,
      keywords: submission.requiredKeywords,
    });

    // Calculate new rewards
    const newLikes = result.likes - submission.lastRewardedLikes;
    const newComments = result.comments - submission.lastRewardedComments;

    let newDaysToAward = 0;
    newDaysToAward += Math.floor(newLikes / 5) * 1;     // Every 5 likes = +1 day
    newDaysToAward += Math.floor(newComments / 2) * 1;  // Every 2 comments = +1 day

    if (newDaysToAward > 0) {
      await db.$transaction(async (tx) => {
        await tx.socialSubmission.update({
          where: { id: submissionId },
          data: {
            likes: result.likes,
            comments: result.comments,
            daysAwarded: { increment: newDaysToAward },
            lastRewardedLikes: result.likes,
            lastRewardedComments: result.comments,
            lastScannedAt: new Date(),
            rescanCount: { increment: 1 },
          },
        });

        await awardPremiumDays(submission.orgId, newDaysToAward, tx);
      });
    } else {
      await db.socialSubmission.update({
        where: { id: submissionId },
        data: {
          lastScannedAt: new Date(),
          rescanCount: { increment: 1 },
        },
      });
    }

    return { newDaysAwarded };

  } catch (error) {
    if (error.code === "POST_NOT_FOUND" || error.code === "ACCESS_DENIED") {
      // Post deleted - revoke all awarded days
      await db.$transaction(async (tx) => {
        await tx.socialSubmission.update({
          where: { id: submissionId },
          data: {
            status: "INVALID",
            errorMessage: "Post deleted or made private",
          },
        });

        await revokePremiumDays(submission.orgId, submission.daysAwarded, tx);
      });

      return { newDaysAwarded: -submission.daysAwarded };
    }

    throw error;
  }
}
```

**Step 1.2:** Test rescan logic
- Create validated submission with 10 likes, 4 comments
- Run rescan → no new rewards (not enough)
- Update to 15 likes, 6 comments
- Run rescan → awards +2 days (1 for likes, 1 for comments)
- Test post deletion → revokes all days

**Step 1.3:** Test 3-day window enforcement
- Create submission 4 days old
- Run rescan → should skip (too old)
- Create submission 2 days old
- Run rescan → should process

**Stage 2: Cron Route (2 steps)**

**Step 2.1:** Create cron endpoint
- Create `apps/nextjs/src/app/api/cron/rescan-social-submissions/route.ts`
- Implement security check and batch processing

```typescript
export async function GET(request: NextRequest) {
  // Security check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("🔄 Starting daily social submission rescan");

  const threeDaysAgo = subDays(new Date(), 3);
  const submissions = await db.socialSubmission.findMany({
    where: {
      status: "VALIDATED",
      createdAt: { gte: threeDaysAgo },
    },
    orderBy: { lastScannedAt: "asc" },
  });

  let processedCount = 0;
  let rewardedCount = 0;
  let revokedCount = 0;

  for (const submission of submissions) {
    try {
      const result = await rescanSubmission(submission.id);
      processedCount++;
      if (result.newDaysAwarded > 0) rewardedCount++;
      if (result.newDaysAwarded < 0) revokedCount++;
    } catch (error) {
      console.error(`Failed to rescan ${submission.id}:`, error);
    }
  }

  console.log(`✅ Rescan complete: ${processedCount} processed, ${rewardedCount} rewarded, ${revokedCount} revoked`);

  return Response.json({
    success: true,
    processed: processedCount,
    rewarded: rewardedCount,
    revoked: revokedCount,
  });
}
```

**Step 2.2:** Configure Vercel cron
- Update `vercel.json` in apps/nextjs
- Add cron configuration

```json
{
  "crons": [{
    "path": "/api/cron/rescan-social-submissions",
    "schedule": "0 2 * * *"
  }]
}
```

**Stage 3: Manual Testing & Deployment (2 steps)**

**Step 3.1:** Test cron manually
- Set CRON_SECRET in .env.local
- Call endpoint with curl:
```bash
curl -X GET http://localhost:3000/api/cron/rescan-social-submissions \
  -H "Authorization: Bearer ${CRON_SECRET}"
```
- Verify responses and database updates

**Step 3.2:** Deploy and verify
- Deploy to Vercel
- Set CRON_SECRET in production env vars
- Verify cron runs at 2 AM daily
- Monitor logs for errors

**Post-Phase Testing:**
- Create submissions with varying engagement
- Wait 1 day, run cron manually
- Verify engagement bonuses awarded correctly
- Delete a test post on social platform
- Run cron → verify credits revoked
- Check both FREE and PREMIUM orgs work

**Acceptance Criteria:**
- [ ] Rescan service calculates rewards correctly
- [ ] 3-day window enforced (older posts skipped)
- [ ] Deleted posts detected and revoked
- [ ] Cron endpoint secured with CRON_SECRET
- [ ] Vercel cron configured and running daily
- [ ] Error handling for API failures
- [ ] Logs show processing statistics

**What's Functional Now:**
- Complete social referral system operational
- Daily rescans automatic
- Engagement bonuses awarded
- Post deletion protection active

**Ready For:**
- Production launch

---

## Implementation Checklist

### ✅ Phase 1: Independent Development (Your Work - No Payment Dependency)

#### RFC-001: Database Schema
- [ ] Create `packages/db/prisma/models/social-submission.prisma`
- [ ] Add SocialPlatform and SocialSubmissionStatus enums
- [ ] Update Organization model:
  - [ ] Add stub fields: `subscriptionTier`, `stripeCustomerId`, `subscriptionExpiresAt`, `purchasedSlots`
  - [ ] Add social fields: `earnedPremiumDays`, `earnedPremiumExpiresAt`
  - [ ] Add relation: `socialSubmissions`
- [ ] Update User model with socialSubmissions relation
- [ ] Run `pnpm db:push`
- [ ] Verify tables created in database

#### RFC-002: Package Migration
- [ ] Copy `/Users/knamnguyen/Documents/0-Programming/gifavatar/packages/social-referral` to `packages/social-referral`
- [ ] Update `package.json` dependencies to match EngageKit workspace versions
- [ ] Add `"packages/social-referral"` to root `package.json` workspaces
- [ ] Replace "gifavatar" keywords with "engagekit_io" in all files
- [ ] Update imports to EngageKit conventions
- [ ] Run `pnpm install` to link package
- [ ] Run `pnpm build` in social-referral package
- [ ] Test verifiers individually:
  - [ ] X verifier with sample URL
  - [ ] LinkedIn verifier
  - [ ] Threads verifier
  - [ ] Facebook verifier
- [ ] Test import in API package

#### RFC-003: Core API Routes
- [ ] Create `packages/api/src/router/social-referral.ts`
- [ ] Implement `checkEligibility` function (accountCount === 1)
- [ ] Implement `checkRateLimit` function (1 post/platform/day)
- [ ] Implement URL normalization and duplicate check
- [ ] Create `submit` endpoint with all validations
- [ ] Create `getStatus` endpoint
- [ ] Create `listSubmissions` endpoint
- [ ] Create `getEarningsSummary` endpoint
- [ ] Add router to `packages/api/src/router/index.ts`
- [ ] Test all endpoints:
  - [ ] Submit with 1 account org → succeeds
  - [ ] Submit with multi-account org → fails
  - [ ] Submit twice same platform/day → rate limit
  - [ ] Submit duplicate URL → conflict

#### RFC-004: Verification Service (FREE functional, PREMIUM stubbed)
- [ ] Create `packages/api/src/services/verify-submission.ts`
- [ ] Implement `verifySubmissionAsync` function
- [ ] Implement `handleValidatedSubmission` function
- [ ] Create `packages/api/src/services/award-premium-days.ts`
- [ ] Implement FREE user reward logic (extends `earnedPremiumExpiresAt`)
- [ ] **Stub** PREMIUM user logic with detailed console logs (see RFC-004 Step 2.3)
- [ ] Create `packages/api/src/services/revoke-premium-days.ts` (stub for Phase 2)
- [ ] Test verification flow:
  - [ ] FREE user submits valid post → earnedPremiumExpiresAt extends +3 days
  - [ ] PREMIUM user submits valid post → see stub logs, earnedPremiumDays increments
  - [ ] Submit invalid post → status = INVALID
  - [ ] Test all 4 platforms

#### RFC-005: UI Implementation
- [ ] Create `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/earn-premium/page.tsx`
- [ ] Build eligibility banner (shows reasons if not eligible)
- [ ] Build stats cards (total earned, premium until, active posts, verifying)
- [ ] Build 2-step submission form:
  - [ ] Step 1: Copy suggested caption
  - [ ] Step 2: Select platform + submit URL
- [ ] Build submissions data table (platform, status, days earned, engagement, last scanned)
- [ ] Update `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/settings/page.tsx`:
  - [ ] Add "Earned Premium" card
  - [ ] Show different content for FREE vs PREMIUM
  - [ ] Add "Earn More" button linking to earn-premium page
- [ ] Update `apps/nextjs/src/components/sidebar/sidebar.tsx`:
  - [ ] Add "Organization Tools" section
  - [ ] Add links: Accounts, Settings, Earn Premium
- [ ] Test responsive design on mobile
- [ ] Test FREE user end-to-end flow in UI
- [ ] Test PREMIUM user flow (verify stub message appears)

#### Phase 1 Testing
- [ ] End-to-end test: FREE user submits post → verified → +3 days premium
- [ ] Verify eligibility enforcement (1 account only)
- [ ] Verify rate limiting (1 post/platform/day)
- [ ] Test all 4 platforms through UI
- [ ] Verify UI shows correct stats and status
- [ ] Check settings page displays earned premium correctly
- [ ] Verify sidebar navigation works
- [ ] Test on mobile viewport

---

### 🔌 Phase 2: Payment Integration (Later - With Cofounder)

#### Connect Stripe Credit System
- [ ] Remove stub from `award-premium-days.ts` (uncomment Phase 2 code)
- [ ] Fetch Stripe subscription to get billing cycle
- [ ] Calculate daily rate based on subscription interval
- [ ] Create Stripe customer balance transaction
- [ ] Test PREMIUM user receives actual credits
- [ ] Verify credits appear on next invoice

#### RFC-006: Cron Job Implementation
- [ ] Create `packages/api/src/services/rescan-submission.ts`
- [ ] Implement engagement bonus calculation (5 likes = +1 day, 2 comments = +1 day)
- [ ] Implement post deletion detection (POST_NOT_FOUND error handling)
- [ ] Implement 3-day window enforcement
- [ ] Create `apps/nextjs/src/app/api/cron/rescan-social-submissions/route.ts`
- [ ] Add security check with CRON_SECRET
- [ ] Implement batch processing for submissions
- [ ] Update `vercel.json` with cron configuration
- [ ] Set CRON_SECRET in environment variables
- [ ] Test rescan manually with curl
- [ ] Deploy and verify daily execution at 2 AM

#### Revocation Logic
- [ ] Complete `revoke-premium-days.ts` implementation
- [ ] For FREE users: Reduce `earnedPremiumExpiresAt`
- [ ] For PREMIUM users: Debit Stripe customer balance
- [ ] Test post deletion triggers revocation
- [ ] Verify minimum 0 days enforcement

#### Phase 2 Testing
- [ ] Test PREMIUM user receives Stripe credits
- [ ] Test daily rescan awards engagement bonuses
- [ ] Test post deletion revokes credits
- [ ] Test 3-day rescan window
- [ ] Verify credits appear on Stripe invoices
- [ ] Monitor error logs for 1 week post-launch

---

### Summary: Phase 1 vs Phase 2

**Phase 1 Deliverables (Independent Work):**
- ✅ Complete UI for social referral
- ✅ 100% functional for FREE users
- ✅ Verification working for all platforms
- ✅ Eligibility and rate limiting enforced
- ✅ PREMIUM flow exists but credits stubbed

**Phase 2 Additions (With Cofounder):**
- 🔌 Connect Stripe credit system
- 🔌 Add daily cron job for rescanning
- 🔌 Enable engagement bonuses
- 🔌 Add post deletion detection and revocation

---

## Cursor + RIPER-5 Guidance

### Using Cursor Plan Mode
1. Import this plan: Attach `social-referral-system_PLAN_27-01-26.md`
2. Execute by RFC: Complete RFC-001 → RFC-002 → ... → RFC-006
3. After each RFC: Update "What's Functional Now" in this document
4. Use Implementation Checklist for granular tracking

### Using RIPER-5 Mode
- **RESEARCH:** Review org-payment-system plan, analyze Gifavatar package, understand existing patterns
- **INNOVATE:** Discuss reward structures, Stripe credit vs pause approaches, UI layout options
- **PLAN:** This document represents completed planning phase
- **EXECUTE:** Implement RFCs sequentially, mid-implementation check-in at RFC-003 completion
- **REVIEW:** After RFC-006, validate entire system, flag any deviations

### If Scope Changes
1. Pause implementation
2. Document change request in "Change Management" section below
3. Assess impact on remaining RFCs
4. Get user approval
5. Update plan and continue

---

## Change Management

(Reserved for mid-implementation changes)

---

## Future Enhancements

### V2 Features (Post-Launch)
- Admin dashboard for fraud detection
- Email notifications for milestones
- Referral leaderboard
- Custom caption templates per org
- Share tracking (when Threads supports it)
- Affiliate link tracking integration (Endorsely)

---

---

## Phase 1 → Phase 2 Handoff Summary

### What Works After Phase 1 (Independent Development)

**100% Functional:**
- ✅ FREE users can submit posts, get verified, earn +3 days premium
- ✅ All 4 social platforms supported (X, LinkedIn, Threads, Facebook)
- ✅ Eligibility enforcement (accountCount === 1)
- ✅ Rate limiting (1 post/platform/day)
- ✅ Complete UI with submission form, dashboard, stats
- ✅ Settings page shows earned premium status
- ✅ Sidebar navigation with Organization Tools section

**Stubbed (Console Logs Only):**
- 🔌 PREMIUM user Stripe credits (days tracked, credits not applied)
- 🔌 Engagement bonuses (no daily rescan)
- 🔌 Post deletion detection (no revocation)

### Integration Points for Phase 2

**Location 1: `packages/api/src/services/award-premium-days.ts`**
```typescript
// Lines ~75-120 (approximately)
if (org.subscriptionTier === "PREMIUM") {
  // UNCOMMENT THIS BLOCK IN PHASE 2:
  /*
  const subscription = await stripe.subscriptions.retrieve(
    org.stripeSubscriptionId,
  );
  const pricePerDay = subscription.items.data[0].price.recurring.interval === "month"
    ? 29.99 / 30
    : 299.99 / 365;
  const creditAmount = Math.round(daysToAward * pricePerDay * 100);
  await stripe.customers.createBalanceTransaction(org.stripeCustomerId, {
    amount: -creditAmount,
    currency: "usd",
    description: `Social referral: ${daysToAward} days earned`,
  });
  */
}
```

**Location 2: New file for Phase 2**
- `packages/api/src/services/rescan-submission.ts`
- `apps/nextjs/src/app/api/cron/rescan-social-submissions/route.ts`
- Update `vercel.json` with cron config

**Location 3: Complete revocation service**
- `packages/api/src/services/revoke-premium-days.ts` (currently stubbed)

### Questions for Cofounder (Phase 2 Planning)

1. **Cron Job Infrastructure:**
   - Use Vercel cron (simple, included) or separate service?
   - Preferred time for daily rescan (currently: 2 AM UTC)?
   - Batch size for processing submissions (currently: all at once)?

2. **Stripe Credit Calculation:**
   - Confirm daily rate formula: monthly $29.99/30, yearly $299.99/365?
   - How to handle subscription changes mid-earning period?
   - Credits expire or roll forward indefinitely?

3. **Post Deletion Handling:**
   - Immediate revocation or grace period?
   - Notify user when credits revoked?
   - Minimum balance enforcement (can't go negative)?

4. **Error Handling:**
   - Social platform API rate limits - retry strategy?
   - Failed Stripe credit transaction - log and continue or halt?
   - Post verification timeout - how long to wait?

### Files to Review Together (Phase 2 Kickoff)

1. `packages/api/src/services/award-premium-days.ts` - See stub, discuss rate calculation
2. `process/plans/org-payment-system_PLAN_19-01-26.md` - Review Stripe webhook patterns
3. Reference: `/Users/knamnguyen/Documents/0-Programming/gifavatar/apps/nextjs/src/app/api/cron/rescan-social-submissions/route.ts` - Gifavatar cron implementation

---

**Plan Version:** 1.1 (Phase 1 - Independent Development Scope)
**Last Updated:** 2026-01-27
**Status:** Ready for Phase 1 Implementation

**Next Step:** Begin RFC-001 (Database Schema) - No payment system dependency required
