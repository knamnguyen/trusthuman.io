# Organization Payment System Redesign

**Date:** 2026-01-19
**Updated:** 2026-01-28 (Version 2.4 - Phase 1, 2 & 3 Complete)
**Status:** 🚧 In Progress (Phase 1, 2 & 3 Complete)
**Complexity:** Complex (Multi-phase migration)

---

## Quick Links

- [Overview](#overview)
- [Architecture Decisions](#architecture-decisions)
- [Schema Changes](#schema-changes)
- [Webhooks](#webhooks)
- [API Endpoints](#api-endpoints)
- [UI & Feature Gating](#ui--feature-gating)
- [Edge Cases & Safeguards](#edge-cases--safeguards)
- [Migration Strategy](#migration-strategy)
- [Testing Checklist](#testing-checklist)

---

## Overview

**Goal:** Restructure payment handling from user-centric to organization-centric billing.

**Current State:**

- `User` has `stripeCustomerId`, `accessType`, `stripeUserProperties` (user-level subscriptions)
- `Organization` has `stripeCustomerId` and `purchasedSlots` (unused, never updated by webhooks)
- Webhooks update User table only
- Slot enforcement exists but doesn't check subscription expiry
- Inconsistent: payment fields exist in both tables but aren't connected

**Target State:**

- `Organization` owns subscription data (payerId, stripeSubscriptionId, purchasedSlots, subscriptionTier, subscriptionExpiresAt)
- `User` owns Stripe customer identity (stripeCustomerId only)
- Webhooks update Organization based on metadata
- **Clean separation:** User = billing identity, Organization = subscription owner
- **Key constraint:** One user can only have ONE active subscription (simplified billing)
- **Slot enforcement:** Already works via `purchasedSlots` (webhooks maintain it)

**Why This Matters:**

- Aligns with multi-tenant architecture (users belong to orgs, orgs have subscriptions)
- Enables team billing (admin pays, all members benefit)
- Simplifies slot enforcement (org.purchasedSlots already enforced in `account.ts`)
- Supports use case: User pays for their org, teammates can be invited

---

## Architecture Decisions

### ADR 1: One Subscription Per User

**Decision:** Enforce maximum 1 active subscription per user at any time.

**Rationale:**

- Simplifies UX: Users understand "you're the payer" or "you're not"
- Reduces billing confusion: One charge per month, not multiple
- Prevents accidental double-subscriptions when user leaves one org and joins another
- Easier customer support: No complex multi-org payment scenarios
- Simpler to implement and test

**Implementation:**

- Block checkout if user has any active subscription (via DB + Stripe check)
- When user leaves org as payer, they cannot subscribe to new org until period expires
- Error message: "You have an active subscription for 'Acme Corp' until Feb 27. Please wait or cancel first."

**Future Evolution:** Can be relaxed later if users request multi-org payments (architecture supports it via metadata)

---

### ADR 2: Stripe Customer Portal for All Subscription Management

**Decision:** Use Stripe's hosted Customer Portal for cancel/upgrade/downgrade, not custom UI.

**Rationale:**

- **Zero code for subscription changes:** Stripe handles quantity changes, billing cycle switches, payment method updates
- **Webhooks keep DB in sync:** customer.subscription.updated fires automatically
- **Best UX:** Users get Stripe's polished portal with invoice history, payment method manager
- **Security:** No PCI compliance needed, Stripe handles card data
- **Prorated billing:** Stripe calculates prorations automatically

**What Portal Enables:**

- Change quantity (add/remove slots) → webhook updates `purchasedSlots`
- Switch monthly ↔ yearly → webhook updates subscription
- Update payment method → no DB changes needed
- Cancel subscription → webhook sets `cancel_at_period_end: true`
- View invoices → no custom invoice UI needed

**Configuration:**

```
Stripe Dashboard → Customer Portal Settings:

Subscriptions:
  ✅ Allow customers to cancel subscriptions
  ✅ Allow customers to switch plans (monthly ↔ yearly)
  ✅ Allow customers to update quantities
    - Minimum: 1
    - Maximum: [blank] (unlimited)

All Changes (upgrades & downgrades):
  ✅ Apply immediately
  ✅ Prorate charges/credits automatically

Payment Methods:
  ✅ Allow customers to update payment methods
  ✅ Allow customers to view invoice history
```

**Impact:** Eliminates ~500 lines of custom billing UI code

---

### ADR 3: Denormalize Subscription Data into Organization Table

**Decision:** Store 4 subscription fields directly on Organization, no separate Subscription table.

**Rationale:**

- **1:1 relationship:** One org = one subscription (no benefit from separate table)
- **Fast queries:** No joins needed for slot enforcement (runs on every LinkedIn account add)
- **Stripe is source of truth:** Webhooks keep denormalized fields in sync
- **Simpler than sync table:** Avoids join complexity, race conditions, duplicate data issues

**What We Store (Performance Cache):**

```prisma
Organization {
  payerId               String?   // WHO is paying (for billing portal access)
  stripeSubscriptionId  String?   // Subscription ID (to cancel when payer leaves)
  purchasedSlots        Int       // How many slots (slot enforcement - ALREADY EXISTS)
  subscriptionTier      String    // "FREE" | "PREMIUM" (for feature gating)
  subscriptionExpiresAt DateTime? // When it expires (for time-based checks)
}
```

**What We DON'T Store (Query Stripe When Needed):**

- ❌ Billing cycle (monthly/yearly) - Query Stripe when showing billing page (~300ms, rare)
- ❌ Payment method details - Security risk, Stripe portal shows it
- ❌ Invoice history - Query Stripe API when user opens billing
- ❌ Full subscription object - Gets stale, too much data

**Performance:**

- Slot enforcement: ~5ms (DB query, already implemented)
- Billing page details: ~300ms (one-time Stripe API call per page load)

---

### ADR 4: Hybrid Blocking Check (DB + Stripe)

**Decision:** Check database first (fast path), fall back to Stripe (edge cases).

**Rationale:**

- **99% of cases:** User currently pays for an org → DB query finds it (~5ms)
- **1% edge case:** User left org as payer but subscription still active until period end → Stripe API needed (~300ms)
- **Always accurate:** Stripe is source of truth for active subscriptions
- **Balances performance vs correctness:** Fast common path, thorough edge case handling

**Implementation:**

```typescript
// Step 1: Fast DB check
const currentPaidOrg = await db.organization.findFirst({
  where: {
    payerId: userId,
    subscriptionExpiresAt: { gt: new Date() },
  },
});
if (currentPaidOrg)
  return { blocked: true, reason: "Currently paying for org" };

// Step 2: Stripe check (handles user-left-org-but-sub-still-active)
const subs = await stripe.subscriptions.list({
  customer: user.stripeCustomerId,
  status: "active",
});
if (subs.data.length > 0)
  return { blocked: true, reason: "Active subscription exists" };

return { blocked: false };
```

---

### ADR 5: Admins Only Can Subscribe

**Decision:** Only organization admins can create subscriptions.

**Rationale:**

- **Clearer permission model:** Billing is an admin responsibility
- **Prevents confusion:** Regular members shouldn't accidentally pay
- **Matches expectations:** Most SaaS tools restrict billing to admins
- **Simpler UI logic:** One less state to handle

**Implementation:**

```typescript
// In createOrgCheckout
if (membership.role !== "ADMIN") {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Only organization admins can subscribe",
  });
}
```

**Future Extension:** If needed, can allow members to pay by removing this check.

---

### ADR 6: Simple Subscription Tiers (FREE | PREMIUM)

**Decision:** Two tiers only: `FREE` and `PREMIUM`.

**Rationale:**

- **Simple to understand:** Free = 1 slot, no AI. Premium = AI features enabled, slots based on quantity purchased.
- **Easy to gate features:** Single check: `isPremiumOrg(org)`
- **Room to grow:** Can add "ENTERPRISE" later if needed
- **No complex feature matrix:** All premium features unlocked together

**IMPORTANT CLARIFICATION:**

- `subscriptionTier = "PREMIUM"` means **"has AI features"**, NOT **"has multiple slots"**
- `purchasedSlots` field determines slot count (mirrors Stripe subscription quantity)
- User can buy Premium with quantity=1 → gets 1 slot WITH AI features
- User can buy Premium with quantity=5 → gets 5 slots WITH AI features

**Examples:**

- Free org: `purchasedSlots = 1`, `subscriptionTier = "FREE"` → 1 slot, no AI
- Premium (qty=1): `purchasedSlots = 1`, `subscriptionTier = "PREMIUM"` → 1 slot, WITH AI
- Premium (qty=5): `purchasedSlots = 5`, `subscriptionTier = "PREMIUM"` → 5 slots, WITH AI

**Feature Matrix:**

| Feature                            | Free        | Premium (any quantity) |
| ---------------------------------- | ----------- | ---------------------- |
| Manual LinkedIn account management | ✅          | ✅                     |
| 1+ LinkedIn account slots          | 1 slot only | 1-unlimited slots      |
| Target list collection             | ✅          | ✅                     |
| Comment history tracking           | ✅          | ✅                     |
| Manual comment mode                | ✅          | ✅                     |
| **AI-powered comments**            | ❌          | ✅                     |
| **Hyperbrowser virtual runs**      | ❌          | ✅                     |
| **Auto-engagement campaigns**      | ❌          | ✅                     |

---

### ADR 7: Client-Side Feature Gating with Quota Check (MVP)

**Decision:** Use client-side checks only for feature gating (no server enforcement for AI/hyperbrowser features). Include quota compliance check in premium helper.

**Rationale:**

- **Good enough for MVP:** 95% of users won't bypass
- **Server enforces slots:** They can't add unlimited accounts (already implemented)
- **Easy to add later:** When needed, add server checks to AI/hyperbrowser endpoints
- **Common pattern:** Many SaaS start this way
- **Faster to ship:** No need to add checks to every AI endpoint
- **Quota enforcement:** If org over quota (8 accounts, 5 slots) → revoke premium for ALL accounts

**What's Server-Enforced:**

- ✅ Slot limits (already in `account.ts`)
- ❌ AI features (client-side only for now)
- ❌ Hyperbrowser features (client-side only for now)

**Implementation:**

```typescript
// Shared helper (client-side only)
export function isPremiumOrg(org: {
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
  purchasedSlots: number;
  accountCount: number;  // Passed from parent
}): boolean {
  // Check subscription active
  if (!org.subscriptionExpiresAt) return false;
  if (org.subscriptionExpiresAt < new Date()) return false;
  if (org.subscriptionTier !== 'PREMIUM') return false;

  // NEW: Check quota compliance
  if (org.accountCount > org.purchasedSlots) {
    console.log(`Org over quota: ${org.accountCount}/${org.purchasedSlots} accounts`);
    return false; // Over quota = no premium
  }

  return true;
}

// Usage in UI (fetch account count once per page load)
const { data: org } = api.organization.getCurrent.useQuery();
const accountCount = org.linkedInAccounts.length;

const isPremium = isPremiumOrg({ ...org, accountCount });
<Button disabled={!isPremium}>✨ AI Comment</Button>

{accountCount > org.purchasedSlots && (
  <Alert variant="warning">
    You have {accountCount} accounts but only {org.purchasedSlots} slots.
    Remove {accountCount - org.purchasedSlots} account(s) to restore premium access.
  </Alert>
)}
```

**Downgrade Scenario:**

1. User reduces from 10 to 5 slots (via Customer Portal)
2. Stripe applies immediately, webhook updates `purchasedSlots = 5`
3. Org has 8 accounts, 5 slots → over quota
4. Client-side check: `accountCount > purchasedSlots` → `isPremium = false`
5. Premium features disabled for ALL accounts
6. User removes 3 accounts
7. Client-side check passes → `isPremium = true` → premium restored

**Benefits:**

- Simple downgrade handling (no scheduling needed)
- Fair enforcement (all accounts treated equally)
- Self-service resolution (user removes accounts at their pace)
- Clear consequence (over quota = no premium)

**When to Add Server Enforcement:** When you see users bypassing or when revenue justifies the effort.

---

### ADR 8: Billing at `/orgSlug/settings` (Simple)

**Decision:** Place billing directly at `/orgSlug/settings` (not `/orgSlug/settings/billing`).

**Rationale:**

- **No other settings yet:** Don't create nested routes prematurely
- **Easy to refactor later:** Can add tabs when needed (members, integrations, etc.)
- **Simpler routing:** One page to manage

**Future Structure:**

```
Current: /acme-corp/settings (shows billing)
Future:  /acme-corp/settings?tab=billing
         /acme-corp/settings?tab=members
         /acme-corp/settings?tab=integrations
```

---

### ADR 9: Stripe Portal Return URL Uses Org ID

**Decision:** Use immutable org ID in return URL, not org slug.

**Rationale:**

- **Org slug is mutable:** Admin can change it while user is in portal
- **Org ID is immutable:** Always works, no 404 risk
- **5 lines of code:** Minimal complexity for 100% reliability

**Implementation:**

```typescript
// Create portal session
return_url: `${baseUrl}/billing-return?orgId=${org.id}`; // Use ID

// Billing return page
const org = await db.organization.findUnique({
  where: { id: searchParams.orgId },
  select: { orgSlug: true },
});
redirect(`/${org.orgSlug}/settings?success=true`); // Use current slug
```

**Alternative (simpler):** Use org slug and accept rare 404 if slug changes during portal session. For most apps, org slugs never change.

---

### ADR 10: Slot Enforcement Already Works

**Decision:** No changes needed to slot enforcement logic.

**Rationale:**

- **Already implemented:** `account.ts` line 362-378 checks `currentCount >= org.purchasedSlots`
- **Webhooks maintain it:** `purchasedSlots` updated automatically on subscription changes
- **Expired subs handled:** When subscription expires, webhook sets `purchasedSlots: 1`

**Current Implementation (No Changes Needed):**

```typescript
// packages/api/src/router/account.ts - registerByUrl
const org = await ctx.db.organization.findUnique({
  where: { id: ctx.activeOrg.id },
  select: { purchasedSlots: true },
});

const currentAccountCount = await ctx.db.linkedInAccount.count({
  where: { organizationId: ctx.activeOrg.id },
});

if (org && currentAccountCount >= org.purchasedSlots) {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: `Organization has reached its limit of ${org.purchasedSlots} LinkedIn account(s). Upgrade to add more.`,
  });
}
```

**Why This Works:**

- Active subscription: `purchasedSlots = 5` (set by checkout webhook)
- Expired subscription: `purchasedSlots = 1` (reset by deletion webhook)
- User can't bypass: Server-side check before account creation

**Note:** Org with 5 existing accounts and expired subscription keeps the 5 accounts (no data loss) but can't add more until they upgrade. This is desired behavior.

---

## Stripe Pricing Structure

### Actual Products & Prices

**Monthly Plan:**

- Product: `LinkedIn Accounts - Monthly` (`prod_quantity_monthly`)
- Price: **$29.99 USD per slot/month**
- Price ID: (fetch from Stripe API dynamically)
- Recurring: Every month
- Quantity-based: 1-unlimited slots

**Yearly Plan:**

- Product: `LinkedIn Accounts - Yearly` (`prod_quantity_yearly`)
- Price: **$299.99 USD per slot/year**
- Price ID: (fetch from Stripe API dynamically)
- Recurring: Every year
- Quantity-based: 1-unlimited slots
- **Discount: 16.7% off** (saves $59.89/year per slot)
- Monthly equivalent: $24.99/month per slot

**Examples:**

| Quantity | Monthly Total | Yearly Total | Yearly Savings |
| -------- | ------------- | ------------ | -------------- |
| 1 slot   | $29.99/mo     | $299.99/yr   | $59.89/yr      |
| 5 slots  | $149.95/mo    | $1,499.95/yr | $299.45/yr     |
| 10 slots | $299.90/mo    | $2,999.90/yr | $598.90/yr     |
| 24 slots | $719.76/mo    | $7,199.76/yr | $1,437.24/yr   |

### Price Fetching Strategy

**Decision:** Fetch live from Stripe API on settings page load (always up-to-date, no cache needed).

**Implementation:**

```typescript
// packages/api/src/router/stripe.ts

export const stripeRouter = createTRPCRouter({
  getPricing: publicProcedure.query(async () => {
    const prices = await stripe.prices.list({
      product: env.STRIPE_PRODUCT_ID_MONTHLY, // Or list all and filter
      active: true,
    });

    const monthly = prices.data.find((p) => p.recurring?.interval === "month");
    const yearly = prices.data.find((p) => p.recurring?.interval === "year");

    return {
      monthly: {
        id: monthly?.id,
        amount: monthly?.unit_amount, // Amount in cents (2999)
        interval: "month",
        displayAmount: "$29.99",
      },
      yearly: {
        id: yearly?.id,
        amount: yearly?.unit_amount, // Amount in cents (29999)
        interval: "year",
        displayAmount: "$299.99",
      },
    };
  }),
});
```

**Benefits:**

- Always reflects current Stripe pricing
- No manual sync needed when prices change
- ~300ms load time (acceptable for settings page)

---

## Schema Changes

### Organization Table

**ADD:**

```prisma
payerId               String?   // User who pays for this org
stripeSubscriptionId  String?   @unique  // To cancel when payer leaves
subscriptionExpiresAt DateTime? // From Stripe current_period_end
subscriptionTier      String    @default("FREE")  // "FREE" | "PREMIUM"
```

**REMOVE (after migration):**

```prisma
stripeCustomerId      String?   // WRONG - Org isn't a Stripe customer, User is
```

**KEEP:**

```prisma
purchasedSlots        Int       @default(1)  // Already exists, webhooks maintain it
```

### User Table

**KEEP:**

```prisma
stripeCustomerId      String?   @unique  // User IS the Stripe customer
```

**REMOVE (after migration):**

```prisma
accessType            AccessType  // Moving to org-level (subscriptionTier)
stripeUserProperties  Json?       // Redundant, Stripe is source of truth
```

**REMOVE ENUM (after migration):**

```prisma
enum AccessType {
  FREE
  WEEKLY
  MONTHLY
  YEARLY
}
```

**ALSO REMOVE (found during analysis):**

```prisma
// In LinkedInAccount model
accessType            AccessType  // Duplicate field, no longer needed
```

### Final Schema

```prisma
// packages/db/prisma/models/organization.prisma
model Organization {
  id                    String    @id
  name                  String
  orgSlug               String?

  // Payment fields (org-centric billing)
  payerId               String?   // WHO is paying
  stripeSubscriptionId  String?   @unique  // Subscription ID (for cancellation)
  purchasedSlots        Int       @default(1)  // How many LinkedIn account slots (webhooks maintain)
  subscriptionTier      String    @default("FREE")  // "FREE" | "PREMIUM"
  subscriptionExpiresAt DateTime? // When subscription expires

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  payer            User?                @relation("OrgPayer", fields: [payerId], references: [id], onDelete: SetNull)
  members          OrganizationMember[]
  linkedInAccounts LinkedInAccount[]
}

// packages/db/prisma/models/user.prisma
model User {
  id                  String   @id
  firstName           String?
  lastName            String?
  username            String?  @unique
  primaryEmailAddress String   @unique
  imageUrl            String?
  stripeCustomerId    String?  @unique  // Stripe customer identity
  clerkUserProperties Json?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  paidOrganizations       Organization[]       @relation("OrgPayer")
  organizationMemberships OrganizationMember[]
  linkedInAccounts        LinkedInAccount[]
  // ... other relations
}
```

---

## Webhooks

### 1. `checkout.session.completed` (Stripe)

**When:** User completes checkout for first subscription

**Purpose:** Initialize organization with subscription data

**Action:**

```typescript
const session = event.data.object as Stripe.Checkout.Session;
const subscription = await stripe.subscriptions.retrieve(
  session.subscription as string,
);

const orgId = session.metadata?.organizationId;
const payerId = session.metadata?.payerId;

if (!orgId || !payerId) {
  console.error("Missing metadata in checkout session", session.id);
  return; // Skip - not an org subscription
}

// Idempotency check
const existing = await db.organization.findUnique({
  where: { id: orgId },
  select: { stripeSubscriptionId: true },
});

if (existing?.stripeSubscriptionId === subscription.id) {
  console.log("Subscription already recorded, skipping");
  return; // Already processed
}

// Verify payer is still in org (race condition check)
const membership = await db.organizationMember.findUnique({
  where: {
    orgId_userId: { orgId, userId: payerId },
  },
});

if (!membership) {
  console.error(`User ${payerId} left org ${orgId} before payment completed`);

  // Cancel subscription immediately
  await stripe.subscriptions.cancel(subscription.id);

  // Refund payment
  const invoice = await stripe.invoices.retrieve(
    subscription.latest_invoice as string,
  );
  await stripe.refunds.create({
    payment_intent: invoice.payment_intent as string,
    reason: "requested_by_customer",
  });

  console.log("Subscription canceled and refunded");
  return;
}

// Guard: Ensure quantity > 0
const quantity = Math.max(1, subscription.items.data[0].quantity || 1);

await db.organization.update({
  where: { id: orgId },
  data: {
    payerId,
    stripeSubscriptionId: subscription.id,
    purchasedSlots: quantity,
    subscriptionTier: "PREMIUM",
    subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
  },
});

console.log(`✅ Org ${orgId} subscribed: ${quantity} slots`);
```

**Edge Cases Handled:**

- Idempotency: Check if subscription already recorded
- Missing metadata: Skip gracefully (old checkout sessions)
- User left org during checkout: Cancel subscription and refund
- Quantity = 0: Guard against invalid Stripe data

---

### 2. `customer.subscription.updated` (Stripe)

**When:** Subscription renews, slots changed (via Customer Portal), billing cycle switched

**Purpose:** Keep organization slot count and expiry date in sync

**Action:**

```typescript
const subscription = event.data.object as Stripe.Subscription;
const orgId = subscription.metadata?.organizationId;

if (!orgId) {
  console.log(
    "No organizationId in metadata, skipping (not an org subscription)",
  );
  return; // User-level subscription (old system) or non-org subscription
}

// Guard: Ensure quantity > 0
const slots = Math.max(1, subscription.items.data[0].quantity || 1);
const expiresAt = new Date(subscription.current_period_end * 1000);

// Idempotency: upsert is naturally idempotent (same data = no change)
await db.organization.update({
  where: { id: orgId },
  data: {
    purchasedSlots: slots,
    subscriptionExpiresAt: expiresAt,
    subscriptionTier: "PREMIUM", // Keep as premium
  },
});

console.log(`✅ Org ${orgId} updated: ${slots} slots, expires ${expiresAt}`);
```

**What Triggers This:**

- Subscription renewal (Stripe charges card, extends period)
- User changes quantity in Customer Portal (5 slots → 10 slots)
- User switches billing cycle (monthly → yearly via Customer Portal)
- Payment succeeds after retry (failed payment recovered)

**Edge Cases Handled:**

- Missing organizationId: Skip gracefully
- Idempotency: Update is idempotent
- Quantity = 0: Guard sets minimum to 1

---

### 3. `customer.subscription.deleted` (Stripe)

**When:** Subscription canceled (either immediately or at period end reached)

**Purpose:** Reset organization to free tier with grace period

**Action:**

```typescript
const subscription = event.data.object as Stripe.Subscription;
const orgId = subscription.metadata?.organizationId;

if (!orgId) return; // Not an org subscription

// Idempotency check
const org = await db.organization.findUnique({
  where: { id: orgId },
  select: { stripeSubscriptionId: true },
});

if (org?.stripeSubscriptionId !== subscription.id) {
  console.log("Subscription ID mismatch or already cleared, skipping");
  return; // Already processed or different subscription
}

// GRACE PERIOD APPROACH: Set expiry to end of period (not immediate revocation)
// This handles billing cycle switches gracefully - if user switches from monthly to yearly,
// the delete event fires but create event follows immediately with new subscription
const endDate = new Date(subscription.current_period_end * 1000);

await db.organization.update({
  where: { id: orgId },
  data: {
    payerId: null,
    stripeSubscriptionId: null, // Clear sub ID
    purchasedSlots: 1, // Free tier default
    subscriptionTier: "FREE", // Reset to free
    subscriptionExpiresAt: endDate, // Still valid until period ends (grace period)
  },
});

console.log(`✅ Org ${orgId} subscription ended, valid until ${endDate}`);

// Note: Don't auto-delete LinkedIn accounts over limit
// Slot enforcement will prevent adding more until upgrade
// If org has 5 accounts and downgrades to free (1 slot), they keep all 5 but can't add more
```

**What Triggers This:**

- User cancels in Customer Portal → period expires → deleted event
- Payer leaves org → our code sets `cancel_at_period_end: true` → period expires → deleted event
- Admin cancels immediately via Stripe Dashboard
- Payment fails repeatedly → Stripe auto-cancels after grace period
- **Billing cycle switch:** User switches monthly → yearly via portal → creates new subscription → deletes old one

**Edge Cases Handled:**

- Idempotency: Check if subscription ID matches before clearing
- LinkedIn accounts over limit: Don't auto-delete (preserve data), enforce on next add attempt
- **Grace period:** Set expiry to period end (not immediate), allows seamless plan switches
- **Billing cycle switch:** If new subscription created before grace period ends, it overwrites with updated data

---

### 4. `organizationMembership.deleted` (Clerk)

**When:** User leaves organization via Clerk (user clicks "Leave" or admin removes them)

**Purpose:** Cancel subscription if the leaving user is the payer

**Action:**

```typescript
const { organization, public_user_data } = event.data;
const orgId = organization.id;
const userId = public_user_data.user_id;

console.log(`User ${userId} left org ${orgId}`);

// Check if this user was the payer
const org = await db.organization.findUnique({
  where: { id: orgId },
  select: {
    payerId: true,
    stripeSubscriptionId: true,
    name: true,
    subscriptionExpiresAt: true,
  },
});

if (org?.payerId !== userId) {
  console.log("User was not the payer, no action needed");
  return; // Regular member leaving, subscription continues
}

if (!org.stripeSubscriptionId) {
  console.log("No active subscription, no action needed");
  return; // Free org or already canceled
}

// Payer is leaving! Cancel subscription at period end
await stripe.subscriptions.update(org.stripeSubscriptionId, {
  cancel_at_period_end: true,
});

// Clear payer immediately (org has no payer now, but subscription still active until period end)
await db.organization.update({
  where: { id: orgId },
  data: { payerId: null },
});

// Notify remaining admins
await notifyOrgAdmins(orgId, {
  title: "Billing Admin Left Organization",
  message: `Your billing admin has left ${org.name}. The subscription will remain active until ${org.subscriptionExpiresAt?.toLocaleDateString()}, then cancel automatically. Subscribe again to maintain access.`,
});

console.log(`✅ Subscription for org ${orgId} set to cancel at period end`);
```

**Why Cancel at Period End (Not Immediately)?**

- User already paid for the current period
- Gives org time to find new payer
- Better UX (no surprise service interruption)
- Stripe doesn't auto-refund partial periods

**Edge Cases Handled:**

- Regular member leaves: No action
- Org has no active subscription: No action
- Payer leaves: Cancel at period end, clear payerId

---

### 5. `invoice.payment_failed` (Stripe)

**When:** Payment fails (expired card, insufficient funds, etc.)

**Purpose:** Notify org admins, give grace period before cancellation

**Action:**

```typescript
const invoice = event.data.object as Stripe.Invoice;
const subscription = await stripe.subscriptions.retrieve(
  invoice.subscription as string,
);
const orgId = subscription.metadata?.organizationId;

if (!orgId) return; // Not an org subscription

const org = await db.organization.findUnique({
  where: { id: orgId },
  include: { payer: true },
});

// Notify payer and admins
await notifyOrgAdmins(orgId, {
  title: "Payment Failed",
  message: `Payment for ${org.name} failed. Please update your payment method in billing settings. Stripe will retry automatically.`,
  severity: "error",
});

// Send email to payer
if (org.payer?.primaryEmailAddress) {
  await sendEmail({
    to: org.payer.primaryEmailAddress,
    subject: "Payment Failed - Update Required",
    body: `Your payment for ${org.name} failed. Update your payment method at: ${baseUrl}/${org.orgSlug}/settings`,
  });
}

console.log(`⚠️ Payment failed for org ${orgId}, notifications sent`);
```

**What Stripe Does Automatically:**

- Retries payment 3 times over 2 weeks
- If all retries fail → cancels subscription → fires `customer.subscription.deleted`

**Our Role:**

- Notify users immediately on first failure
- Don't disable access during grace period

---

### 6. `customer.deleted` (Stripe)

**When:** Stripe customer deleted (manually via Stripe Dashboard)

**Purpose:** Clean up stripeCustomerId in User table

**Action:**

```typescript
const customer = event.data.object as Stripe.Customer;
const customerId = customer.id;

// Clear stripeCustomerId from user
await db.user.updateMany({
  where: { stripeCustomerId: customerId },
  data: { stripeCustomerId: null },
});

console.log(`✅ Cleared stripeCustomerId ${customerId} from users`);

// Note: Subscriptions already canceled by this point (Stripe requirement)
// So organization.stripeSubscriptionId should already be null via subscription.deleted webhook
```

---

### 7. `user.deleted` (Clerk) - Enhancement Needed

**When:** User deletes their Clerk account

**Purpose:** Cancel any subscriptions they're paying for

**Action (ADD TO EXISTING HANDLER):**

```typescript
case "user.deleted": {
  const userId = data.id;

  // NEW: Check if user was paying for any org
  const paidOrgs = await db.organization.findMany({
    where: { payerId: userId },
    select: { id: true, stripeSubscriptionId: true, name: true }
  });

  for (const org of paidOrgs) {
    if (org.stripeSubscriptionId) {
      // Cancel subscription at period end
      await stripe.subscriptions.update(org.stripeSubscriptionId, {
        cancel_at_period_end: true
      });

      console.log(`Subscription ${org.stripeSubscriptionId} will cancel (user deleted account)`);

      // Notify org admins
      await notifyOrgAdmins(org.id, {
        title: "Billing Admin Deleted Account",
        message: `The billing admin for ${org.name} deleted their account. Subscription will cancel at period end.`
      });
    }
  }

  // EXISTING: Delete user from DB
  await db.user.deleteMany({
    where: { id: userId },
  });

  break;
}
```

---

## API Endpoints

### 1. `createOrgCheckout`

**Purpose:** Create Stripe checkout session for org subscription

**Input:**

```typescript
{
  organizationId: string;
  slots: number; // 1-unlimited (no max limit)
  interval: "monthly" | "yearly";
}
```

**Logic:**

```typescript
export const createOrgCheckout = protectedProcedure
  .input(
    z.object({
      organizationId: z.string(),
      slots: z.number().min(1), // No max limit
      interval: z.enum(["monthly", "yearly"]),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    // 1. Verify user is admin of org
    const membership = await ctx.db.organizationMember.findUnique({
      where: {
        orgId_userId: {
          orgId: input.organizationId,
          userId: ctx.user.id,
        },
      },
    });

    if (!membership || membership.role !== "ADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only organization admins can subscribe",
      });
    }

    // 2. Check: Does user already have an active subscription?
    const canSubscribe = await canUserCreateNewSubscription(ctx.user.id);
    if (!canSubscribe.allowed) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: canSubscribe.reason,
      });
    }

    // 3. Get or create Stripe customer for user
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: { stripeCustomerId: true, primaryEmailAddress: true },
    });

    let customerId = user?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.primaryEmailAddress,
        metadata: { clerkUserId: ctx.user.id },
      });
      customerId = customer.id;

      await ctx.db.user.update({
        where: { id: ctx.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // 4. Get org for return URL
    const org = await ctx.db.organization.findUnique({
      where: { id: input.organizationId },
      select: { orgSlug: true },
    });

    // 5. Create checkout session with org metadata
    const priceId =
      input.interval === "yearly"
        ? STRIPE_QUANTITY_PRICES.YEARLY
        : STRIPE_QUANTITY_PRICES.MONTHLY;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: input.slots,
          adjustable_quantity: {
            enabled: true,
            minimum: 1,
            // No maximum - allow unlimited slots
          },
        },
      ],
      mode: "subscription",
      success_url: `${baseUrl}/billing-return?orgId=${input.organizationId}&success=true`,
      cancel_url: `${baseUrl}/${org.orgSlug}/settings?canceled=true`,
      allow_promotion_codes: true,
      billing_cycle_anchor: "now",
      proration_behavior: "create_prorations", // Immediate proration for all changes
      subscription_data: {
        metadata: {
          organizationId: input.organizationId, // KEY: Webhooks use this
          payerId: ctx.user.id,
        },
      },
      metadata: {
        organizationId: input.organizationId,
        payerId: ctx.user.id,
      },
    });

    return { url: session.url };
  });
```

**Helper Function:**

```typescript
async function canUserCreateNewSubscription(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  // Step 1: Fast DB check - Is user currently paying for an org?
  const currentPaidOrg = await db.organization.findFirst({
    where: {
      payerId: userId,
      subscriptionExpiresAt: { gt: new Date() },
    },
    select: { name: true, subscriptionExpiresAt: true },
  });

  if (currentPaidOrg) {
    return {
      allowed: false,
      reason: `You're already paying for "${currentPaidOrg.name}" until ${currentPaidOrg.subscriptionExpiresAt.toLocaleDateString()}. Cancel that subscription first or wait for it to expire.`,
    };
  }

  // Step 2: Stripe check - Did user leave an org but subscription still active?
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return { allowed: true }; // No Stripe customer = no subscriptions
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "active",
    limit: 10,
  });

  // Check for any active subscription (including ones marked for cancellation but still active)
  const activeSubscription = subscriptions.data.find((sub) => {
    const isStillActive = new Date(sub.current_period_end * 1000) > new Date();
    return isStillActive;
  });

  if (activeSubscription) {
    const expiryDate = new Date(
      activeSubscription.current_period_end * 1000,
    ).toLocaleDateString();
    const orgName =
      activeSubscription.metadata.organizationName || "a previous organization";

    return {
      allowed: false,
      reason: `You have an active subscription for "${orgName}" until ${expiryDate}. Please wait for it to expire or contact support to cancel it immediately.`,
    };
  }

  return { allowed: true };
}
```

**How Stripe Handles Changes:**

**Quantity Increase (e.g., 5 → 10 slots):**

- Same subscription ID, updates line item quantity
- Immediate proration charge for additional slots
- Webhook: `customer.subscription.updated`

**Quantity Decrease (e.g., 10 → 5 slots):**

- Same subscription ID, updates line item quantity
- Immediate proration credit (applied to next invoice)
- Webhook: `customer.subscription.updated`
- **Over-quota handling:** If org has 8 accounts but reduces to 5 slots, client-side check disables premium until user removes 3 accounts

**Billing Cycle Switch (e.g., monthly → yearly):**

- Creates **NEW subscription** (new ID) with yearly product
- Cancels **OLD subscription** (monthly)
- Applies proration credit from unused monthly time
- Webhooks: `customer.subscription.deleted`, then `customer.subscription.created`
- **Grace period:** Delete event doesn't revoke access immediately (sets expiry date), create event updates with new subscription

---

### 2. `createOrgPortal`

**Purpose:** Create Stripe customer portal session for managing subscription

**Input:**

```typescript
{
  organizationId: string;
}
```

**Logic:**

```typescript
export const createOrgPortal = protectedProcedure
  .input(
    z.object({
      organizationId: z.string(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    // Get org with payer info
    const org = await ctx.db.organization.findUnique({
      where: { id: input.organizationId },
      include: { payer: true },
    });

    if (!org?.payer?.stripeCustomerId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active subscription found",
      });
    }

    // Verify user is payer or admin
    const membership = await ctx.db.organizationMember.findUnique({
      where: {
        orgId_userId: {
          orgId: input.organizationId,
          userId: ctx.user.id,
        },
      },
    });

    if (
      !membership ||
      (ctx.user.id !== org.payerId && membership.role !== "ADMIN")
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the payer or admins can access billing settings",
      });
    }

    // Create customer portal session (uses payer's Stripe customer)
    const session = await stripe.billingPortal.sessions.create({
      customer: org.payer.stripeCustomerId,
      return_url: `${baseUrl}/billing-return?orgId=${input.organizationId}`, // Use org ID (immutable)
    });

    return { url: session.url };
  });
```

---

### 3. `getSubscriptionStatus`

**Purpose:** Get org's subscription status for UI (billing page, settings, dashboard banners)

**Input:**

```typescript
{
  organizationId: string
  includeDetails?: boolean  // Fetch billing cycle from Stripe (slower)
}
```

**Output:**

```typescript
{
  isActive: boolean
  purchasedSlots: number
  usedSlots: number
  expiresAt: Date | null
  subscriptionTier: 'FREE' | 'PREMIUM'
  payer: { firstName: string, lastName: string, email: string } | null
  isPayer: boolean
  billingCycle?: 'monthly' | 'yearly'  // Only if includeDetails=true
  cancelAtPeriodEnd?: boolean          // Only if includeDetails=true
}
```

**Logic:**

```typescript
export const getSubscriptionStatus = protectedProcedure
  .input(
    z.object({
      organizationId: z.string(),
      includeDetails: z.boolean().optional().default(false),
    }),
  )
  .query(async ({ ctx, input }) => {
    // Verify user is member
    const membership = await ctx.db.organizationMember.findUnique({
      where: {
        orgId_userId: {
          orgId: input.organizationId,
          userId: ctx.user.id,
        },
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a member of this organization",
      });
    }

    // Get org with payer and LinkedIn account count
    const org = await ctx.db.organization.findUnique({
      where: { id: input.organizationId },
      include: {
        payer: {
          select: {
            firstName: true,
            lastName: true,
            primaryEmailAddress: true,
          },
        },
        linkedInAccounts: {
          where: { organizationId: input.organizationId },
          select: { id: true },
        },
      },
    });

    if (!org) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    // Fast data from DB
    const isActive = org.subscriptionExpiresAt
      ? org.subscriptionExpiresAt > new Date()
      : false;
    const usedSlots = org.linkedInAccounts.length;

    const baseStatus = {
      isActive,
      purchasedSlots: org.purchasedSlots,
      usedSlots,
      expiresAt: org.subscriptionExpiresAt,
      subscriptionTier: org.subscriptionTier as "FREE" | "PREMIUM",
      payer: org.payer,
      isPayer: ctx.user.id === org.payerId,
    };

    // If details requested (billing page), query Stripe
    if (input.includeDetails && org.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(
        org.stripeSubscriptionId,
      );

      return {
        ...baseStatus,
        billingCycle:
          subscription.items.data[0].price.recurring.interval === "year"
            ? "yearly"
            : "monthly",
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      };
    }

    return baseStatus;
  });
```

---

### 4. Billing Return Page (New)

**Purpose:** Handle Stripe portal return URL with org ID

**Location:** `apps/nextjs/src/app/billing-return/page.tsx`

**Logic:**

```typescript
export default async function BillingReturnPage({
  searchParams
}: {
  searchParams: { orgId: string; success?: string }
}) {
  const org = await db.organization.findUnique({
    where: { id: searchParams.orgId },
    select: { orgSlug: true }
  });

  if (!org?.orgSlug) {
    return <div>Organization not found</div>;
  }

  // Redirect to current slug (handles org slug changes)
  const successParam = searchParams.success ? '?success=true' : '';
  redirect(`/${org.orgSlug}/settings${successParam}`);
}
```

---

## UI & Feature Gating

### Settings Page UI Specification

**Location:** `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/settings/page.tsx`

**Full Implementation:**

```typescript
"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "@sassy/ui/button";
import { Card } from "@sassy/ui/card";
import { Badge } from "@sassy/ui/badge";
import { Alert } from "@sassy/ui/alert";

export default function SettingsPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly"); // Default: yearly (recommended)
  const [quantity, setQuantity] = useState(1);

  const { data: prices } = api.stripe.getPricing.useQuery();
  const { data: org } = api.organization.getSubscriptionStatus.useQuery({
    organizationId: activeOrg.id,
    includeDetails: true,
  });
  const { data: membership } = api.organization.getMembership.useQuery();

  const createCheckout = api.stripe.createOrgCheckout.useMutation();
  const createPortal = api.stripe.createOrgPortal.useMutation();

  const isFreeTier = org?.subscriptionTier === "FREE";
  const isAdmin = membership?.role === "ADMIN";
  const isPayer = org?.isPayer;
  const isOverQuota = (org?.usedSlots ?? 0) > (org?.purchasedSlots ?? 1);

  // Price calculation
  const pricePerSlot = billingCycle === "monthly"
    ? (prices?.monthly.amount ?? 2999) / 100
    : (prices?.yearly.amount ?? 29999) / 100 / 12; // Monthly equivalent

  const totalMonthly = (pricePerSlot * quantity).toFixed(2);
  const totalYearly = billingCycle === "yearly" ? (pricePerSlot * quantity * 12).toFixed(2) : null;
  const savings = billingCycle === "yearly" ? ((29.99 - pricePerSlot) * quantity * 12).toFixed(2) : null;

  const handleUpgrade = async () => {
    const result = await createCheckout.mutateAsync({
      organizationId: activeOrg.id,
      slots: quantity,
      interval: billingCycle,
    });
    window.location.href = result.url;
  };

  const handleManageSubscription = async () => {
    const result = await createPortal.mutateAsync({
      organizationId: activeOrg.id,
    });
    window.location.href = result.url;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your organization's subscription and billing settings
        </p>
      </div>

      {/* Over Quota Warning */}
      {isOverQuota && !isFreeTier && (
        <Alert variant="warning">
          <h3 className="font-semibold">Over Quota</h3>
          <p>
            You have {org.usedSlots} accounts but only {org.purchasedSlots} slots.
            Premium features are disabled.{" "}
            <a href={`/${org.orgSlug}/accounts`} className="underline">
              Remove {org.usedSlots - org.purchasedSlots} account(s)
            </a>{" "}
            or{" "}
            <button onClick={handleManageSubscription} className="underline">
              upgrade your plan
            </button>
            .
          </p>
        </Alert>
      )}

      {/* Non-Admin View */}
      {!isAdmin && (
        <Alert>
          <p>
            Only admins can manage billing. Contact an admin to upgrade or manage the subscription.
          </p>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Tier Card */}
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Free</h2>
              <p className="text-3xl font-bold mt-2">$0</p>
              <p className="text-sm text-muted-foreground">Forever free</p>
            </div>

            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>1 LinkedIn account slot</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Manual LinkedIn management</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Target list collection</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Comment history tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span className="text-muted-foreground">No AI features</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-500 mr-2">✗</span>
                <span className="text-muted-foreground">No auto-engagement</span>
              </li>
            </ul>

            {isFreeTier && (
              <Badge variant="secondary">Current Plan</Badge>
            )}
          </div>
        </Card>

        {/* Premium Tier Card */}
        <Card className="p-6 border-2 border-primary">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Premium</h2>
                {!isFreeTier && <Badge>Current Plan</Badge>}
              </div>
              <p className="text-3xl font-bold mt-2">
                ${pricePerSlot.toFixed(2)}<span className="text-sm font-normal">/slot/month</span>
              </p>
              {billingCycle === "yearly" && (
                <p className="text-sm text-muted-foreground">
                  Billed yearly at ${(pricePerSlot * 12).toFixed(2)}/slot/year
                </p>
              )}
            </div>

            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>1-unlimited LinkedIn account slots</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>All free features</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="font-semibold">AI-powered comments</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="font-semibold">Hyperbrowser virtual runs</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="font-semibold">Auto-engagement campaigns</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span className="font-semibold">Priority support</span>
              </li>
            </ul>

            {/* Billing Cycle Toggle */}
            {isFreeTier && isAdmin && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={billingCycle === "monthly"}
                      onChange={() => setBillingCycle("monthly")}
                    />
                    <span>Monthly</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={billingCycle === "yearly"}
                      onChange={() => setBillingCycle("yearly")}
                    />
                    <span>Yearly</span>
                    <Badge variant="secondary" className="ml-1">
                      Save 16.7%
                    </Badge>
                  </label>
                </div>

                {/* Quantity Selector */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Number of Slots (1-unlimited)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                {/* Price Breakdown */}
                <div className="bg-muted p-4 rounded-lg space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{quantity} slot(s) × ${pricePerSlot.toFixed(2)}/mo</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>
                      ${totalMonthly}/{billingCycle === "monthly" ? "month" : "year"}
                    </span>
                  </div>
                  {billingCycle === "yearly" && (
                    <p className="text-xs text-green-600">
                      You save ${savings}/year compared to monthly billing
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div>
              {isFreeTier && isAdmin ? (
                <Button
                  onClick={handleUpgrade}
                  disabled={createCheckout.isLoading}
                  className="w-full"
                  size="lg"
                >
                  {createCheckout.isLoading ? "Loading..." : "Upgrade to Premium"}
                </Button>
              ) : !isFreeTier && (isPayer || isAdmin) ? (
                <div className="space-y-3">
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>{org.purchasedSlots} slots</strong> • {org.usedSlots} used
                    </p>
                    <p className="text-muted-foreground">
                      {org.cancelAtPeriodEnd
                        ? `Cancels on ${org.expiresAt?.toLocaleDateString()}`
                        : `Renews on ${org.expiresAt?.toLocaleDateString()}`}
                    </p>
                    {org.payer && !isPayer && (
                      <p className="text-sm">
                        Paid by {org.payer.firstName} {org.payer.lastName}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleManageSubscription}
                    disabled={createPortal.isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {createPortal.isLoading ? "Loading..." : "Manage Subscription"}
                  </Button>
                </div>
              ) : (
                <Alert>
                  <p className="text-sm">
                    Contact {org.payer?.firstName || "an admin"} to manage billing.
                  </p>
                </Alert>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
```

### Updated Feature Check Helper (with Quota)

```typescript
// packages/api/src/utils/check-premium.ts

export function isPremiumOrg(org: {
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
  purchasedSlots: number;
  accountCount: number;
}): boolean {
  // Check subscription active
  if (!org.subscriptionExpiresAt) return false;
  if (org.subscriptionExpiresAt < new Date()) return false;
  if (org.subscriptionTier !== "PREMIUM") return false;

  // Check quota compliance
  if (org.accountCount > org.purchasedSlots) {
    return false; // Over quota = no premium
  }

  return true;
}
```

### Usage in Next.js (Components)

```typescript
// apps/nextjs/src/components/ai-comment-button.tsx

const { data: org } = api.organization.getCurrent.useQuery();
const accountCount = org?.linkedInAccounts.length ?? 0;

const isPremium = isPremiumOrg({
  subscriptionTier: org?.subscriptionTier,
  subscriptionExpiresAt: org?.subscriptionExpiresAt,
  purchasedSlots: org?.purchasedSlots ?? 1,
  accountCount,
});

return (
  <>
    <Button disabled={!isPremium} onClick={generateAIComment}>
      {isPremium ? "✨ Generate AI Comment" : "🔒 Upgrade for AI"}
    </Button>

    {accountCount > (org?.purchasedSlots ?? 1) && (
      <Alert variant="warning">
        Premium disabled: Over quota. Remove {accountCount - (org?.purchasedSlots ?? 1)} account(s).
      </Alert>
    )}
  </>
);
```

### Usage in WXT Extension

```typescript
// apps/wxt-extension/entrypoints/linkedin.content/compose-tab/ComposeTab.tsx

const { data: org } = trpc.organization.getCurrent.useQuery();
const accountCount = org?.linkedInAccounts.length ?? 0;

const isPremium = isPremiumOrg({
  subscriptionTier: org?.subscriptionTier ?? 'FREE',
  subscriptionExpiresAt: org?.subscriptionExpiresAt,
  purchasedSlots: org?.purchasedSlots ?? 1,
  accountCount,
});

const isOverQuota = accountCount > (org?.purchasedSlots ?? 1);

return (
  <div>
    {/* AI features - show upgrade prompt if not premium */}
    {isPremium ? (
      <>
        <Button onClick={generateAIComment}>✨ AI Comment</Button>
        <Button onClick={startHyperBrowser}>🤖 Auto Engage</Button>
      </>
    ) : isOverQuota ? (
      <Alert variant="warning">
        <p className="text-sm">Premium disabled: Over quota</p>
        <p className="text-xs">
          Remove {accountCount - (org?.purchasedSlots ?? 1)} account(s) or upgrade.
        </p>
      </Alert>
    ) : (
      <UpgradeBanner>
        <Text size="sm">Unlock AI features with Premium</Text>
        <Button
          size="sm"
          onClick={() => window.open(`https://engagekit.io/${org?.orgSlug}/settings`)}
        >
          Upgrade
        </Button>
      </UpgradeBanner>
    )}

    {/* Manual mode - always available */}
    <TextArea placeholder="Write your comment..." />
    <Button onClick={submitManualComment}>Post Comment</Button>
  </div>
);
```

### Feature Matrix (Simple)

| Feature                       | Free        | Premium (any quantity) |
| ----------------------------- | ----------- | ---------------------- |
| Manual LinkedIn management    | ✅          | ✅                     |
| LinkedIn account slots        | 1 slot only | 1-unlimited slots      |
| Target lists                  | ✅          | ✅                     |
| Comment history               | ✅          | ✅                     |
| **AI-powered comments**       | ❌          | ✅                     |
| **Hyperbrowser virtual runs** | ❌          | ✅                     |
| **Auto-engagement campaigns** | ❌          | ✅                     |
| **Priority support**          | ❌          | ✅                     |

**Note:** Premium tier unlocks AI features regardless of slot count. User can purchase Premium with quantity=1 to get AI features with just 1 slot.

---

## Edge Cases & Safeguards

### 1. Webhook Idempotency

**Problem:** Stripe may send duplicate webhooks.

**Solution:**

```typescript
// checkout.session.completed
const existing = await db.organization.findUnique({
  where: { id: orgId },
  select: { stripeSubscriptionId: true },
});
if (existing?.stripeSubscriptionId === subscription.id) return; // Skip

// customer.subscription.deleted
const org = await db.organization.findUnique({
  where: { id: orgId },
  select: { stripeSubscriptionId: true },
});
if (org?.stripeSubscriptionId !== subscription.id) return; // Skip
```

---

### 2. User Deletes Account While Paying

**Handled by:** Enhanced `user.deleted` Clerk webhook (see Webhooks section)

---

### 3. Race Condition: User Leaves During Checkout

**Handled by:** `checkout.session.completed` verifies user still in org, cancels and refunds if not

---

### 4. Webhook Failures

**Solution:** Return 500 on error → Stripe retries automatically

```typescript
export async function POST(req: Request) {
  try {
    await updateOrganizationFromWebhook(event);
    return NextResponse.json({ received: true }); // 200 only if successful
  } catch (error) {
    console.error("Webhook processing failed:", error);
    return new NextResponse("Webhook error", { status: 500 }); // Stripe retries
  }
}
```

---

### 5. Subscription Quantity = 0

**Handled by:** Guard in all webhooks: `const quantity = Math.max(1, subscription.items.data[0].quantity || 1);`

---

### 6. Stripe Customer Deleted

**Handled by:** `customer.deleted` webhook clears `User.stripeCustomerId`

---

### 7. Org Has 5 Accounts, Subscription Expires

**Behavior:**

- Webhook resets `purchasedSlots: 1`
- Existing 5 accounts remain (no data loss)
- Slot enforcement prevents adding 6th account
- UI shows: "You have 5 accounts but free tier allows 1. Upgrade or remove 4."

**This is desired behavior** - no automatic data deletion.

---

### 8. User Downgrades While Over Quota

**Scenario:** Org has 10 slots with 8 accounts. User reduces to 5 slots via Customer Portal.

**Behavior:**

1. Stripe applies reduction immediately (with proration credit)
2. Webhook updates `purchasedSlots: 5`
3. Org now has 8 accounts, 5 slots → **over quota**
4. Client-side `isPremiumOrg()` check: `accountCount > purchasedSlots` → returns `false`
5. Premium features disabled for **ALL accounts**
6. Warning banner: "You have 8 accounts but only 5 slots. Remove 3 accounts to restore premium."
7. User removes 3 accounts manually
8. Org has 5 accounts, 5 slots → quota OK
9. Client-side check passes → premium restored

**Why This Works:**

- Simple (no scheduling, no scheduled changes)
- Fair (all accounts treated equally, no picking which ones lose access)
- Self-service (user resolves at their pace)
- Clear consequence (over quota = no premium)
- No data loss (accounts preserved, just premium disabled)

---

### 8. Org Slug Changes While in Portal

**Handled by:** Return URL uses org ID → billing-return page redirects to current slug

---

## Migration Strategy

### Phase 1: Additive Changes (Non-Breaking)

**Goal:** Add new fields without breaking existing functionality.

**Steps:**

1. Add fields to Organization: `payerId`, `stripeSubscriptionId`, `subscriptionExpiresAt`, `subscriptionTier`
2. Add relation: `Organization.payer` → `User`
3. Deploy schema migration (no data changes yet)

**SQL:**

```sql
-- Add new fields
ALTER TABLE "Organization" ADD COLUMN "payerId" TEXT;
ALTER TABLE "Organization" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "Organization" ADD COLUMN "subscriptionExpiresAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "subscriptionTier" TEXT DEFAULT 'FREE';

-- Add constraints
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_stripeSubscriptionId_key"
  UNIQUE ("stripeSubscriptionId");

ALTER TABLE "Organization" ADD CONSTRAINT "Organization_payerId_fkey"
  FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

**Verification:**

```bash
pnpm db:push
psql $DATABASE_URL -c "\d \"Organization\""
```

---

### Phase 2: Data Migration

**Goal:** Move existing user subscriptions to organizations.

**Script:** `scripts/migrate-subscriptions.ts`

```typescript
import Stripe from "stripe";

import { db } from "@sassy/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
});

async function migrateSubscriptions() {
  const users = await db.user.findMany({
    where: {
      accessType: { not: "FREE" },
      stripeCustomerId: { not: null },
    },
    include: {
      organizationMemberships: {
        include: { organization: true },
        where: { role: "ADMIN" },
      },
    },
  });

  console.log(`Found ${users.length} users with subscriptions`);

  const results = {
    migrated: 0,
    noAdminOrg: 0,
    noStripeSubscription: 0,
    errors: 0,
  };

  for (const user of users) {
    try {
      const primaryOrg = user.organizationMemberships[0]?.organization;

      if (!primaryOrg) {
        console.warn(`User ${user.id} has subscription but no admin org`);
        results.noAdminOrg++;
        continue;
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId!,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        console.warn(
          `User ${user.id} has accessType but no active Stripe subscription`,
        );
        results.noStripeSubscription++;
        continue;
      }

      const subscription = subscriptions.data[0];

      // Update subscription metadata
      await stripe.subscriptions.update(subscription.id, {
        metadata: {
          organizationId: primaryOrg.id,
          payerId: user.id,
          migratedAt: new Date().toISOString(),
        },
      });

      // Update organization
      await db.organization.update({
        where: { id: primaryOrg.id },
        data: {
          payerId: user.id,
          stripeSubscriptionId: subscription.id,
          purchasedSlots: subscription.items.data[0].quantity || 1,
          subscriptionTier: "PREMIUM",
          subscriptionExpiresAt: new Date(
            subscription.current_period_end * 1000,
          ),
        },
      });

      console.log(`✅ Migrated user ${user.id} to org ${primaryOrg.id}`);
      results.migrated++;
    } catch (error) {
      console.error(`Error migrating user ${user.id}:`, error);
      results.errors++;
    }
  }

  console.log("\n=== Migration Results ===");
  console.log(`Migrated: ${results.migrated}`);
  console.log(`No admin org: ${results.noAdminOrg}`);
  console.log(`No Stripe subscription: ${results.noStripeSubscription}`);
  console.log(`Errors: ${results.errors}`);
}

migrateSubscriptions().catch(console.error);
```

---

### Phase 3: Update Webhook Handlers (Dual-Write)

**Goal:** Webhooks update both User (old) and Organization (new) tables.

**Duration:** Keep dual-write for 30 days after migration.

```typescript
// apps/nextjs/src/app/api/webhooks/stripe/route.ts

if (eventType === "customer.subscription.updated") {
  const subscription = event.data.object;
  const orgId = subscription.metadata?.organizationId;

  // OLD: Update User table (temporary, for backward compatibility)
  if (clerkUserId) {
    await db.user.update({
      where: { id: clerkUserId },
      data: {
        accessType: mappedAccessType,
        stripeUserProperties: subscription,
      },
    });
  }

  // NEW: Update Organization table (if metadata present)
  if (orgId) {
    await db.organization.update({
      where: { id: orgId },
      data: {
        purchasedSlots: subscription.items.data[0].quantity,
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
      },
    });
  }
}
```

---

### Phase 4: Update API Endpoints & UI

**New Endpoints:**

- `createOrgCheckout`
- `createOrgPortal`
- `getSubscriptionStatus`

**Old Endpoints (Deprecate):**

- `createCheckout`
- `createCustomerPortal`
- `checkAccess`

**UI Updates:**

```typescript
// OLD
const hasAccess = user?.accessType !== "FREE";

// NEW
const isPremium = isPremiumOrg(org);
```

**Files to Update (~18 files):**

- `use-premium-status.ts`
- `use-subscription.ts`
- `subscription-status.tsx`
- `subscription/page.tsx`
- `check-premium-access.ts`
- WXT extension components

---

### Phase 5: Enhance Webhooks

**Add new logic:**

- `user.deleted`: Cancel subscriptions user is paying for
- `customer.deleted`: Clear stripeCustomerId
- `invoice.payment_failed`: Send notifications

---

### Phase 6: Remove Old Fields (Breaking)

**Wait Period:** 30 days after Phase 4 deployed.

**SQL:**

```sql
ALTER TABLE "Organization" DROP COLUMN "stripeCustomerId";
ALTER TABLE "User" DROP COLUMN "accessType";
ALTER TABLE "User" DROP COLUMN "stripeUserProperties";
ALTER TABLE "LinkedInAccount" DROP COLUMN "accessType";
DROP TYPE "AccessType";
```

**Remove Code:**

- Old endpoints
- Dual-write logic
- Old hooks

---

## Testing Checklist

### Webhooks

- [ ] `checkout.session.completed` creates org subscription
- [ ] `customer.subscription.updated` updates slots and expiry
- [ ] `customer.subscription.deleted` resets org to free tier
- [ ] `organizationMembership.deleted` cancels subscription when payer leaves
- [ ] `invoice.payment_failed` sends notifications
- [ ] `customer.deleted` clears stripeCustomerId
- [ ] `user.deleted` cancels subscriptions
- [ ] Duplicate webhooks handled (idempotency)
- [ ] Missing metadata skipped gracefully
- [ ] Quantity = 0 guarded against

### Subscription Flows

- [ ] Admin subscribes to org (with quantity = 1 and 5)
- [ ] Subscription renews automatically
- [ ] User increases slots in portal (5 → 10, immediate proration)
- [ ] User decreases slots in portal (10 → 5, immediate proration credit)
- [ ] User decreases slots while over quota (10 → 5 with 8 accounts, premium disabled)
- [ ] User removes excess accounts to restore premium (8 → 5 accounts)
- [ ] User switches billing cycle (monthly → yearly, seamless with grace period)
- [ ] User switches billing cycle (yearly → monthly)
- [ ] User cancels in portal (subscription ends at period end)
- [ ] Payer leaves org (subscription cancels at period end)
- [ ] New admin subscribes after payer leaves
- [ ] Payment fails (notification sent, Stripe retries)

### Constraints & Edge Cases

- [ ] User with active subscription blocked from creating new subscription
- [ ] User who left org as payer blocked until expiry
- [ ] Admin-only subscription creation enforced
- [ ] Non-admin sees appropriate UI
- [ ] Org with 5 accounts and expired subscription can't add 6th
- [ ] Org with 8 accounts downgrades to 5 slots → premium disabled
- [ ] Org removes excess accounts → premium restored immediately
- [ ] Over-quota warning banner displays correctly
- [ ] Client-side premium check includes quota validation
- [ ] User deleting account cancels subscriptions
- [ ] User leaving during checkout (refund works)
- [ ] Slot enforcement works (already implemented, no changes)
- [ ] Billing cycle switch creates grace period (no downtime)

### UI States

- [ ] Admin, free tier: Shows upgrade button
- [ ] Admin, paying: Shows manage subscription
- [ ] Admin, someone else paying: Shows read-only view
- [ ] Non-admin: Shows "contact admin" message
- [ ] Premium features disabled for free tier (client-side)
- [ ] Org slug change doesn't break portal return

### Migration

- [ ] Data migration script runs successfully
- [ ] All active subscriptions mapped to orgs
- [ ] Unmapped subscriptions flagged
- [ ] Dual-write period works
- [ ] UI migration complete
- [ ] Old fields removed without breaking

---

## Files to Modify

### Schema (Phase 1) ✅ COMPLETE

- [x] `packages/db/prisma/models/organization.prisma` - Added 4 fields + relation
  - `payerId String?`
  - `stripeSubscriptionId String? @unique`
  - `subscriptionTier String @default("FREE")`
  - `subscriptionExpiresAt DateTime?`
  - `payer User? @relation("OrgPayer", ...)`
- [x] `packages/db/prisma/models/user.prisma` - Added paidOrganizations relation
  - `paidOrganizations Organization[] @relation("OrgPayer")`
- [ ] Run: `pnpm db:push` (user to run manually)

### API Routes (Phase 2) ✅ COMPLETE

- [x] `packages/api/src/router/organization.ts` - Added subscription sub-router
  - `trpc.organization.subscription.status()` - Get org subscription status
  - `trpc.organization.subscription.pricing()` - Get pricing from QUANTITY_PRICING_CONFIG
  - `trpc.organization.subscription.checkout()` - Create Stripe checkout for org
  - `trpc.organization.subscription.portal()` - Create Stripe customer portal
- [x] `packages/feature-flags/src/premium.ts` - Added isPremiumOrg and getPremiumStatus helpers
- [x] `packages/feature-flags/src/index.ts` - Exported new helpers

**Implementation Notes:**

- Subscription endpoints use `ctx.activeOrg.id` from Clerk context
- Checkout blocks if user already has active subscription (DB check only, webhooks keep in sync)
- Get-or-create Stripe customer wrapped in transaction
- `NEXTJS_URL` env var required (throws if missing)
- Pricing uses `QUANTITY_PRICING_CONFIG` instead of Stripe API

### Webhooks (Phase 3) ✅ COMPLETE

- [x] `packages/api/src/api/webhooks/stripe.webhook.ts` - Added org-centric handlers:
  - `checkout.session.completed` - Initialize org subscription from checkout
  - `customer.subscription.created/updated` - Sync slots and expiry to org
  - `customer.subscription.deleted/paused` - Reset org to free tier with grace period
  - `customer.deleted` - Clear stripeCustomerId from user
  - Legacy user-centric handlers preserved for backwards compatibility
- [x] `packages/api/src/api/webhooks/clerk.webhook.ts` - Enhanced:
  - `user.deleted` - Cancel subscriptions user is paying for
  - `organizationMembership.deleted` - Cancel subscription if payer leaves org

**Implementation Notes:**

- Uses switch/case for cleaner event handling
- Idempotency checks prevent duplicate processing
- Race condition handled: If user leaves org during checkout, subscription is canceled and refunded
- Grace period on deletion: subscriptionExpiresAt set to period end (not immediate revocation)
- Legacy handlers fall through when no org metadata present

### New Pages (Phase 4) - PENDING

- [ ] `apps/nextjs/src/app/billing-return/page.tsx` - Create return handler
- [ ] `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/settings/page.tsx` - Create or update billing page

### UI (Phase 5) - ~18 files - PENDING

- [ ] `apps/nextjs/src/hooks/use-subscription.ts` - Switch to org endpoints
- [ ] `apps/nextjs/src/hooks/use-premium-status.ts` - Switch to org endpoints
- [ ] `apps/nextjs/src/_components/subscription-status.tsx` - Use getSubscriptionStatus
- [ ] `apps/nextjs/src/app/subscription/page.tsx` - Use createOrgCheckout
- [ ] `packages/api/src/utils/check-premium-access.ts` - Use isPremiumOrg
- [ ] `apps/wxt-extension/entrypoints/*` - Add premium checks with isPremiumOrg

### Data Migration (Phase 6) - PENDING

- [ ] `scripts/migrate-subscriptions.ts` - Create migration script
- [ ] `scripts/verify-migration.ts` - Create verification script

### Cleanup (Phase 7) - PENDING

- [ ] Remove `User.accessType`, `stripeUserProperties`, `LinkedInAccount.accessType`
- [ ] Remove `AccessType` enum
- [ ] Remove `Organization.stripeCustomerId`
- [ ] Remove old endpoints, hooks, utilities
- [ ] Remove dual-write logic

---

## Summary: Key Changes from Original Plan

### Version 2.2 Updates (Final Pricing Model)

| Aspect                   | Previous Version           | Version 2.2                                            |
| ------------------------ | -------------------------- | ------------------------------------------------------ |
| **Pricing model**        | "Premium = multiple slots" | "Premium = AI features enabled, slots = quantity"      |
| **Slot count**           | Fixed 2-24 for premium     | 1-unlimited based on quantity purchased                |
| **Monthly price**        | $24.99/slot/month          | **$29.99/slot/month** (actual Stripe price)            |
| **Yearly price**         | Not specified              | **$299.99/slot/year** (16.7% discount)                 |
| **Price fetching**       | Hardcoded                  | Live from Stripe API                                   |
| **Feature gating**       | Simple expiry check        | Includes quota compliance check                        |
| **Downgrade handling**   | Not specified              | Immediate with over-quota enforcement                  |
| **Settings page UI**     | Basic specification        | Complete implementation with live pricing              |
| **Quantity limits**      | 1-24 slots                 | 1-unlimited (no max)                                   |
| **Stripe portal config** | Plan switches unclear      | Allow both quantity changes and billing cycle switches |

### Clarified Pricing Logic

**Previous Understanding (WRONG):**

- Free = 1 slot
- Premium = 2-24 slots (premium implies multiple slots)

**Corrected Understanding (CORRECT):**

- `subscriptionTier = "PREMIUM"` means **"has AI features"**
- `purchasedSlots` determines slot count (independent of tier)
- Examples:
  - Free: `purchasedSlots = 1`, `subscriptionTier = "FREE"` → 1 slot, no AI
  - Premium (qty=1): `purchasedSlots = 1`, `subscriptionTier = "PREMIUM"` → 1 slot, WITH AI ✅
  - Premium (qty=5): `purchasedSlots = 5`, `subscriptionTier = "PREMIUM"` → 5 slots, WITH AI

### Downgrade Flow (New)

**Scenario:** User reduces from 10 to 5 slots while having 8 accounts connected.

**Behavior:**

1. Stripe applies reduction immediately (with proration credit)
2. Webhook updates `purchasedSlots = 5`
3. Org has 8 accounts, 5 slots → **over quota**
4. Client-side check: `accountCount > purchasedSlots` → `isPremium = false`
5. Premium features disabled for **ALL accounts**
6. Warning banner shows: "Remove 3 accounts to restore premium"
7. User removes 3 accounts → quota OK → premium restored

**Why This Works:**

- ✅ Simple (no scheduled changes)
- ✅ Fair (all accounts treated equally)
- ✅ Self-service (user fixes at their pace)
- ✅ Clear consequence (over quota = no premium)

### What Makes This Simpler

1. ✅ **Slot enforcement already works** - No changes needed, webhooks maintain it
2. ✅ **Client-side feature gating** - No server checks for AI features yet (includes quota check)
3. ✅ **Admins only** - Clearer permission model
4. ✅ **Two tiers** - FREE | PREMIUM (no complex matrix)
5. ✅ **Single settings page** - No nested routes
6. ✅ **Clerk webhooks exist** - Just enhance, don't create
7. ✅ **Layout handles org switching** - No custom logic needed
8. ✅ **Immediate downgrades** - No scheduling complexity
9. ✅ **Live price fetching** - Always up-to-date, no manual sync

---

**Next Steps:**

1. ~~Review this simplified plan~~ ✅
2. ~~Begin Phase 1: Schema migration (non-breaking)~~ ✅
3. ~~Phase 2: API endpoints~~ ✅
4. ~~Phase 3: Webhook handlers~~ ✅
5. **Phase 4: New pages (billing-return, settings)** ← NEXT
6. Phase 5: UI updates (~18 files)
7. Phase 6: Data migration script
8. Test on staging environment

---

**Plan Version:** 2.4 (Phase 1, 2 & 3 Complete)
**Last Updated:** 2026-01-28
**Author:** Architecture discussion with user

**Key Updates in v2.2:**

- ✅ Corrected pricing model: Premium = AI features (not multiple slots)
- ✅ Actual Stripe pricing: $29.99/mo, $299.99/yr (16.7% discount)
- ✅ Live price fetching from Stripe API
- ✅ Quota-aware feature gating (client-side)
- ✅ Immediate downgrade handling with over-quota enforcement
- ✅ Complete settings page UI implementation
- ✅ No quantity limits (1-unlimited slots)
