import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { z } from "zod";

import {
  QUANTITY_PRICING_CONFIG,
  STRIPE_QUANTITY_PRICES,
} from "@sassy/stripe/schema-validators";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

// Direct Stripe client for org-centric billing
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2023-08-16",
});

const baseUrl = process.env.NEXTJS_URL;
if (!baseUrl) {
  throw new Error("NEXTJS_URL environment variable is required");
}

/**
 * Subscription sub-router for organization billing
 * Access via: trpc.organization.subscription.status(), .checkout(), .portal(), .pricing()
 */
const subscriptionRouter = createTRPCRouter({
  /**
   * Get subscription status for the active organization
   */
  status: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.activeOrg?.id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active organization selected",
      });
    }

    const organizationId = ctx.activeOrg.id;

    // Verify user is member
    const membership = await ctx.db.organizationMember.findUnique({
      where: {
        orgId_userId: {
          orgId: organizationId,
          userId: ctx.user.id,
        },
      },
    });

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a member of this organization",
      });
    }

    // Get org with payer and LinkedIn account count
    const org = await ctx.db.organization.findUnique({
      where: { id: organizationId },
      include: {
        payer: {
          select: {
            firstName: true,
            lastName: true,
            primaryEmailAddress: true,
          },
        },
        _count: {
          select: { linkedInAccounts: true },
        },
      },
    });

    if (!org) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    const isActive = org.subscriptionExpiresAt
      ? org.subscriptionExpiresAt > new Date()
      : false;

    return {
      isActive,
      purchasedSlots: org.purchasedSlots,
      usedSlots: org._count.linkedInAccounts,
      expiresAt: org.subscriptionExpiresAt,
      subscriptionTier: org.subscriptionTier as "FREE" | "PREMIUM",
      payer: org.payer,
      isPayer: ctx.user.id === org.payerId,
      role: membership.role,
    };
  }),

  /**
   * Get pricing from config (manually maintained)
   */
  pricing: publicProcedure.query(() => {
    const { monthly, yearly } = QUANTITY_PRICING_CONFIG;

    return {
      monthly: {
        id: STRIPE_QUANTITY_PRICES.MONTHLY,
        amount: Math.round(monthly.pricePerSlot * 100),
        currency: "usd",
        interval: "month" as const,
        displayAmount: `$${monthly.pricePerSlot.toFixed(2)}`,
      },
      yearly: {
        id: STRIPE_QUANTITY_PRICES.YEARLY,
        amount: Math.round(yearly.pricePerSlot * 100),
        currency: "usd",
        interval: "year" as const,
        displayAmount: `$${yearly.pricePerSlot.toFixed(2)}`,
        monthlyEquivalent: `$${(yearly.pricePerSlot / 12).toFixed(2)}`,
      },
    };
  }),

  /**
   * Create a checkout session for org subscription
   * Only admins can subscribe. One user can only have one active subscription.
   */
  checkout: protectedProcedure
    .input(
      z.object({
        slots: z.number().min(1),
        interval: z.enum(["monthly", "yearly"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeOrg?.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active organization selected",
        });
      }

      const organizationId = ctx.activeOrg.id;

      // 1. Verify user is admin of org
      const membership = await ctx.db.organizationMember.findUnique({
        where: {
          orgId_userId: {
            orgId: organizationId,
            userId: ctx.user.id,
          },
        },
      });

      if (!membership || membership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only organization admins can subscribe",
        });
      }

      // 2. Check if user already has an active subscription (DB only - webhooks keep this in sync)
      const existingPaidOrg = await ctx.db.organization.findFirst({
        where: {
          payerId: ctx.user.id,
          subscriptionExpiresAt: { gt: new Date() },
        },
        select: { name: true, subscriptionExpiresAt: true },
      });

      if (existingPaidOrg) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You're already paying for "${existingPaidOrg.name}" until ${existingPaidOrg.subscriptionExpiresAt?.toLocaleDateString()}. Cancel that subscription first or wait for it to expire.`,
        });
      }

      // 3. Get or create Stripe customer for user (in transaction)
      const { customerId, org } = await ctx.db.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: ctx.user.id },
          select: { stripeCustomerId: true, primaryEmailAddress: true },
        });

        let stripeCustomerId = user?.stripeCustomerId;
        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: user?.primaryEmailAddress,
            metadata: { clerkUserId: ctx.user.id },
          });
          stripeCustomerId = customer.id;

          await tx.user.update({
            where: { id: ctx.user.id },
            data: { stripeCustomerId },
          });
        }

        const organization = await tx.organization.findUnique({
          where: { id: organizationId },
          select: { orgSlug: true, name: true },
        });

        return { customerId: stripeCustomerId, org: organization };
      });

      // 4. Create checkout session with org metadata
      const priceId =
        input.interval === "yearly"
          ? STRIPE_QUANTITY_PRICES.YEARLY
          : STRIPE_QUANTITY_PRICES.MONTHLY;

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: input.slots,
            adjustable_quantity: {
              enabled: true,
              minimum: 1,
            },
          },
        ],
        mode: "subscription",
        success_url: `${baseUrl}/billing-return?orgId=${organizationId}&success=true`,
        cancel_url: `${baseUrl}/${org?.orgSlug ?? ""}/settings?canceled=true`,
        allow_promotion_codes: true,
        subscription_data: {
          metadata: {
            organizationId,
            organizationName: org?.name ?? "",
            payerId: ctx.user.id,
          },
        },
        metadata: {
          organizationId,
          payerId: ctx.user.id,
        },
      });

      return { url: session.url };
    }),

  /**
   * Create a Stripe customer portal session for managing org subscription
   * Only payer or admins can access
   */
  portal: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.activeOrg?.id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active organization selected",
      });
    }

    const organizationId = ctx.activeOrg.id;

    // Get org with payer info
    const org = await ctx.db.organization.findUnique({
      where: { id: organizationId },
      include: {
        payer: {
          select: { stripeCustomerId: true },
        },
      },
    });

    if (!org?.payer?.stripeCustomerId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active subscription found",
      });
    }

    // Verify user is payer or admin
    const membership = await ctx.db.organizationMember.findUnique({
      where: {
        orgId_userId: {
          orgId: organizationId,
          userId: ctx.user.id,
        },
      },
    });

    if (
      !membership ||
      (ctx.user.id !== org.payerId && membership.role !== "ADMIN")
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only the payer or admins can access billing settings",
      });
    }

    // Create customer portal session (uses payer's Stripe customer)
    const session = await stripe.billingPortal.sessions.create({
      customer: org.payer.stripeCustomerId,
      return_url: `${baseUrl}/billing-return?orgId=${organizationId}`,
    });

    return { url: session.url };
  }),
});

