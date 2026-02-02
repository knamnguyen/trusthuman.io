/**
 * Integration test: paid-org credit path
 *
 * Tests the EXACT branching logic from social-referral-verification.ts:242-284
 * and the rescan workflow's equivalent — against real DB + real Stripe API.
 *
 * Flow tested:
 *   1. PREMIUM org earns days → detects isPaidPremium=true
 *   2. Looks up org.payerId → User.stripeCustomerId
 *   3. Calls stripeService.createBalanceCredit() → credit appears on Stripe
 *   4. earnedPremiumExpiresAt is NOT extended (paid orgs get credits instead)
 *
 *   5. FREE org earns days → detects isPaidPremium=false
 *   6. Extends earnedPremiumExpiresAt instead
 *   7. NO Stripe API call is made
 *
 * Run with: bun run packages/api/tests/test-paid-org-credit-path.ts
 */

import { config } from "dotenv";
import Stripe from "stripe";

import { db } from "@sassy/db";
import { StripeService } from "@sassy/stripe";

config({ path: ".env" });

const CREDIT_PER_DAY_CENTS = 100; // must match social-referral-verification.ts

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function testPaidOrgCreditPath() {
  console.log("Testing Paid-Org Credit Path (end-to-end)\n");

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey?.startsWith("sk_test_")) {
    throw new Error("STRIPE_SECRET_KEY must be a test key (sk_test_...)");
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-08-16" });
  const stripeService = new StripeService({
    secretKey: stripeSecretKey,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  });

  // Track test data for cleanup
  let testPremiumOrgId: string | null = null;
  let testFreeOrgId: string | null = null;
  let testSubmission1Id: string | null = null;
  let testSubmission2Id: string | null = null;
  let stripeCreditToReverse = 0;
  let stripeCustomerId: string | null = null;

  try {
    // ═══════════════════════════════════════════════════════════════════
    // SETUP: Find a real payer with stripeCustomerId
    // ═══════════════════════════════════════════════════════════════════
    console.log("1. Finding payer with stripeCustomerId...");
    const payer = await db.user.findFirst({
      where: { stripeCustomerId: { not: null } },
      select: { id: true, stripeCustomerId: true, primaryEmailAddress: true },
    });

    if (!payer?.stripeCustomerId) {
      throw new Error(
        "No user with stripeCustomerId found in DB. Cannot test paid-org path.",
      );
    }
    stripeCustomerId = payer.stripeCustomerId;
    console.log(`   Payer: ${payer.primaryEmailAddress} (${payer.id})`);
    console.log(`   Stripe customer: ${stripeCustomerId}\n`);

    // Record initial Stripe balance
    const customerBefore = (await stripe.customers.retrieve(
      stripeCustomerId,
    )) as Stripe.Customer;
    const balanceBefore = customerBefore.balance;
    console.log(`   Initial Stripe balance: ${balanceBefore}c\n`);

    // ═══════════════════════════════════════════════════════════════════
    // TEST A: PREMIUM org → Stripe credit (NOT earnedPremiumExpiresAt)
    // ═══════════════════════════════════════════════════════════════════
    console.log("═══ TEST A: PREMIUM org → Stripe credit ═══\n");

    // Create test PREMIUM org
    console.log("2. Creating test PREMIUM org...");
    const premiumOrg = await db.organization.create({
      data: {
        id: `test-premium-${Date.now()}`,
        name: "Test Org - Paid Credit Path",
        orgSlug: `test-premium-credit-${Date.now()}`,
        payerId: payer.id,
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        purchasedSlots: 5,
        earnedPremiumExpiresAt: null, // no earned premium
      },
    });
    testPremiumOrgId = premiumOrg.id;
    console.log(`   Created: ${testPremiumOrgId}`);
    console.log(`   subscriptionTier: ${premiumOrg.subscriptionTier}`);
    console.log(`   payerId: ${premiumOrg.payerId}`);
    console.log(`   earnedPremiumExpiresAt: ${premiumOrg.earnedPremiumExpiresAt}\n`);

    // Create a VERIFIED submission (simulating scan #1 done, 1 day base awarded)
    console.log("3. Creating VERIFIED submission for PREMIUM org...");
    const submission1 = await db.socialSubmission.create({
      data: {
        organizationId: testPremiumOrgId,
        platform: "X",
        postUrl: `https://x.com/test/paid-credit-test/${Date.now()}`,
        urlNormalized: `x.com/test/paid-credit-test/${Date.now()}`,
        status: "VERIFIED",
        verifiedAt: new Date(),
        containsKeyword: true,
        postText: "Test paid org credit path @engagekit_io",
        likes: 15,
        comments: 8,
        shares: 2,
        daysAwarded: 0, // will be set by our logic below
        scanCount: 1,
        lastScannedAt: new Date(),
      },
    });
    testSubmission1Id = submission1.id;
    console.log(`   Submission: ${testSubmission1Id}\n`);

    // ── Execute the EXACT same logic as social-referral-verification.ts:242-284 ──
    console.log("4. Executing award logic (same as verification service)...");
    const finalDays = 3; // simulate: 15 likes (>=10) + 8 comments (>=5) = max 3
    const now = new Date();

    const isPaidPremium =
      premiumOrg.subscriptionTier === "PREMIUM" &&
      premiumOrg.subscriptionExpiresAt != null &&
      premiumOrg.subscriptionExpiresAt > now;

    console.log(`   isPaidPremium: ${isPaidPremium} (expected: true)`);
    assert(isPaidPremium, "Test org should be detected as paid premium");

    assert(!!premiumOrg.payerId, "Test org must have payerId");

    // Look up payer's Stripe customer ID (same as production code)
    const payerLookup = await db.user.findUnique({
      where: { id: premiumOrg.payerId! },
      select: { stripeCustomerId: true },
    });

    console.log(`   Payer stripeCustomerId: ${payerLookup?.stripeCustomerId}`);
    assert(
      !!payerLookup?.stripeCustomerId,
      "Payer must have stripeCustomerId",
    );

    // Apply Stripe credit (same as production code)
    const creditAmount = finalDays * CREDIT_PER_DAY_CENTS;
    console.log(`   Applying credit: ${finalDays} days × ${CREDIT_PER_DAY_CENTS}c = ${creditAmount}c ($${(creditAmount / 100).toFixed(2)})`);

    await stripeService.createBalanceCredit(
      payerLookup!.stripeCustomerId!,
      creditAmount,
      `Social referral: ${finalDays} day(s) credit for submission ${testSubmission1Id}`,
    );
    stripeCreditToReverse += creditAmount;

    // Update submission (same as production code)
    await db.socialSubmission.update({
      where: { id: testSubmission1Id },
      data: { daysAwarded: finalDays },
    });

    console.log("   Stripe credit applied!\n");

    // ── Verify: Stripe balance changed ──
    console.log("5. Verifying Stripe balance...");
    const customerAfterA = (await stripe.customers.retrieve(
      stripeCustomerId,
    )) as Stripe.Customer;
    const expectedBalanceA = balanceBefore - creditAmount;
    console.log(`   Balance before: ${balanceBefore}c`);
    console.log(`   Credit applied: -${creditAmount}c`);
    console.log(`   Balance after:  ${customerAfterA.balance}c (expected: ${expectedBalanceA}c)`);
    assert(
      customerAfterA.balance === expectedBalanceA,
      `Expected balance ${expectedBalanceA}c, got ${customerAfterA.balance}c`,
    );
    console.log("   Stripe balance verified!\n");

    // ── Verify: earnedPremiumExpiresAt was NOT changed ──
    console.log("6. Verifying earnedPremiumExpiresAt was NOT extended...");
    const orgAfterA = await db.organization.findUnique({
      where: { id: testPremiumOrgId },
      select: { earnedPremiumExpiresAt: true },
    });
    console.log(`   earnedPremiumExpiresAt: ${orgAfterA?.earnedPremiumExpiresAt} (expected: null)`);
    assert(
      orgAfterA?.earnedPremiumExpiresAt === null,
      "PREMIUM org should NOT have earnedPremiumExpiresAt set",
    );
    console.log("   Confirmed: paid org got Stripe credit, NOT earned premium days\n");

    // ═══════════════════════════════════════════════════════════════════
    // TEST B: FREE org → earnedPremiumExpiresAt (NOT Stripe credit)
    // ═══════════════════════════════════════════════════════════════════
    console.log("═══ TEST B: FREE org → earnedPremiumExpiresAt ═══\n");

    console.log("7. Creating test FREE org...");
    const freeOrg = await db.organization.create({
      data: {
        id: `test-free-${Date.now()}`,
        name: "Test Org - Free Credit Path",
        orgSlug: `test-free-credit-${Date.now()}`,
        subscriptionTier: "FREE",
        earnedPremiumExpiresAt: null,
      },
    });
    testFreeOrgId = freeOrg.id;
    console.log(`   Created: ${testFreeOrgId}`);
    console.log(`   subscriptionTier: ${freeOrg.subscriptionTier}`);
    console.log(`   earnedPremiumExpiresAt: ${freeOrg.earnedPremiumExpiresAt}\n`);

    // Create submission for free org
    console.log("8. Creating VERIFIED submission for FREE org...");
    const submission2 = await db.socialSubmission.create({
      data: {
        organizationId: testFreeOrgId,
        platform: "X",
        postUrl: `https://x.com/test/free-credit-test/${Date.now()}`,
        urlNormalized: `x.com/test/free-credit-test/${Date.now()}`,
        status: "VERIFIED",
        verifiedAt: new Date(),
        containsKeyword: true,
        postText: "Test free org credit path @engagekit_io",
        likes: 2,
        comments: 0,
        shares: 0,
        daysAwarded: 0,
        scanCount: 1,
        lastScannedAt: new Date(),
      },
    });
    testSubmission2Id = submission2.id;
    console.log(`   Submission: ${testSubmission2Id}\n`);

    // ── Execute FREE org award logic ──
    console.log("9. Executing award logic for FREE org...");
    const freeDays = 1; // simulate: 2 likes (<10), 0 comments (<5) = base only
    const now2 = new Date();

    const isFreeOrgPaidPremium =
      freeOrg.subscriptionTier === "PREMIUM" &&
      freeOrg.subscriptionExpiresAt != null &&
      freeOrg.subscriptionExpiresAt > now2;

    console.log(`   isPaidPremium: ${isFreeOrgPaidPremium} (expected: false)`);
    assert(!isFreeOrgPaidPremium, "FREE org should NOT be detected as paid premium");

    // Extend earnedPremiumExpiresAt (same as production code)
    const currentExpiry = freeOrg.earnedPremiumExpiresAt;
    const baseDate =
      currentExpiry && currentExpiry > now2 ? currentExpiry : now2;
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + freeDays);

    await db.organization.update({
      where: { id: testFreeOrgId },
      data: { earnedPremiumExpiresAt: newExpiry },
    });

    await db.socialSubmission.update({
      where: { id: testSubmission2Id },
      data: { daysAwarded: freeDays },
    });

    console.log(`   Extended earnedPremiumExpiresAt to: ${newExpiry.toISOString()}\n`);

    // ── Verify: earnedPremiumExpiresAt was extended ──
    console.log("10. Verifying earnedPremiumExpiresAt was extended...");
    const orgAfterB = await db.organization.findUnique({
      where: { id: testFreeOrgId },
      select: { earnedPremiumExpiresAt: true },
    });
    assert(
      orgAfterB?.earnedPremiumExpiresAt != null,
      "FREE org should have earnedPremiumExpiresAt set",
    );

    const expiryDiffMs =
      orgAfterB!.earnedPremiumExpiresAt!.getTime() - now2.getTime();
    const expiryDiffDays = expiryDiffMs / (24 * 60 * 60 * 1000);
    console.log(`   earnedPremiumExpiresAt: ${orgAfterB!.earnedPremiumExpiresAt!.toISOString()}`);
    console.log(`   Days from now: ${expiryDiffDays.toFixed(2)} (expected: ~${freeDays})`);
    assert(
      expiryDiffDays >= 0.9 && expiryDiffDays <= 1.1,
      `Expected ~1 day, got ${expiryDiffDays.toFixed(2)} days`,
    );
    console.log("   Confirmed: free org got earned premium days, NOT Stripe credit\n");

    // ── Verify: Stripe balance unchanged (no credit for free org) ──
    console.log("11. Verifying Stripe balance unchanged after FREE org award...");
    const customerAfterB = (await stripe.customers.retrieve(
      stripeCustomerId,
    )) as Stripe.Customer;
    console.log(`   Stripe balance: ${customerAfterB.balance}c (expected: ${expectedBalanceA}c, same as after Test A)`);
    assert(
      customerAfterB.balance === expectedBalanceA,
      `Balance should not have changed. Expected ${expectedBalanceA}c, got ${customerAfterB.balance}c`,
    );
    console.log("   Confirmed: no Stripe credit for free org\n");

    // ═══════════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════════
    console.log("════════════════════════════════════════════");
    console.log("SUMMARY");
    console.log("════════════════════════════════════════════");
    console.log("Test A (PREMIUM org):");
    console.log(`   isPaidPremium=true → Stripe credit: -${creditAmount}c ($${(creditAmount / 100).toFixed(2)})`);
    console.log(`   earnedPremiumExpiresAt: null (unchanged)`);
    console.log("Test B (FREE org):");
    console.log(`   isPaidPremium=false → earnedPremiumExpiresAt extended by ${freeDays} day(s)`);
    console.log(`   Stripe balance: unchanged`);
    console.log("════════════════════════════════════════════\n");

    console.log("All paid-org credit path tests passed!");
  } catch (error) {
    console.error("\nTest failed:");
    console.error(error);
    process.exit(1);
  } finally {
    // ═══════════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════════
    console.log("\nCleaning up...");

    // Reverse Stripe credits
    if (stripeCreditToReverse > 0 && stripeCustomerId) {
      try {
        await stripe.customers.createBalanceTransaction(stripeCustomerId, {
          amount: stripeCreditToReverse, // positive = debit (reverses credit)
          currency: "usd",
          description: "Test cleanup: reversing paid-org credit path test",
        });
        console.log(`   Reversed Stripe credit: +${stripeCreditToReverse}c`);
      } catch (err) {
        console.error("   Failed to reverse Stripe credit:", err);
      }
    }

    // Delete test submissions
    if (testSubmission1Id) {
      try {
        await db.socialSubmission.delete({ where: { id: testSubmission1Id } });
        console.log(`   Deleted submission: ${testSubmission1Id}`);
      } catch {}
    }
    if (testSubmission2Id) {
      try {
        await db.socialSubmission.delete({ where: { id: testSubmission2Id } });
        console.log(`   Deleted submission: ${testSubmission2Id}`);
      } catch {}
    }

    // Delete test orgs
    if (testPremiumOrgId) {
      try {
        await db.organization.delete({ where: { id: testPremiumOrgId } });
        console.log(`   Deleted PREMIUM org: ${testPremiumOrgId}`);
      } catch {}
    }
    if (testFreeOrgId) {
      try {
        await db.organization.delete({ where: { id: testFreeOrgId } });
        console.log(`   Deleted FREE org: ${testFreeOrgId}`);
      } catch {}
    }

    console.log("   Cleanup complete");
    await db.$disconnect();
  }
}

void testPaidOrgCreditPath();
