# Stripe Subscription Changes - Design Document

**Date:** 2026-02-03
**Status:** Implemented
**Approach:** Trust Stripe Customer Portal proration logic

---

## Overview

This document outlines how subscription changes are handled when customers use the Stripe Customer Portal to modify their plans. Stripe handles all proration calculations and applies changes immediately, while our webhook handler simply updates the database to match Stripe's state.

## Stripe Customer Portal Configuration

```
✅ Customers can switch plans: ENABLED
✅ Customers can change quantity: ENABLED
✅ Proration: "Prorate charges and credits"
✅ Charge timing: "Invoice prorations immediately"
✅ Downgrades: "Update immediately"
✅ Interval changes: "Update immediately"
```

**Key Behaviors:**
- All changes apply immediately (no deferrals)
- Credits go to customer account balance (not cash refunds)
- Credits automatically apply to future invoices
- Stripe calculates all proration math before webhook

---

## Pure Quantity Changes (Same Interval)

### Monthly Plan - Quantity Changes

| Scenario | Current State | Customer Action | What Stripe Does (Before Webhook) | What We Do (Webhook) | Final Result |
|----------|---------------|-----------------|-----------------------------------|---------------------|--------------|
| **Upgrade** | Monthly 3 slots<br>$75/month | Increase to 5 slots | • Calculate unused time in current month (e.g., 15 days left)<br>• Charge: (5 slots × $25 × 15/30 days) = $62.50<br>• Update subscription immediately | Update DB:<br>• purchasedSlots: 3→5<br>• expiresAt: unchanged | ✅ Customer charged $62.50, gets 5 slots immediately |
| **Downgrade** | Monthly 5 slots<br>$125/month | Decrease to 3 slots | • Calculate unused time (e.g., 15 days left)<br>• Credit: (2 slots × $25 × 15/30 days) = $41.67 to account balance<br>• Update subscription immediately | Update DB:<br>• purchasedSlots: 5→3<br>• expiresAt: unchanged | ✅ Customer gets $41.67 credit for future invoices, has 3 slots immediately |

### Yearly Plan - Quantity Changes

| Scenario | Current State | Customer Action | What Stripe Does (Before Webhook) | What We Do (Webhook) | Final Result |
|----------|---------------|-----------------|-----------------------------------|---------------------|--------------|
| **Upgrade** | Yearly 3 slots<br>$750/year | Increase to 5 slots | • Calculate unused time (e.g., 180 days left)<br>• Charge: (2 slots × $250 × 180/365 days) = $246.58<br>• Update subscription immediately | Update DB:<br>• purchasedSlots: 3→5<br>• expiresAt: unchanged | ✅ Customer charged $246.58, gets 5 slots immediately |
| **Downgrade** | Yearly 5 slots<br>$1250/year | Decrease to 3 slots | • Calculate unused time (e.g., 180 days left)<br>• Credit: (2 slots × $250 × 180/365 days) = $246.58 to account balance<br>• Update subscription immediately | Update DB:<br>• purchasedSlots: 5→3<br>• expiresAt: unchanged | ✅ Customer gets $246.58 credit for future invoices, has 3 slots immediately |

---

## Pure Interval Changes (Same Quantity)

| Scenario | Current State | Customer Action | What Stripe Does (Before Webhook) | What We Do (Webhook) | Final Result |
|----------|---------------|-----------------|-----------------------------------|---------------------|--------------|
| **Monthly → Yearly** | Monthly 3 slots<br>$75/month | Switch to yearly | • Credit unused month: (3 slots × $25 × 15/30 days) = $37.50<br>• Charge yearly: (3 slots × $250) = $750<br>• **Net charge: $750 - $37.50 = $712.50**<br>• Update subscription immediately | Update DB:<br>• Plan: monthly→yearly<br>• expiresAt: +1 year from now | ✅ Customer charged $712.50, committed to full year |
| **Yearly → Monthly** | Yearly 3 slots<br>$750/year | Switch to monthly | • Credit unused year: (3 slots × $250 × 180/365 days) = $369.86<br>• Charge monthly: (3 slots × $25 × 15/30 days) = $37.50<br>• **Net credit: $369.86 - $37.50 = $332.36 to account balance**<br>• Update subscription immediately | Update DB:<br>• Plan: yearly→monthly<br>• expiresAt: +1 month from now | ✅ Customer gets $332.36 credit for future invoices, switches to monthly immediately |

