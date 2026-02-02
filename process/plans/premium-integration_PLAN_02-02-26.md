# Premium Integration: Social Referral + Organization Payment System

**Date:** 2026-02-02
**Complexity:** COMPLEX (Multi-phase integration)
**Execution Model:** Phase-by-Phase with Pre-Research and Post-Testing
**Status:** ⏳ PLANNED
**Related Plans:**
- @org-payment-system_PLAN_19-01-26.md (Org Payment System)
- @social-referral-system_PLAN_27-01-26.md (Social Referral System)

---

## Quick Links

- [Overview](#overview)
- [Execution Brief](#execution-brief)
- [Phased Execution Workflow](#phased-execution-workflow)
- [Architecture Decisions](#architecture-decisions)
- [Critical Bugs Identified](#critical-bugs-identified)
- [Database Schema](#database-schema)
- [Phased Delivery Plan](#phased-delivery-plan)
- [RFCs](#rfcs)
- [Implementation Checklist](#implementation-checklist)

---

## Overview

**Goal:** Integrate the Social Referral System with the Organization Payment System for production launch, fixing critical bugs and consolidating premium logic.

**Current State (Two Independent Systems):**

1. **Org Payment System** (✅ Complete by cofounder)
   - Org-centric billing with Stripe ($29.99/slot/month, $299.99/slot/year)
   - Subscriptions stored on Organization table
   - Webhooks maintain `payerId`, `stripeSubscriptionId`, `purchasedSlots`, `subscriptionTier`, `subscriptionExpiresAt`
   - User has `stripeCustomerId` (billing identity)

   **Stripe Architecture (Checkout + Customer Portal + Direct API):**
   - **New subscriptions:** Stripe Checkout (subscription mode) → `checkout.session.completed` webhook
   - **Upgrades (add slots):** Stripe Checkout (payment mode, prorated charge) → quantity synced post-checkout via `stripe.subscriptions.update()` at `organization.ts:1048-1056`
   - **Downgrades (reduce slots):** Direct API `stripe.subscriptions.update()` with `proration_behavior: "none"` at `organization.ts:556-564` — takes effect at renewal (handled by webhook `customer.subscription.updated`)
   - **Cancel pending update:** Direct API `stripe.invoices.voidInvoice()` + `stripe.subscriptions.update()` at `organization.ts:707-730` — reverts pending downgrade
   - **General management:** Stripe Customer Portal (cancel, view invoices, update payment method)
   - **Webhook events handled:** `checkout.session.completed`, `customer.subscription.created/updated/deleted/paused`, `customer.deleted`
   - **Deferred webhook:** `invoice.payment_failed` — deferred to Phase 2 (Stripe Smart Retries + built-in dunning management handle retries automatically; email notifications not yet ready)

2. **Social Referral System** (✅ Phase 1 Complete)
   - Earn premium via social posts
   - Free days stored in `earnedPremiumExpiresAt` on Organization
   - Immediate verification + 3 rescans (24-hour intervals via DBOS workflows)
   - FREE users: extend `earnedPremiumExpiresAt` ✅ WORKS
   - PREMIUM users: Stripe credits (currently stubbed with console.log)

**Critical Bugs Discovered:**

1. **Bug #1:** Social referral premium detection broken
   - Location: `packages/api/src/services/social-referral-verification.ts:158`
   - Current: `const isPremium = !!submission.organization.stripeCustomerId;`
   - Problem: `stripeCustomerId` does NOT exist on Organization (it's on User)
   - Impact: ALL orgs appear as FREE (isPremium always false)

2. **Bug #2:** Earned premium NOT checked anywhere for feature access
   - `isOrgPremium()` in `packages/feature-flags/src/premium.ts:707` - Only checks paid subscription
   - `hasPremiumAccessClause()` in `packages/api/src/access-control/organization.ts:15` - Only checks paid
   - `hasPremiumAccess()` in `packages/api/src/access-control/organization.ts:73` - Only checks paid
   - AI quota system ignores `earnedPremiumExpiresAt`
   - Frontend hooks ignore `earnedPremiumExpiresAt`
   - Impact: Users who earn premium via social posts DON'T get premium features

**Target State:**

- ✅ Single source of truth for premium checks (consolidates paid + earned)
- ✅ PREMIUM orgs get Stripe credits (reduce next invoice) when earning days
- ✅ FREE orgs get `earnedPremiumExpiresAt` extended (no Stripe involvement)
- ✅ All premium checks (AI quota, feature gating, frontend) respect BOTH sources
- ✅ Bug #1 fixed: Use correct org subscription fields for premium detection
- ✅ Bug #2 fixed: All premium checks consider `earnedPremiumExpiresAt`
- ✅ Stripe credits via `customers.createBalanceTransaction()` — server-side only, compatible with Checkout+Portal setup (auto-deducts from next subscription invoice)
- ⏭️ `invoice.payment_failed` deferred to Phase 2 (Stripe Smart Retries + dunning management handle this automatically)

**Why This Matters:**

- Users who earn premium via social posts should actually GET premium features
- Premium orgs should get tangible value (Stripe credits = money off next invoice)
- Single source of truth prevents bugs and inconsistencies
- Local Stripe CLI testing setup for collaborative development
- Production-ready for launch (all edge cases handled)

---

## Execution Brief

### RFC-001: Stripe Local Testing Setup ✅
**What happened:** Already operational — CF tunnel (`api-dev.engagekit.io` → `localhost:8000`) + Stripe dashboard webhook (4 events, Active). `invoice.payment_failed` deferred to Phase 2 (Stripe handles via Smart Retries + dunning).

**Test:** Verified existing setup — Stripe CLI installed, webhook endpoint active, env vars configured.

### RFC-002: Consolidate Premium Check Logic
**What happens:** Create `getOrgPremiumStatus()` function that checks BOTH paid AND earned premium, update all existing functions to use it, add `earnedPremiumExpiresAt` to all Prisma selects.

**Test:** Test with 4 org types: FREE+no earned, FREE+earned, PREMIUM+no earned, PREMIUM+earned. Verify all premium checks return correct results.

### RFC-003: Fix Social Referral Premium Detection + Stripe Credits
**What happens:** Fix broken `stripeCustomerId` check, implement Stripe customer balance transactions for PREMIUM orgs, calculate daily rate based on billing cycle, award credits to payer's Stripe customer.

**Test:** Submit social post as PREMIUM org (monthly billing) → verify Stripe credits applied. Submit as FREE org → verify `earnedPremiumExpiresAt` extended.

### RFC-004: Update AI Quota + Feature Gating
**What happens:** Add `earnedPremiumExpiresAt` to `ORG_SELECT` in ai-quota.ts, update all routers using `hasPremiumAccess()` to work with earned premium, ensure unlimited AI comments for earned premium users.

**Test:** Earn premium via social post → verify unlimited AI comments available. Verify LinkedIn scrape, profile import, target list features all work with earned premium.

### RFC-005: Frontend Integration
**What happens:** Update `useOrgSubscription` hook in both Next.js and extension, add `premiumSource` to API response, update settings page to show earned premium badge, update earn-premium page UI.

**Test:** Frontend shows "Premium (Earned)" badge when `earnedPremiumExpiresAt` active. Settings page displays earned premium status correctly.

### RFC-006: Database Migration & Verification
**What happens:** Run `db:push` for schema changes, run migration script for existing subscriptions, verify data integrity.

**Test:** No data loss, all existing subscriptions migrated correctly, earned premium dates preserved.

### RFC-007: Comprehensive Testing & Edge Cases
**What happens:** Test matrix covering all combinations, test Stripe credits applied correctly, test quota enforcement, test webhook handling, test subscription expiry transitions.

**Test:** Full regression test suite covering 16 edge cases (see Testing Matrix).

### Expected Outcome
- ✅ Users who earn premium via social posts GET premium features
- ✅ PREMIUM orgs get Stripe credits (money off invoices)
- ✅ FREE orgs get extended premium time
- ✅ Single source of truth for premium checks (no bugs)
- ✅ All edge cases handled (quota, expiry, billing cycle changes)
- ✅ Production-ready with local Stripe CLI testing verified collaboratively

---

## Phased Execution Workflow

**IMPORTANT:** This plan uses a phase-by-phase execution model with built-in approval gates.

### Workflow for Each RFC

**Step 1: Pre-Phase Research**
- Read existing implementation (current premium checks, Stripe integration)
- Analyze bug impact and affected files
- Identify all callsites that need updates
- Present findings to user for review

**Step 2: Detailed Planning**
- Create detailed implementation steps (file-by-file)
- Specify exact function signatures and migration steps
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

### Example Phase Execution

```
User: "Begin RFC-002: Consolidate Premium Check Logic"

Assistant (Pre-Phase Research):
- Reading existing premium checks across codebase...
- Found 7 locations checking premium status (see Bug #2 list)
- Current `isOrgPremium()` at premium.ts:707 only checks paid subscription
- `hasPremiumAccessClause()` returns Prisma WHERE — can't use OR for earned premium
- AI quota `ORG_SELECT` missing `earnedPremiumExpiresAt`
- Recommended: Create `getOrgPremiumStatus()` as single source of truth, update all callsites
- Do you approve proceeding with this approach?

User: "Yes, proceed"

Assistant (Detailed Planning):
- Will create `getOrgPremiumStatus()` in packages/feature-flags/src/premium.ts
- Will update `isOrgPremium()` as wrapper for backward compatibility
- Will update `hasPremiumAccess()` to fetch org and use new function
- Will update `hasPremiumAccessClause()` with comment about earned premium needing runtime check
- Files to modify: premium.ts, access-control/organization.ts, ai-quota.ts
- Ready to implement?

User: "Go ahead"

Assistant (Implementation):
[Creates getOrgPremiumStatus(), updates isOrgPremium(), updates hasPremiumAccess(), etc.]

Assistant (Testing):
Running post-phase tests:
✓ FREE org (no earned) → isPremium = false
✓ FREE org (earned active) → isPremium = true, source = "earned"
✓ PREMIUM org (no earned) → isPremium = true, source = "paid"
✓ PREMIUM org (earned active) → isPremium = true, source = latest expiry
✓ PREMIUM org (over quota + earned) → isPremium = true, source = "earned"
✓ All router callsites still compile

Phase RFC-002 complete. Proceed to RFC-003?
```

### Benefits
- **User Control:** Explicit approval gates prevent scope creep
- **Early Feedback:** Catch issues before building on wrong foundation
- **Visibility:** Clear status at each milestone
- **Quality:** Testing built into every phase
- **Flexibility:** Easy to adjust course between phases

---

## Architecture Decisions

### ADR-001: Two Premium Sources (Paid + Earned)

**Decision:** Organizations can have premium from TWO sources:
1. Paid subscription (`subscriptionTier = "PREMIUM"` + `subscriptionExpiresAt`)
2. Earned via social referral (`earnedPremiumExpiresAt`)

**Rationale:**
- Paid and earned premium are independent systems
- Users should get premium features from EITHER source
- Use latest expiry date (max of paid vs earned)
- Simple OR logic: `isPremium = hasPaidPremium() || hasEarnedPremium()`

**Implementation:**
```typescript
export function getOrgPremiumStatus(org: {
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
  earnedPremiumExpiresAt: Date | null;
  purchasedSlots: number;
  accountCount: number;
}): {
  isPremium: boolean;
  source: "paid" | "earned" | "none";
  expiresAt: Date | null;
  reason?: string;
} {
  const now = new Date();

  // Check paid subscription
  const hasPaid =
    org.subscriptionTier === "PREMIUM" &&
    org.subscriptionExpiresAt &&
    org.subscriptionExpiresAt > now &&
    org.accountCount <= org.purchasedSlots; // Quota check

  // Check earned premium
  const hasEarned =
    org.earnedPremiumExpiresAt &&
    org.earnedPremiumExpiresAt > now;

  if (hasPaid && hasEarned) {
    // Both active - use latest expiry
    const paidExpiry = org.subscriptionExpiresAt!;
    const earnedExpiry = org.earnedPremiumExpiresAt!;
    return {
      isPremium: true,
      source: paidExpiry > earnedExpiry ? "paid" : "earned",
      expiresAt: paidExpiry > earnedExpiry ? paidExpiry : earnedExpiry,
    };
  }

  if (hasPaid) {
    return {
      isPremium: true,
      source: "paid",
      expiresAt: org.subscriptionExpiresAt,
    };
  }

  if (hasEarned) {
    return {
      isPremium: true,
      source: "earned",
      expiresAt: org.earnedPremiumExpiresAt,
    };
  }

  return {
    isPremium: false,
    source: "none",
    expiresAt: null,
    reason: "no_active_premium",
  };
}
```

**Benefits:**
- Single function checks both sources
- Clear precedence (latest expiry wins)
- Easy to extend (add more sources later)
- Works for ALL premium checks throughout codebase

---

### ADR-002: Stripe Credits for PREMIUM Users

**Decision:** When PREMIUM orgs earn days via social referral, award Stripe customer balance credits (not extend subscription).

**Rationale:**
- Stripe handles everything (credits, invoices, carryover)
- Credits reduce next invoice automatically
- No need to modify subscription end date
- No edge cases with billing cycle switches
- Credits stack naturally (60 days earned = $60-82 credit depending on billing cycle)
- If user cancels, credits remain (can be converted to earned premium on cancellation)
- `customers.createBalanceTransaction()` is a server-side Stripe API call — NOT a user-initiated flow, fully compatible with our Checkout+Portal architecture (credits auto-deduct from next subscription invoice)

**Implementation:**
```typescript
async function awardDaysToPremiumOrg(orgId: string, daysEarned: number) {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: {
      payer: { select: { stripeCustomerId: true } }
    },
  });

  if (!org.payer?.stripeCustomerId) {
    throw new Error("No Stripe customer for premium org");
  }

  // Fetch subscription to get billing cycle
  const subscription = await stripe.subscriptions.retrieve(
    org.stripeSubscriptionId!,
  );

  // Calculate daily rate based on billing cycle
  // Monthly: $29.99/mo = $1.00/day
  // Yearly: $299.99/yr = $0.822/day
  const interval = subscription.items.data[0].price.recurring?.interval;
  const pricePerDay = interval === "month"
    ? 29.99 / 30  // $1.00/day
    : 299.99 / 365;  // $0.822/day

  const creditAmount = Math.round(daysEarned * pricePerDay * 100); // Convert to cents

  // Award credit to Stripe customer balance
  await stripe.customers.createBalanceTransaction(
    org.payer.stripeCustomerId,
    {
      amount: -creditAmount, // Negative = credit
      currency: "usd",
      description: `Social referral credit: ${daysEarned} days earned`,
    },
  );

  console.log(`[Stripe Credit] Awarded $${(creditAmount / 100).toFixed(2)} credit for ${daysEarned} days`);
}
```

**Edge Cases Handled:**
- Premium user cancels → credits remain, convert to `earnedPremiumExpiresAt` on webhook
- Premium user downgrades slots but stays premium → credits applied to new rate
- Credits exceed invoice → automatically carry forward to next billing cycle
- User switches monthly ↔ yearly → credits applied at new rate

**Note:** Credits are applied to the PAYER's Stripe customer account, not the organization.

---

### ADR-003: FREE Orgs Extend earnedPremiumExpiresAt (Unchanged)

**Decision:** FREE orgs earning days via social referral extend `earnedPremiumExpiresAt` directly (no Stripe involvement).

**Rationale:**
- FREE orgs don't have Stripe customer (no subscription)
- Simple date extension logic (already implemented in Phase 1)
- No need to create Stripe customer for free users
- Clean separation: Stripe for paid, DB field for earned

**Implementation (Already Works):**
```typescript
async function awardDaysToFreeOrg(orgId: string, daysEarned: number) {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { earnedPremiumExpiresAt: true },
  });

  const now = new Date();
  const currentExpiry = org.earnedPremiumExpiresAt || now;

  // If expired, start from now. If active, extend from current expiry.
  const baseDate = currentExpiry > now ? currentExpiry : now;
  const newExpiry = addDays(baseDate, daysEarned);

  await db.organization.update({
    where: { id: orgId },
    data: { earnedPremiumExpiresAt: newExpiry },
  });
}
```

**No Changes Needed:** This logic already works in Phase 1 implementation.

---

### ADR-004: Prisma Select Clause Includes earnedPremiumExpiresAt

**Decision:** All premium checks MUST select `earnedPremiumExpiresAt` alongside paid subscription fields.

**Rationale:**
- Premium checks need BOTH sources to be accurate
- Missing `earnedPremiumExpiresAt` in select = bug (defaults to null)
- Standardize select clause across codebase

**Standard Select Clause:**
```typescript
const ORG_PREMIUM_SELECT = {
  subscriptionTier: true,
  subscriptionExpiresAt: true,
  earnedPremiumExpiresAt: true,
  purchasedSlots: true,
  // accountCount computed via relation or count query
} as const;
```

**Usage:**
```typescript
const org = await db.organization.findUnique({
  where: { id: orgId },
  select: {
    ...ORG_PREMIUM_SELECT,
    linkedInAccounts: { select: { id: true } }, // For accountCount
  },
});

const accountCount = org.linkedInAccounts.length;
const premiumStatus = getOrgPremiumStatus({ ...org, accountCount });
```

**Files Requiring Updates:**
- `packages/api/src/utils/ai-quota.ts` (ORG_SELECT)
- `packages/api/src/access-control/organization.ts` (hasPremiumAccessClause)
- All routers using `hasPremiumAccess()`
- Frontend hooks (`use-org-subscription.ts` in nextjs and wxt-extension)

---

### ADR-005: invoice.payment_failed Deferred to Phase 2

**Decision:** Skip `invoice.payment_failed` webhook handler for V1.0.

**Rationale:**
- Stripe has built-in dunning management: Smart Retries with exponential backoff over 3 days
- Retry schedule configurable in Stripe Dashboard (Settings → Billing → Subscriptions)
- If all retries fail, Stripe automatically cancels subscription → triggers `customer.subscription.deleted` which we already handle
- Email notifications are a Phase 2 feature anyway (no email service ready)
- Handler would be entirely stubs (console.log + TODO comments)

**Phase 2 Implementation:**
- When email service is ready, add `invoice.payment_failed` handler
- Send payment failure notification to payer
- Add "Payment failed" banner in org settings
- Register `invoice.payment_failed` event in Stripe webhook dashboard

---

### ADR-006: Local Stripe Testing via Cloudflare Tunnel

**Decision:** Use existing Cloudflare tunnel for local webhook testing instead of Stripe CLI forwarding.

**Rationale:**
- CF tunnel already configured: `api-dev.engagekit.io` → `localhost:8000`
- Stripe webhook endpoint already registered in dashboard: `https://api-dev.engagekit.io/api/webhooks/stripe` (4 events, Active)
- Dev webhook secret already in environment
- No additional tooling needed — real Stripe events hit local server through tunnel
- Stripe CLI still available for triggering test events if needed (`stripe trigger`)

**Setup:**
- Local API server runs on `localhost:8000`
- CF tunnel proxies `api-dev.engagekit.io` → `localhost:8000`
- Stripe Dashboard webhook points to `https://api-dev.engagekit.io/api/webhooks/stripe`
- `STRIPE_WEBHOOK_SECRET` env var matches the dashboard webhook secret

---

## Critical Bugs Identified

### Bug #1: Social Referral Premium Detection Broken

**Location:** `packages/api/src/services/social-referral-verification.ts:158`

**Current Code:**
```typescript
const isPremium = !!submission.organization.stripeCustomerId;
```

**Problem:**
- `stripeCustomerId` does NOT exist on Organization model
- Organization has: `payerId`, `stripeSubscriptionId`, `subscriptionTier`, `subscriptionExpiresAt`
- User (payer) has: `stripeCustomerId`
- This means `submission.organization.stripeCustomerId` is always undefined
- `!!undefined` = `false`
- **ALL orgs appear as FREE (isPremium always false)**

**Impact:**
- PREMIUM orgs don't get Stripe credits (think they're free)
- Social referral system awards `earnedPremiumExpiresAt` to ALL orgs (even premium)
- Premium users don't get invoice credits they should be getting

**Root Cause:**
- Confusion between Organization fields and User fields
- Org payment system uses `Organization.subscriptionTier` and `Organization.subscriptionExpiresAt` for premium checks
- But social referral verification used wrong field (`stripeCustomerId` from old user-centric system)

**Fix:**
```typescript
// BEFORE (broken):
const isPremium = !!submission.organization.stripeCustomerId;

// AFTER (correct):
const isPremium =
  submission.organization.subscriptionTier === "PREMIUM" &&
  submission.organization.subscriptionExpiresAt &&
  submission.organization.subscriptionExpiresAt > new Date();
```

**Files to Fix:**
- `packages/api/src/services/social-referral-verification.ts` (line 158)

**Testing:**
- Create PREMIUM org → submit social post → verify Stripe credits applied (not earnedPremiumExpiresAt)
- Create FREE org → submit social post → verify earnedPremiumExpiresAt extended (no Stripe calls)

---

### Bug #2: Earned Premium Not Checked Anywhere

**Problem:**
- Users earn premium via social posts → `earnedPremiumExpiresAt` set
- But NO premium checks consider this field
- Result: Users with earned premium DON'T get premium features

**Affected Functions:**

1. **`isOrgPremium()` in `packages/feature-flags/src/premium.ts:707`**
   - Only checks: `subscriptionTier`, `subscriptionExpiresAt`, `purchasedSlots`, `accountCount`
   - Ignores: `earnedPremiumExpiresAt`
   - Impact: Frontend thinks user is not premium

2. **`hasPremiumAccessClause()` in `packages/api/src/access-control/organization.ts:15`**
   - Returns Prisma where clause: `{ subscriptionTier: "PREMIUM", subscriptionExpiresAt: { gt: new Date() } }`
   - Ignores: `earnedPremiumExpiresAt`
   - Impact: Can't create Prisma clause for earned premium (need OR logic)

3. **`hasPremiumAccess()` in `packages/api/src/access-control/organization.ts:73`**
   - Calls `hasPremiumAccessClause()` internally
   - Impact: Server-side premium checks fail for earned premium

4. **AI Quota in `packages/api/src/utils/ai-quota.ts`**
   - `ORG_SELECT` doesn't include `earnedPremiumExpiresAt`
   - Calls `isOrgPremium()` which ignores earned premium
   - Impact: Users with earned premium get LIMITED AI comments (should be unlimited)

5. **Frontend Hooks**
   - `apps/nextjs/src/hooks/use-org-subscription.ts`
   - `apps/wxt-extension/entrypoints/linkedin.content/hooks/use-org-subscription.ts`
   - Only check paid subscription fields
   - Impact: Frontend doesn't show earned premium badge

**Root Cause:**
- Org payment system implemented first (only considered paid subscriptions)
- Social referral system added `earnedPremiumExpiresAt` later
- But existing premium checks were never updated to check BOTH sources
- Two independent systems never integrated

**Fix Strategy:**
1. Create `getOrgPremiumStatus()` function (checks BOTH paid and earned)
2. Update `isOrgPremium()` to call new function
3. Update `hasPremiumAccessClause()` to use OR logic (Prisma doesn't support OR in nested where, need runtime check)
4. Update `hasPremiumAccess()` to fetch org and call `getOrgPremiumStatus()`
5. Update AI quota to include `earnedPremiumExpiresAt` in select
6. Update frontend hooks to fetch and display earned premium

**Files to Fix:**
- `packages/feature-flags/src/premium.ts` (isOrgPremium, getPremiumStatus)
- `packages/api/src/access-control/organization.ts` (hasPremiumAccessClause, hasPremiumAccess)
- `packages/api/src/utils/ai-quota.ts` (ORG_SELECT, premium check)
- `packages/api/src/router/organization.ts` (return earnedPremiumExpiresAt in status)
- `apps/nextjs/src/hooks/use-org-subscription.ts`
- `apps/wxt-extension/entrypoints/linkedin.content/hooks/use-org-subscription.ts`

**Testing:**
- Earn premium via social post → verify AI quota becomes unlimited
- Verify LinkedIn scrape, profile import, target list features all work
- Verify frontend shows "Premium (Earned)" badge

---

## Database Schema

### Organization Model (Current State)

```prisma
model Organization {
  id                     String    @id @default(uuid())
  name                   String
  orgSlug                String?   @unique
  purchasedSlots         Int       @default(1)

  // Paid Subscription Fields (from Org Payment System)
  payerId                String?
  stripeSubscriptionId   String?   @unique
  subscriptionTier       String    @default("FREE")  // "FREE" | "PREMIUM"
  subscriptionExpiresAt  DateTime?

  // Earned Premium Fields (from Social Referral System)
  earnedPremiumDays      Int       @default(0)
  earnedPremiumExpiresAt DateTime?

  // Relations
  payer                  User?     @relation("OrgPayer", fields: [payerId], references: [id])
  socialSubmissions      SocialSubmission[]
  linkedInAccounts       LinkedInAccount[]
  members                OrganizationMember[]

  @@index([payerId])
  @@index([stripeSubscriptionId])
}
```

### User Model (Billing Identity)

```prisma
model User {
  id                  String   @id  // Clerk user ID
  email               String?
  imageUrl            String?
  stripeCustomerId    String?  @unique  // Stripe billing identity

  // Relations
  paidOrganizations   Organization[] @relation("OrgPayer")
  memberships         OrganizationMember[]
}
```

### SocialSubmission Model (Already Implemented)

```prisma
model SocialSubmission {
  id                String   @id @default(uuid())
  organizationId    String
  url               String
  urlNormalized     String   @unique  // Global duplicate detection
  platform          Platform // X, LINKEDIN, THREADS, FACEBOOK
  caption           String
  status            SubmissionStatus
  daysEarned        Int      @default(0)
  lastScannedAt     DateTime?
  scanCount         Int      @default(0)
  createdAt         DateTime @default(now())

  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
  @@index([urlNormalized])
  @@index([createdAt])
}
```

**Schema Changes Needed:**
- ✅ None (all fields already exist)
- ✅ No migration needed (db:push only to sync types)

---

## Phased Delivery Plan

### Current Status

✅ **RFC-001**: Stripe Local Testing Setup (COMPLETE — existing CF tunnel + Stripe dashboard webhook)
⏳ **RFC-002**: Consolidate Premium Check Logic (PLANNED)
⏳ **RFC-003**: Fix Social Referral Premium Detection + Stripe Credits (PLANNED)
⏳ **RFC-004**: Update AI Quota + Feature Gating (PLANNED)
⏳ **RFC-005**: Frontend Integration (PLANNED)
⏳ **RFC-006**: Database Migration & Verification (PLANNED)
⏳ **RFC-007**: Comprehensive Testing & Edge Cases (PLANNED)

**Immediate Next Steps:** RFC-002 (Consolidate Premium Check Logic)

---

## RFCs

### RFC-001: Stripe Local Testing Setup ✅ COMPLETE

**Summary:** Local Stripe testing environment already operational via existing infrastructure.

**Status:** COMPLETE (pre-existing setup)

**What Was Already In Place:**
- Stripe CLI installed at `/opt/homebrew/bin/stripe`
- Cloudflare tunnel: `api-dev.engagekit.io` → `localhost:8000`
- Stripe webhook endpoint registered: `https://api-dev.engagekit.io/api/webhooks/stripe` (4 events, Active)
- `STRIPE_WEBHOOK_SECRET` configured in environment
- Webhook handler at `packages/api/src/api/webhooks/stripe.webhook.ts` handles 6 event types

**Scope Change:**
- `invoice.payment_failed` deferred to Phase 2 (Stripe Smart Retries + dunning management handle this automatically)
- No standalone testing doc needed (collaborative testing approach)

**Test Card Numbers (for reference):**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Auth required: `4000 0025 0000 3155`

**Acceptance Criteria:**
- [x] Stripe CLI installed and authenticated
- [x] Webhook endpoint active (CF tunnel → localhost:8000)
- [x] Webhook handlers verified in codebase
- [x] User can test Stripe flows end-to-end locally

**What's Functional Now:** Local Stripe testing environment ready via CF tunnel + Stripe dashboard webhook

**Ready For:** RFC-002 (Consolidate Premium Check Logic)

---

### RFC-002: Consolidate Premium Check Logic

**Summary:** Create single source of truth function for premium checks, update all existing premium checks to use it.

**Dependencies:** RFC-001 (Stripe Local Testing)

**Stages:**

**Stage 0: Pre-Phase Research**
1. Grep all files for `subscriptionTier` to find all premium checks
2. Analyze current implementation of `isOrgPremium()`, `hasPremiumAccessClause()`, `hasPremiumAccess()`
3. Find all callsites (routers, AI quota, frontend hooks)
4. Create comprehensive list of files requiring updates
5. Present findings to user

**Stage 1: Create Consolidated Premium Status Function**
1. Create `packages/feature-flags/src/premium.ts` (or update existing)
2. Implement `getOrgPremiumStatus()` function:
   ```typescript
   export function getOrgPremiumStatus(org: {
     subscriptionTier: string;
     subscriptionExpiresAt: Date | null;
     earnedPremiumExpiresAt: Date | null;
     purchasedSlots: number;
     accountCount: number;
   }): {
     isPremium: boolean;
     source: "paid" | "earned" | "none";
     expiresAt: Date | null;
     reason?: string;
   }
   ```
3. Implement logic checking BOTH paid and earned premium
4. Use latest expiry date when both active
5. Include quota compliance check for paid premium
6. Add comprehensive JSDoc comments
7. Write unit tests

**Stage 2: Update isOrgPremium() Wrapper**
1. Update existing `isOrgPremium()` to call `getOrgPremiumStatus()`
2. Return boolean for backward compatibility:
   ```typescript
   export function isOrgPremium(org: {
     subscriptionTier: string;
     subscriptionExpiresAt: Date | null;
     earnedPremiumExpiresAt: Date | null;
     purchasedSlots: number;
     accountCount: number;
   }): boolean {
     return getOrgPremiumStatus(org).isPremium;
   }
   ```
3. Verify all existing callsites still work

**Stage 3: Update hasPremiumAccessClause() for OR Logic**
1. Update `packages/api/src/access-control/organization.ts`
2. Problem: Prisma doesn't support OR in nested where clauses elegantly
3. Solution: Keep simple clause for paid premium, handle earned premium in runtime check
4. Update `hasPremiumAccessClause()`:
   ```typescript
   export function hasPremiumAccessClause() {
     // Returns clause for PAID premium only
     // Earned premium must be checked separately (see hasPremiumAccess())
     return {
       subscriptionTier: "PREMIUM",
       subscriptionExpiresAt: { gt: new Date() },
     };
   }
   ```
5. Add comment explaining earned premium needs separate check

**Stage 4: Update hasPremiumAccess() Runtime Check**
1. Update `hasPremiumAccess()` function:
   ```typescript
   export async function hasPremiumAccess(
     db: PrismaClient,
     { orgId }: { orgId: string },
   ): Promise<boolean> {
     const org = await db.organization.findUnique({
       where: { id: orgId },
       select: {
         subscriptionTier: true,
         subscriptionExpiresAt: true,
         earnedPremiumExpiresAt: true,
         purchasedSlots: true,
         linkedInAccounts: { select: { id: true } },
       },
     });

     if (!org) return false;

     const accountCount = org.linkedInAccounts.length;
     return getOrgPremiumStatus({ ...org, accountCount }).isPremium;
   }
   ```
2. Test with all 4 org types (FREE+no earned, FREE+earned, PREMIUM+no earned, PREMIUM+earned)

**Stage 5: Update All Router Callsites**
1. Find all routers using `hasPremiumAccess()`
2. Update each to pass correct parameters
3. Verify no breaking changes
4. Files likely affected:
   - `packages/api/src/router/profile-import.ts`
   - `packages/api/src/router/linkedin-scrape-apify.ts`
   - `packages/api/src/router/target-list.ts`
   - Any other routers with premium gating

**Stage 6: Export Consolidated Types**
1. Export `PremiumStatus` type from `premium.ts`
2. Export `OrgPremiumFields` type for consistent select clauses
3. Update all imports across codebase

**Post-Phase Testing:**
1. Test with FREE org (no earned) → isPremium = false
2. Test with FREE org (earned active) → isPremium = true, source = "earned"
3. Test with PREMIUM org (no earned) → isPremium = true, source = "paid"
4. Test with PREMIUM org (earned active) → isPremium = true, source = paid/earned (whichever expires later)
5. Test with PREMIUM org (over quota) → isPremium = false (paid revoked), but earned still works if active
6. Verify all routers still work correctly

**Acceptance Criteria:**
- [ ] `getOrgPremiumStatus()` implemented and tested
- [ ] `isOrgPremium()` updated to use new function
- [ ] `hasPremiumAccess()` checks BOTH paid and earned premium
- [ ] All routers using premium checks updated
- [ ] Unit tests pass for all 4 org types
- [ ] No breaking changes to existing functionality
- [ ] TypeScript types exported correctly

**What's Functional Now:** Single source of truth for premium checks, all existing premium checks work with earned premium

**Ready For:** RFC-003 (Fix Social Referral Premium Detection + Stripe Credits)

---

### RFC-003: Fix Social Referral Premium Detection + Stripe Credits

**Summary:** Fix broken premium detection bug in social referral verification, implement Stripe customer balance transactions for PREMIUM orgs.

**Dependencies:** RFC-002 (Consolidated Premium Logic)

**Stages:**

**Stage 0: Pre-Phase Research**
1. Read current social referral verification implementation
2. Locate broken premium check (line 158)
3. Understand Stripe customer balance API
4. Review org payment plan for billing cycle calculation
5. Present fix strategy to user

**Stage 1: Fix Premium Detection Bug**
1. Open `packages/api/src/services/social-referral-verification.ts`
2. Locate line 158: `const isPremium = !!submission.organization.stripeCustomerId;`
3. Replace with correct check:
   ```typescript
   const isPremium =
     submission.organization.subscriptionTier === "PREMIUM" &&
     submission.organization.subscriptionExpiresAt &&
     submission.organization.subscriptionExpiresAt > new Date();
   ```
4. Update Prisma include to fetch correct fields:
   ```typescript
   include: {
     organization: {
       select: {
         id: true,
         subscriptionTier: true,
         subscriptionExpiresAt: true,
         earnedPremiumExpiresAt: true,
         stripeSubscriptionId: true,
         payer: {
           select: {
             id: true,
             stripeCustomerId: true,
           },
         },
       },
     },
   }
   ```
5. Verify no other instances of broken check exist (grep for `stripeCustomerId`)

**Stage 2: Implement Stripe Credit Calculation**
1. Create helper function `calculateDailyRate()`:
   ```typescript
   async function calculateDailyRate(subscriptionId: string): Promise<number> {
     const subscription = await stripe.subscriptions.retrieve(subscriptionId);
     const interval = subscription.items.data[0].price.recurring?.interval;

     // Monthly: $29.99/mo / 30 = $1.00/day
     // Yearly: $299.99/yr / 365 = $0.822/day
     return interval === "month"
       ? 29.99 / 30
       : 299.99 / 365;
   }
   ```
2. Handle edge case: subscription has quantity > 1 (multiple slots)
3. Credit should be per-slot rate (not total subscription amount)

**Stage 3: Implement Stripe Customer Balance Transaction**
1. Create helper function `awardStripeCreditsToPremiumOrg()`:
   ```typescript
   async function awardStripeCreditsToPremiumOrg(
     orgId: string,
     daysEarned: number,
   ): Promise<void> {
     const org = await db.organization.findUnique({
       where: { id: orgId },
       include: {
         payer: { select: { stripeCustomerId: true } },
       },
     });

     if (!org?.stripeSubscriptionId) {
       throw new Error("No subscription for premium org");
     }

     if (!org.payer?.stripeCustomerId) {
       throw new Error("No Stripe customer for payer");
     }

     const dailyRate = await calculateDailyRate(org.stripeSubscriptionId);
     const creditAmount = Math.round(daysEarned * dailyRate * 100); // Convert to cents

     await stripe.customers.createBalanceTransaction(
       org.payer.stripeCustomerId,
       {
         amount: -creditAmount, // Negative = credit
         currency: "usd",
         description: `Social referral credit: ${daysEarned} days earned`,
       },
     );

     console.log(`[Stripe Credit] Org ${orgId} awarded $${(creditAmount / 100).toFixed(2)} for ${daysEarned} days`);
   }
   ```
2. Add error handling for Stripe API failures
3. Add retry logic for transient errors

**Stage 4: Update Social Referral Award Logic**
1. Update `awardDaysToOrganization()` function in social referral service
2. Replace stub with real Stripe credit call:
   ```typescript
   if (isPremium) {
     // BEFORE (stub):
     // console.log(`[STUB] Would credit ${daysToAward} days to Stripe customer`);

     // AFTER (real implementation):
     await awardStripeCreditsToPremiumOrg(orgId, daysToAward);
   } else {
     // FREE org: extend earnedPremiumExpiresAt (already works)
     await awardDaysToFreeOrg(orgId, daysToAward);
   }
   ```
3. Test with real Stripe test mode

**Stage 5: Handle Edge Cases**
1. What if user cancels subscription during rescan period?
   - Check subscription status before awarding credits
   - If canceled, convert to `earnedPremiumExpiresAt` instead
2. What if user switches billing cycle (monthly → yearly)?
   - Credits already in customer balance still apply
   - New credits calculated at new rate
3. What if Stripe API call fails?
   - Log error and retry
   - Don't block social submission (mark as "pending_credit")
   - Implement retry job for failed credits

**Stage 6: Add Monitoring and Logging**
1. Log all Stripe credit transactions
2. Add metrics for successful/failed credit awards
3. Create dashboard query for total credits awarded per month
4. Add error alerting for repeated Stripe API failures

**Post-Phase Testing:**
1. Submit social post as PREMIUM org (monthly) → verify Stripe credit applied
2. Submit social post as PREMIUM org (yearly) → verify correct daily rate used
3. Submit social post as FREE org → verify `earnedPremiumExpiresAt` extended (no Stripe call)
4. Simulate Stripe API failure → verify error logged and submission not blocked
5. Check Stripe dashboard → verify customer balance shows credits
6. Verify next invoice deducts credits automatically

**Acceptance Criteria:**
- [ ] Premium detection bug fixed (uses correct org fields)
- [ ] Stripe credit calculation correct for monthly ($1.00/day based on $29.99/mo)
- [ ] Stripe credit calculation correct for yearly ($0.822/day based on $299.99/yr)
- [ ] Credits applied to payer's Stripe customer balance
- [ ] FREE orgs still use `earnedPremiumExpiresAt` (no regression)
- [ ] Error handling for Stripe API failures
- [ ] Logging and monitoring in place
- [ ] Manual test: PREMIUM org gets invoice credit

**What's Functional Now:** PREMIUM orgs get real Stripe credits when earning days via social referral

**Ready For:** RFC-004 (Update AI Quota + Feature Gating)

---

### RFC-004: Update AI Quota + Feature Gating

**Summary:** Add `earnedPremiumExpiresAt` to all relevant Prisma selects, ensure AI quota and feature gating respect earned premium.

**Dependencies:** RFC-003 (Stripe Credits Working)

**Stages:**

**Stage 0: Pre-Phase Research**
1. Read AI quota implementation in `packages/api/src/utils/ai-quota.ts`
2. Identify all routers using `hasPremiumAccess()`
3. Find routers using simple tier check (`subscriptionTier === "PREMIUM"`)
4. Create comprehensive list of files requiring updates
5. Present findings to user

**Stage 1: Update AI Quota Select Clause**
1. Open `packages/api/src/utils/ai-quota.ts`
2. Locate `ORG_SELECT` constant
3. Add `earnedPremiumExpiresAt` to select:
   ```typescript
   const ORG_SELECT = {
     subscriptionTier: true,
     subscriptionExpiresAt: true,
     earnedPremiumExpiresAt: true, // ADD THIS
     purchasedSlots: true,
     linkedInAccounts: { select: { id: true } },
   } as const;
   ```
4. Verify AI quota calculation uses `getOrgPremiumStatus()`

**Stage 2: Update AI Quota Premium Check**
1. Find where AI quota checks premium status
2. Replace simple tier check with consolidated function:
   ```typescript
   // BEFORE:
   const isPremium = org.subscriptionTier === "PREMIUM";

   // AFTER:
   const accountCount = org.linkedInAccounts.length;
   const premiumStatus = getOrgPremiumStatus({ ...org, accountCount });
   const isPremium = premiumStatus.isPremium;
   ```
3. Verify unlimited AI comments for earned premium users

**Stage 3: Update target-list.ts Router**
1. Open `packages/api/src/router/target-list.ts`
2. Find simple tier check (line 82 or similar)
3. Replace with consolidated premium check
4. Update Prisma select to include `earnedPremiumExpiresAt`
5. Test target list features work with earned premium

**Stage 4: Update profile-import.ts Router**
1. Open `packages/api/src/router/profile-import.ts`
2. Find `hasPremiumAccess()` calls
3. Verify using updated function from RFC-002
4. Test profile import works with earned premium

**Stage 5: Update linkedin-scrape-apify.ts Router**
1. Open `packages/api/src/router/linkedin-scrape-apify.ts`
2. Find premium access checks
3. Update to use consolidated function
4. Test LinkedIn scraping works with earned premium

**Stage 6: Audit All Premium-Gated Features**
1. Search codebase for all premium checks
2. Create checklist of features to test:
   - AI-powered comments (unlimited for premium)
   - Hyperbrowser virtual runs (premium only)
   - Auto-engagement campaigns (premium only)
   - LinkedIn profile scraping (premium only)
   - Profile import (premium only)
   - Target list advanced features (premium only)
3. Test each feature with earned premium org

**Post-Phase Testing:**
1. Earn premium via social post (FREE org → earned premium)
2. Test AI comments → verify unlimited quota
3. Test target list → verify advanced features unlocked
4. Test profile import → verify works
5. Test LinkedIn scrape → verify works
6. Verify console logs show "Premium (Earned)" correctly
7. Test PREMIUM org (paid) → verify all features still work (no regression)

**Acceptance Criteria:**
- [ ] `ORG_SELECT` includes `earnedPremiumExpiresAt`
- [ ] AI quota respects earned premium (unlimited comments)
- [ ] Target list features work with earned premium
- [ ] Profile import works with earned premium
- [ ] LinkedIn scrape works with earned premium
- [ ] All premium-gated features tested with earned premium
- [ ] No regressions for paid premium users
- [ ] Console logs correctly identify premium source

**What's Functional Now:** All premium features work for users with earned premium

**Ready For:** RFC-005 (Frontend Integration)

---

### RFC-005: Frontend Integration

**Summary:** Update frontend hooks to fetch and display earned premium, add premium source badge to UI.

**Dependencies:** RFC-004 (Feature Gating Working)

**Stages:**

**Stage 0: Pre-Phase Research**
1. Read current `useOrgSubscription` hook implementation (Next.js)
2. Read current `useOrgSubscription` hook implementation (extension)
3. Find where premium status is displayed in settings page
4. Identify earn-premium page components
5. Present UI mockups for premium badges to user

**Stage 1: Update Next.js useOrgSubscription Hook**
1. Open `apps/nextjs/src/hooks/use-org-subscription.ts`
2. Update tRPC query to fetch `earnedPremiumExpiresAt`
3. Add `premiumSource` to return value:
   ```typescript
   export function useOrgSubscription() {
     const { data: org } = api.organization.getCurrent.useQuery();

     if (!org) return { isPremium: false, source: "none" };

     const accountCount = org.linkedInAccounts?.length ?? 0;
     const premiumStatus = getOrgPremiumStatus({
       subscriptionTier: org.subscriptionTier,
       subscriptionExpiresAt: org.subscriptionExpiresAt,
       earnedPremiumExpiresAt: org.earnedPremiumExpiresAt,
       purchasedSlots: org.purchasedSlots,
       accountCount,
     });

     return {
       isPremium: premiumStatus.isPremium,
       source: premiumStatus.source,
       expiresAt: premiumStatus.expiresAt,
     };
   }
   ```
4. Update all callsites to use new return shape

**Stage 2: Update Extension useOrgSubscription Hook**
1. Open `apps/wxt-extension/entrypoints/linkedin.content/hooks/use-org-subscription.ts`
2. Apply same updates as Next.js hook
3. Ensure extension fetches `earnedPremiumExpiresAt` from API
4. Test in extension context

**Stage 3: Update Organization Router to Return Earned Premium**
1. Open `packages/api/src/router/organization.ts`
2. Find `getCurrent` query (or similar)
3. Ensure select includes `earnedPremiumExpiresAt`:
   ```typescript
   select: {
     id: true,
     name: true,
     orgSlug: true,
     subscriptionTier: true,
     subscriptionExpiresAt: true,
     earnedPremiumExpiresAt: true, // ADD THIS
     purchasedSlots: true,
     linkedInAccounts: { select: { id: true } },
   }
   ```
4. Add `premiumSource` to return value if not already present

**Stage 4: Update Settings Page Premium Badge**
1. Open settings page component (likely `/[orgSlug]/settings/page.tsx`)
2. Use updated `useOrgSubscription` hook
3. Display premium source:
   ```tsx
   const { isPremium, source, expiresAt } = useOrgSubscription();

   {isPremium && (
     <Badge variant={source === "paid" ? "default" : "secondary"}>
       {source === "paid" ? "Premium (Paid)" : "Premium (Earned)"}
       {expiresAt && ` - Expires ${formatDate(expiresAt)}`}
     </Badge>
   )}
   ```
4. Style earned premium badge differently (maybe green vs purple)

**Stage 5: Update Earn Premium Page**
1. Open `/[orgSlug]/earn-premium/page.tsx`
2. Add section showing current earned premium status
3. Display days earned, expiry date, premium source
4. Show "Premium Status" card at top:
   ```tsx
   {isPremium && source === "earned" && (
     <Card>
       <CardHeader>
         <CardTitle>You have Premium (Earned)!</CardTitle>
       </CardHeader>
       <CardContent>
         <p>Your premium access expires on {formatDate(expiresAt)}</p>
         <p>Keep sharing to extend your premium time.</p>
       </CardContent>
     </Card>
   )}
   ```

**Stage 6: Add Premium Source Indicator Throughout App**
1. Add premium badge to org switcher (if applicable)
2. Add premium indicator to sidebar (if applicable)
3. Show premium source in account settings
4. Ensure consistent messaging ("Premium (Paid)" vs "Premium (Earned)")

**Post-Phase Testing:**
1. Earn premium via social post
2. Verify settings page shows "Premium (Earned)" badge
3. Verify correct expiry date displayed
4. Verify earn-premium page shows current status
5. Test in extension → verify premium status syncs
6. Test paid premium user → verify shows "Premium (Paid)"
7. Verify UI looks polished (no rough edges)

**Acceptance Criteria:**
- [ ] `useOrgSubscription` hook returns `premiumSource`
- [ ] Settings page displays earned premium badge
- [ ] Earn-premium page shows current premium status
- [ ] Extension hook updated to match Next.js hook
- [ ] UI distinguishes paid vs earned premium
- [ ] All premium indicators consistent across app
- [ ] No visual regressions

**What's Functional Now:** Frontend displays earned premium status, users see "Premium (Earned)" badge

**Ready For:** RFC-006 (Database Migration & Verification)

---

### RFC-006: Database Migration & Verification

**Summary:** Run db:push to sync schema types, run migration script for existing subscriptions, verify data integrity.

**Dependencies:** RFC-005 (Frontend Integration Complete)

**Stages:**

**Stage 0: Pre-Phase Research**
1. Review current database state
2. Check if any schema changes needed (likely none, just type sync)
3. Identify existing subscriptions that need verification
4. Create backup plan before migration
5. Present migration strategy to user

**Stage 1: Backup Current Database**
1. Export current database state:
   ```bash
   pg_dump -h localhost -U postgres -d engagekit > backup_$(date +%Y%m%d_%H%M%S).sql
   ```
2. Verify backup file created successfully
3. Store backup in safe location

**Stage 2: Run db:push for Type Sync**
1. Run `pnpm db:push` from root
2. Verify Prisma client regenerated
3. Check for any schema drift warnings
4. Verify no data loss occurred
5. Test database connection still works

**Stage 3: Verify Existing Subscriptions**
1. Query all orgs with active subscriptions:
   ```sql
   SELECT
     id,
     name,
     subscriptionTier,
     subscriptionExpiresAt,
     earnedPremiumExpiresAt,
     payerId,
     stripeSubscriptionId,
     purchasedSlots
   FROM "Organization"
   WHERE subscriptionTier = 'PREMIUM'
   AND subscriptionExpiresAt > NOW();
   ```
2. Verify all fields populated correctly
3. Check for any NULL values where unexpected

**Stage 4: Verify Earned Premium Data**
1. Query all orgs with earned premium:
   ```sql
   SELECT
     id,
     name,
     earnedPremiumExpiresAt,
     earnedPremiumDays
   FROM "Organization"
   WHERE earnedPremiumExpiresAt > NOW();
   ```
2. Verify dates make sense (not in past)
3. Check `earnedPremiumDays` matches calculated days

**Stage 5: Run Data Integrity Checks**
1. Check for orphaned data:
   - Orgs with `stripeSubscriptionId` but no `payerId`
   - Orgs with `subscriptionTier = "PREMIUM"` but NULL `subscriptionExpiresAt`
   - Users with `stripeCustomerId` but no paid orgs
2. Fix any inconsistencies found
3. Document any edge cases discovered

**Stage 6: Verify Stripe Sync**
1. For each PREMIUM org, verify Stripe subscription exists:
   ```typescript
   const orgs = await db.organization.findMany({
     where: { subscriptionTier: "PREMIUM" },
     select: { id: true, stripeSubscriptionId: true },
   });

   for (const org of orgs) {
     const sub = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
     console.log(`Org ${org.id}: Stripe status = ${sub.status}`);
   }
   ```
2. Document any discrepancies (DB says premium but Stripe says canceled)
3. Create reconciliation script if needed

**Post-Phase Testing:**
1. Query 5 random orgs → verify all fields correct
2. Test premium checks with real database data
3. Verify no NULL values where unexpected
4. Verify Stripe sync matches database state
5. Restore from backup and re-run migration (dry run)

**Acceptance Criteria:**
- [ ] Database backup created successfully
- [ ] `db:push` completed without errors
- [ ] All existing subscriptions verified correct
- [ ] All earned premium data verified correct
- [ ] No orphaned or inconsistent data
- [ ] Stripe sync verified for all premium orgs
- [ ] Data integrity checks pass
- [ ] Migration can be replayed from backup

**What's Functional Now:** Database in clean state, all data verified, ready for production

**Ready For:** RFC-007 (Comprehensive Testing & Edge Cases)

---

### RFC-007: Comprehensive Testing & Edge Cases

**Summary:** Full end-to-end testing covering all combinations of premium states, edge cases, and error scenarios.

**Dependencies:** RFC-006 (Database Verified)

**Stages:**

**Stage 0: Pre-Phase Research**
1. Review all implemented features
2. Create comprehensive test matrix (see below)
3. Identify edge cases not yet covered
4. Create testing runbook
5. Present test plan to user

**Stage 1: Test Matrix Setup**

Create test orgs for each combination:

| Org Type | Subscription Tier | Earned Premium | Account Count | Purchased Slots | Expected Premium |
|----------|-------------------|----------------|---------------|-----------------|------------------|
| A | FREE | NULL | 1 | 1 | No |
| B | FREE | Active (future) | 1 | 1 | Yes (Earned) |
| C | FREE | Expired (past) | 1 | 1 | No |
| D | PREMIUM | NULL | 3 | 5 | Yes (Paid) |
| E | PREMIUM | Active (future) | 3 | 5 | Yes (Paid preferred) |
| F | PREMIUM | Expired (past) | 3 | 5 | Yes (Paid) |
| G | PREMIUM | NULL | 8 | 5 | No (Over quota) |
| H | PREMIUM | Active (future) | 8 | 5 | Yes (Earned overrides quota) |
| I | PREMIUM | NULL (canceled) | 3 | 5 | No (Canceled) |
| J | FREE | Active (30 days) | 1 | 1 | Yes (Earned) |

**Stage 2: Premium Check Testing**
1. For each org type (A-J):
   - Call `getOrgPremiumStatus()`
   - Verify `isPremium` matches expected
   - Verify `source` correct ("paid", "earned", "none")
   - Verify `expiresAt` matches expected date
2. Document any failures
3. Fix bugs and re-test

**Stage 3: Feature Gating Testing**
1. For each org type (A-J):
   - Test AI comment generation (should work only if `isPremium = true`)
   - Test LinkedIn scrape (premium only)
   - Test profile import (premium only)
   - Test target list advanced features (premium only)
   - Verify slot enforcement (can't add account if at limit)
2. Document any features incorrectly gated
3. Fix and re-test

**Stage 4: Social Referral Integration Testing**
1. Test FREE org submits post:
   - Verify `earnedPremiumExpiresAt` extended
   - Verify NO Stripe API call
   - Verify premium features unlock
2. Test PREMIUM org submits post:
   - Verify Stripe credits applied
   - Verify `earnedPremiumExpiresAt` NOT extended
   - Verify invoice shows credit
3. Test PREMIUM org (over quota) submits post:
   - Verify Stripe credits applied
   - Verify premium still revoked (over quota)
   - User must remove accounts to restore premium

**Stage 5: Stripe Credit Testing**
1. Create PREMIUM org with monthly billing
2. Submit social post earning 7 days
3. Verify Stripe credit = 7 x $1.00 = $7.00
4. Check Stripe dashboard → verify customer balance shows -$7.00
5. Trigger invoice generation → verify credit deducted
6. Repeat for yearly billing:
   - Verify credit = 7 x $0.822 = $5.75

**Stage 6: Edge Case Testing**

**Edge Case 1: User cancels subscription during rescan**
- Setup: PREMIUM org, submit post, cancel subscription during 3-day rescan period
- Expected: Rescan awards `earnedPremiumExpiresAt` instead of Stripe credits
- Test: Verify behavior correct

**Edge Case 2: User switches billing cycle (monthly → yearly)**
- Setup: PREMIUM org with monthly, earn 30 days credit
- Action: Switch to yearly billing
- Expected: Old credits still apply, new credits use yearly rate
- Test: Verify invoice reflects both old and new credits

**Edge Case 3: User downgrades slots (10 → 5) but has 8 accounts**
- Setup: PREMIUM org with 8 accounts, 10 slots
- Action: Downgrade to 5 slots via Stripe portal
- Expected: Premium revoked (over quota), must remove 3 accounts
- Test: Verify premium features disabled

**Edge Case 4: User leaves org as payer**
- Setup: User A pays for Org X, User B is member
- Action: User A leaves org
- Expected: Subscription continues until period end, then cancels
- Test: Verify Org X keeps premium until `subscriptionExpiresAt`

**Edge Case 5: User earns premium, then subscribes**
- Setup: FREE org earns 30 days premium
- Action: User subscribes to paid plan
- Expected: Premium extends to whichever expires later
- Test: Verify correct expiry date used

**Edge Case 6: Stripe webhook fails to update DB**
- Setup: Trigger webhook event, simulate DB failure
- Expected: Webhook retries via Stripe Smart Retries
- Test: Verify eventual consistency

**Edge Case 7: User submits duplicate URL from different org**
- Setup: Org A submits URL X, Org B tries to submit same URL
- Expected: Blocked by unique constraint on `urlNormalized`
- Test: Verify error message clear

**Edge Case 8: User deletes post after earning credit**
- Setup: Submit post, earn Stripe credit, delete post
- Expected: (Phase 2 - not implemented yet) Credit revoked
- Test: Document as known limitation for Phase 2

**Stage 7: Frontend UI Testing**
1. Verify settings page shows correct premium badge for all org types
2. Verify earn-premium page shows current status correctly
3. Verify extension syncs premium status
4. Test responsive design (mobile, tablet, desktop)
5. Verify no console errors
6. Test accessibility (keyboard navigation, screen reader)

**Stage 8: Performance Testing**
1. Test with org having 1000+ submissions
2. Verify premium check query time < 100ms
3. Verify AI quota check doesn't slow down
4. Test with 100 concurrent users
5. Monitor database query performance
6. Identify and fix any N+1 queries

**Post-Phase Testing:**
1. Full regression test on staging environment
2. Test all 10 org types (A-J) end-to-end
3. Verify all 8 edge cases handled correctly
4. No console errors or warnings
5. Lighthouse score > 90 for all pages
6. User acceptance testing with real users

**Acceptance Criteria:**
- [ ] All 10 org types tested (A-J matrix)
- [ ] All premium-gated features tested
- [ ] Social referral integration tested (FREE + PREMIUM)
- [ ] Stripe credits verified in dashboard
- [ ] All 8 edge cases handled correctly
- [ ] Frontend UI tested across devices
- [ ] Performance acceptable (<100ms queries)
- [ ] No regressions in existing functionality
- [ ] User acceptance testing passed

**What's Functional Now:** Entire premium integration system production-ready, all edge cases handled

**Ready For:** Production Deployment

---

## Implementation Checklist (Complete Workflow)

### RFC-001: Stripe Local Testing Setup ✅ COMPLETE
- [x] Stripe CLI installed (`/opt/homebrew/bin/stripe`)
- [x] CF tunnel active: `api-dev.engagekit.io` → `localhost:8000`
- [x] Stripe webhook registered in dashboard (4 events, Active)
- [x] `STRIPE_WEBHOOK_SECRET` configured in env
- [x] `invoice.payment_failed` deferred to Phase 2

### RFC-002: Consolidate Premium Check Logic
- [ ] Create `getOrgPremiumStatus()` function in `premium.ts`
- [ ] Implement logic checking BOTH paid and earned premium
- [ ] Update `isOrgPremium()` to call new function
- [ ] Update `hasPremiumAccessClause()` (add comment about earned premium)
- [ ] Update `hasPremiumAccess()` to fetch and check both sources
- [ ] Find all routers using `hasPremiumAccess()`
- [ ] Update each router to pass correct parameters
- [ ] Export consolidated types (`PremiumStatus`, `OrgPremiumFields`)
- [ ] Write unit tests for all 4 org types
- [ ] Verify no breaking changes

### RFC-003: Fix Social Referral Premium Detection + Stripe Credits
- [ ] Fix bug in `social-referral-verification.ts` line 158
- [ ] Replace `stripeCustomerId` check with correct org fields
- [ ] Update Prisma include to fetch `subscriptionTier`, `subscriptionExpiresAt`, etc.
- [ ] Create `calculateDailyRate()` helper function
- [ ] Create `awardStripeCreditsToPremiumOrg()` helper function
- [ ] Implement Stripe customer balance transaction
- [ ] Update `awardDaysToOrganization()` to call real Stripe API
- [ ] Remove console.log stub
- [ ] Add error handling for Stripe API failures
- [ ] Add retry logic for transient errors
- [ ] Handle edge case: user cancels subscription during rescan
- [ ] Add monitoring and logging for credit transactions
- [ ] Test with real Stripe test mode (monthly billing)
- [ ] Test with yearly billing
- [ ] Verify Stripe dashboard shows credits

### RFC-004: Update AI Quota + Feature Gating
- [ ] Update `ORG_SELECT` in `ai-quota.ts` to include `earnedPremiumExpiresAt`
- [ ] Update AI quota premium check to use `getOrgPremiumStatus()`
- [ ] Update `target-list.ts` router premium check
- [ ] Update `profile-import.ts` router premium check
- [ ] Update `linkedin-scrape-apify.ts` router premium check
- [ ] Audit all premium-gated features
- [ ] Test AI comments with earned premium (verify unlimited)
- [ ] Test target list features with earned premium
- [ ] Test profile import with earned premium
- [ ] Test LinkedIn scrape with earned premium
- [ ] Verify no regressions for paid premium users

### RFC-005: Frontend Integration
- [ ] Update `useOrgSubscription` hook in `apps/nextjs/src/hooks/`
- [ ] Add `premiumSource` to return value
- [ ] Update `useOrgSubscription` hook in `apps/wxt-extension/`
- [ ] Update `organization.ts` router to return `earnedPremiumExpiresAt`
- [ ] Update settings page to show premium source badge
- [ ] Style earned premium badge differently (green vs purple)
- [ ] Update earn-premium page to show current status
- [ ] Add "Premium Status" card if premium active
- [ ] Add premium indicator to org switcher (if applicable)
- [ ] Test frontend displays "Premium (Earned)" correctly
- [ ] Test extension syncs premium status
- [ ] Verify UI looks polished (no rough edges)

### RFC-006: Database Migration & Verification
- [ ] Create database backup: `pg_dump > backup.sql`
- [ ] Run `pnpm db:push` from root
- [ ] Verify Prisma client regenerated
- [ ] Query all orgs with active subscriptions
- [ ] Verify all fields populated correctly
- [ ] Query all orgs with earned premium
- [ ] Verify dates make sense (not in past)
- [ ] Check for orphaned data (NULL values where unexpected)
- [ ] Verify Stripe sync for all PREMIUM orgs
- [ ] Document any discrepancies
- [ ] Restore from backup and re-run (dry run)

### RFC-007: Comprehensive Testing & Edge Cases
- [ ] Create 10 test orgs (A-J matrix)
- [ ] Test `getOrgPremiumStatus()` for each org type
- [ ] Test AI comments for each org type
- [ ] Test LinkedIn scrape for each org type
- [ ] Test profile import for each org type
- [ ] Test target list features for each org type
- [ ] Test FREE org social referral submission
- [ ] Test PREMIUM org social referral submission
- [ ] Test Stripe credits applied correctly (monthly billing)
- [ ] Test Stripe credits applied correctly (yearly billing)
- [ ] Test edge case 1: user cancels during rescan
- [ ] Test edge case 2: user switches billing cycle
- [ ] Test edge case 3: user downgrades slots (over quota)
- [ ] Test edge case 4: user leaves org as payer
- [ ] Test edge case 5: user earns premium then subscribes
- [ ] Test edge case 6: webhook failure (retry)
- [ ] Test edge case 7: duplicate URL submission
- [ ] Test edge case 8: user deletes post (Phase 2 limitation)
- [ ] Test frontend UI for all org types
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Run performance tests (query time < 100ms)
- [ ] Full regression test on staging

---

## Testing Matrix (Comprehensive)

### Premium Status Combinations

| Test ID | Subscription Tier | Paid Expiry | Earned Expiry | Account Count | Purchased Slots | Expected Premium | Source | Notes |
|---------|-------------------|-------------|---------------|---------------|-----------------|------------------|--------|-------|
| T-001 | FREE | NULL | NULL | 1 | 1 | No | none | Default free org |
| T-002 | FREE | NULL | 2026-03-15 | 1 | 1 | Yes | earned | Earned via social |
| T-003 | FREE | NULL | 2026-01-15 | 1 | 1 | No | none | Earned expired |
| T-004 | PREMIUM | 2026-03-15 | NULL | 3 | 5 | Yes | paid | Active paid sub |
| T-005 | PREMIUM | 2026-03-15 | 2026-02-15 | 3 | 5 | Yes | paid | Paid expires later |
| T-006 | PREMIUM | 2026-02-15 | 2026-03-15 | 3 | 5 | Yes | earned | Earned expires later |
| T-007 | PREMIUM | 2026-03-15 | NULL | 8 | 5 | No | none | Over quota (paid revoked) |
| T-008 | PREMIUM | 2026-03-15 | 2026-03-20 | 8 | 5 | Yes | earned | Earned overrides quota |
| T-009 | PREMIUM | 2026-01-15 | NULL | 3 | 5 | No | none | Paid expired |
| T-010 | PREMIUM | 2026-01-15 | 2026-03-15 | 3 | 5 | Yes | earned | Paid expired, earned active |
| T-011 | FREE | NULL | 2026-12-31 | 1 | 1 | Yes | earned | Long-term earned |
| T-012 | PREMIUM | 2026-03-15 | 2026-03-15 | 3 | 5 | Yes | paid | Both expire same day |
| T-013 | PREMIUM | NULL | NULL | 3 | 5 | No | none | Subscription canceled |
| T-014 | FREE | NULL | NULL | 0 | 1 | No | none | No accounts added |
| T-015 | PREMIUM | 2026-03-15 | NULL | 5 | 5 | Yes | paid | Exactly at quota |
| T-016 | PREMIUM | 2026-03-15 | NULL | 6 | 5 | No | none | One over quota |

### Feature Gating Test Cases

For each test ID above, verify:
- [ ] AI comment generation (unlimited if premium, limited if free)
- [ ] LinkedIn scrape (premium only)
- [ ] Profile import (premium only)
- [ ] Target list advanced features (premium only)
- [ ] Slot enforcement (correct limit applied)

### Social Referral Test Cases

| Test ID | Org Type | Action | Expected Behavior |
|---------|----------|--------|-------------------|
| SR-001 | FREE (no earned) | Submit post (7 days) | `earnedPremiumExpiresAt` = now + 7 days |
| SR-002 | FREE (earned active) | Submit post (7 days) | `earnedPremiumExpiresAt` += 7 days |
| SR-003 | PREMIUM (monthly) | Submit post (7 days) | Stripe credit = $7.00 |
| SR-004 | PREMIUM (yearly) | Submit post (7 days) | Stripe credit = $5.75 |
| SR-005 | PREMIUM (over quota) | Submit post (7 days) | Stripe credit = $7.00, but premium still revoked |
| SR-006 | PREMIUM (canceled) | Submit post (7 days) | `earnedPremiumExpiresAt` = now + 7 days |

### Stripe Credit Calculation Test Cases

| Billing Cycle | Days Earned | Expected Credit | Calculation |
|---------------|-------------|-----------------|-------------|
| Monthly | 7 | $7.00 | 7 x ($29.99 / 30) = $6.998 → $7.00 |
| Monthly | 30 | $29.99 | 30 x ($29.99 / 30) = $29.99 |
| Yearly | 7 | $5.75 | 7 x ($299.99 / 365) = $5.753 → $5.75 |
| Yearly | 365 | $299.99 | 365 x ($299.99 / 365) = $299.99 |

---

## Ops Runbook

### Deployment

**Pre-Deployment Checklist:**
- [ ] All RFCs completed (001-007)
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Database migration tested on staging
- [ ] Stripe webhooks tested locally
- [ ] Manual QA completed (all 16 test cases)
- [ ] Performance acceptable (<100ms queries)
- [ ] No console errors

**Deployment Steps:**
1. Create feature branch: `feature/premium-integration`
2. Implement RFCs 001-007 in order
3. Run `pnpm db:push` to sync schema types
4. Submit PR with test results and screenshots
5. Code review (2 approvals required)
6. Merge to main
7. Deploy to staging (Vercel preview)
8. Run smoke tests on staging (test matrix)
9. Deploy to production (Vercel production)
10. Monitor error logs for 24 hours

**Rollback Plan:**
- Revert PR if critical bug discovered
- Database migration is additive (no data loss risk)
- Stripe credits cannot be revoked (contact Stripe support if needed)

### Monitoring

**Metrics to Track:**
- Premium check query execution time (target: <100ms)
- Stripe credit API success rate (target: >99%)
- Social referral submission rate
- Earned premium conversion rate (% of users who earn premium)
- Stripe credit total awarded per month

**Alerts:**
- Stripe API error rate >1%
- Premium check query time >500ms
- Webhook failure (Stripe Smart Retries exhausted)
- Database inconsistency detected

**Dashboards:**
1. Premium Status Dashboard
   - Total orgs with paid premium
   - Total orgs with earned premium
   - Total orgs with both
   - Expiry distribution (histogram)

2. Stripe Credits Dashboard
   - Total credits awarded (last 30 days)
   - Average credit per submission
   - Top orgs by credits earned
   - Failed credit transactions

3. Social Referral Dashboard
   - Submissions per day
   - Validation rate (% approved)
   - Average days earned per submission
   - Platform distribution (X, LinkedIn, Threads, Facebook)

### Maintenance

**Weekly Tasks:**
- Review error logs for Stripe API failures
- Check for orgs with inconsistent premium state
- Monitor Stripe credit balances (ensure not accumulating excessively)

**Monthly Tasks:**
- Audit database for orphaned data
- Review premium check performance (query optimization)
- Analyze social referral conversion metrics
- Update pricing if needed (Stripe product prices)

**Quarterly Tasks:**
- Full premium integration audit
- Review and optimize database indexes
- Stress test with 10x traffic
- User feedback review (gather feature requests)

---

## Acceptance Criteria (Versioned)

### V1.0 (Production Launch)

**Bug Fixes:**
- [ ] Bug #1 fixed: Social referral uses correct org premium check
- [ ] Bug #2 fixed: All premium checks consider `earnedPremiumExpiresAt`
- [ ] No regressions in existing functionality

**Premium Logic:**
- [ ] `getOrgPremiumStatus()` checks BOTH paid and earned premium
- [ ] Returns correct `source` ("paid", "earned", "none")
- [ ] Uses latest expiry date when both active
- [ ] Quota compliance checked for paid premium

**Stripe Integration:**
- [ ] PREMIUM orgs get Stripe credits (not `earnedPremiumExpiresAt`)
- [ ] Credits calculated correctly (monthly: $1.00/day from $29.99/mo, yearly: $0.822/day from $299.99/yr)
- [ ] Credits applied to payer's Stripe customer balance
- [ ] Next invoice deducts credits automatically

**Feature Gating:**
- [ ] AI quota respects earned premium (unlimited comments)
- [ ] LinkedIn scrape works with earned premium
- [ ] Profile import works with earned premium
- [ ] Target list features work with earned premium
- [ ] All premium-gated features tested

**Frontend:**
- [ ] Settings page shows "Premium (Earned)" or "Premium (Paid)" badge
- [ ] Earn-premium page shows current premium status
- [ ] Extension syncs premium status
- [ ] UI distinguishes paid vs earned premium

**Testing:**
- [ ] All 16 test matrix combinations pass
- [ ] All 6 social referral test cases pass
- [ ] All 8 edge cases handled correctly
- [ ] Performance acceptable (<100ms queries)
- [ ] Stripe credits verified in dashboard

**Documentation:**
- [ ] Premium integration documented
- [ ] Edge cases documented
- [ ] Known limitations documented (Phase 2)

---

## Future Work

### Phase 2 Enhancements (Post-Launch)

**Post Deletion Detection:**
- Implement webhook or cron job to detect deleted social posts
- Revoke Stripe credits when post deleted
- Convert credits back to negative `earnedPremiumExpiresAt` if needed

**Email Notifications + Payment Failed Webhook:**
- Add `invoice.payment_failed` webhook handler (deferred from V1.0 — Stripe dunning handles retries)
- Send email when premium earned via social referral
- Send email when premium expires (7 days before)
- Send email when payment fails
- Add "Payment failed" banner in org settings (`paymentFailedAt` field)

**Rate Limiting:**
- Implement 1 post/platform/day limit
- Prevent spam submissions
- Add cooldown period after rejection

**Advanced Analytics:**
- Track which social platforms drive most engagement
- A/B test different reward structures
- Analyze optimal caption length and keywords
- Build viral coefficient dashboard

**Gamification:**
- Leaderboard for top earners
- Achievement badges for milestones
- Referral contest with prizes
- Team challenges for orgs with multiple users

---

## Known Issues & Limitations

### Phase 1 Limitations

**Post Deletion Not Detected:**
- If user deletes social post after earning credit, credit NOT revoked
- Planned for Phase 2 (requires polling or webhook)
- Mitigation: Manual review of suspicious accounts

**No Email Notifications:**
- Users not notified when they earn premium
- Users not notified when premium expires
- Users not notified when payment fails (`invoice.payment_failed` deferred to Phase 2)
- Planned for Phase 2 (requires email service integration)
- Mitigation: In-app notifications only; Stripe Smart Retries + dunning handle payment failures automatically

**No Rate Limiting:**
- Users can submit unlimited posts per day
- Risk of spam submissions
- Planned for Phase 2 (optional)
- Mitigation: Manual review of excessive submissions

**Stripe Smart Retries Only:**
- If webhook fails, relies on Stripe Smart Retries
- No custom retry logic implemented
- May lose some webhook events if all retries exhausted
- Mitigation: Manual reconciliation script (run weekly)

### Edge Cases to Monitor

**User Cancels Subscription During Rescan:**
- Rescan may award credits to canceled subscription
- Need to check subscription status before awarding credits
- Currently handled: Checks subscription tier before credit

**User Switches Orgs Frequently:**
- May earn premium on multiple orgs
- Each org independent (expected behavior)
- No cross-org gaming detected yet

**User Has Very Long Earned Premium (1+ years):**
- No limit on `earnedPremiumExpiresAt` duration
- Could accumulate years of earned premium
- Monitor for abuse (user farming submissions)

---

## Change Management (for updates mid-flight)

**Change Request Process:**
1. Classify change (Bug fix, New feature, Scope change, Technical debt)
2. Analyze impact (Components affected, Timeline impact, Dependencies)
3. Determine strategy (Immediate, Schedule for next phase, Defer to Phase 2)
4. Update plan sections (RFCs, Acceptance Criteria, Testing Matrix)
5. Communicate to stakeholders
6. Track risks

**Example Change Scenarios:**

**Scenario 1:** User requests "Revoke credits for deleted posts" mid-implementation
- Classification: New feature (Phase 2)
- Strategy: Defer to Phase 2 (out of scope for V1.0)
- Document as known limitation
- Add to Future Work section

**Scenario 2:** Bug found in Stripe credit calculation (wrong daily rate)
- Classification: Bug fix (critical)
- Strategy: Immediate fix
- Update RFC-003 with corrected calculation
- Re-test all Stripe credit test cases

**Scenario 3:** Performance issue (premium check query takes 2 seconds)
- Classification: Performance bug
- Strategy: Immediate optimization
- Add database index
- Update RFC-006 with new index

---

## Glossary

**Earned Premium:** Premium access granted by earning days via social referral submissions (stored in `earnedPremiumExpiresAt`).

**Paid Premium:** Premium access granted by active Stripe subscription (determined by `subscriptionTier`, `subscriptionExpiresAt`, and quota compliance).

**Premium Source:** Which system is currently providing premium access ("paid", "earned", or "none"). When both active, latest expiry date determines source.

**Stripe Customer Balance:** Stripe feature allowing credits/debits to customer account. Negative balance = credit that reduces next invoice.

**Daily Rate:** Cost per day based on billing cycle. Monthly: $29.99 / 30 = $1.00/day. Yearly: $299.99 / 365 = $0.822/day.

**Quota Compliance:** Organization has accountCount <= purchasedSlots. If over quota, paid premium revoked (but earned premium still works).

**Over Quota:** Organization has more LinkedIn accounts than purchased slots. Causes paid premium to be revoked until accounts removed.

**Stripe Smart Retries:** Stripe's automatic webhook retry system. Retries failed webhooks with exponential backoff for 3 days.

---

**Next Step:** Review this plan, approve for execution, then enter EXECUTE mode with `ENTER EXECUTE MODE` command.
