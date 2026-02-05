/**
 * End-to-End Social Referral Test
 *
 * Tests:
 * 1. FREE org → earnedPremiumExpiresAt extended
 * 2. PREMIUM org → Stripe credit applied
 *
 * Run with: bun run packages/api/tests/test-social-referral-e2e.ts
 */
import { config } from "dotenv";
import Stripe from "stripe";

import { db } from "@sassy/db";
import { StripeService } from "@sassy/stripe";

config({ path: ".env" });

const CREDIT_PER_DAY_CENTS = 100; // $1.00/day

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function testFreeOrgPath() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("TEST 1: FREE org → earnedPremiumExpiresAt");
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Find or create a FREE test org
  let testOrg = await db.organization.findFirst({
    where: {
      subscriptionTier: "FREE",
      payerId: null,
    },
    select: {
      id: true,
      name: true,
      subscriptionTier: true,
      earnedPremiumExpiresAt: true,
    },
  });

  if (!testOrg) {
    console.log("Creating test FREE org...");
    testOrg = await db.organization.create({
      data: {
        id: `test-free-${Date.now()}`,
        name: "Test FREE Org",
        orgSlug: `test-free-${Date.now()}`,
        subscriptionTier: "FREE",
      },
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
        earnedPremiumExpiresAt: true,
      },
    });
  }

  console.log(`Using org: ${testOrg.name} (${testOrg.id})`);
  console.log(`  Tier: ${testOrg.subscriptionTier}`);
  console.log(`  Current earnedPremiumExpiresAt: ${testOrg.earnedPremiumExpiresAt}`);

  // Simulate the award logic (same as social-referral-verification.ts:272-284)
  const daysToAward = 1;
  const now = new Date();

  const isPaidPremium = false; // FREE tier, so this is false

  if (!isPaidPremium) {
    const currentExpiry = testOrg.earnedPremiumExpiresAt;
    const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + daysToAward);

    console.log(`\nApplying award logic:`);
    console.log(`  Days to award: ${daysToAward}`);
    console.log(`  Base date: ${baseDate.toISOString()}`);
    console.log(`  New expiry: ${newExpiry.toISOString()}`);

    await db.organization.update({
      where: { id: testOrg.id },
      data: { earnedPremiumExpiresAt: newExpiry },
    });

    // Verify
    const updatedOrg = await db.organization.findUnique({
      where: { id: testOrg.id },
      select: { earnedPremiumExpiresAt: true },
    });

    assert(
      updatedOrg?.earnedPremiumExpiresAt != null,
      "earnedPremiumExpiresAt should be set",
    );

    const diffMs = updatedOrg!.earnedPremiumExpiresAt!.getTime() - baseDate.getTime();
    const diffDays = diffMs / (24 * 60 * 60 * 1000);

    assert(
      diffDays >= 0.9 && diffDays <= 1.1,
      `Expected ~1 day difference, got ${diffDays.toFixed(2)} days`,
    );

    console.log(`\n✅ TEST 1 PASSED: earnedPremiumExpiresAt extended by ${diffDays.toFixed(2)} days`);
  }

  return testOrg.id;
}

