/**
 * Check if Stripe customer exists and what's the actual customer ID
 */
import { config } from "dotenv";
import Stripe from "stripe";

import { db } from "@sassy/db";

config({ path: ".env" });

async function main() {
  console.log("=== Checking Stripe Customer ===\n");

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.log("❌ STRIPE_SECRET_KEY not found in .env");
    return;
  }

  console.log(`Stripe key type: ${stripeSecretKey.startsWith("sk_test_") ? "TEST" : stripeSecretKey.startsWith("sk_live_") ? "LIVE" : "UNKNOWN"}`);

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-08-16" });

  // Get user's stored customer ID from DB
  const user = await db.user.findFirst({
    where: { stripeCustomerId: { not: null } },
    select: { id: true, primaryEmailAddress: true, stripeCustomerId: true },
  });

  if (!user) {
    console.log("❌ No user with stripeCustomerId in DB");
    await db.$disconnect();
    return;
  }

  console.log(`\nDB User: ${user.primaryEmailAddress}`);
  console.log(`DB stripeCustomerId: ${user.stripeCustomerId}`);

  // Try to fetch the customer from Stripe
  try {
    const customer = await stripe.customers.retrieve(user.stripeCustomerId!);
    console.log(`\n✅ Customer exists in Stripe:`);
    console.log(`  ID: ${customer.id}`);
    console.log(`  Email: ${"email" in customer ? customer.email : "N/A"}`);
    console.log(`  Balance: ${"balance" in customer ? customer.balance : "N/A"}c`);
  } catch (err) {
    console.log(`\n❌ Customer NOT found in Stripe: ${user.stripeCustomerId}`);
    console.log(`  Error: ${err instanceof Error ? err.message : String(err)}`);

    // Try to find the customer by email
    console.log(`\nSearching for customer by email: ${user.primaryEmailAddress}...`);
    const customers = await stripe.customers.list({
      email: user.primaryEmailAddress ?? undefined,
      limit: 5,
    });

    if (customers.data.length > 0) {
      console.log(`Found ${customers.data.length} customer(s):`);
      for (const c of customers.data) {
        console.log(`  - ${c.id}: ${c.email}, balance=${c.balance}c`);
      }

      const correctId = customers.data[0]?.id;
      if (correctId && correctId !== user.stripeCustomerId) {
        console.log(`\n⚠️  Consider updating DB user with correct stripeCustomerId: ${correctId}`);

        // Uncomment to auto-fix:
        // await db.user.update({
        //   where: { id: user.id },
        //   data: { stripeCustomerId: correctId },
        // });
        // console.log(`✅ Updated user's stripeCustomerId to ${correctId}`);
      }
    } else {
      console.log("No customers found with that email in Stripe");
    }
  }

  // Also check for active subscriptions
  console.log("\n=== Checking Active Subscriptions ===");
  const subscriptions = await stripe.subscriptions.list({
    status: "active",
    limit: 10,
  });

  console.log(`Found ${subscriptions.data.length} active subscription(s)`);
  for (const sub of subscriptions.data) {
    const customer =
      typeof sub.customer === "string"
        ? sub.customer
        : sub.customer?.id ?? "unknown";
    console.log(`  - ${sub.id}: customer=${customer}, status=${sub.status}`);
  }

  await db.$disconnect();
}

main().catch(console.error);
