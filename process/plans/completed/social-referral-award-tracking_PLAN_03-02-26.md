# Social Referral Award Tracking Improvements

**Date:** 2026-02-03
**Complexity:** Simple
**Status:** 🚧 IN PROGRESS

---

## Quick Links

- [Overview](#overview)
- [Goals](#goals-and-success-metrics)
- [Execution Brief](#execution-brief)
- [Schema Changes](#schema-changes)
- [Implementation Checklist](#implementation-checklist)

---

## Overview

Currently, the social referral system awards FREE orgs with `earnedPremiumExpiresAt` days and PREMIUM orgs with Stripe credits. However, the UI doesn't properly differentiate between these two modes, leading to confusing displays when users switch tiers.

**Problem:** A user who was FREE (earned days), then upgraded to PREMIUM (now earns credits), still sees "Premium Earned Active: X days remaining" which is irrelevant since they already have paid premium.

**Solution:** Track the award type per submission and update UI to show context-appropriate information.

---

## Goals and Success Metrics

1. **Track award type per submission** - Know if a submission awarded days vs credits
2. **Improve UI for PREMIUM orgs** - Show credits earned instead of days remaining
3. **Maintain backward compatibility** - Existing submissions should continue to work
4. **Clear separation** - Users understand exactly what they earned and in which mode

**Success:**
- PREMIUM orgs see "💰 $X.XX credits earned"
- FREE orgs see "🎉 X days remaining"
- Submission history shows appropriate context per entry

---

## Execution Brief

### Phase 1: Schema Migration
**What happens:** Add `awardType` enum and `creditAmountCents` field to SocialSubmission model.
**Test:** Run migration, verify existing submissions get `awardType = null` (backward compatible).

### Phase 2: Backend Updates
**What happens:** Update verification service and rescan workflow to populate new fields.
**Test:** Submit a post as PREMIUM, verify `awardType = 'STRIPE_CREDIT'` and `creditAmountCents` is set.

### Phase 3: API Updates
**What happens:** Update `getEarnedPremiumStatus` to return tier-appropriate data, add credits info.
**Test:** Call API as PREMIUM org, verify response includes credits data.

### Phase 4: UI Updates
**What happens:** Update earn-premium page to show different content based on org tier.
**Test:** Visual verification - PREMIUM shows credits, FREE shows days.

**Expected Outcome:**
- [x] Schema has `awardType` and `creditAmountCents` fields
- [x] New submissions populate these fields
- [x] API returns tier-appropriate status
- [x] UI displays correct information per tier

---

## Schema Changes

### Add to `SocialSubmission` model:

```prisma
model SocialSubmission {
  // ... existing fields ...

  // Reward tracking (existing)
  daysAwarded        Int       @default(0)

  // NEW: Award type tracking
  awardType          AwardType?          // null for legacy submissions
  creditAmountCents  Int?                // For STRIPE_CREDIT awards: actual cents credited
}

enum AwardType {
  EARNED_DAYS     // FREE org: extends earnedPremiumExpiresAt
  STRIPE_CREDIT   // PREMIUM org: Stripe customer balance credit
}
```

**Migration strategy:**
- New fields are nullable for backward compatibility
- Existing submissions remain with `awardType = null`
- New submissions always get explicit `awardType`

---

## Scope

### In Scope
- Schema migration (add `awardType`, `creditAmountCents`)
- Update `social-referral-verification.ts` to set new fields
- Update `rescan-social-submission.workflow.ts` to set new fields
- Update `getEarnedPremiumStatus` API to return tier-appropriate data
- Update earn-premium page UI

### Out of Scope
- Backfilling existing submissions (they'll show as "legacy")
- Credit revocation for deleted posts (already deferred)
- Engagement bonus rescans (already working)

---

## Assumptions and Constraints

1. Existing submissions with `awardType = null` are treated as legacy
2. PREMIUM orgs can query Stripe balance for total credits (more accurate than summing)
3. UI should handle the transition gracefully (mixed history)

---

## Functional Requirements

### FR1: Schema
- [ ] Add `AwardType` enum with `EARNED_DAYS` and `STRIPE_CREDIT`
- [ ] Add `awardType AwardType?` field to SocialSubmission
- [ ] Add `creditAmountCents Int?` field to SocialSubmission

### FR2: Verification Service
- [ ] Set `awardType = 'EARNED_DAYS'` when extending earnedPremiumExpiresAt
- [ ] Set `awardType = 'STRIPE_CREDIT'` when applying Stripe credit
- [ ] Set `creditAmountCents` to actual cents credited for PREMIUM

### FR3: Rescan Workflow
- [ ] Same logic as verification service for additional days/credits

### FR4: API
- [ ] `getEarnedPremiumStatus` returns:
  - For FREE: `{ type: 'days', isActive, daysRemaining, expiresAt }`
  - For PREMIUM: `{ type: 'credits', totalCreditsEarned, stripeBalance }`

### FR5: UI
- [ ] Header badge shows tier-appropriate message
- [ ] Submission table shows "Days Earned" or "Credit Earned" based on `awardType`
- [ ] Legacy submissions (null awardType) show as "Days Earned" with note

---

## Non-Functional Requirements

- Migration must be non-breaking (nullable fields)
- No downtime during deployment

---

## Acceptance Criteria

1. [ ] New PREMIUM submission shows `awardType = 'STRIPE_CREDIT'` in DB
2. [ ] New FREE submission shows `awardType = 'EARNED_DAYS'` in DB
3. [ ] PREMIUM org UI shows "💰 $X.XX credits earned"
4. [ ] FREE org UI shows "🎉 X days remaining"
5. [ ] Mixed history displays correctly (some days, some credits)
6. [ ] Legacy submissions (pre-migration) still display

---

## Implementation Checklist

### Step 1: Schema Migration
- [ ] 1.1 Add `AwardType` enum to `social-submission.prisma`
- [ ] 1.2 Add `awardType` field (nullable)
- [ ] 1.3 Add `creditAmountCents` field (nullable)
- [ ] 1.4 Run `pnpm db:generate` and `pnpm db:push`

### Step 2: Update Verification Service
- [ ] 2.1 In `social-referral-verification.ts`, set `awardType` in PREMIUM branch
- [ ] 2.2 Set `creditAmountCents` in PREMIUM branch
- [ ] 2.3 Set `awardType` in FREE branch

### Step 3: Update Rescan Workflow
- [ ] 3.1 In `rescan-social-submission.workflow.ts`, mirror the same logic

### Step 4: Update API
- [ ] 4.1 Modify `getEarnedPremiumStatus` in `social-referral.ts` router
- [ ] 4.2 Return different shape based on org tier
- [ ] 4.3 For PREMIUM: fetch Stripe balance or sum `creditAmountCents`

### Step 5: Update UI
- [ ] 5.1 Update header badge in `earn-premium/page.tsx`
- [ ] 5.2 Update table to show "Credit Earned" column for PREMIUM
- [ ] 5.3 Handle legacy submissions gracefully

### Step 6: Test
- [ ] 6.1 Test FREE org submission → days awarded, UI shows days
- [ ] 6.2 Test PREMIUM org submission → credits awarded, UI shows credits
- [ ] 6.3 Test mixed history display

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Migration breaks existing submissions | Low | Medium | Nullable fields, legacy handling |
| Stripe balance mismatch with DB | Low | Low | Primary source is Stripe, DB is cache |

---

## Integration Notes

### Files to modify:
1. `packages/db/prisma/models/social-submission.prisma` - Schema
2. `packages/api/src/services/social-referral-verification.ts` - Award logic
3. `packages/api/src/workflows/rescan-social-submission.workflow.ts` - Rescan logic
4. `packages/api/src/router/social-referral.ts` - API endpoint
5. `apps/nextjs/src/app/(new-dashboard)/[orgSlug]/earn-premium/page.tsx` - UI

### Constants:
- `CREDIT_PER_DAY_CENTS = 100` (already defined)

---

**Next Step:** Begin with Step 1.1 - Add `AwardType` enum to schema.
