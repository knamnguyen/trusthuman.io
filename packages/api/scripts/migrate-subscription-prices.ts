import Stripe from "stripe";

import { db } from "@sassy/db";

import { env } from "../src/utils/env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});

async function findActiveOrg() {
  const activeSubscriptions = await db.organization.findMany({
    where: {
      stripeSubscriptionId: {
        not: null,
      },
    },
  });

  return activeSubscriptions;
}

async function migrateNewPrice() {
  for (const org of await findActiveOrg()) {
    try {
      const stripeSubscriptionId = org.stripeSubscriptionId!;

      await stripe.subscriptions.update(stripeSubscriptionId, {
        items: [
          {
            price: "price_1Su7SmIeOImcBhu6xW4lQkvj",
            quantity: 1,
          },
        ],
        proration_behavior: "none",
      });
    } catch (err) {
      console.error(err);
    }
  }
}

await migrateNewPrice();