export const organizationRouter = () =>
  createTRPCRouter({
    /**
     * Get the user's current organization based on Clerk's active org
     * Uses orgId from Clerk's org switcher context
     */
    getCurrent: protectedProcedure.query(async ({ ctx }) => {
      // If no active org selected in Clerk, fall back to first membership
      const orgId = ctx.activeOrg?.id;

      const membership = await ctx.db.organizationMember.findFirst({
        where: {
          userId: ctx.user.id,
          ...(orgId ? { orgId } : {}),
        },
        include: {
          org: {
            select: {
              id: true,
              name: true,
              orgSlug: true,
              purchasedSlots: true,
              stripeCustomerId: true,
              createdAt: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" }, // Fallback: oldest org if no orgId specified
      });

      if (!membership) {
        return null;
      }

      return {
        ...membership.org,
        role: membership.role,
      };
    }),

    /**
     * List all organizations the user is a member of
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      const memberships = await ctx.db.organizationMember.findMany({
        where: { userId: ctx.user.id },
        include: {
          org: {
            select: {
              id: true,
              name: true,
              purchasedSlots: true,
              createdAt: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      });

      return memberships.map((m) => ({
        ...m.org,
        role: m.role,
      }));
    }),

    /**
     * Subscription sub-router
     * Access: trpc.organization.subscription.status(), .checkout(), .portal(), .pricing()
     */
    subscription: subscriptionRouter,
  });
