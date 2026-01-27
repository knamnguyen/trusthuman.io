// packages/api/src/router/stripe.ts
import { TRPCError } from "@trpc/server";

import { StripeService } from "@sassy/stripe";
import {
  createCheckoutSchema,
  createCustomerPortalSchema,
  createQuantityCheckoutSchema,
} from "@sassy/stripe/schema-validators";

import type { TRPCContext } from "../trpc";
import { createTRPCRouter, protectedProcedure } from "../trpc";

/**
 * Create a Stripe service instance
 * This is used by all the tRPC procedures
 */
const stripeService = new StripeService({
  secretKey: process.env.STRIPE_SECRET_KEY ?? "",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
});

/**
 * Utility function for checking access type
 */
const checkAccessType = async (ctx: TRPCContext) => {
  const user = await ctx.db.user.findUnique({
    where: { id: ctx.user?.id },
  });
  const access = user?.accessType;
  return access;
};

export const stripeRouter = () =>
  createTRPCRouter({
    /**
     * Create a checkout session for subscription or one-time payment
     *
     * @param purchaseType - Type of purchase (MONTHLY, YEARLY, LIFETIME)
     * @returns URL to redirect to Stripe checkout
     */
    createCheckout: protectedProcedure
      .input(createCheckoutSchema)
      .mutation(async ({ ctx, input }) => {
        //if user already has lifetime subscription, don't allow config or checkout
        const access = await checkAccessType(ctx);
        if (access === "MONTHLY" || access === "WEEKLY" || access === "YEARLY")
          throw new Error(
            "User already has a subscription, click manage subscription to change plan",
          );

        const userId = ctx.user.id;

        // Create checkout session with Stripe
        const checkoutUrl = await stripeService.createCheckoutSession(
          userId, // Clerk user ID
          input.purchaseType,
          ctx.user.primaryEmailAddress,
        );
        return checkoutUrl;
      }),

    /**
     * Create a customer portal session for subscription management
     *
     * @returns URL to redirect to Stripe customer portal
     */
    createCustomerPortal: protectedProcedure
      .input(createCustomerPortalSchema)
      .mutation(async ({ ctx, input }) => {
        //if user already has lifetime subscription, don't allow config or checkout
        const userId = ctx.user.id;

        // Get origin for redirect URL if not provided
        const origin = process.env.NEXTJS_URL ?? "http://localhost:3000";
        const returnUrl = input.returnUrl ?? `${origin}/subscription`;

        // Create customer portal session with Stripe
        const result = await stripeService.createCustomerPortalSession(
          userId, // Clerk user ID
          returnUrl,
        );

        if (!result.url) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create customer portal session",
          });
        }

        return result;
      }),

    checkAccess: protectedProcedure.query(async ({ ctx }) => {
      const access = await checkAccessType(ctx);

      if (access === "FREE") return { hasAccess: false, accessType: "FREE" };
      return { hasAccess: true, accessType: access };
    }),

    // ============================================================================
    // QUANTITY PRICING ENDPOINTS (Multi-Account)
    // ============================================================================

    /**
     * Create a checkout session for quantity-based (multi-account) pricing
     *
     * @param numSlots - Number of LinkedIn account slots (1-24)
     * @param billingCycle - "MONTHLY" or "YEARLY"
     * @returns URL to redirect to Stripe checkout + pricing breakdown
     */
    createCheckoutQuantity: protectedProcedure
      .input(createQuantityCheckoutSchema)
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.user.id;

        const result = await stripeService.createCheckoutSessionQuantity(
          userId,
          input.numSlots,
          input.billingCycle,
          ctx.user.primaryEmailAddress,
        );

        if (!result.url) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create checkout session",
          });
        }

        return result;
      }),

    /**
     * Get current quantity-based subscription details
     *
     * @returns Subscription details including slot count, billing cycle, and pricing
     */
    getSubscriptionQuantity: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      return stripeService.getSubscriptionDetailsQuantity(userId);
    }),

    /**
     * Get pricing preview for a given slot count (no API call, instant response)
     *
     * @param numSlots - Number of slots to price
     * @param billingCycle - "MONTHLY" or "YEARLY"
     * @returns Pricing breakdown with per-slot price, total, and savings
     */
    getPricingPreview: protectedProcedure
      .input(createQuantityCheckoutSchema)
      .query(({ input }) => {
        return stripeService.getPricingPreviewQuantity(
          input.numSlots,
          input.billingCycle,
        );
      }),
  });

// Prevent type leakage issues across your entire Turborepo while maintaining proper type checking during development
