# Organization Payment System Redesign

## Overview

Restructure payment handling to be organization-centric. Each organization has its own subscription, with a `payerId` referencing the User who pays. The payer's `stripeCustomerId` is used for charging. When the payer leaves the org, the subscription auto-cancels at period end.

## Current State

- `Organization` has `stripeCustomerId` and `purchasedSlots` but webhooks don't update them
- `User` has `stripeCustomerId`, `accessType`, `stripeUserProperties`
- Stripe webhooks update User table, not Organization
- Inconsistent: payment fields exist in both tables but aren't properly connected

## Target State

- `Organization` owns subscription data (`payerId`, `stripeSubscriptionId`, `purchasedSlots`, `subscriptionExpiresAt`)
- `User` owns Stripe customer identity (`stripeCustomerId`)
- Webhooks update Organization based on metadata
- Clean separation: User = billing identity, Organization = subscription

---

## Schema Changes

### Organization Table

**ADD:**
```prisma
payerId               String?   // User who pays for this org
stripeSubscriptionId  String?   @unique  // To cancel when payer leaves
subscriptionExpiresAt DateTime? // From Stripe current_period_end
```

**REMOVE:**
```prisma
stripeCustomerId      String?   // Get from payer.stripeCustomerId instead
```

**KEEP:**
```prisma
purchasedSlots        Int       @default(1)  // Already exists
```

### User Table

**KEEP:**
```prisma
stripeCustomerId      String?   @unique
```

**REMOVE:**
```prisma
accessType            AccessType  // Subscription is per org now
stripeUserProperties  Json?       // No longer needed
```

**REMOVE ENUM:**
```prisma
enum AccessType {
  FREE
  WEEKLY
  MONTHLY
  YEARLY
}
```

### Final Schema

```prisma
// organization.prisma
model Organization {
  id                    String    @id
  name                  String
  orgSlug               String?

  // Payment fields
  payerId               String?
  stripeSubscriptionId  String?   @unique
  purchasedSlots        Int       @default(1)
  subscriptionExpiresAt DateTime?

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  payer            User?                @relation("OrgPayer", fields: [payerId], references: [id], onDelete: SetNull)
  members          OrganizationMember[]
  linkedInAccounts LinkedInAccount[]
}

// user.prisma
model User {
  id                  String   @id
  firstName           String?
  lastName            String?
  username            String?  @unique
  primaryEmailAddress String   @unique
  imageUrl            String?
  stripeCustomerId    String?  @unique
  clerkUserProperties Json?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  paidOrganizations       Organization[]       @relation("OrgPayer")
  organizationMemberships OrganizationMember[]
  linkedInAccounts        LinkedInAccount[]
}
```

---

## Webhooks

### 1. `checkout.session.completed` (Stripe)

**When:** User completes checkout for first time

**Action:**
```typescript
const session = event.data.object;
const subscription = await stripe.subscriptions.retrieve(session.subscription);

const orgId = session.metadata.organizationId;
const payerId = session.metadata.payerId;
const slots = subscription.items.data[0].quantity;

await db.organization.update({
  where: { id: orgId },
  data: {
    payerId: payerId,
    stripeSubscriptionId: subscription.id,
    purchasedSlots: slots,
    subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
  }
});
```

### 2. `customer.subscription.updated` (Stripe)

**When:** Subscription renews, slots changed, payment succeeds

**Action:**
```typescript
const subscription = event.data.object;
const orgId = subscription.metadata.organizationId;

if (!orgId) return; // Not an org subscription

const slots = subscription.items.data[0].quantity;

await db.organization.update({
  where: { id: orgId },
  data: {
    purchasedSlots: slots,
    subscriptionExpiresAt: new Date(subscription.current_period_end * 1000),
  }
});
```

### 3. `customer.subscription.deleted` (Stripe)

**When:** Subscription canceled (immediately or at period end reached)

