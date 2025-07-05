// packages/api/src/router/stripe.ts
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { StripeService } from "@sassy/stripe";
import {
  createCheckoutSchema,
  createCustomerPortalSchema,
} from "@sassy/stripe/schema-validators";

import type { TRPCContext } from "../trpc";
import { protectedProcedure } from "../trpc";

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

export const stripeRouter = {
  /**
   * Create a checkout session for subscription or one-time payment
   *
   * @param purchaseType - Type of purchase (MONTHLY, YEARLY, LIFETIME)
   * @returns URL to redirect to Stripe checkout
   */
  createCheckout: protectedProcedure
    .input(createCheckoutSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new Error("User not authenticated");
      //if user already has lifetime subscription, don't allow config or checkout
      const access = await checkAccessType(ctx);
      if (access === "MONTHLY" || access === "WEEKLY" || access === "YEARLY")
        throw new Error(
          "User already has a subscription, click manage subscription to change plan",
        );

      const userId = ctx.user.id;
      const email = ctx.user.emailAddresses[0]?.emailAddress;

      // Create checkout session with Stripe
      const checkoutUrl = await stripeService.createCheckoutSession(
        userId, // Clerk user ID
        input.purchaseType,
        email,
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
      if (!ctx.user) throw new Error("User not authenticated");
      //if user already has lifetime subscription, don't allow config or checkout
      const access = await checkAccessType(ctx);
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
    if (!ctx.user) throw new Error("User not authenticated");
    const access = await checkAccessType(ctx);

    if (access === "FREE") return { hasAccess: false, accessType: "FREE" };
    return { hasAccess: true, accessType: access };
  }),
} satisfies TRPCRouterRecord;

//prevent type leakage issues across your entire Turborepo while maintaining proper type checking during development
