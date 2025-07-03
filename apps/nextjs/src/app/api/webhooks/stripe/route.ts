// apps/nextjs/src/app/api/webhooks/stripe/route.ts
import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";

import type { WebhookResult } from "@sassy/stripe";
import { db } from "@sassy/db";
import { StripeService } from "@sassy/stripe";
import { STRIPE_ID_TO_ACCESS_TYPE } from "@sassy/stripe/schema-validators";

import { env } from "~/env";
import { metadata } from "../../../layout";

/**
 * Stripe webhook handler
 * This receives events from Stripe when subscription status changes
 * It updates Clerk metadata with subscription status
 */

console.log("Stripe webhook route loaded");
export async function POST(req: Request) {
  try {
    console.log("Stripe webhook received");
    // Create Stripe service
    const stripeService = new StripeService({
      secretKey: process.env.STRIPE_SECRET_KEY || "",
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    });

    // Get raw request body
    const body = await req.text();

    // Get Stripe signature from headers
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new NextResponse("Missing stripe signature", { status: 400 });
    }

    // Process the webhook event sent from Stripe
    const result = await stripeService.handleWebhookEvent(
      signature,
      Buffer.from(body),
    );

    // Update User table based on Stripe events
    if (result.event) {
      const eventType = result.event.type;
      let accessType = "FREE";
      let stripeCustomerId = undefined;
      let stripeUserProperties = {};
      let updateFields: any = {};

      // Type-narrow the subscription object
      const subscription = result.event.data.object as Stripe.Subscription;
      const priceId = subscription.items?.data?.[0]?.price?.id;
      const productId = subscription.items?.data?.[0]?.price?.product;
      stripeCustomerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : undefined;
      // Fetch Stripe customer to get clerkUserId
      let clerkUserId: string | undefined = undefined;
      if (stripeCustomerId && typeof stripeCustomerId === "string") {
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
            apiVersion: "2023-08-16",
          });
          const customerRaw = await stripe.customers.retrieve(stripeCustomerId);
          const customer = customerRaw as Stripe.Customer;
          if (customer?.metadata?.clerkUserId) {
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
        updateFields = {
          accessType,
          stripeCustomerId,
          stripeUserProperties,
        };
      } else if (
        eventType === "customer.subscription.deleted" ||
        eventType === "customer.subscription.paused"
      ) {
        updateFields = {
          accessType: "FREE",
        };
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
    }

    console.log("Stripe webhook processed");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return new NextResponse(
      "Webhook error: " +
        (error instanceof Error ? error.message : "Unknown error"),
      { status: 400 },
    );
  }
}

// Ensure this route is always dynamically evaluated
export const dynamic = "force-dynamic";