**Action:**
```typescript
const subscription = event.data.object;
const orgId = subscription.metadata.organizationId;

if (!orgId) return;

await db.organization.update({
  where: { id: orgId },
  data: {
    payerId: null,
    stripeSubscriptionId: null,
    purchasedSlots: 1,
    subscriptionExpiresAt: null,
  }
});

// Optional: Downgrade LinkedInAccounts or notify users
```

### 4. `organizationMembership.deleted` (Clerk)

**When:** User leaves organization via Clerk

**Action:**
```typescript
const { organization, public_user_data } = event.data;
const orgId = organization.id;
const userId = public_user_data.user_id;

const org = await db.organization.findUnique({
  where: { id: orgId },
  select: { payerId: true, stripeSubscriptionId: true }
});

if (org?.payerId === userId && org?.stripeSubscriptionId) {
  // Cancel subscription at period end
  await stripe.subscriptions.update(org.stripeSubscriptionId, {
    cancel_at_period_end: true
  });

  // Clear payer
  await db.organization.update({
    where: { id: orgId },
    data: { payerId: null }
  });

  // Notify remaining admins
  await notifyOrgAdmins(orgId,
    "Your billing admin has left. Subscribe again to continue access after the current period."
  );
}
```

---

## API Endpoints

### 1. `createOrgCheckout`

**Purpose:** Create Stripe checkout session for org subscription

**Input:**
```typescript
{
  organizationId: string
  slots: number (1-24)
  interval: 'monthly' | 'yearly'
}
```

**Logic:**
1. Verify user is admin of org
2. Get or create Stripe customer for user
3. Create checkout session with org metadata
4. Return checkout URL

### 2. `createOrgPortal`

**Purpose:** Create Stripe customer portal session for managing subscription

**Input:**
```typescript
{
  organizationId: string
}
```

**Logic:**
1. Verify user is payer or admin
2. Get payer's stripeCustomerId
3. Create portal session
4. Return portal URL

### 3. `getSubscriptionStatus`

**Purpose:** Get org's subscription status for UI

**Input:**
```typescript
{
  organizationId: string
}
```

**Output:**
```typescript
{
  isActive: boolean
  purchasedSlots: number
  usedSlots: number
  expiresAt: Date | null
  payer: { firstName, lastName, email } | null
  isPayer: boolean
}
```

---

## User Flows

### Flow 1: Admin Subscribes (New)
1. Admin goes to Settings > Billing
2. Clicks "Upgrade" → selects slots, interval
3. `createOrgCheckout` → Stripe Checkout
4. Pays with card
5. `checkout.session.completed` webhook updates Organization
6. Admin sees active subscription

### Flow 2: Subscription Renews
1. Period end arrives
2. Stripe charges card automatically
3. `customer.subscription.updated` webhook extends `subscriptionExpiresAt`
4. No user action needed

### Flow 3: Admin Changes Slots
1. Admin clicks "Manage Subscription"
2. `createOrgPortal` → Stripe Customer Portal
3. Changes quantity
4. `customer.subscription.updated` webhook updates `purchasedSlots`

### Flow 4: Payer Leaves Org
1. Payer clicks "Leave Organization" in Clerk
2. `organizationMembership.deleted` webhook fires
3. Detects payer is leaving → cancels subscription at period end
4. `payerId` set to null
5. Remaining admins notified
6. Org has access until `subscriptionExpiresAt`
7. `customer.subscription.deleted` webhook resets org to free tier

### Flow 5: New Admin Takes Over Billing
1. New admin sees "No active subscription" warning
2. Clicks "Subscribe"
3. Goes through Flow 1 with their card
4. `payerId` updated to new admin

### Flow 6: User Pays for Multiple Orgs
1. User is admin of Org A and Org B
2. Subscribes to Org A (5 slots)
3. Subscribes to Org B (3 slots)
4. Two separate subscriptions on user's Stripe customer
5. Each org has independent subscription data

