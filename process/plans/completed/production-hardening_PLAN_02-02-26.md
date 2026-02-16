# Production Hardening: Bug Fixes + Test Coverage

**Date:** 2026-02-02
**Complexity:** Simple (one-session)
**Status:** ✅ COMPLETE
**Related Plans:**
- @premium-integration_PLAN_02-02-26.md (Premium Integration — COMPLETE)
- @org-payment-system_PLAN_19-01-26.md (Org Payment System — COMPLETE)
- @social-referral-system_PLAN_27-01-26.md (Social Referral System — COMPLETE)

---

## Quick Links

- [Overview](#overview)
- [Goals](#goals-and-success-metrics)
- [Execution Brief](#execution-brief)
- [Bug Fixes](#bug-fixes)
- [Test Coverage](#test-coverage)
- [Implementation Checklist](#implementation-checklist)
- [Acceptance Criteria](#acceptance-criteria)

---

## Overview

Post-integration audit of all 3 plans (org-payment, social-referral, premium-integration) revealed 2 critical bugs and significant test coverage gaps in the subscription/premium system. This plan fixes the bugs and adds comprehensive tests to catch regressions before production deployment.

---

## Goals and Success Metrics

- Fix 2 critical bugs that WILL cause production issues
- Raise test coverage on critical payment paths from 0% to meaningful coverage
- All existing 21 premium-system tests still passing after changes
- Type-check passes with no new errors

---

## Execution Brief

### Phase 1: Bug Fixes (2 critical bugs)

**What happens:** Fix the grace period bug in `convertOrgSubscriptionToFree()` (keep tier PREMIUM on cancel, let `subscriptionExpiresAt` handle expiry naturally) and fix the slot counting bug in `account.ts` (exclude DISABLED accounts from quota count).

**Test:** Run type-check. Run existing test-premium-system.ts (all 21 should still pass).

### Phase 2: Write Comprehensive Tests

**What happens:** Write tests covering: webhook handler logic (subscription lifecycle), slot enforcement edge cases, subscription.status API response shape, grace period behavior, and monthly cap enforcement.

**Test:** Run new test file. All tests pass.

### Phase 3: Verify No Regressions

**What happens:** Run full type-check, run all existing test files, verify no regressions.

**Test:** Zero new type errors. All test files pass.

### Expected Outcome

- Grace period works correctly (premium preserved until `subscriptionExpiresAt`)
- Slot counting excludes DISABLED accounts
- Comprehensive test coverage for subscription lifecycle
- No regressions in existing functionality

---

## Bug Fixes

### Bug 1: Grace Period Broken (CRITICAL)

**Location:** `packages/api/src/router/organization.ts` — `convertOrgSubscriptionToFree()` (lines 802-823)

**Problem:** When Stripe fires `customer.subscription.deleted`, this function sets `subscriptionTier = "FREE"` immediately. But `isOrgPremium()` in `org-access-control.ts:32` requires `subscriptionTier === "PREMIUM"`. Result: premium revoked instantly instead of at period end.

**Impact:**
- Billing cycle switches (monthly→yearly): Stripe fires delete then create. Between events, premium is lost and `disableAccountsExceedingSlots` runs, disabling accounts that don't get re-enabled.
- Immediate cancellations: User paid through period end but loses access immediately.

**Fix (approved approach: keep tier PREMIUM on cancel):**

Change `convertOrgSubscriptionToFree()` to NOT reset `subscriptionTier` to "FREE" and NOT reset `purchasedSlots` to 1 immediately. Instead:
- Keep `subscriptionTier` as-is (stays "PREMIUM")
- Keep `purchasedSlots` as-is (stays at current value)
- Set `subscriptionExpiresAt = endDate` (the grace period end)
- Clear `payerId = null` and `stripeSubscriptionId = null`
- Do NOT call `disableAccountsExceedingSlots` (let natural expiry handle it)

After `subscriptionExpiresAt` passes, `isOrgPremium()` naturally returns false because `subscriptionExpiresAt <= now`. The stale PREMIUM tier and purchasedSlots are harmless — premium checks gate on expiry, and the next subscription overwrites all fields.

**The `subscription.status` endpoint also needs a small fix:** The `paidActive` check at line 218 uses only `subscriptionExpiresAt > now` (doesn't check tier). This is now correct — it aligns with the new behavior where tier stays PREMIUM during grace period. No change needed there.

**Slot enforcement during grace period:** `registerByUrl` in account.ts checks `currentAccountCount >= org.purchasedSlots`. Since we keep `purchasedSlots` at the original value, users can continue using their slots during grace period. This is correct — they paid for that period.

**What happens at natural expiry:**
- `isOrgPremium()` returns false (expiry passed)
- Frontend shows not premium
- User can't use premium features
- Slots remain at old value (harmless — can't use premium features anyway)
- When user re-subscribes, all fields get overwritten by `convertOrgSubscriptionToPremium()`

```typescript
// BEFORE (broken):
export async function convertOrgSubscriptionToFree(
  db: PrismaClient,
  { orgId, expiresAt }: { orgId: string; expiresAt: Date },
) {
  return await db.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: orgId },
      data: {
        payerId: null,
        stripeSubscriptionId: null,
        purchasedSlots: 1,              // ← Immediately resets slots
        subscriptionTier: "FREE",        // ← Breaks isOrgPremium()
        subscriptionExpiresAt: expiresAt,
      },
    });
    return await disableAccountsExceedingSlots(tx, {
      orgId,
      purchasedSlots: 1,                // ← Disables accounts immediately
    });
  });
}

// AFTER (fixed):
export async function convertOrgSubscriptionToFree(
  db: PrismaClient,
  { orgId, expiresAt }: { orgId: string; expiresAt: Date },
) {
  await db.organization.update({
    where: { id: orgId },
    data: {
      payerId: null,
      stripeSubscriptionId: null,
      // Keep subscriptionTier and purchasedSlots — grace period preserves access
      subscriptionExpiresAt: expiresAt,
    },
  });
}
```

**Risk assessment:** Low. The worst case is stale `purchasedSlots` and `subscriptionTier` values after subscription fully expires. These are harmless because:
1. `isOrgPremium()` gates on `subscriptionExpiresAt > now` — returns false after expiry
2. `registerByUrl` only blocks adding accounts past the slot limit — stale slots just means the old limit persists (user can't use premium features anyway)
3. Next `convertOrgSubscriptionToPremium()` call overwrites everything

---

### Bug 2: Slot Counting Includes DISABLED Accounts (CRITICAL)

**Location:** `packages/api/src/router/account.ts` line 366-368

**Problem:** `registerByUrl` counts ALL LinkedIn accounts (including DISABLED) when checking slot quota. But `disableAccountsExceedingSlots()` in organization.ts correctly counts only non-DISABLED accounts.

**Impact:** Users who had accounts disabled (from a downgrade) can't add new accounts even though they have available slots.

**Fix (1-line change):**

```typescript
// BEFORE (broken):
const currentAccountCount = await ctx.db.linkedInAccount.count({
  where: { organizationId: ctx.activeOrg.id },
});

// AFTER (fixed):
const currentAccountCount = await ctx.db.linkedInAccount.count({
  where: {
    organizationId: ctx.activeOrg.id,
    status: { not: "DISABLED" },
  },
});
```

---

## Test Coverage

### What's Already Covered (existing tests — don't touch)

- `test-premium-system.ts` — 21 scenarios covering isOrgPremium, premiumSource, rewards, Stripe credits
- `test-rescan-simple.ts` — 11 unit tests for calculateDaysToAward + DB state transitions
- `test-rescan-real-url.ts` — Real URL scraping integration test
- `test-stripe-credit.ts` — Real Stripe API credit tests
- `test-paid-org-credit-path.ts` — Award branching (PREMIUM→credit, FREE→earned days)

### What Needs Tests (new file: `test-subscription-lifecycle.ts`)

**Test 1: Grace period — subscription deleted keeps premium during grace**
- Create PREMIUM org with future expiry
- Call `convertOrgSubscriptionToFree(orgId, futureDate)`
- Assert: `subscriptionTier` stays "PREMIUM", `purchasedSlots` unchanged
- Assert: `isOrgPremium()` returns true (expiry still in future)
- Assert: `stripeSubscriptionId` and `payerId` are null

**Test 2: Grace period — premium naturally expires**
- Create org with `subscriptionTier="PREMIUM"`, `subscriptionExpiresAt=yesterday`
- Assert: `isOrgPremium()` returns false
- Assert: `subscription.status` returns `isActive=false`

**Test 3: Grace period — new subscription overwrites grace state**
- Create org in grace period state (tier=PREMIUM, sub=null, payer=null, expiry=future)
- Call `convertOrgSubscriptionToPremium()` with new subscription data
- Assert: All fields updated (new payerId, subscriptionId, slots, expiry)

**Test 4: Slot counting — DISABLED accounts don't count**
- Create org with `purchasedSlots=1`
- Create 3 DISABLED LinkedIn accounts + 0 active
- Assert: Slot check allows adding 1 new account (count=0, slots=1)

**Test 5: Slot counting — active accounts count correctly**
- Create org with `purchasedSlots=2`
- Create 2 CONNECTED LinkedIn accounts
- Assert: Slot check blocks adding (count=2, slots=2)

**Test 6: Slot counting — mix of active and disabled**
- Create org with `purchasedSlots=2`
- Create 1 CONNECTED + 2 DISABLED accounts
- Assert: Slot check allows adding 1 more (activeCount=1, slots=2)

**Test 7: subscription.status — FREE org response shape**
- Create FREE org (no subscription, no earned)
- Call getSubscriptionStatus helper
- Assert: `isActive=false, premiumSource="none", subscriptionTier="FREE"`

**Test 8: subscription.status — grace period org response shape**
- Create org in grace period (tier=PREMIUM, stripeSubId=null, expiry=future)
- Call getSubscriptionStatus helper
- Assert: `isActive=true, premiumSource="paid"` (grace period honors premium)

**Test 9: subscription.status — expired grace period response**
- Create org with tier=PREMIUM, expiry=yesterday, stripeSubId=null
- Call getSubscriptionStatus helper
- Assert: `isActive=false, premiumSource="none"` (grace period expired)

**Test 10: Monthly cap enforcement — under cap**
- Create org with 10 days already awarded this month
- Calculate new award of 3 days
- Assert: Award succeeds (10+3=13 < 14 cap)

**Test 11: Monthly cap enforcement — at cap**
- Create org with 14 days already awarded this month
- Attempt new award
- Assert: 0 additional days awarded (at cap)

**Test 12: Monthly cap enforcement — partial cap**
- Create org with 13 days already awarded
- Calculate award of 3 days
- Assert: Only 1 day awarded (13+1=14, capped)

**Test 13: Webhook idempotency — subscription.updated with mismatched sub ID**
- Create org with `stripeSubscriptionId="sub_123"`
- Simulate webhook with subscription.id="sub_456"
- Assert: No update occurs (ID mismatch guard)

**Test 14: disableAccountsExceedingSlots — correct priority**
- Create org with 5 accounts: 2 REGISTERED, 1 CONNECTING, 2 CONNECTED
- Call disableAccountsExceedingSlots(purchasedSlots=2)
- Assert: REGISTERED accounts disabled first, then CONNECTING, CONNECTED kept

### Webhook Handler Chain Tests (Tests 15-19)

These tests call the actual exported handler functions (`convertOrgSubscriptionToPremium`, `convertOrgSubscriptionToFree`, `applyPendingDowngrade`, `handleCheckoutSessionSuccess`) with real DB state to verify the full lifecycle chains work correctly.

**Test 15: Full checkout → premium activation chain**
- Create FREE org with payer user (admin member)
- Call `convertOrgSubscriptionToPremium(db, { orgId, payerId, purchasedSlots: 3, stripeSubscriptionId: "sub_test", subscriptionExpiresAt: +30 days })`
- Assert: org is now PREMIUM, purchasedSlots=3, payer set, stripeSubscriptionId set
- Assert: `isOrgPremium()` returns true
- Assert: `subscription.status` helper returns `isActive=true, premiumSource="paid"`

**Test 16: Full cancellation → grace period → expiry chain**
- Start with PREMIUM org (from Test 15 setup pattern)
- Call `convertOrgSubscriptionToFree(db, { orgId, expiresAt: +7 days })`
- Assert: subscriptionTier still "PREMIUM", purchasedSlots unchanged (grace period fix)
- Assert: stripeSubscriptionId=null, payerId=null
- Assert: `isOrgPremium()` returns true (still in grace period)
- Manually set subscriptionExpiresAt to yesterday
- Assert: `isOrgPremium()` returns false (grace period expired)

**Test 17: Upgrade chain — slots increase, accounts stay enabled**
- Create PREMIUM org with purchasedSlots=2, 2 CONNECTED accounts
- Call `convertOrgSubscriptionToPremium(db, { ..., purchasedSlots: 5 })`
- Assert: purchasedSlots=5, both accounts still CONNECTED (not disabled)
- Assert: Can add 3 more accounts (slot check: 2 active < 5 slots)

**Test 18: Downgrade chain — deferred, then applied at renewal**
- Create PREMIUM org with purchasedSlots=5, 4 CONNECTED + 1 REGISTERED accounts
- Call `applyPendingDowngrade(db, { orgId, newPurchasedSlots: 2, subscriptionExpiresAt: +30 days })`
- Assert: purchasedSlots=2
- Assert: 3 accounts disabled (REGISTERED first, then oldest CONNECTED)
- Assert: 2 CONNECTED accounts remain active

**Test 19: Billing cycle switch chain — delete then create (no premium loss)**
- Create PREMIUM org with purchasedSlots=3, 3 CONNECTED accounts
- Call `convertOrgSubscriptionToFree(db, { orgId, expiresAt: +1 day })` (simulates monthly delete)
- Assert: `isOrgPremium()` still true (grace period), all 3 accounts still CONNECTED
- Immediately call `convertOrgSubscriptionToPremium(db, { ..., purchasedSlots: 3, stripeSubscriptionId: "sub_yearly" })` (simulates yearly create)
- Assert: org back to full PREMIUM with new sub ID, all accounts still CONNECTED

---

## Scope

**In scope:**
- Fix Bug 1 (grace period)
- Fix Bug 2 (slot counting)
- Write test-subscription-lifecycle.ts (19 tests)
- Run existing tests to verify no regressions

**In scope (document only — add TODO comments for future fix):**
- Bug 3 (cancelUpdate broken) — add TODO comment explaining the bug and how to fix
- Missing payer-in-org check on checkout completion — add TODO comment
- `organization.deleted` not canceling Stripe — add TODO comment

**Out of scope (no code changes):**
- `invoice.payment_failed` handler — deferred to Phase 2 per plan
- Frontend hook tests — these are integration-tested via the API layer

---

## Assumptions and Constraints

- All Prisma schema fields already exist (no migration needed)
- Test environment uses real Prisma client against dev database
- Stripe API tests use test mode with real API calls
- Existing 21 tests in test-premium-system.ts must not break

---

## Implementation Checklist

### Bug Fixes

- [ ] 1. Read `convertOrgSubscriptionToFree()` in organization.ts (lines 802-823)
- [ ] 2. Fix Bug 1: Remove `subscriptionTier: "FREE"` and `purchasedSlots: 1` from the update, remove `disableAccountsExceedingSlots` call, remove `$transaction` wrapper (no longer needed)
- [ ] 3. Read slot enforcement in account.ts (lines 366-368)
- [ ] 4. Fix Bug 2: Add `status: { not: "DISABLED" }` to the linkedInAccount count query
- [ ] 5. Run type-check: `pnpm tsc --noEmit` — verify no new errors
- [ ] 6. Run existing tests: `bun run packages/api/tests/test-premium-system.ts` — verify all 21 pass

### TODO Comments (document known issues in code for future fix)

- [ ] 7. Add TODO comment to `cancelUpdate` mutation in organization.ts explaining:
  - Downgrade cancel: `invoiceId` is null (downgrade returns `invoiceId: null`), so `voidInvoice(null)` throws, and the Stripe subscription revert never runs
  - Upgrade cancel: Invoice is already paid after checkout completes, so `voidInvoice` fails. Also no DB reversal happens.
  - Fix: For downgrade cancel, skip voidInvoice and just revert Stripe subscription quantity. For upgrade cancel, refund the payment + revert Stripe sub + revert DB.
  - Note: No frontend calls this mutation yet — fix when building the cancel UI.
- [ ] 8. Add TODO comment to `handleCheckoutSessionSuccess()` in organization.ts explaining:
  - Missing check: Should verify payer is still a member of the org before activating subscription
  - Race condition: Admin starts checkout → gets removed from org → completes payment → org gets premium but ex-member is charged
  - Fix: Query `organizationMember` for `{orgId, userId: payerId}`. If not found, cancel subscription + refund.
- [ ] 9. Add TODO comment to `organization.deleted` case in clerk.webhook.ts explaining:
  - Missing: Should cancel Stripe subscription before deleting org
  - Impact: Orphaned Stripe subscription if org deleted via Clerk dashboard
  - Fix: Check if org has `stripeSubscriptionId`, call `stripe.subscriptions.cancel()`, then delete.

### New Tests

- [ ] 10. Create `packages/api/tests/test-subscription-lifecycle.ts`
- [ ] 11. Implement Tests 1-3 (grace period scenarios)
- [ ] 12. Implement Tests 4-6 (slot counting scenarios)
- [ ] 13. Implement Tests 7-9 (subscription.status response shape)
- [ ] 14. Implement Tests 10-12 (monthly cap enforcement)
- [ ] 15. Implement Tests 13-14 (webhook idempotency + account disabling priority)
- [ ] 16. Implement Tests 15-19 (webhook handler chain tests: checkout→premium, cancel→grace→expiry, upgrade, downgrade, billing cycle switch)
- [ ] 17. Run new test file: `bun run packages/api/tests/test-subscription-lifecycle.ts` — all 19 pass
- [ ] 18. Run all test files to verify no regressions

---

## Acceptance Criteria

- [ ] `convertOrgSubscriptionToFree()` preserves `subscriptionTier` and `purchasedSlots`
- [ ] `isOrgPremium()` returns true during grace period (expiry in future)
- [ ] `isOrgPremium()` returns false after grace period expires
- [ ] Slot enforcement in `registerByUrl` excludes DISABLED accounts
- [ ] New test file has 19 tests, all passing
- [ ] Existing test-premium-system.ts: all 21 tests still pass
- [ ] Type-check passes with no new errors
- [ ] TODO comments added to `cancelUpdate`, `handleCheckoutSessionSuccess`, and `organization.deleted` Clerk handler
- [ ] No changes to Prisma schema (no migration needed)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Grace period fix causes stale tier/slots after full expiry | Low | Low | `isOrgPremium()` gates on expiry, stale values harmless. Next subscription overwrites. |
| Existing tests break from grace period change | Medium | Medium | Run all 21 tests after fix. Test 5 (over-quota) may need assertion update. |
| Slot counting fix reveals users at wrong quota | Low | Low | Fix is additive — only allows MORE registrations for users with disabled accounts. |

---

## Integration Notes

**Files modified:**
- `packages/api/src/router/organization.ts` — `convertOrgSubscriptionToFree()` (Bug 1)
- `packages/api/src/router/account.ts` — `registerByUrl` slot count (Bug 2)

**Files created:**
- `packages/api/tests/test-subscription-lifecycle.ts` — 14 new tests

**Dependencies:**
- Prisma client (dev DB)
- `isOrgPremium()` from `org-access-control.ts`
- `calculateDaysToAward`, `MONTHLY_CAP_DAYS` from `social-referral-verification.ts`
- `convertOrgSubscriptionToFree`, `convertOrgSubscriptionToPremium`, `disableAccountsExceedingSlots` from `organization.ts`

---

## Cursor + RIPER-5 Guidance

- Import Implementation Checklist directly into Cursor Plan mode
- RIPER-5: RESEARCH is done (this plan IS the research output). Go directly to EXECUTE.
- After execution, run all tests as verification step
- If any test fails, fix before marking complete

---

**Next Step:** Enter EXECUTE mode and implement this checklist in order.