---

## Mixed Changes (Interval + Quantity)

### Monthly → Yearly (with quantity change)

| Scenario | Current State | Customer Action | What Stripe Does (Before Webhook) | What We Do (Webhook) | Final Result |
|----------|---------------|-----------------|-----------------------------------|---------------------|--------------|
| **M→Y + Increase** | Monthly 3 slots<br>$75/month | Yearly 5 slots | • Credit unused month: (3 × $25 × 15/30) = $37.50<br>• Charge yearly: (5 × $250) = $1250<br>• **Net charge: $1250 - $37.50 = $1212.50** | Update DB:<br>• purchasedSlots: 3→5<br>• Plan: monthly→yearly<br>• expiresAt: +1 year | ✅ Customer charged $1212.50, gets 5 slots + yearly commitment immediately |
| **M→Y + Decrease** | Monthly 5 slots<br>$125/month | Yearly 3 slots | • Credit unused month: (5 × $25 × 15/30) = $62.50<br>• Charge yearly: (3 × $250) = $750<br>• **Net charge: $750 - $62.50 = $687.50** | Update DB:<br>• purchasedSlots: 5→3<br>• Plan: monthly→yearly<br>• expiresAt: +1 year | ✅ Customer charged $687.50, gets 3 slots + yearly commitment immediately |

### Yearly → Monthly (with quantity change)

| Scenario | Current State | Customer Action | What Stripe Does (Before Webhook) | What We Do (Webhook) | Final Result |
|----------|---------------|-----------------|-----------------------------------|---------------------|--------------|
| **Y→M + Increase** | Yearly 3 slots<br>$750/year | Monthly 5 slots | • Credit unused year: (3 × $250 × 180/365) = $369.86<br>• Charge monthly: (5 × $25 × 15/30) = $62.50<br>• **Net credit: $369.86 - $62.50 = $307.36 to account balance** | Update DB:<br>• purchasedSlots: 3→5<br>• Plan: yearly→monthly<br>• expiresAt: +1 month | ✅ Customer gets $307.36 credit + 5 slots immediately |
| **Y→M + Decrease** | Yearly 5 slots<br>$1250/year | Monthly 3 slots | • Credit unused year: (5 × $250 × 180/365) = $616.44<br>• Charge monthly: (3 × $25 × 15/30) = $37.50<br>• **Net credit: $616.44 - $37.50 = $578.94 to account balance** | Update DB:<br>• purchasedSlots: 5→3<br>• Plan: yearly→monthly<br>• expiresAt: +1 month | ✅ Customer gets $578.94 credit + switches to 3 slots monthly immediately |

---

## Revenue Protection Strategy

### Credits vs Refunds

**All credits go to customer's account balance:**
- Credits are NOT cash refunds
- Credits automatically apply to next invoice
- Money stays with you as deferred revenue
- Even large credits (Y→M) are just future payment offsets

**Example:** Customer switches from Yearly 5 slots ($1250) to Monthly 3 slots with 180 days left:
- Credit: $616.44 goes to account balance
- Next 16 monthly invoices ($75 each): Free (using credit)
- Month 17+: Resume normal billing
- **Net result:** No cash refund, customer stays with you longer

### Why This Works

1. **Immediate UX**: All changes apply instantly (both Stripe and our DB)
2. **Revenue retained**: Credits keep money in system as future revenue
3. **Simple logic**: No complex upgrade/downgrade detection needed
4. **Stripe handles math**: Proven proration engine, no bugs
5. **Idempotent**: Handles duplicate webhooks correctly