---

## Slot Enforcement

```typescript
// When registering new LinkedIn account
const org = await db.organization.findUnique({
  where: { id: activeOrgId },
  select: { purchasedSlots: true, subscriptionExpiresAt: true },
});

const isActive = org?.subscriptionExpiresAt
  ? org.subscriptionExpiresAt > new Date()
  : false;

const effectiveSlots = isActive ? org.purchasedSlots : 1;

const currentCount = await db.linkedInAccount.count({
  where: { organizationId: activeOrgId },
});

if (currentCount >= effectiveSlots) {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: `Limit of ${effectiveSlots} LinkedIn account(s) reached.`,
  });
}
```

---

## Files to Modify

### Schema
- [ ] `packages/db/prisma/models/organization.prisma` - Add payment fields, relation
- [ ] `packages/db/prisma/models/user.prisma` - Remove accessType, add relation

### Webhooks
- [ ] `apps/nextjs/src/app/api/webhooks/stripe/route.ts` - Update all handlers
- [ ] `packages/api/src/api/webhooks/clerk.webhook.ts` - Add payer-leaves logic

### API Routes
- [ ] `packages/api/src/router/stripe.ts` - Add createOrgCheckout, createOrgPortal
- [ ] `packages/api/src/router/organization.ts` - Add getSubscriptionStatus

### Business Logic
- [ ] `packages/api/src/router/account.ts` - Update slot enforcement
- [ ] `packages/stripe/src/index.ts` - Update checkout session creation with metadata

### UI (Future)
- [ ] Billing settings page - Show subscription status, upgrade/manage buttons
- [ ] Warning banner when subscription expiring or no payer

---

## Migration Steps

### 1. Database Migration
```sql
-- Add new fields to Organization
ALTER TABLE "Organization" ADD COLUMN "payerId" TEXT;
ALTER TABLE "Organization" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "Organization" ADD COLUMN "subscriptionExpiresAt" TIMESTAMP;

-- Add unique constraint
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_stripeSubscriptionId_key" UNIQUE ("stripeSubscriptionId");

-- Add foreign key
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_payerId_fkey"
  FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE SET NULL;

-- Remove stripeCustomerId from Organization (after migration)
ALTER TABLE "Organization" DROP COLUMN "stripeCustomerId";

-- Remove accessType from User (after migration)
ALTER TABLE "User" DROP COLUMN "accessType";
ALTER TABLE "User" DROP COLUMN "stripeUserProperties";
DROP TYPE "AccessType";
```

### 2. Data Migration
For existing subscriptions (if any):
1. Find Users with active `accessType` != FREE
2. Find their primary Organization (where they're admin)
3. Set Organization.payerId = User.id
4. Retrieve subscription from Stripe and populate stripeSubscriptionId, subscriptionExpiresAt

### 3. Code Deployment Order
1. Deploy schema changes (additive only first)
2. Deploy webhook handlers (handle both old and new patterns)
3. Deploy API endpoints
4. Deploy UI changes
5. Run data migration
6. Deploy schema removal (remove old fields)

---

## Testing Checklist

- [ ] New subscription checkout flow
- [ ] Subscription renewal updates org
- [ ] Slot change via portal updates org
- [ ] Payer leaving org triggers cancel
- [ ] Subscription deletion resets org
- [ ] Slot enforcement uses subscriptionExpiresAt
- [ ] User can pay for multiple orgs
- [ ] Non-payer admin can access portal (view only)
- [ ] Orphan org expires correctly

---

## Open Questions

1. **Grace period:** Should we give orgs extra time after subscription expires before restricting access?
2. **Notification system:** How to notify admins when payer leaves? Email? In-app?
3. **Existing data:** Do we have existing paid subscriptions to migrate?
4. **Free tier limits:** What happens when org downgrades? Keep all accounts but restrict features? Or force removal of accounts over limit?
