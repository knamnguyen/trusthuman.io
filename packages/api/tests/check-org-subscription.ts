/**
 * Check org subscription details and match to Stripe
 */
import { config } from "dotenv";
import Stripe from "stripe";

import { db } from "@sassy/db";

config({ path: ".env" });

async function main() {
  console.log("=== Checking Org Subscription Details ===\n");

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-08-16" });

  // Get the main org
  const org = await db.organization.findFirst({
    where: { name: "engagekit" },
    include: {
      payer: {
        select: { id: true, primaryEmailAddress: true, stripeCustomerId: true },
      },
    },
  });

  if (!org) {
    console.log("❌ No 'engagekit' org found");
    await db.$disconnect();
    return;
  }

  console.log("Organization:");
  console.log(`  Name: ${org.name}`);
  console.log(`  Tier: ${org.subscriptionTier}`);
  console.log(`  Stripe Subscription ID: ${org.stripeSubscriptionId}`);
  console.log(`  Subscription Expires: ${org.subscriptionExpiresAt}`);
  console.log(`  Earned Premium Expires: ${org.earnedPremiumExpiresAt}`);
  console.log(`  Payer ID: ${org.payerId}`);
  console.log(`  Purchased Slots: ${org.purchasedSlots}`);

  if (org.payer) {
    console.log("\nPayer:");
    console.log(`  Email: ${org.payer.primaryEmailAddress}`);
    console.log(`  Stripe Customer ID: ${org.payer.stripeCustomerId}`);
  }

  // Check the subscription in Stripe if it exists
  if (org.stripeSubscriptionId) {
    console.log("\n=== Checking Stripe Subscription ===");
    try {
      const subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
      console.log(`  Status: ${subscription.status}`);
      console.log(`  Customer: ${typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id}`);
      console.log(`  Current period end: ${new Date(subscription.current_period_end * 1000).toISOString()}`);
    } catch (err) {
      console.log(`  ❌ Subscription not found: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    console.log("\nNo stripeSubscriptionId - checking if this was cancelled...");

    // The org is FREE tier but has subscriptionExpiresAt - this means it was cancelled
    if (org.subscriptionTier === "FREE" && org.subscriptionExpiresAt) {
      console.log(`  → Org was likely cancelled. subscriptionExpiresAt remains from previous subscription.`);
      console.log(`  → For a clean FREE org, subscriptionExpiresAt should be null`);
    }
  }

  // List all orgs with PREMIUM tier
  console.log("\n=== All Premium Orgs ===");
  const premiumOrgs = await db.organization.findMany({
    where: { subscriptionTier: "PREMIUM" },
    include: {
      payer: {
        select: { primaryEmailAddress: true, stripeCustomerId: true },
      },
    },
  });

  console.log(`Found ${premiumOrgs.length} premium org(s)`);
  for (const o of premiumOrgs) {
    console.log(`  - ${o.name}: subId=${o.stripeSubscriptionId}, payer=${o.payer?.primaryEmailAddress} (${o.payer?.stripeCustomerId})`);
  }

  // List all active subscriptions and their orgs
  console.log("\n=== Active Stripe Subscriptions ===");
  const subscriptions = await stripe.subscriptions.list({
    status: "active",
    limit: 10,
  });

  for (const sub of subscriptions.data) {
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
    console.log(`\nSubscription: ${sub.id}`);
    console.log(`  Customer: ${customerId}`);
    console.log(`  Status: ${sub.status}`);

    // Find org with this subscription
    const orgWithSub = await db.organization.findFirst({
      where: { stripeSubscriptionId: sub.id },
    });

    if (orgWithSub) {
      console.log(`  → Org: ${orgWithSub.name} (${orgWithSub.id})`);
    } else {
      console.log(`  → No org found with this subscription ID`);

      // Try to find by customer metadata
      try {
        const customer = (await stripe.customers.retrieve(customerId!)) as Stripe.Customer;
        console.log(`  → Customer email: ${customer.email}`);
        console.log(`  → Customer metadata: ${JSON.stringify(customer.metadata)}`);
      } catch {}
    }
  }

  await db.$disconnect();
}

main().catch(console.error);
