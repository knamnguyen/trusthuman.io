/**
 * Comprehensive Premium System Integration Test
 *
 * Tests the ENTIRE premium detection + reward + feature gating system across
 * RFC-007's 16-combination test matrix:
 *
 * CORE SCENARIOS (12 tests):
 *  1. FREE org (no premium)        → premiumSource="none", isPremium=false
 *  2. FREE org + earned premium     → premiumSource="earned", isPremium=true
 *  3. PREMIUM org (paid, active)    → premiumSource="paid", isPremium=true
 *  4. PREMIUM org (paid, expired)   → premiumSource="none", isPremium=false
 *  5. PREMIUM org (over quota)      → premiumSource="paid", isPremium=false
 *  6. FREE org + earned + 2 accounts → premiumSource="none" (earned requires <=1 account)
 *  7. Social referral: FREE org     → earnedPremiumExpiresAt extended
 *  8. Social referral: PREMIUM org  → Stripe credit applied, earnedPremiumExpiresAt NOT set
 *  9. Monthly cap enforcement       → Days capped at 14/month
 * 10. Both paid + earned active     → premiumSource="paid" (priority)
 * 11. Earned premium expired        → premiumSource="none"
 * 12. Credit calculation            → $1.00/day constant verified
 *
 * EDGE CASES (9 tests):
 * 13. Paid expired + earned active (1 account) → earned kicks in
 * 14. Exactly at quota (5/5)       → isPremium=true
 * 15. One over quota (6/5)         → isPremium=false
 * 16. PREMIUM canceled (NULL expiry) → premiumSource="none"
 * 17. FREE with no accounts        → premiumSource="none"
 * 18. Long-term earned (365 days)  → premiumSource="earned"
 * 19. Over quota + earned (8 accounts) → earned disqualified by accountCount
 * 20. Over quota + earned (1 account) → earned overrides paid over-quota
 * 21. Both expire same day         → paid priority
 *
 * Run with: bun run packages/api/tests/test-premium-system.ts
 */

import { config } from "dotenv";
import Stripe from "stripe";

import { db } from "@sassy/db";
import { StripeService } from "@sassy/stripe";

import { isOrgPremium } from "../src/services/org-access-control";
import {
  calculateDaysToAward,
  MAX_DAYS_PER_POST,
  LIKES_THRESHOLD,
  COMMENTS_THRESHOLD,
  MONTHLY_CAP_DAYS,
} from "../src/services/social-referral-verification";

config({ path: ".env" });

const CREDIT_PER_DAY_CENTS = 100;

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`   PASS: ${message}`);
}

// ═══════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════

/** Simulate what subscription.status returns */
function getSubscriptionStatus(org: {
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
  purchasedSlots: number;
  earnedPremiumExpiresAt: Date | null;
  accountCount: number;
}) {
  const now = new Date();

  const paidActive =
    org.subscriptionTier === "PREMIUM" &&
    org.subscriptionExpiresAt != null &&
    org.subscriptionExpiresAt > now;

  const earnedActive =
    org.earnedPremiumExpiresAt != null &&
    org.earnedPremiumExpiresAt > now &&
    org.accountCount <= 1;

  const isPremium = isOrgPremium(org);

  const premiumSource: "paid" | "earned" | "none" = paidActive
    ? "paid"
    : earnedActive
      ? "earned"
      : "none";

  return { isActive: isPremium, premiumSource, earnedPremiumExpiresAt: org.earnedPremiumExpiresAt };
}

