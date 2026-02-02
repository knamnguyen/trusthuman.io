// packages/api/src/router/stripe.ts
import { TRPCError } from "@trpc/server";

import { StripeService } from "@sassy/stripe";
import { createCustomerPortalSchema } from "@sassy/stripe/schema-validators";

import { createTRPCRouter, protectedProcedure } from "../trpc";

/**
 * Create a Stripe service instance
 * This is used by all the tRPC procedures
 */
const stripeService = new StripeService({
  secretKey: process.env.STRIPE_SECRET_KEY ?? "",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
});

export const stripeRouter = () =>
  createTRPCRouter({
    /**
     * Create a customer portal session for subscription management
     * @deprecated Use organization.subscription.portal() instead for org-centric billing
     * Kept for backwards compatibility with chrome extension
     */
    createCustomerPortal: protectedProcedure
      .input(createCustomerPortalSchema)
      .mutation(async ({ ctx, input }) => {
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
  });

// Prevent type leakage issues across your entire Turborepo while maintaining proper type checking during development
