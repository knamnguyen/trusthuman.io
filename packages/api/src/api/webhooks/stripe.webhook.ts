// packages/api/src/api/webhooks/stripe.webhook.ts
import type Stripe from "stripe";
import { Hono } from "hono";

import { db } from "@sassy/db";
import { StripeService } from "@sassy/stripe";

import {
  convertOrgSubscriptionToFree,
  convertOrgSubscriptionToPremium,
  handleCheckoutSessionSuccess,
} from "../../router/organization";
import { env } from "../../utils/env";

/**
 * Stripe webhook handler
 * Handles both legacy user-centric and new org-centric subscription events
 */

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

    const result = stripeService.parseWebhookEvent(
      signature,
      Buffer.from(body),
    );

    if (!result.valid) {
      return c.text("No event to process");
    }

    const { type: eventType, data } = result.event;

    switch (eventType) {
      case "checkout.session.completed": {
        const session = data.object;

        await handleCheckoutSessionSuccess(db, session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = data.object;
        const orgId = subscription.metadata.organizationId;
        const payerId = subscription.metadata.payerId;

        // Validate required metadata
        if (orgId === undefined || payerId === undefined) {
          console.error(
            `${eventType}: Missing organizationId or payerId in metadata, skipping`,
          );
          break;
        }

        // Extract subscription details
        const slots = getPurchasedSlots(subscription);
        // HACK: stripe's library types are fucked we need to find current_period_end from subscription items in some cases
        const currentPeriodEnd =
          (subscription.current_period_end as number | undefined) ??
          ((
            subscription.items.data[0] as unknown as
              | { current_period_end: number }
              | undefined
          )?.current_period_end as number | undefined);

        if (currentPeriodEnd === undefined) {
          console.error(
            `${eventType}: Missing current_period_end, skipping`,
          );
          break;
        }

        const newExpiresAt = new Date(currentPeriodEnd * 1000);

        // Check current org state for idempotency
        const org = await db.organization.findUnique({
          where: { id: orgId },
          select: {
            stripeSubscriptionId: true,
            purchasedSlots: true,
          },
        });

        // Idempotency: Skip if subscription ID doesn't match (prevents processing wrong subscription)
        if (org?.stripeSubscriptionId && org.stripeSubscriptionId !== subscription.id) {
          console.log(
            `${eventType}: Subscription ID mismatch (expected ${org.stripeSubscriptionId}, got ${subscription.id}), skipping`,
          );
          break;
        }

        // Update DB to match Stripe state
        // Note: Stripe Customer Portal handles all proration/credits automatically with these settings:
        // - "Prorate charges and credits" (credits unused time, charges new price)
        // - "Update immediately" for all changes (no deferrals)
        // - Credits applied to customer balance (used for future invoices, not refunded)
        await convertOrgSubscriptionToPremium(db, {
          orgId,
          payerId,
          purchasedSlots: slots,
          stripeSubscriptionId: subscription.id,
          subscriptionExpiresAt: newExpiresAt,
        });

        const changeDesc = org?.purchasedSlots
          ? `${org.purchasedSlots}→${slots} slots`
          : `${slots} slots`;
        console.log(
          `✅ ${eventType}: Org ${orgId} updated to ${changeDesc} until ${newExpiresAt.toISOString()}`,
        );
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

        // HACK: same as customer.subscription.updated (lines 70-85)
        const currentPeriodEnd =
          (subscription.current_period_end as number | undefined) ??
          ((
            subscription.items.data[0] as unknown as
              | { current_period_end: number }
              | undefined
          )?.current_period_end as number | undefined);

        if (currentPeriodEnd === undefined) {
          console.error(
            `${eventType}: Missing current_period_end, skipping`,
          );
          break;
        }

        const endDate = new Date(currentPeriodEnd * 1000);

        await convertOrgSubscriptionToFree(db, { orgId, expiresAt: endDate });

        console.log(`✅ ${eventType}: Org ${orgId} reset to free tier`);
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