---

## Implementation

### Webhook Handler Logic

```typescript
case "customer.subscription.created":
case "customer.subscription.updated": {
  // 1. Validate metadata (orgId, payerId)
  // 2. Extract subscription details (slots, expiry)
  // 3. Check idempotency (subscription ID match)
  // 4. Update DB to match Stripe state

  await convertOrgSubscriptionToPremium(db, {
    orgId,
    payerId,
    purchasedSlots: slots,
    stripeSubscriptionId: subscription.id,
    subscriptionExpiresAt: newExpiresAt,
  });
}
```

**What we DON'T do:**
- ❌ Detect upgrades vs downgrades
- ❌ Check interval changes
- ❌ Calculate prorations
- ❌ Defer any changes
- ❌ Override Stripe's decisions

**What we DO:**
- ✅ Validate metadata
- ✅ Update DB to match Stripe
- ✅ Trust Stripe's proration logic
- ✅ Handle idempotency

---

## Testing Strategy

### Test Coverage

1. **Initial subscriptions** (webhook-initial-subscription.test.ts)
   - Monthly 1, 3, 5 slots
   - Yearly 1, 3, 5 slots

2. **Quantity changes** (webhook-quantity-changes.test.ts)
   - Monthly: 3→5 (upgrade), 5→3 (downgrade)
   - Yearly: 3→5 (upgrade), 5→3 (downgrade)

3. **Plan interval changes** (webhook-plan-changes.test.ts)
   - M→Y same quantity (3→3)
   - Y→M same quantity (3→3)
   - M→Y + quantity increase (3→5)
   - M→Y + quantity decrease (5→3)
   - Y→M + quantity increase (3→5)
   - Y→M + quantity decrease (5→3)

4. **Cancellations** (webhook-cancellations.test.ts)
   - Immediate cancellation
   - Scheduled cancellation (period end)
   - Subscription paused

5. **Edge cases** (webhook-edge-cases.test.ts)
   - Missing metadata
   - Mismatched subscription ID
   - Duplicate webhooks
   - Non-existent organization
   - Customer deletion
   - Rapid updates

### Test Approach

- Use Stripe test mode (`sk_test_...`)
- Create real Stripe subscriptions via API
- Modify subscriptions to trigger webhooks
- Wait for webhook processing (3s delay)
- Verify DB state matches expected values
- Clean up all test data in `afterAll`

---

## Pricing Reference

**Monthly Plan:**
- $25 per slot per month
- Examples: 3 slots = $75/mo, 5 slots = $125/mo

**Yearly Plan:**
- $250 per slot per year (~$20.83/mo, 17% discount)
- Examples: 3 slots = $750/yr, 5 slots = $1250/yr

---

## Decision Log

### Why "Trust Stripe" Approach?

**Considered alternatives:**
1. ❌ **Manual downgrade deferral**: Complex logic, can get out of sync with Stripe
2. ❌ **Restrict Customer Portal**: Bad UX, forces support tickets
3. ✅ **Trust Stripe completely**: Simple, reliable, industry standard

**Decision rationale:**
- Stripe's proration engine is battle-tested and handles edge cases
- Customer Portal settings already configured for immediate updates
- Credits (not refunds) keep revenue in system
- Simpler code = fewer bugs
- Matches Stripe's recommended approach

### Key Constraints

1. **Stripe Customer Portal** is the source of truth for subscription changes
2. **Credits are acceptable** as they're deferred revenue, not lost revenue
3. **Immediate updates** preferred for good UX
4. **Simple logic** preferred over complex edge case handling

---

## Related Files

- Implementation: `packages/api/src/api/webhooks/stripe.webhook.ts`
- Tests: `packages/api/tests/webhook-*.test.ts`
- Stripe service: `packages/stripe/src/index.ts`
- DB operations: `packages/api/src/router/organization.ts`