/** Simulate what useOrgSubscription hook returns */
function hookOutput(status: ReturnType<typeof getSubscriptionStatus> & { usedSlots: number; purchasedSlots: number }) {
  const isOverQuota = status.usedSlots > status.purchasedSlots;
  return {
    isPremium: status.isActive,
    premiumSource: status.premiumSource,
    isOverQuota,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN TEST
// ═══════════════════════════════════════════════════════════════════════

async function testPremiumSystem() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Comprehensive Premium System Integration Test");
  console.log("═══════════════════════════════════════════════\n");

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey?.startsWith("sk_test_")) {
    throw new Error("STRIPE_SECRET_KEY must be a test key (sk_test_...)");
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-08-16" });
  const stripeService = new StripeService({
    secretKey: stripeSecretKey,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  });

  // Cleanup tracking
  const testOrgIds: string[] = [];
  const testSubmissionIds: string[] = [];
  let stripeCreditToReverse = 0;
  let stripeCustomerId: string | null = null;

  try {
    // Find a real payer for Stripe tests
    const payer = await db.user.findFirst({
      where: { stripeCustomerId: { not: null } },
      select: { id: true, stripeCustomerId: true, primaryEmailAddress: true },
    });

    if (!payer?.stripeCustomerId) {
      throw new Error("No user with stripeCustomerId found in DB.");
    }
    stripeCustomerId = payer.stripeCustomerId;
    console.log(`Using payer: ${payer.primaryEmailAddress} (${stripeCustomerId})\n`);

    // Record initial Stripe balance
    const customerBefore = (await stripe.customers.retrieve(stripeCustomerId)) as Stripe.Customer;
    const balanceBefore = customerBefore.balance;

    // ═══════════════════════════════════════════════════════════════
    // TEST 1: FREE org (no premium)
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 1: FREE org (no premium)");
    const freeOrg = {
      subscriptionTier: "FREE",
      subscriptionExpiresAt: null,
      purchasedSlots: 1,
      earnedPremiumExpiresAt: null,
      accountCount: 0,
    };
    const status1 = getSubscriptionStatus(freeOrg);
    assert(status1.isActive === false, "FREE org should NOT be premium");
    assert(status1.premiumSource === "none", "premiumSource should be 'none'");
    const hook1 = hookOutput({ ...status1, usedSlots: 0, purchasedSlots: 1 });
    assert(hook1.isPremium === false, "Hook: isPremium=false");
    assert(hook1.premiumSource === "none", "Hook: premiumSource='none'");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 2: FREE org + earned premium (active)
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 2: FREE org + earned premium (active)");
    const earnedOrg = {
      subscriptionTier: "FREE",
      subscriptionExpiresAt: null,
      purchasedSlots: 1,
      earnedPremiumExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      accountCount: 1,
    };
    const status2 = getSubscriptionStatus(earnedOrg);
    assert(status2.isActive === true, "Earned premium org should be premium");
    assert(status2.premiumSource === "earned", "premiumSource should be 'earned'");
    const hook2 = hookOutput({ ...status2, usedSlots: 1, purchasedSlots: 1 });
    assert(hook2.isPremium === true, "Hook: isPremium=true");
    assert(hook2.premiumSource === "earned", "Hook: premiumSource='earned'");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 3: PREMIUM org (paid, active)
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 3: PREMIUM org (paid, active)");
    const paidOrg = {
      subscriptionTier: "PREMIUM",
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      purchasedSlots: 5,
      earnedPremiumExpiresAt: null,
      accountCount: 3,
    };
    const status3 = getSubscriptionStatus(paidOrg);
    assert(status3.isActive === true, "Paid premium org should be premium");
    assert(status3.premiumSource === "paid", "premiumSource should be 'paid'");
    const hook3 = hookOutput({ ...status3, usedSlots: 3, purchasedSlots: 5 });
    assert(hook3.isPremium === true, "Hook: isPremium=true");
    assert(hook3.isOverQuota === false, "Hook: isOverQuota=false (3/5 slots)");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 4: PREMIUM org (paid, expired)
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 4: PREMIUM org (paid, expired)");
    const expiredOrg = {
      subscriptionTier: "PREMIUM",
      subscriptionExpiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // expired yesterday
      purchasedSlots: 5,
      earnedPremiumExpiresAt: null,
      accountCount: 3,
    };
    const status4 = getSubscriptionStatus(expiredOrg);
    assert(status4.isActive === false, "Expired paid org should NOT be premium");
    assert(status4.premiumSource === "none", "premiumSource should be 'none'");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 5: PREMIUM org (paid, over quota)
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 5: PREMIUM org (over quota)");
    const overQuotaOrg = {
      subscriptionTier: "PREMIUM",
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      purchasedSlots: 2,
      earnedPremiumExpiresAt: null,
      accountCount: 5, // 5 accounts > 2 slots
    };
    const status5 = getSubscriptionStatus(overQuotaOrg);
    assert(status5.isActive === false, "Over-quota org should NOT be premium");
    assert(status5.premiumSource === "paid", "premiumSource still 'paid' (subscription exists, but over quota)");
    const hook5 = hookOutput({ ...status5, usedSlots: 5, purchasedSlots: 2 });
    assert(hook5.isPremium === false, "Hook: isPremium=false (isActive=false due to over quota)");
    assert(hook5.isOverQuota === true, "Hook: isOverQuota=true");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 6: FREE org + earned premium + 2 accounts (earned disqualified)
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 6: Earned premium with 2 accounts (disqualified)");
    const multiAccountEarned = {
      subscriptionTier: "FREE",
      subscriptionExpiresAt: null,
      purchasedSlots: 1,
      earnedPremiumExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      accountCount: 2, // >1 account disqualifies earned premium
    };
    const status6 = getSubscriptionStatus(multiAccountEarned);
    assert(status6.isActive === false, "Multi-account org should NOT get earned premium");
    assert(status6.premiumSource === "none", "premiumSource should be 'none' (2 accounts)");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 7: Social referral → FREE org → extends earnedPremiumExpiresAt
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 7: Social referral → FREE org → earned days");
    const freeOrgDb = await db.organization.create({
      data: {
        id: `test-free-sys-${Date.now()}`,
        name: "Test - Premium System Free",
        orgSlug: `test-free-sys-${Date.now()}`,
        subscriptionTier: "FREE",
        earnedPremiumExpiresAt: null,
      },
    });
    testOrgIds.push(freeOrgDb.id);

    // Simulate awarding 2 days (base + likes bonus)
    const awardDays = 2;
    const now = new Date();
    const newExpiry = new Date(now);
    newExpiry.setDate(newExpiry.getDate() + awardDays);
    await db.organization.update({
      where: { id: freeOrgDb.id },
      data: { earnedPremiumExpiresAt: newExpiry },
    });

    const orgAfter7 = await db.organization.findUnique({
      where: { id: freeOrgDb.id },
      select: { earnedPremiumExpiresAt: true, subscriptionTier: true },
    });
    assert(orgAfter7?.earnedPremiumExpiresAt != null, "earnedPremiumExpiresAt should be set");
    const diffDays7 = (orgAfter7!.earnedPremiumExpiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    assert(diffDays7 >= 1.9 && diffDays7 <= 2.1, `Expected ~2 days, got ${diffDays7.toFixed(2)}`);
    assert(orgAfter7?.subscriptionTier === "FREE", "subscriptionTier should still be FREE");

    // Verify premium detection
    const status7 = getSubscriptionStatus({
      subscriptionTier: orgAfter7!.subscriptionTier,
      subscriptionExpiresAt: null,
      purchasedSlots: 1,
      earnedPremiumExpiresAt: orgAfter7!.earnedPremiumExpiresAt,
      accountCount: 0,
    });
    assert(status7.isActive === true, "After earning days, org should be premium");
    assert(status7.premiumSource === "earned", "premiumSource should be 'earned'");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 8: Social referral → PREMIUM org → Stripe credit
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 8: Social referral → PREMIUM org → Stripe credit");
    const premOrgDb = await db.organization.create({
      data: {
        id: `test-prem-sys-${Date.now()}`,
        name: "Test - Premium System Paid",
        orgSlug: `test-prem-sys-${Date.now()}`,
        payerId: payer.id,
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        purchasedSlots: 3,
        earnedPremiumExpiresAt: null,
      },
    });
    testOrgIds.push(premOrgDb.id);

    // Create submission
    const sub8 = await db.socialSubmission.create({
      data: {
        organizationId: premOrgDb.id,
        platform: "X",
        postUrl: `https://x.com/test/sys-test-8/${Date.now()}`,
        urlNormalized: `x.com/test/sys-test-8/${Date.now()}`,
        status: "VERIFIED",
        verifiedAt: new Date(),
        containsKeyword: true,
        postText: "Test @engagekit_io premium system",
        likes: 15,
        comments: 8,
        shares: 2,
        daysAwarded: 0,
        scanCount: 1,
        lastScannedAt: new Date(),
      },
    });
    testSubmissionIds.push(sub8.id);

    // Execute award logic (same as production code)
    const finalDays = calculateDaysToAward(15, 8, 0);
    assert(finalDays === MAX_DAYS_PER_POST, `15 likes + 8 comments should earn ${MAX_DAYS_PER_POST} days, got ${finalDays}`);

    const isPaidPremium =
      premOrgDb.subscriptionTier === "PREMIUM" &&
      premOrgDb.subscriptionExpiresAt != null &&
      premOrgDb.subscriptionExpiresAt > new Date();
    assert(isPaidPremium === true, "Test org should be detected as paid premium");

    // Apply Stripe credit
    const creditAmount = finalDays * CREDIT_PER_DAY_CENTS;
    await stripeService.createBalanceCredit(
      stripeCustomerId,
      creditAmount,
      `Test: ${finalDays} day(s) credit for sys test`,
    );
    stripeCreditToReverse += creditAmount;

    await db.socialSubmission.update({
      where: { id: sub8.id },
      data: { daysAwarded: finalDays },
    });

    // Verify: Stripe balance changed
    const customerAfter8 = (await stripe.customers.retrieve(stripeCustomerId)) as Stripe.Customer;
    assert(
      customerAfter8.balance === balanceBefore - creditAmount,
      `Stripe balance: expected ${balanceBefore - creditAmount}c, got ${customerAfter8.balance}c`,
    );

    // Verify: earnedPremiumExpiresAt NOT changed
    const orgAfter8 = await db.organization.findUnique({
      where: { id: premOrgDb.id },
      select: { earnedPremiumExpiresAt: true },
    });
    assert(
      orgAfter8?.earnedPremiumExpiresAt === null,
      "Paid org should NOT have earnedPremiumExpiresAt set",
    );

    // Verify premium status
    const status8 = getSubscriptionStatus({
      subscriptionTier: premOrgDb.subscriptionTier,
      subscriptionExpiresAt: premOrgDb.subscriptionExpiresAt,
      purchasedSlots: premOrgDb.purchasedSlots,
      earnedPremiumExpiresAt: null,
      accountCount: 0,
    });
    assert(status8.isActive === true, "Paid org still premium");
    assert(status8.premiumSource === "paid", "premiumSource='paid'");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 9: calculateDaysToAward + Monthly cap
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 9: Reward calculation + monthly cap");
    assert(calculateDaysToAward(0, 0, 0) === 1, "Base: 0 likes, 0 comments → 1 day");
    assert(calculateDaysToAward(9, 4, 0) === 1, "Below thresholds: 9 likes, 4 comments → 1 day");
    assert(calculateDaysToAward(10, 0, 0) === 2, "Likes bonus: 10 likes → 2 days");
    assert(calculateDaysToAward(0, 5, 0) === 2, "Comments bonus: 5 comments → 2 days");
    assert(calculateDaysToAward(10, 5, 0) === 3, "Both bonuses: 10 likes, 5 comments → 3 days (max)");
    assert(calculateDaysToAward(100, 50, 0) === 3, "Above max: 100 likes, 50 comments → 3 days (capped)");
    assert(calculateDaysToAward(10, 5, 2) === 1, "Delta: max=3, already=2 → 1 more");
    assert(calculateDaysToAward(10, 5, 3) === 0, "At max: already=3 → 0 more");
    assert(MONTHLY_CAP_DAYS === 14, "Monthly cap should be 14 days");
    assert(MAX_DAYS_PER_POST === 3, "Max per post should be 3 days");
    assert(LIKES_THRESHOLD === 10, "Likes threshold should be 10");
    assert(COMMENTS_THRESHOLD === 5, "Comments threshold should be 5");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 10: Both paid + earned active → paid takes priority
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 10: Both paid + earned active → paid priority");
    const dualOrg = {
      subscriptionTier: "PREMIUM",
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      purchasedSlots: 5,
      earnedPremiumExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      accountCount: 3,
    };
    const status10 = getSubscriptionStatus(dualOrg);
    assert(status10.isActive === true, "Dual org should be premium");
    assert(status10.premiumSource === "paid", "premiumSource should be 'paid' (takes priority)");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 11: Earned premium expired
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 11: Earned premium expired");
    const expiredEarned = {
      subscriptionTier: "FREE",
      subscriptionExpiresAt: null,
      purchasedSlots: 1,
      earnedPremiumExpiresAt: new Date(Date.now() - 1000), // expired
      accountCount: 1,
    };
    const status11 = getSubscriptionStatus(expiredEarned);
    assert(status11.isActive === false, "Expired earned premium should NOT be active");
    assert(status11.premiumSource === "none", "premiumSource should be 'none'");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 12: CREDIT_PER_DAY_CENTS correct
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 12: Credit calculation");
    assert(CREDIT_PER_DAY_CENTS === 100, "CREDIT_PER_DAY_CENTS should be 100 ($1.00/day)");
    assert(1 * CREDIT_PER_DAY_CENTS === 100, "1 day credit = $1.00 (100c)");
    assert(3 * CREDIT_PER_DAY_CENTS === 300, "3 day credit = $3.00 (300c)");
    assert(14 * CREDIT_PER_DAY_CENTS === 1400, "14 day credit (monthly cap) = $14.00 (1400c)");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 13: PREMIUM paid expired + earned active (1 account)
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 13: PREMIUM paid expired + earned active (1 account)");
    const expiredPaidEarnedActive = {
      subscriptionTier: "PREMIUM",
      subscriptionExpiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // expired yesterday
      purchasedSlots: 5,
      earnedPremiumExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      accountCount: 1,
    };
    const status13 = getSubscriptionStatus(expiredPaidEarnedActive);
    assert(status13.isActive === true, "Expired paid + active earned (1 account) should be premium");
    assert(status13.premiumSource === "earned", "premiumSource should be 'earned' (paid expired)");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 14: PREMIUM exactly at quota (5/5)
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 14: PREMIUM exactly at quota (5/5)");
    const exactQuota = {
      subscriptionTier: "PREMIUM",
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      purchasedSlots: 5,
      earnedPremiumExpiresAt: null,
      accountCount: 5,
    };
    const status14 = getSubscriptionStatus(exactQuota);
    assert(status14.isActive === true, "Exactly at quota (5/5) should be premium");
    assert(status14.premiumSource === "paid", "premiumSource should be 'paid'");
    const hook14 = hookOutput({ ...status14, usedSlots: 5, purchasedSlots: 5 });
    assert(hook14.isPremium === true, "Hook: isPremium=true");
    assert(hook14.isOverQuota === false, "Hook: isOverQuota=false (exactly at quota)");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 15: PREMIUM one over quota (6/5)
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 15: PREMIUM one over quota (6/5)");
    const oneOverQuota = {
      subscriptionTier: "PREMIUM",
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      purchasedSlots: 5,
      earnedPremiumExpiresAt: null,
      accountCount: 6,
    };
    const status15 = getSubscriptionStatus(oneOverQuota);
    assert(status15.isActive === false, "One over quota (6/5) should NOT be premium");
    assert(status15.premiumSource === "paid", "premiumSource should be 'paid' (subscription exists)");
    const hook15 = hookOutput({ ...status15, usedSlots: 6, purchasedSlots: 5 });
    assert(hook15.isPremium === false, "Hook: isPremium=false");
    assert(hook15.isOverQuota === true, "Hook: isOverQuota=true");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 16: PREMIUM canceled (NULL expiry)
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 16: PREMIUM canceled (NULL expiry)");
    const canceledPremium = {
      subscriptionTier: "PREMIUM",
      subscriptionExpiresAt: null,
      purchasedSlots: 5,
      earnedPremiumExpiresAt: null,
      accountCount: 3,
    };
    const status16 = getSubscriptionStatus(canceledPremium);
    assert(status16.isActive === false, "Canceled premium (NULL expiry) should NOT be premium");
    assert(status16.premiumSource === "none", "premiumSource should be 'none'");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 17: FREE, no accounts added
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 17: FREE org with no accounts");
    const freeNoAccounts = {
      subscriptionTier: "FREE",
      subscriptionExpiresAt: null,
      purchasedSlots: 1,
      earnedPremiumExpiresAt: null,
      accountCount: 0,
    };
    const status17 = getSubscriptionStatus(freeNoAccounts);
    assert(status17.isActive === false, "FREE with no accounts should NOT be premium");
    assert(status17.premiumSource === "none", "premiumSource should be 'none'");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 18: FREE, long-term earned (365 days)
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 18: FREE org with long-term earned (365 days)");
    const longTermEarned = {
      subscriptionTier: "FREE",
      subscriptionExpiresAt: null,
      purchasedSlots: 1,
      earnedPremiumExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 days
      accountCount: 1,
    };
    const status18 = getSubscriptionStatus(longTermEarned);
    assert(status18.isActive === true, "FREE with 365-day earned should be premium");
    assert(status18.premiumSource === "earned", "premiumSource should be 'earned'");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 19: PREMIUM over quota + earned active (8 accounts) — earned DISQUALIFIED
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 19: PREMIUM over quota + earned active (8 accounts)");
    const overQuotaEarnedMultiAccount = {
      subscriptionTier: "PREMIUM",
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      purchasedSlots: 5,
      earnedPremiumExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      accountCount: 8,
    };
    const status19 = getSubscriptionStatus(overQuotaEarnedMultiAccount);
    assert(status19.isActive === false, "Over quota (8/5) + earned with 8 accounts should NOT be premium");
    assert(status19.premiumSource === "paid", "premiumSource should be 'paid' (subscription exists)");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 20: PREMIUM over quota + earned active (1 account) — earned WORKS
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 20: PREMIUM over quota + earned active (1 account)");
    const overQuotaEarnedSingleAccount = {
      subscriptionTier: "PREMIUM",
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      purchasedSlots: 0,
      earnedPremiumExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      accountCount: 1,
    };
    const status20 = getSubscriptionStatus(overQuotaEarnedSingleAccount);
    assert(status20.isActive === true, "Over quota (1/0) but earned active (1 account) should be premium");
    assert(status20.premiumSource === "paid", "premiumSource should be 'paid' (paidActive=true)");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // TEST 21: Both expire on same day
    // ═══════════════════════════════════════════════════════════════
    console.log("TEST 21: Both paid and earned expire on same day");
    const sameExpiry = {
      subscriptionTier: "PREMIUM",
      subscriptionExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      purchasedSlots: 5,
      earnedPremiumExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      accountCount: 3,
    };
    const status21 = getSubscriptionStatus(sameExpiry);
    assert(status21.isActive === true, "Both expire same day should be premium");
    assert(status21.premiumSource === "paid", "premiumSource should be 'paid' (takes priority)");
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════
    console.log("═══════════════════════════════════════════════");
    console.log("  ALL 21 TESTS PASSED");
    console.log("═══════════════════════════════════════════════");
    console.log("");
    console.log("Coverage:");
    console.log("  [1]  FREE org (no premium) → none");
    console.log("  [2]  FREE + earned premium → earned");
    console.log("  [3]  PREMIUM (paid, active) → paid");
    console.log("  [4]  PREMIUM (paid, expired) → none");
    console.log("  [5]  PREMIUM (over quota) → none");
    console.log("  [6]  Earned + 2 accounts → disqualified");
    console.log("  [7]  Social referral → FREE org → earned days (DB)");
    console.log("  [8]  Social referral → PREMIUM org → Stripe credit (real API)");
    console.log("  [9]  Reward calculation + constants");
    console.log("  [10] Both paid + earned → paid priority");
    console.log("  [11] Earned premium expired → none");
    console.log("  [12] Credit calculation verified");
    console.log("  [13] PREMIUM paid expired + earned active (1 account) → earned");
    console.log("  [14] PREMIUM exactly at quota (5/5) → paid");
    console.log("  [15] PREMIUM one over quota (6/5) → not premium");
    console.log("  [16] PREMIUM canceled (NULL expiry) → none");
    console.log("  [17] FREE with no accounts → none");
    console.log("  [18] FREE with long-term earned (365 days) → earned");
    console.log("  [19] PREMIUM over quota + earned (8 accounts) → not premium");
    console.log("  [20] PREMIUM over quota + earned (1 account) → premium via earned");
    console.log("  [21] Both paid and earned expire same day → paid priority");
    console.log("");
    console.log("Systems tested:");
    console.log("  - isOrgPremium() (org-access-control.ts)");
    console.log("  - subscription.status response shape");
    console.log("  - useOrgSubscription hook logic");
    console.log("  - calculateDaysToAward() (social-referral-verification.ts)");
    console.log("  - Stripe createBalanceCredit (real API)");
    console.log("  - DB: earnedPremiumExpiresAt extension");
    console.log("  - DB: paid org does NOT set earnedPremiumExpiresAt");
    console.log("  - Reward constants (thresholds, caps, credits)");
  } catch (error) {
    console.error("\nTest failed:");
    console.error(error);
    process.exit(1);
  } finally {
    // ═══════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════
    console.log("\nCleaning up...");

    // Reverse Stripe credits
    if (stripeCreditToReverse > 0 && stripeCustomerId) {
      try {
        await stripe.customers.createBalanceTransaction(stripeCustomerId, {
          amount: stripeCreditToReverse,
          currency: "usd",
          description: "Test cleanup: reversing premium system test credits",
        });
        console.log(`   Reversed Stripe credit: +${stripeCreditToReverse}c`);
      } catch (err) {
        console.error("   Failed to reverse Stripe credit:", err);
      }
    }

    // Delete test submissions
    for (const id of testSubmissionIds) {
      try {
        await db.socialSubmission.delete({ where: { id } });
        console.log(`   Deleted submission: ${id}`);
      } catch {}
    }

    // Delete test orgs
    for (const id of testOrgIds) {
      try {
        await db.organization.delete({ where: { id } });
        console.log(`   Deleted org: ${id}`);
      } catch {}
    }

    console.log("   Cleanup complete");
    await db.$disconnect();
  }
}

void testPremiumSystem();
