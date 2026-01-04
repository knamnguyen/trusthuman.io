// apps/nextjs/src/app/api/webhooks/stripe/route.ts
import { Hono } from "hono";
import Stripe from "stripe";

import type { AccessType, Prisma } from "@sassy/db";
import { db } from "@sassy/db";
import { StripeService } from "@sassy/stripe";
import { STRIPE_ID_TO_ACCESS_TYPE } from "@sassy/stripe/schema-validators";

import { env } from "../../utils/env";

/**
 * Stripe webhook handler
 * This receives events from Stripe when subscription status changes
 * It updates Clerk metadata with subscription status
 */

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});

export const stripeWebhookRoutes = new Hono().post("/", async (c) => {
  try {
    console.log("Stripe webhook received");
    // Create Stripe service
    const stripeService = new StripeService({
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
    });

    // Get raw request body
    const body = await c.req.text();

    // Get Stripe signature from headers
    const signature = c.req.header("stripe-signature");

    if (signature === undefined) {
      return c.text("Missing stripe signature", { status: 400 });
    }

    // Process the webhook event sent from Stripe
    const result = await stripeService.handleWebhookEvent(
      signature,
      Buffer.from(body),
    );

    if (result.event === undefined) {
      return c.text("No event to process");
    }

    // Update User table based on Stripe events
    const eventType = result.event.type;
    let accessType = "FREE";
    let stripeCustomerId = undefined;
    let stripeUserProperties = {};
    const updateFields: Prisma.UserUpdateInput = {};

    // Type-narrow the subscription object
    const subscription = result.event.data.object as Stripe.Subscription;
    const priceId = subscription.items.data[0]?.price.id;
    const productId = subscription.items.data[0]?.price.product;
    stripeCustomerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : undefined;
    // Fetch Stripe customer to get clerkUserId
    let clerkUserId: string | undefined = undefined;
    if (stripeCustomerId && typeof stripeCustomerId === "string") {
      try {
        const customerRaw = await stripe.customers.retrieve(stripeCustomerId);
        const customer = customerRaw as Stripe.Customer;
        if (customer.metadata.clerkUserId) {
          clerkUserId = customer.metadata.clerkUserId;
        }
      } catch (e) {
        console.error("Error fetching Stripe customer for webhook:", e);
      }
    }

    let mappedAccessType = "FREE";
    if (
      priceId &&
      typeof priceId === "string" &&
      STRIPE_ID_TO_ACCESS_TYPE[priceId]
    ) {
      mappedAccessType = STRIPE_ID_TO_ACCESS_TYPE[priceId];
    } else if (
      productId &&
      typeof productId === "string" &&
      STRIPE_ID_TO_ACCESS_TYPE[productId]
    ) {
      mappedAccessType = STRIPE_ID_TO_ACCESS_TYPE[productId];
    }

    if (
      eventType === "customer.subscription.created" ||
      eventType === "customer.subscription.updated"
    ) {
      accessType = mappedAccessType;
      stripeUserProperties = subscription;
      updateFields.accessType = accessType as AccessType;
      updateFields.stripeCustomerId = stripeCustomerId;
      updateFields.stripeUserProperties = stripeUserProperties;
    } else if (
      eventType === "customer.subscription.deleted" ||
      eventType === "customer.subscription.paused"
    ) {
      updateFields.accessType = "FREE";
    }

    // Update the user in the database by clerkUserId
    if (clerkUserId && Object.keys(updateFields).length > 0) {
      const updated = await db.user.updateMany({
        where: { id: clerkUserId },
        data: updateFields,
      });
      if (updated.count === 0) {
        console.warn("No user found for clerkUserId", clerkUserId);
      }
    } else {
      console.warn(
        "No clerkUserId found in Stripe customer metadata or no update fields",
      );
    }

    console.log("Stripe webhook processed");

    return c.json({ success: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return c.text(
      "Webhook error: " +
        (error instanceof Error ? error.message : "Unknown error"),
      { status: 400 },
    );
  }
});