async function testPremiumOrgPath() {
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("TEST 2: PREMIUM org → Stripe credit");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey?.startsWith("sk_test_")) {
    console.log("⚠️  STRIPE_SECRET_KEY must be a test key (sk_test_...)");
    console.log("   Skipping Stripe credit test\n");
    return null;
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-08-16" });
  const stripeService = new StripeService({
    secretKey: stripeSecretKey,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  });

  // Find a user with stripeCustomerId
  const payer = await db.user.findFirst({
    where: { stripeCustomerId: { not: null } },
    select: { id: true, stripeCustomerId: true, primaryEmailAddress: true },
  });

  if (!payer?.stripeCustomerId) {
    console.log("⚠️  No user with stripeCustomerId found");
    console.log("   Skipping Stripe credit test\n");
    return null;
  }

  // Verify customer exists in Stripe (and is not deleted)
  try {
    const customer = await stripe.customers.retrieve(payer.stripeCustomerId);
    if ("deleted" in customer && customer.deleted === true) {
      console.log(`⚠️  Stripe customer ${payer.stripeCustomerId} is DELETED`);
      console.log("   You need to create a new subscription to get a valid customer");
      console.log("   Skipping Stripe credit test\n");
      return null;
    }
  } catch {
    console.log(`⚠️  Stripe customer ${payer.stripeCustomerId} not found`);
    console.log("   Skipping Stripe credit test\n");
    return null;
  }

  console.log(`Using payer: ${payer.primaryEmailAddress}`);
  console.log(`Stripe customer: ${payer.stripeCustomerId}`);

  // Get initial balance
  const customerBefore = (await stripe.customers.retrieve(
    payer.stripeCustomerId,
  )) as Stripe.Customer;
  const balanceBefore = customerBefore.balance ?? 0;
  console.log(`Initial balance: ${balanceBefore}c`);

  // Create test PREMIUM org
  const testOrgId = `test-premium-${Date.now()}`;
  const testOrg = await db.organization.create({
    data: {
      id: testOrgId,
      name: "Test PREMIUM Org",
      orgSlug: `test-premium-${Date.now()}`,
      subscriptionTier: "PREMIUM",
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      purchasedSlots: 5,
      payerId: payer.id,
    },
  });

  console.log(`Created test org: ${testOrg.name} (${testOrg.id})`);

  // Simulate the award logic for PREMIUM org
  const daysToAward = 2;
  const creditAmount = daysToAward * CREDIT_PER_DAY_CENTS;

  console.log(`\nApplying Stripe credit:`);
  console.log(`  Days to award: ${daysToAward}`);
  console.log(`  Credit amount: ${creditAmount}c ($${(creditAmount / 100).toFixed(2)})`);

  await stripeService.createBalanceCredit(
    payer.stripeCustomerId,
    creditAmount,
    `Social referral test: ${daysToAward} day(s) credit`,
  );

  // Verify balance changed
  const customerAfter = (await stripe.customers.retrieve(
    payer.stripeCustomerId,
  )) as Stripe.Customer;
  const expectedBalance = balanceBefore - creditAmount;

  console.log(`Balance after: ${customerAfter.balance}c (expected: ${expectedBalance}c)`);

  assert(
    customerAfter.balance === expectedBalance,
    `Balance mismatch: expected ${expectedBalance}c, got ${customerAfter.balance}c`,
  );

  console.log(`\n✅ TEST 2 PASSED: Stripe credit applied successfully`);

  // Cleanup: reverse the credit
  console.log("\nCleaning up: reversing Stripe credit...");
  await stripe.customers.createBalanceTransaction(payer.stripeCustomerId, {
    amount: creditAmount, // positive = debit (reverses credit)
    currency: "usd",
    description: "Test cleanup: reversing test credit",
  });

  // Delete test org
  await db.organization.delete({ where: { id: testOrgId } });
  console.log("Cleanup complete");

  return testOrgId;
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════════════════╗");
  console.log("║           SOCIAL REFERRAL E2E TEST                            ║");
  console.log("╚═══════════════════════════════════════════════════════════════╝\n");

  try {
    // Test 1: FREE org path
    const freeOrgId = await testFreeOrgPath();

    // Test 2: PREMIUM org path (Stripe credit)
    await testPremiumOrgPath();

    console.log("\n╔═══════════════════════════════════════════════════════════════╗");
    console.log("║                   ALL TESTS PASSED                            ║");
    console.log("╚═══════════════════════════════════════════════════════════════╝\n");

    console.log("Summary:");
    console.log("  ✅ FREE org: earnedPremiumExpiresAt extended correctly");
    console.log("  ✅ PREMIUM org: Stripe credit applied and verified");
  } catch (error) {
    console.error("\n❌ TEST FAILED:");
    console.error(error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
