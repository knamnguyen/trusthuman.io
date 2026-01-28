// packages/api/src/api/webhooks/stripe.webhook.ts
import { Hono } from "hono";
import Stripe from "stripe";

import type { AccessType, Prisma } from "@sassy/db";
import { db } from "@sassy/db";
import { StripeService } from "@sassy/stripe";
import { STRIPE_ID_TO_ACCESS_TYPE } from "@sassy/stripe/schema-validators";

import {
  convertOrgSubscriptionToFree,
  convertOrgSubscriptionToPremium,
} from "../../router/organization";
import { env } from "../../utils/env";

/**
 * Stripe webhook handler
 * Handles both legacy user-centric and new org-centric subscription events
 */

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});

const stripeService = new StripeService({
  secretKey: env.STRIPE_SECRET_KEY,
  webhookSecret: env.STRIPE_WEBHOOK_SECRET,
});

export const stripeWebhookRoutes = new Hono().post("/", async (c) => {
  try {
    console.log("Stripe webhook received");

    const body = await c.req.text();
    const signature = c.req.header("stripe-signature");

    if (!signature) {
      return c.text("Missing stripe signature", { status: 400 });
    }

    const result = await stripeService.handleWebhookEvent(
      signature,
      Buffer.from(body),
    );

    if (!result.event) {
      return c.text("No event to process");
    }

    const { type: eventType, data } = result.event;

    switch (eventType) {
      case "checkout.session.completed": {
        const session = data.object;
        const orgId = session.metadata?.organizationId;
        const payerId = session.metadata?.payerId;

        if (!orgId || !payerId || !session.subscription) {
          console.log(
            "checkout.session.completed: Missing org metadata or subscription, skipping",
          );
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        );

        // Idempotency check
        const existing = await db.organization.findUnique({
          where: { id: orgId },
          select: { stripeSubscriptionId: true },
        });

        if (existing?.stripeSubscriptionId === subscription.id) {
          console.log(
            "checkout.session.completed: Already processed, skipping",
          );
          break;
        }

        // Verify payer is still in org (race condition check)
        const membership = await db.organizationMember.findUnique({
          where: { orgId_userId: { orgId, userId: payerId } },
        });

        if (!membership) {
          console.error(
            `checkout.session.completed: User ${payerId} left org ${orgId}`,
          );
          await stripe.subscriptions.cancel(subscription.id);

          // Attempt refund
          if (subscription.latest_invoice) {
            try {
              const invoice = await stripe.invoices.retrieve(
                subscription.latest_invoice as string,
              );
              if (invoice.payment_intent) {
                await stripe.refunds.create({
                  payment_intent: invoice.payment_intent as string,
                  reason: "requested_by_customer",
                });
              }
            } catch (e) {
              console.error("checkout.session.completed: Refund failed", e);
            }
          }
          break;
        }

        const quantity = getPurchasedSlots(subscription);

        await convertOrgSubscriptionToPremium(db, {
          orgId,
          payerId,
          purchasedSlots: quantity,
          stripeSubscriptionId: subscription.id,
          subscriptionExpiresAt: new Date(
            subscription.current_period_end * 1000,
          ),
        });

        console.log(
          `✅ checkout.session.completed: Org ${orgId} subscribed with ${quantity} slots`,
        );
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = data.object;
        const orgId = subscription.metadata.organizationId;
        const payerId = subscription.metadata.payerId;

        if (orgId === undefined || payerId === undefined) {
          console.error(
            `${eventType}: Missing organizationId or payerId in metadata, skipping`,
          );
          break;
        }

        // Org-centric: update organization
        const slots = getPurchasedSlots(subscription);
        const expiresAt = new Date(subscription.current_period_end * 1000);

        await convertOrgSubscriptionToPremium(db, {
          orgId,
          payerId,
          purchasedSlots: slots,
          stripeSubscriptionId: subscription.id,
          subscriptionExpiresAt: expiresAt,
        });

        console.log(`✅ ${eventType}: Org ${orgId} updated to ${slots} slots`);

        // Legacy user-centric: update user
        await handleLegacySubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.paused": {
        const subscription = data.object;
        const orgId = subscription.metadata.organizationId;

        if (orgId === undefined) {
          console.error(
            `${eventType}: Missing organizationId in metadata, skipping`,
          );
          break;
        }

        const org = await db.organization.findUnique({
          where: { id: orgId },
          select: { stripeSubscriptionId: true },
        });

        if (org?.stripeSubscriptionId !== subscription.id) {
          console.log(`${eventType}: Subscription ID mismatch, skipping`);
          break;
        }

        const endDate = new Date(subscription.current_period_end * 1000);

        await convertOrgSubscriptionToFree(db, { orgId, expiresAt: endDate });

        console.log(`✅ ${eventType}: Org ${orgId} reset to free tier`);

        // Legacy user-centric: reset user to FREE
        await handleLegacySubscriptionDelete(subscription);
        break;
      }

      case "customer.deleted": {
        const customer = data.object;
        await db.user.updateMany({
          where: { stripeCustomerId: customer.id },
          data: { stripeCustomerId: null },
        });
        console.log(
          `✅ customer.deleted: Cleared stripeCustomerId ${customer.id}`,
        );
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    console.log("Stripe webhook processed");
    return c.json({ success: true });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return c.text(
      "Webhook error: " +
        (error instanceof Error ? error.message : "Unknown error"),
      { status: 500 }, // 500 so Stripe retries
    );
  }
});

function getPurchasedSlots(subscription: Stripe.Subscription): number {
  return Math.max(1, subscription.items.data[0]?.quantity ?? 1);
}

// ============================================================================
// LEGACY USER-CENTRIC HANDLERS (to be deprecated)
// ============================================================================

async function handleLegacySubscriptionUpdate(
  subscription: Stripe.Subscription,
) {
  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : undefined;

  if (!stripeCustomerId) return;

  let clerkUserId: string | undefined;
  try {
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    if ("metadata" in customer && customer.metadata.clerkUserId) {
      clerkUserId = customer.metadata.clerkUserId;
    }
  } catch (e) {
    console.error("Error fetching Stripe customer:", e);
    return;
  }

  if (!clerkUserId) return;

  const priceId = subscription.items.data[0]?.price.id;
  const productId = subscription.items.data[0]?.price.product;

  let accessType: AccessType = "FREE";
  if (priceId && STRIPE_ID_TO_ACCESS_TYPE[priceId]) {
    accessType = STRIPE_ID_TO_ACCESS_TYPE[priceId];
  } else if (
    typeof productId === "string" &&
    STRIPE_ID_TO_ACCESS_TYPE[productId]
  ) {
    accessType = STRIPE_ID_TO_ACCESS_TYPE[productId];
  }

  const updateFields: Prisma.UserUpdateInput = {
    accessType,
    stripeCustomerId,
    stripeUserProperties: subscription as unknown as Prisma.InputJsonValue,
  };

  await db.user.updateMany({
    where: { id: clerkUserId },
    data: updateFields,
  });
}

async function handleLegacySubscriptionDelete(
  subscription: Stripe.Subscription,
) {
  const stripeCustomerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : undefined;

  if (!stripeCustomerId) return;

  let clerkUserId: string | undefined;
  try {
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    if ("metadata" in customer && customer.metadata.clerkUserId) {
      clerkUserId = customer.metadata.clerkUserId;
    }
  } catch (e) {
    console.error("Error fetching Stripe customer:", e);
    return;
  }

  if (!clerkUserId) return;

  await db.user.updateMany({
    where: { id: clerkUserId },
    data: { accessType: "FREE" },
  });
}
