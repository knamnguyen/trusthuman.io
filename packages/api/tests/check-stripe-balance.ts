/**
 * Check Stripe customer balance
 */
import { config } from "dotenv";
import Stripe from "stripe";

import { db } from "@sassy/db";

config({ path: ".env" });

async function main() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-08-16" });

  // Get payer's Stripe customer ID
  const org = await db.organization.findFirst({
    where: { name: "engagekit" },
    include: {
      payer: { select: { stripeCustomerId: true, primaryEmailAddress: true } },
    },
  });

  if (!org?.payer?.stripeCustomerId) {
    console.log("No payer with Stripe customer ID found");
    await db.$disconnect();
    return;
  }

  console.log(`Customer: ${org.payer.stripeCustomerId}`);
  console.log(`Email: ${org.payer.primaryEmailAddress}`);

  const customer = (await stripe.customers.retrieve(
    org.payer.stripeCustomerId,
  )) as Stripe.Customer;

  console.log(`\nCurrent balance: ${customer.balance}c ($${(customer.balance / 100).toFixed(2)})`);
  console.log(`(Negative balance = credit, reduces next invoice)`);

  // List recent balance transactions
  const transactions = await stripe.customers.listBalanceTransactions(
    org.payer.stripeCustomerId,
    { limit: 5 },
  );

  if (transactions.data.length > 0) {
    console.log("\nRecent balance transactions:");
    for (const t of transactions.data) {
      const date = new Date(t.created * 1000).toLocaleString();
      console.log(`  ${date}: ${t.amount}c - ${t.description || "No description"}`);
    }
  } else {
    console.log("\nNo balance transactions yet");
  }

  await db.$disconnect();
}

main().catch(console.error);
