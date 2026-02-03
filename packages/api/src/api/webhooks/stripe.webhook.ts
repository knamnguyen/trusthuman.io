// packages/api/src/api/webhooks/stripe.webhook.ts
import type Stripe from "stripe";
import { Hono } from "hono";

import { db } from "@sassy/db";
import { StripeService } from "@sassy/stripe";

import {
  applyPendingDowngrade,
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

        if (orgId === undefined || payerId === undefined) {
          console.error(
            `${eventType}: Missing organizationId or payerId in metadata, skipping`,
          );
          break;
        }

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
            "${eventType}: Missing current_period_end, skipping, heres the subscription object",
            subscription,
          );
          break;
        }

        const newExpiresAt = new Date(currentPeriodEnd * 1000);

        const org = await db.organization.findUnique({
          where: { id: orgId },
          select: {
            stripeSubscriptionId: true,
            purchasedSlots: true,
            subscriptionExpiresAt: true,
          },
        });

        if (org?.stripeSubscriptionId !== subscription.id) {
          console.log(`${eventType}: Subscription ID mismatch, skipping`);
          break;
        }

        // Apply downgrade only when new period has started (renewal detected)
        // Compare Stripe's new expiry against DB's old expiry
        const isDowngrade = slots < org.purchasedSlots;
        const periodAdvanced =
          org.subscriptionExpiresAt !== null &&
          newExpiresAt > org.subscriptionExpiresAt; // Changed >= to > for proper period detection

        if (isDowngrade && periodAdvanced) {
          // Period has advanced (renewal) - apply pending downgrade
          await applyPendingDowngrade(db, {
            orgId,
            newPurchasedSlots: slots,
            subscriptionExpiresAt: newExpiresAt,
          });

          console.log(
            `✅ ${eventType}: Org ${orgId} pending downgrade applied: ${slots} slots`,
          );
          break;
        }

        if (isDowngrade && !periodAdvanced) {
          // Mid-period downgrade - defer to renewal
          console.log(
            `⏳ ${eventType}: Org ${orgId} downgrade deferred to renewal: ${org.purchasedSlots} → ${slots} slots`,
          );
          console.log(
            `   Will take effect at: ${newExpiresAt.toISOString()}`,
          );
          break; // Don't update DB yet!
        }

        // Upgrades and renewals without pending downgrade - apply immediately

        await convertOrgSubscriptionToPremium(db, {
          orgId,
          payerId,
          purchasedSlots: slots,
          stripeSubscriptionId: subscription.id,
          subscriptionExpiresAt: newExpiresAt,
        });

        console.log(`✅ ${eventType}: Org ${orgId} updated to ${slots} slots`);
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
