# Social Referral System

**Date:** 2026-01-27
**Complexity:** Complex (Multi-phase implementation)
**Status:** 🚧 Planning

---

## Quick Links

- [Overview](#overview)
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
- Daily engagement-based bonuses (5 likes = +1 day, 2 comments = +1 day)
- 3-day rescan window (unlimited earning during this period)
- Credits apply to org determined by URL (`/[orgSlug]/earn-premium`)
- Stripe customer balance credits for premium users
- Extended premium access for free users
- Post deletion detection with credit revocation

**Integration Points:**
- Existing org payment system (references @org-payment-system_PLAN_19-01-26.md)
- Stripe billing and webhooks
- Gifavatar social referral package (migration)
- Sidebar navigation enhancement

---

## Execution Brief

### Phase 1-2: Foundation (Schema + Package Migration)
**What happens:** Database schema created, Gifavatar social-referral package migrated to EngageKit monorepo, core types and utilities ported.

**Test:** Run `pnpm db:push`, verify SocialSubmission table exists, import social-referral package successfully.

### Phase 3-4: Core Backend (API + Verification)
**What happens:** tRPC routes for submission/status/listing created, verification service integrated, Stripe credit system implemented, eligibility checks enforced.

**Test:** Submit post URL via API, verify immediate validation, check Stripe customer balance updated for premium users.

### Phase 5-6: UI + Cron (Dashboard + Rescan)
**What happens:** `/[orgSlug]/earn-premium` page built with submission form and dashboard, daily cron job deployed for engagement rescanning, revocation logic for deleted posts.

**Test:** Submit post through UI, see real-time status updates, trigger cron manually, verify engagement rewards appear.

### Expected Outcome
- ✅ Users can submit social posts and earn premium time
- ✅ Free users get extended `earnedPremiumExpiresAt`
- ✅ Premium users get Stripe credits (automatic invoice deduction)
- ✅ Daily rescan awards engagement bonuses for 3 days
- ✅ Deleted posts trigger credit revocation
- ✅ Sidebar navigation includes org-level utilities
- ✅ Settings page shows earned premium status

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

### ADR 3: Simplified Reward Structure

**Decision:**
- Verified post: +3 days
- Every 5 likes: +1 day
- Every 2 comments: +1 day
- No shares (not supported across all platforms)
- No per-post cap (unlimited earning during 3-day window)
- No global cap (unlimited viral potential)

**Rationale:**
- Conservative initial reward (3 days vs 7)
- Lower comment threshold (2 vs 5) for higher engagement quality
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

### Current Status
⏳ **Phase 1:** Database Schema
⏳ **Phase 2:** Package Migration
⏳ **Phase 3:** Core API Routes
⏳ **Phase 4:** Verification Service
⏳ **Phase 5:** UI Implementation
⏳ **Phase 6:** Cron Job & Testing

---

### Phase 1: Database Schema

**Overview:** Add social referral tables and fields to support submission tracking and earned premium.

**Files/Modules:**
- `packages/db/prisma/models/social-submission.prisma` (NEW)
- `packages/db/prisma/models/organization.prisma` (UPDATE)
- `packages/db/prisma/models/user.prisma` (UPDATE)

**What's Functional:**
- SocialSubmission table with all required fields
- Organization earnedPremiumDays and earnedPremiumExpiresAt
- User relation to submissions

**Ready For:** Phase 2 (Package Migration)

---

### Phase 2: Package Migration

**Overview:** Copy Gifavatar social-referral package to EngageKit, update dependencies, test imports.

**Files/Modules:**
- `packages/social-referral/` (NEW - entire package)
- `packages/social-referral/package.json` (UPDATE dependencies)
- Root `package.json` (ADD workspace reference)

**What's Functional:**
- social-referral package builds successfully
- Verifiers for all 4 platforms functional
- Type exports available for import

**Ready For:** Phase 3 (Core API Routes)

---

### Phase 3: Core API Routes

**Overview:** Create tRPC routes for submission, status checking, and listing.

**Files/Modules:**
- `packages/api/src/router/social-referral.ts` (NEW)
- `packages/api/src/router/index.ts` (UPDATE - add router)
- `packages/api/src/utils/social-referral-rewards.ts` (NEW - reward calculation)

**What's Functional:**
- Users can submit post URLs
- Eligibility checks enforced (1 account only)
- Rate limiting (1 post/platform/day)
- Submission status retrieval

**Ready For:** Phase 4 (Verification Service)

---

### Phase 4: Verification Service Integration

**Overview:** Integrate verification service, implement immediate validation, add Stripe credits.

**Files/Modules:**
- `packages/api/src/services/verify-submission.ts` (NEW)
- `packages/api/src/services/award-premium-days.ts` (NEW)
- `packages/api/src/services/revoke-premium-days.ts` (NEW)

**What's Functional:**
- Immediate post verification on submission
- Stripe credits awarded to premium users
- earnedPremiumExpiresAt extended for free users
- Background verification job

**Ready For:** Phase 5 (UI Implementation)

---

### Phase 5: UI Implementation

**Overview:** Build earn-premium page, enhance settings page, update sidebar navigation.

**Files/Modules:**
- `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/earn-premium/page.tsx` (NEW)
- `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/settings/page.tsx` (UPDATE)
- `apps/nextjs/src/components/sidebar/sidebar.tsx` (UPDATE)
- `apps/nextjs/src/components/social-referral/` (NEW - components)

**What's Functional:**
- Users can submit posts via UI
- Real-time status updates
- Submissions table with engagement metrics
- Settings page shows earned premium status
- Sidebar navigation updated

**Ready For:** Phase 6 (Cron Job & Testing)

---

### Phase 6: Cron Job & Testing

**Overview:** Deploy daily rescan cron, implement post deletion detection, comprehensive testing.

**Files/Modules:**
- `apps/nextjs/src/app/api/cron/rescan-social-submissions/route.ts` (NEW)
- `vercel.json` (UPDATE - add cron config)

**What's Functional:**
- Daily rescans run automatically
- Engagement bonuses awarded
- Deleted posts detected and credits revoked
- Full system operational

**Ready For:** Production Launch

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

**Stage 1: Package Copy (2 steps)**

**Step 1.1:** Copy package directory
- Copy `/Users/knamnguyen/Documents/0-Programming/gifavatar/packages/social-referral` to `packages/social-referral`
- Review package.json dependencies
- Update to match EngageKit workspace versions

**Step 1.2:** Configure workspace
- Add `"packages/social-referral"` to root package.json workspaces
- Update tsconfig paths if needed
- Run `pnpm install` to link package

**Stage 2: Adaptation (3 steps)**

**Step 2.1:** Update imports and paths
- Replace Gifavatar-specific imports with EngageKit equivalents
- Update any hardcoded URLs or references
- Change keyword from "gifavatar" to "engagekit_io"

**Step 2.2:** Test verifiers individually
- Create test script for X verifier
- Test LinkedIn verifier with sample URL
- Verify Threads and Facebook verifiers

**Step 2.3:** Build and export
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

**Step 2.3:** Implement PREMIUM user Stripe credits
```typescript
if (org.subscriptionTier === "PREMIUM") {
  // Get subscription to determine billing cycle
  const subscription = await stripe.subscriptions.retrieve(
    org.stripeSubscriptionId,
  );

  // Calculate credit amount
  const pricePerDay = subscription.items.data[0].price.recurring.interval === "month"
    ? 29.99 / 30  // $1.00/day
    : 299.99 / 365;  // $0.82/day

  const creditAmount = Math.round(daysToAward * pricePerDay * 100); // cents

  // Add credit to Stripe customer balance
  await stripe.customers.createBalanceTransaction(org.stripeCustomerId, {
    amount: -creditAmount, // Negative = credit
    currency: "usd",
    description: `Social referral: ${daysToAward} days earned`,
  });

  // Track in DB
  await db.organization.update({
    where: { id: orgId },
    data: {
      earnedPremiumDays: { increment: daysToAward },
    },
  });
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

**Step 1.4:** Build submission form
```tsx
<Tabs value={step}>
  <TabsList>
    <TabsTrigger value="copy">1. Copy Caption</TabsTrigger>
    <TabsTrigger value="submit">2. Submit Post</TabsTrigger>
  </TabsList>

  <TabsContent value="copy">
    <div className="space-y-4">
      <Label>Suggested Caption (must include "engagekit_io")</Label>
      <Textarea
        readOnly
        value={DEFAULT_CAPTION}
        className="font-mono text-sm"
      />
      <Button onClick={handleCopy}>
        <Copy className="mr-2 h-4 w-4" />
        Copy Caption
      </Button>
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

### Phase 1: Database Schema
- [ ] Create `packages/db/prisma/models/social-submission.prisma`
- [ ] Add SocialPlatform and SocialSubmissionStatus enums
- [ ] Update Organization model with earnedPremium fields
- [ ] Update User model with socialSubmissions relation
- [ ] Run `pnpm db:push`
- [ ] Verify tables created in database

### Phase 2: Package Migration
- [ ] Copy Gifavatar social-referral package to packages/
- [ ] Update package.json dependencies
- [ ] Add to root workspace configuration
- [ ] Change keywords from "gifavatar" to "engagekit_io"
- [ ] Build package and verify exports
- [ ] Test import in API package

### Phase 3: Core API Routes
- [ ] Create `packages/api/src/router/social-referral.ts`
- [ ] Implement eligibility check function
- [ ] Implement rate limiting check
- [ ] Create submit endpoint with validation
- [ ] Create getStatus endpoint
- [ ] Create listSubmissions endpoint
- [ ] Add router to index.ts
- [ ] Test all endpoints with Postman/curl

### Phase 4: Verification Service
- [ ] Create `packages/api/src/services/verify-submission.ts`
- [ ] Implement verifySubmissionAsync function
- [ ] Create `packages/api/src/services/award-premium-days.ts`
- [ ] Implement FREE user reward logic
- [ ] Implement PREMIUM user Stripe credit logic
- [ ] Create `packages/api/src/services/revoke-premium-days.ts`
- [ ] Test verification flow end-to-end

### Phase 5: UI Implementation
- [ ] Create `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/earn-premium/page.tsx`
- [ ] Build eligibility banner component
- [ ] Build stats cards component
- [ ] Build 2-step submission form
- [ ] Build submissions data table
- [ ] Update settings page with earned premium section
- [ ] Update sidebar with org tools section
- [ ] Test responsive design

### Phase 6: Cron Job
- [ ] Create `packages/api/src/services/rescan-submission.ts`
- [ ] Implement rescan logic with reward calculation
- [ ] Implement post deletion detection
- [ ] Create `apps/nextjs/src/app/api/cron/rescan-social-submissions/route.ts`
- [ ] Configure Vercel cron in vercel.json
- [ ] Set CRON_SECRET in environment variables
- [ ] Test manually with curl
- [ ] Deploy and verify daily execution

### Testing & Launch
- [ ] Test FREE user flow end-to-end
- [ ] Test PREMIUM user flow end-to-end
- [ ] Test all 4 platforms (X, LinkedIn, Threads, Facebook)
- [ ] Test rate limiting (1 post/platform/day)
- [ ] Test eligibility enforcement (1 account only)
- [ ] Test post deletion and credit revocation
- [ ] Test 3-day rescan window
- [ ] Verify Stripe credits appear on invoices
- [ ] Monitor error logs for 1 week post-launch

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

**Plan Version:** 1.0
**Last Updated:** 2026-01-27
**Next Step:** Begin RFC-001 (Database Schema)
