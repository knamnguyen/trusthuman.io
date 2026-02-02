/**
 * Test Stripe credit system (createBalanceCredit)
 *
 * Tests:
 * 1. Create a balance credit on a Stripe test customer
 * 2. Verify the credit appears in customer balance
 * 3. Test the full flow: org → payer → stripeCustomerId → credit
 *
 * Run with: bun run packages/api/tests/test-stripe-credit.ts
 *
 * Optional: pass a real Stripe customer ID to skip test customer creation:
 *   bun run packages/api/tests/test-stripe-credit.ts cus_xxx
 */

import { config } from "dotenv";
import Stripe from "stripe";

import { db } from "@sassy/db";
import { StripeService } from "@sassy/stripe";

config({ path: ".env" });

const CREDIT_PER_DAY_CENTS = 100; // $1.00/day ($29.99/mo / 30)

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function testStripeCredit() {
  console.log("Testing Stripe Credit System\n");

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY not set in environment");
  }

  // Verify we're using test mode
  if (!stripeSecretKey.startsWith("sk_test_")) {
    throw new Error(
      "STRIPE_SECRET_KEY must be a test key (sk_test_...). Refusing to run against live Stripe.",
    );
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-08-16" });
  const stripeService = new StripeService({
    secretKey: stripeSecretKey,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  });

  let testCustomerId: string | null = null;
  let createdTestCustomer = false;

  try {
    // ── Step 1: Get or create a Stripe test customer ──────────────────
    const inputCustomerId = process.argv[2];

    if (inputCustomerId?.startsWith("cus_")) {
      console.log(`1. Using provided Stripe customer: ${inputCustomerId}`);
      testCustomerId = inputCustomerId;

      // Verify customer exists
      const customer = await stripe.customers.retrieve(testCustomerId);
      if (customer.deleted) {
        throw new Error(`Customer ${testCustomerId} is deleted`);
      }
      console.log(
        `   Customer found: ${(customer as Stripe.Customer).email ?? "(no email)"}\n`,
      );
    } else {
      // Try to find an existing test customer from our DB
      console.log("1. Looking for existing Stripe customer in database...");
      const payer = await db.user.findFirst({
        where: { stripeCustomerId: { not: null } },
        select: { id: true, stripeCustomerId: true, primaryEmailAddress: true },
      });

      if (payer?.stripeCustomerId) {
        testCustomerId = payer.stripeCustomerId;
        console.log(
          `   Found existing payer: ${payer.primaryEmailAddress} (${testCustomerId})\n`,
        );
      } else {
        // Create a test customer
        console.log("   No existing payer found. Creating test customer...");
        const customer = await stripe.customers.create({
          email: "test-credit@engagekit.io",
          name: "Test Credit User",
          metadata: { purpose: "stripe-credit-test" },
        });
        testCustomerId = customer.id;
        createdTestCustomer = true;
        console.log(`   Created test customer: ${testCustomerId}\n`);
      }
    }

    // ── Step 2: Check initial balance ─────────────────────────────────
    console.log("2. Checking initial customer balance...");
    const customerBefore = (await stripe.customers.retrieve(
      testCustomerId,
    )) as Stripe.Customer;
    const balanceBefore = customerBefore.balance; // in cents, negative = credit
    console.log(
      `   Current balance: ${balanceBefore}c ($${(balanceBefore / 100).toFixed(2)})`,
    );
    console.log(
      `   (Negative balance = credit owed TO customer)\n`,
    );

    // ── Step 3: Apply a 1-day credit via StripeService ────────────────
    console.log("3. Applying 1-day credit via stripeService.createBalanceCredit()...");
    const credit1Day = CREDIT_PER_DAY_CENTS; // 83 cents
    const txn1 = await stripeService.createBalanceCredit(
      testCustomerId,
      credit1Day,
      "Test: 1 day social referral credit (base reward)",
    );
    console.log(`   Transaction ID: ${txn1.id}`);
    console.log(`   Amount: ${txn1.amount}c (should be -${credit1Day})`);
    console.log(`   Description: ${txn1.description}`);
    assert(
      txn1.amount === -credit1Day,
      `Expected amount -${credit1Day}, got ${txn1.amount}`,
    );
    console.log("   1-day credit applied successfully!\n");

    // ── Step 4: Apply a 3-day credit (max per post) ───────────────────
    console.log("4. Applying 3-day credit (max per post = 3 x 100c = 300c)...");
    const credit3Days = 3 * CREDIT_PER_DAY_CENTS; // 249 cents
    const txn3 = await stripeService.createBalanceCredit(
      testCustomerId,
      credit3Days,
      "Test: 3 days social referral credit (base + likes + comments)",
    );
    console.log(`   Transaction ID: ${txn3.id}`);
    console.log(`   Amount: ${txn3.amount}c (should be -${credit3Days})`);
    assert(
      txn3.amount === -credit3Days,
      `Expected amount -${credit3Days}, got ${txn3.amount}`,
    );
    console.log("   3-day credit applied successfully!\n");

    // ── Step 5: Verify final balance ──────────────────────────────────
    console.log("5. Verifying final customer balance...");
    const customerAfter = (await stripe.customers.retrieve(
      testCustomerId,
    )) as Stripe.Customer;
    const balanceAfter = customerAfter.balance;
    const totalCredited = credit1Day + credit3Days; // 332 cents
    const expectedBalance = balanceBefore - totalCredited;

    console.log(`   Balance before: ${balanceBefore}c`);
    console.log(`   Total credited: ${totalCredited}c ($${(totalCredited / 100).toFixed(2)})`);
    console.log(`   Balance after:  ${balanceAfter}c`);
    console.log(`   Expected after: ${expectedBalance}c`);
    assert(
      balanceAfter === expectedBalance,
      `Expected balance ${expectedBalance}c, got ${balanceAfter}c`,
    );
    console.log("   Balance verified correctly!\n");

    // ── Step 6: List recent balance transactions ──────────────────────
    console.log("6. Listing recent balance transactions...");
    const transactions =
      await stripe.customers.listBalanceTransactions(testCustomerId, {
        limit: 5,
      });
    for (const txn of transactions.data) {
      const date = new Date(txn.created * 1000).toISOString();
      console.log(
        `   ${date} | ${txn.amount}c | ${txn.description ?? "(no description)"}`,
      );
    }

    // ── Step 7: Full-stack test: DB org → payer → Stripe credit ───────
    console.log("\n7. Full-stack test: Find a PREMIUM org and trace the credit path...");
    const premiumOrg = await db.organization.findFirst({
      where: {
        subscriptionTier: "PREMIUM",
        payerId: { not: null },
      },
      select: {
        id: true,
        name: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        payerId: true,
      },
    });

    if (premiumOrg) {
      console.log(`   Found PREMIUM org: ${premiumOrg.name} (${premiumOrg.id})`);
      console.log(`   Payer ID: ${premiumOrg.payerId}`);

      const payer = await db.user.findUnique({
        where: { id: premiumOrg.payerId! },
        select: { stripeCustomerId: true, primaryEmailAddress: true },
      });

      if (payer?.stripeCustomerId) {
        console.log(
          `   Payer Stripe Customer: ${payer.stripeCustomerId} (${payer.primaryEmailAddress})`,
        );
        console.log(
          "   Full credit path verified: org → payer → stripeCustomerId",
        );
      } else {
        console.log(
          "   WARNING: Payer has no stripeCustomerId. Credits would fail for this org.",
        );
      }
    } else {
      console.log("   No PREMIUM org found in DB (expected in test environment)");
    }

    // ── Summary ──────────────────────────────────────────────────────
    console.log("\n========================================");
    console.log("Summary:");
    console.log(`   Stripe customer: ${testCustomerId}`);
    console.log(`   1-day credit: ${credit1Day}c ($${(credit1Day / 100).toFixed(2)})`);
    console.log(`   3-day credit: ${credit3Days}c ($${(credit3Days / 100).toFixed(2)})`);
    console.log(`   Total credited: ${totalCredited}c ($${(totalCredited / 100).toFixed(2)})`);
    console.log(`   Final balance: ${balanceAfter}c ($${(balanceAfter / 100).toFixed(2)})`);
    console.log("========================================\n");

    // ── Step 8: Cleanup — reverse the test credits ────────────────────
    console.log("8. Cleaning up test credits (reversing balance)...");
    await stripe.customers.createBalanceTransaction(testCustomerId, {
      amount: totalCredited, // positive = debit (reverses the credits)
      currency: "usd",
      description: "Test cleanup: reversing test credits",
    });

    const customerFinal = (await stripe.customers.retrieve(
      testCustomerId,
    )) as Stripe.Customer;
    console.log(
      `   Balance after cleanup: ${customerFinal.balance}c (should be ${balanceBefore}c)`,
    );
    assert(
      customerFinal.balance === balanceBefore,
      `Expected ${balanceBefore}c after cleanup, got ${customerFinal.balance}c`,
    );
    console.log("   Cleanup complete!\n");

    // Delete test customer if we created it
    if (createdTestCustomer) {
      console.log("9. Deleting test customer...");
      await stripe.customers.del(testCustomerId);
      console.log("   Test customer deleted\n");
    }

    console.log("All Stripe credit tests passed!");
  } catch (error) {
    console.error("\nTest failed:");
    console.error(error);

    // Attempt cleanup
    if (createdTestCustomer && testCustomerId) {
      try {
        console.log("\nCleaning up test customer...");
        await stripe.customers.del(testCustomerId);
        console.log("Test customer deleted");
      } catch (cleanupError) {
        console.error("Failed to cleanup test customer:", cleanupError);
      }
    }

    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

void testStripeCredit();
