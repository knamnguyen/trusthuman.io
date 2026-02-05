/**
 * Check if customer is deleted
 */
import { config } from "dotenv";
import Stripe from "stripe";

import { db } from "@sassy/db";

config({ path: ".env" });

async function main() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-08-16" });

  const user = await db.user.findFirst({
    where: { stripeCustomerId: { not: null } },
    select: { stripeCustomerId: true, primaryEmailAddress: true },
  });

  if (!user?.stripeCustomerId) {
    console.log("No user with stripeCustomerId");
    await db.$disconnect();
    return;
  }

  console.log(`Checking customer: ${user.stripeCustomerId}`);

  try {
    const customer = await stripe.customers.retrieve(user.stripeCustomerId);
    console.log("Customer object:", JSON.stringify(customer, null, 2));

    if ("deleted" in customer && customer.deleted === true) {
      console.log("\n⚠️  Customer is DELETED!");
    } else {
      console.log("\n✅ Customer is active");
    }
  } catch (err) {
    console.log("Error:", err instanceof Error ? err.message : String(err));
  }

  // Also try to list recent customers to see what's actually in the Stripe account
  console.log("\n=== Recent Customers ===");
  const customers = await stripe.customers.list({ limit: 10 });
  for (const c of customers.data) {
    console.log(`- ${c.id}: ${c.email} (balance: ${c.balance}c)`);
  }

  await db.$disconnect();
}

main().catch(console.error);
