import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { z } from "zod";

import type { PrismaClient, PrismaTransactionalClient } from "@sassy/db";
import type {
  CheckoutSessionMetadata,
  SubscriptionMetadata,
} from "@sassy/stripe/schema-validators";
import {
  checkoutSessionMetadataSchema,
  QUANTITY_PRICING_CONFIG,
  STRIPE_QUANTITY_PRICES,
} from "@sassy/stripe/schema-validators";

import {
  hasOrgAdminPermissionClause,
  hasPermissionToAccessOrgClause,
  hasPermissionToUpdateOrgSubscriptionClause,
  isOrgPremium,
} from "../services/org-access-control";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { safe } from "../utils/commons";

// Direct Stripe client for org-centric billing
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2023-08-16",
});

const baseUrl = process.env.NEXTJS_URL;
if (!baseUrl) {
  throw new Error("NEXTJS_URL environment variable is required");
}

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
              createdAt: true,
            },
          },
        },
        orderBy: { joinedAt: "asc" }, // Fallback: oldest org if no orgId specified
      });

      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No organization membership found for the user",
        });
      }

      return {
        ...membership.org,
        role: membership.role,
      };
    }),

    /**
     * Get a specific organization by ID
     * Only accessible if user is a member of the organization
     * Uses embedded permission clause for single-query access control
     */
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        // Single query: permission check + data fetch + membership role
        const org = await ctx.db.organization.findFirst({
          where: {
            id: input.id,
            ...hasPermissionToAccessOrgClause(ctx.user.id),
          },
          select: {
            id: true,
            name: true,
            orgSlug: true,
            purchasedSlots: true,
            subscriptionTier: true,
            subscriptionExpiresAt: true,
            earnedPremiumExpiresAt: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                linkedInAccounts: true,
                members: true,
              },
            },
            // Include user's membership to get their role
            members: {
              where: { userId: ctx.user.id },
              select: { role: true },
              take: 1,
            },
          },
        });

        if (!org) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Organization not found",
          });
        }

        const { members, _count, ...orgData } = org;

        return {
          ...orgData,
          role: members[0]?.role ?? "MEMBER",
          linkedInAccountCount: _count.linkedInAccounts,
          memberCount: _count.members,
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

/**
 * Subscription sub-router for organization billing
 * Access via: trpc.organization.subscription.status(), .checkout(), .portal(), .pricing()
 */
const subscriptionRouter = createTRPCRouter({
  /**
   * Get subscription status for the active organization
   * Uses embedded permission clause for single-query access control
   */
  status: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.activeOrg?.id) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active organization selected",
      });
    }

    // Single query: permission check + data fetch + membership role
    const org = await ctx.db.organization.findFirst({
      where: {
        id: ctx.activeOrg.id,
        ...hasPermissionToAccessOrgClause(ctx.user.id),
      },
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
        // Include user's membership to get their role
        members: {
          where: { userId: ctx.user.id },
          select: { role: true },
          take: 1,
        },
      },
    });

    if (!org) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    const now = new Date();
    const accountCount = org._count.linkedInAccounts;

    const paidActive = org.subscriptionExpiresAt
      ? org.subscriptionExpiresAt > now
      : false;

    const earnedActive =
      org.earnedPremiumExpiresAt != null &&
      org.earnedPremiumExpiresAt > now &&
      accountCount <= 1;

    const isPremium = isOrgPremium({
      subscriptionTier: org.subscriptionTier,
      subscriptionExpiresAt: org.subscriptionExpiresAt,
      purchasedSlots: org.purchasedSlots,
      accountCount,
      earnedPremiumExpiresAt: org.earnedPremiumExpiresAt,
    });

    const premiumSource: "paid" | "earned" | "none" = paidActive
      ? "paid"
      : earnedActive
        ? "earned"
        : "none";

    return {
      isActive: isPremium,
      premiumSource,
      purchasedSlots: org.purchasedSlots,
      usedSlots: accountCount,
      expiresAt: org.subscriptionExpiresAt,
      earnedPremiumExpiresAt: org.earnedPremiumExpiresAt,
      subscriptionTier: org.subscriptionTier as "FREE" | "PREMIUM",
      payer: org.payer,
      isPayer: ctx.user.id === org.payerId,
      role: org.members[0]?.role ?? "MEMBER",
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
   * Uses embedded permission clause for single-query access control
   */
  checkout: protectedProcedure
    .input(
      z.object({
        slots: z.number().int().min(1),
        interval: z.enum(["monthly", "yearly"]),
        endorsely_referral: z.string().nullish(),
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

      // 1. Verify user is admin + check existing subscription in parallel queries
      const [adminOrg, existingPaidOrg] = await Promise.all([
        // Check admin access (single query with embedded clause)
        ctx.db.organization.findFirst({
          where: {
            id: organizationId,
            ...hasOrgAdminPermissionClause(ctx.user.id),
          },
          select: { id: true, orgSlug: true, name: true },
        }),
        // Check if user already has an active subscription
        ctx.db.organization.findFirst({
          where: {
            payerId: ctx.user.id,
            subscriptionExpiresAt: { gt: new Date() },
          },
          select: { name: true, subscriptionExpiresAt: true },
        }),
      ]);

      if (!adminOrg) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only organization admins can subscribe",
        });
      }

      if (existingPaidOrg) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You're already paying for "${existingPaidOrg.name}" until ${existingPaidOrg.subscriptionExpiresAt?.toLocaleDateString()}. Cancel that subscription first or wait for it to expire.`,
        });
      }

      // 2. Get or create Stripe customer for user (in transaction)
      const customerId = await ctx.db.$transaction(async (tx) => {
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

        return stripeCustomerId;
      });

      // 3. Create checkout session with org metadata
      const priceId =
        input.interval === "yearly"
          ? STRIPE_QUANTITY_PRICES.YEARLY
          : STRIPE_QUANTITY_PRICES.MONTHLY;

      const redirects = createCheckoutSessionRedirectUrls({
        organizationId,
        organizationSlug: adminOrg.orgSlug ?? "",
        action: "create_subscription",
      });

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
        success_url: redirects.success,
        cancel_url: redirects.cancel,
        allow_promotion_codes: true,
        subscription_data: {
          metadata: {
            organizationId,
            organizationName: adminOrg.name,
            payerId: ctx.user.id,
          } satisfies SubscriptionMetadata,
        },
        metadata: {
          type: "create_subscription",
          organizationId,
          slots: input.slots.toString(),
          payerId: ctx.user.id,
          endorsely_referral: input.endorsely_referral ?? null,
        } satisfies CheckoutSessionMetadata,
      });

      return { url: session.url };
    }),

  // in addition to webhooks, we have this manual capture endpoint so that redirects will also idempotently capture and update organization stuff
  capture: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        action: z.enum(["create_subscription", "update_subscription"]),
      }),
    )
    .query(async ({ input, ctx }) => {
      const session = await stripe.checkout.sessions.retrieve(input.sessionId);

      return await handleCheckoutSessionSuccess(ctx.db, session);
    }),

  /**
   * Create a Stripe customer portal session for managing org subscription
   * Only payer or admins can access
   * Uses embedded permission clause for single-query access control
   */
  portal: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.activeOrg?.id) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active organization selected",
      });
    }

    const organizationId = ctx.activeOrg.id;

    // Single query: get org with payer info + user's membership
    const org = await ctx.db.organization.findFirst({
      where: {
        id: organizationId,
        ...hasPermissionToAccessOrgClause(ctx.user.id),
      },
      include: {
        payer: {
          select: { stripeCustomerId: true },
        },
        members: {
          where: { userId: ctx.user.id },
          select: { role: true },
          take: 1,
        },
      },
    });

    if (!org) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Organization not found",
      });
    }

    if (!org.payer?.stripeCustomerId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active subscription found",
      });
    }

    // Verify user is payer or admin
    const isPayer = ctx.user.id === org.payerId;
    const isAdmin = org.members[0]?.role === "admin";

    if (!isPayer && !isAdmin) {
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

  /**
   * Update subscription quantity (slots)
   * Only the payer can update. Uses always_invoice for immediate proration.
   * Returns error object instead of throwing for mutation error handling.
   */
  update: protectedProcedure
    .input(
      z.object({
        slots: z.number().int().min(1),
        endorsely_referral: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeOrg?.id) {
        return {
          success: false,
          error: "No active organization selected",
        } as const;
      }

      const organizationId = ctx.activeOrg.id;

      // Single query with access control clause - only payer can update
      const org = await ctx.db.organization.findFirst({
        where: {
          id: organizationId,
          ...hasPermissionToUpdateOrgSubscriptionClause(ctx.user.id),
        },
        select: {
          stripeSubscriptionId: true,
          purchasedSlots: true,
          name: true,
          payer: {
            select: {
              stripeCustomerId: true,
            },
          },
        },
      });

      if (!org) {
        return {
          success: false,
          error: "Only the subscription payer can update slot quantity",
        } as const;
      }

      if (!org.stripeSubscriptionId) {
        return {
          success: false,
          error: "No active subscription found",
        } as const;
      }

      const stripeCustomerId = org.payer?.stripeCustomerId;

      if (!stripeCustomerId) {
        // this shudnt happen bcs payer would always have stripeCustomerId if they have a subscription
        // this is for type narrowing for stripeCustomerId usage below
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Payer has no Stripe customer ID",
        });
      }

      if (org.purchasedSlots === input.slots) {
        return { success: false, error: "Slot quantity unchanged" } as const;
      }

      // Get subscription to find the item ID
      const subscriptionResult = await safe(() =>
        stripe.subscriptions.retrieve(org.stripeSubscriptionId!),
      );

      if (!subscriptionResult.ok) {
        console.error(
          "Error retrieving subscription:",
          subscriptionResult.error,
        );
        return {
          success: false,
          error: "Internal server error",
        } as const;
      }

      const subscriptionItem = subscriptionResult.output.items.data[0];
      if (!subscriptionItem) {
        return { success: false, error: "Subscription has no items" } as const;
      }

      const isDowngrade = input.slots < org.purchasedSlots;

      if (isDowngrade) {
        // Downgrade: Update Stripe immediately (so next invoice is correct)
        // but keep current slots in DB until renewal
        const updateResult = await safe(() =>
          stripe.subscriptions.update(org.stripeSubscriptionId!, {
            items: [{ id: subscriptionItem.id, quantity: input.slots }],
            proration_behavior: "none", // No credit - takes effect at renewal
          }),
        );

        if (!updateResult.ok) {
          return { success: false, error: updateResult.error.message } as const;
        }

        return {
          success: true,
          isDowngrade: true,
          url: null,
          invoiceId: null,
          previousSlots: org.purchasedSlots,
          newSlots: input.slots,
          effectiveAt: new Date(
            subscriptionResult.output.current_period_end * 1000,
          ),
        } as const;
      }

      // Upgrade: Update Stripe subscription with immediate proration
      // Clear any pending downgrade since user is upgrading
      const updateResult = await safe(() =>
        stripe.subscriptions.update(org.stripeSubscriptionId!, {
          items: [{ id: subscriptionItem.id, quantity: input.slots }],
          proration_behavior: "none",
          payment_behavior: "pending_if_incomplete",
        }),
      );

      if (!updateResult.ok) {
        return { success: false, error: updateResult.error.message } as const;
      }

      const interval = subscriptionItem.price.recurring?.interval;

      if (!interval) {
        console.info("Missing interval on subscription item price");
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Internal issue with subscription, please contact engagekit.io@gmail.com for support",
        });
      }

      const redirects = createCheckoutSessionRedirectUrls({
        organizationId,
        organizationSlug: ctx.activeOrg.slug ?? "",
        action: "update_subscription",
      });

      console.info(redirects);

      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              unit_amount: calculateProratedAmount({
                purchasedSlots: {
                  old: org.purchasedSlots,
                  new: input.slots,
                },
                currentPeriodEnd: new Date(
                  subscriptionResult.output.current_period_end * 1000,
                ),
                term: interval === "month" ? "monthly" : "yearly",
              }),
              currency: "usd",
              product_data: {
                name: `Prorated charge for extra ${input.slots - org.purchasedSlots} slots purchase for ${org.name} untill end of ${new Date(subscriptionResult.output.current_period_end * 1000).toString()}`,
              },
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: redirects.success,
        cancel_url: redirects.cancel,
        allow_promotion_codes: true,
        metadata: {
          type: "update_subscription",
          organizationId,
          slots: input.slots.toString(),
          payerId: ctx.user.id,
          endorsely_referral: input.endorsely_referral ?? null,
        } satisfies CheckoutSessionMetadata,
      });

      if (session.url === null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to create checkout session, please contact engagekit.io@gmail.com for support.",
        });
      }

      return {
        success: true,
        isDowngrade: false,
        url: session.url,
        previousSlots: org.purchasedSlots,
        newSlots: input.slots,
      } as const;
    }),

  /**
   * Cancel a pending subscription update by voiding the invoice
   * and reverting the subscription quantity
   */
  cancelUpdate: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        revertToSlots: z.number().int().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.activeOrg?.id) {
        return {
          success: false,
          error: "No active organization selected",
        } as const;
      }

      // Verify user is the payer
      const org = await ctx.db.organization.findFirst({
        where: {
          id: ctx.activeOrg.id,
          ...hasPermissionToUpdateOrgSubscriptionClause(ctx.user.id),
        },
        select: { stripeSubscriptionId: true },
      });

      if (!org?.stripeSubscriptionId) {
        return {
          success: false,
          error: "No active subscription found",
        } as const;
      }

      // Void the invoice
      const voidResult = await safe(() =>
        stripe.invoices.voidInvoice(input.invoiceId),
      );

      if (!voidResult.ok) {
        // Invoice might already be paid or voided
        console.error("Error voiding invoice:", voidResult.error);
        return {
          success: false,
          error: "Could not cancel the invoice. It may have already been paid.",
        } as const;
      }

      // Revert subscription quantity
      const subscription = await stripe.subscriptions.retrieve(
        org.stripeSubscriptionId,
      );
      const subscriptionItem = subscription.items.data[0];

      if (subscriptionItem) {
        await safe(() =>
          stripe.subscriptions.update(org.stripeSubscriptionId!, {
            items: [{ id: subscriptionItem.id, quantity: input.revertToSlots }],
            proration_behavior: "none", // No proration for revert
          }),
        );
      }

      return { success: true } as const;
    }),
});

export async function convertOrgSubscriptionToPremium(
  db: PrismaClient,
  {
    orgId,
    purchasedSlots,
    stripeSubscriptionId,
    payerId,
    subscriptionExpiresAt,
  }: {
    orgId: string;
    payerId: string;
    purchasedSlots: number;
    stripeSubscriptionId: string;
    subscriptionExpiresAt: Date;
  },
) {
  return await db.$transaction(async (tx) => {
    await tx.organization.update({
      where: {
        id: orgId,
        ...hasOrgAdminPermissionClause(payerId),
      },
      data: {
        subscriptionTier: "PREMIUM",
        stripeSubscriptionId,
        purchasedSlots,
        subscriptionExpiresAt,
        payerId,
      },
    });

    return await disableAccountsExceedingSlots(tx, {
      orgId,
      purchasedSlots,
    });
  });
}

export async function convertOrgSubscriptionToFree(
  db: PrismaClient,
  { orgId, expiresAt }: { orgId: string; expiresAt: Date },
) {
  return await db.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: orgId },
      data: {
        payerId: null,
        stripeSubscriptionId: null,
        purchasedSlots: 1,
        subscriptionTier: "FREE",
        subscriptionExpiresAt: expiresAt, // Grace period
      },
    });

    return await disableAccountsExceedingSlots(tx, {
      orgId,
      purchasedSlots: 1,
    });
  });
}

/**
 * Apply a pending downgrade at renewal.
 * Called by webhook when subscription renews with a lower new purchased slots.
 * Updates purchasedSlots, clears pending, and disables excess accounts.
 */
export async function applyPendingDowngrade(
  db: PrismaClient,
  {
    orgId,
    newPurchasedSlots,
    subscriptionExpiresAt,
  }: {
    orgId: string;
    newPurchasedSlots: number;
    subscriptionExpiresAt: Date;
  },
) {
  return await db.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: orgId },
      data: {
        purchasedSlots: newPurchasedSlots,
        subscriptionExpiresAt,
      },
    });

    return await disableAccountsExceedingSlots(tx, {
      orgId,
      purchasedSlots: newPurchasedSlots,
    });
  });
}

/**
 * Update organization subscription slot count.
 * Used when payer changes quantity via in-app UI.
 * Disables excess accounts if downgrading.
 */
export async function updateOrgSubscriptionPurchasedSlots(
  db: PrismaClient,
  { orgId, purchasedSlots }: { orgId: string; purchasedSlots: number },
) {
  return await db.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: orgId },
      data: { purchasedSlots },
    });

    return await disableAccountsExceedingSlots(tx, {
      orgId,
      purchasedSlots,
    });
  });
}

async function disableAccountsExceedingSlots(
  tx: PrismaTransactionalClient,
  {
    orgId,
    purchasedSlots,
  }: {
    orgId: string;
    purchasedSlots: number;
  },
) {
  // Count only non-disabled accounts
  const activeAccountCount = await tx.linkedInAccount.count({
    where: {
      organizationId: orgId,
      status: { not: "DISABLED" },
    },
  });

  if (activeAccountCount <= purchasedSlots) {
    return {
      status: "noop",
    } as const;
  }

  const numToDisable = activeAccountCount - purchasedSlots;

  // Get accounts to disable, prioritizing:
  // 1. REGISTERED (not yet connected)
  // 2. CONNECTING (in progress)
  // 3. CONNECTED (oldest first to keep most recent active)
  const accountsToDisable = await tx.linkedInAccount.findMany({
    where: {
      organizationId: orgId,
      status: { not: "DISABLED" },
    },
    orderBy: [{ createdAt: "asc" }],
    select: { id: true, status: true },
  });

  // Sort by priority to disable: REGISTERED first, CONNECTING second, CONNECTED last (kept)
  const priorityOrder = { REGISTERED: 0, CONNECTING: 1, CONNECTED: 2 };
  const sortedAccounts = accountsToDisable.sort((a, b) => {
    const priorityA =
      priorityOrder[
        a.status as Exclude<keyof typeof priorityOrder, "DISABLED">
      ];
    const priorityB =
      priorityOrder[
        b.status as Exclude<keyof typeof priorityOrder, "DISABLED">
      ];
    return priorityA - priorityB;
  });

  const idsToDisable = sortedAccounts.slice(0, numToDisable).map((a) => a.id);

  await tx.linkedInAccount.updateMany({
    where: {
      id: { in: idsToDisable },
    },
    data: {
      status: "DISABLED",
    },
  });

  return {
    status: "disabled",
    numAccountsDisabled: idsToDisable.length,
  } as const;
}

export function calculateProratedAmount({
  purchasedSlots,
  currentPeriodEnd,
  term,
  now = new Date(),
}: {
  purchasedSlots: {
    old: number;
    new: number;
  };
  currentPeriodEnd: Date;
  term: "monthly" | "yearly";
  now?: Date;
}) {
  if (purchasedSlots.new <= purchasedSlots.old) {
    throw new Error("Proration calculation only valid for upgrades");
  }

  const daysToProrate =
    (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (daysToProrate <= 0) {
    throw new Error("No days left to prorate");
  }

  const dailyRatePerSlot =
    QUANTITY_PRICING_CONFIG[term].pricePerSlot /
    (term === "monthly" ? 30 : 365);

  console.info({ daysToProrate, dailyRatePerSlot });
  const proratedAmount =
    (purchasedSlots.new - purchasedSlots.old) *
    dailyRatePerSlot *
    daysToProrate;

  return Math.round(proratedAmount * 100); // in cents
}

export async function handleCheckoutSessionSuccess(
  db: PrismaClient,
  session: Stripe.Checkout.Session,
) {
  const metadata = checkoutSessionMetadataSchema.safeParse(session.metadata);

  if (!metadata.success) {
    return {
      status: "error",
      message: "invalid session metadata",
    } as const;
  }

  const organizationId = metadata.data.organizationId;

  // Verify user is admin of the organization
  const organization = await db.organization.findFirst({
    where: {
      id: organizationId,
    },
  });

  if (!organization) {
    return {
      status: "error",
      message: "organization not found",
    } as const;
  }

  if (session.status !== "complete") {
    return {
      status: "error",
      message: "session not complete",
    } as const;
  }

  switch (metadata.data.type) {
    case "create_subscription": {
      const subscriptionId = session.subscription;
      if (typeof subscriptionId !== "string") {
        return {
          status: "error",
          message: "missing subscription ID in session",
        } as const;
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const quantity = subscription.items.data[0]?.quantity ?? 1;
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

      await convertOrgSubscriptionToPremium(db, {
        orgId: organizationId,
        purchasedSlots: quantity,
        stripeSubscriptionId: subscription.id,
        payerId: metadata.data.payerId,
        subscriptionExpiresAt: currentPeriodEnd,
      });
      break;
    }
    case "update_subscription": {
      const organization = await db.organization.findFirst({
        where: { id: organizationId },
        select: {
          stripeSubscriptionId: true,
        },
      });
      if (!organization?.stripeSubscriptionId) {
        return {
          status: "error",
          message: "organization has no active subscription",
        } as const;
      }

      const subscription = await stripe.subscriptions.retrieve(
        organization.stripeSubscriptionId,
      );

      const itemId = subscription.items.data[0]?.id;

      if (!itemId) {
        return {
          status: "error",
          message: "subscription has no items",
        } as const;
      }

      await stripe.subscriptions.update(organization.stripeSubscriptionId, {
        items: [
          {
            quantity: parseInt(metadata.data.slots),
            id: itemId,
          },
        ],
        proration_behavior: "none",
      });

      await updateOrgSubscriptionPurchasedSlots(db, {
        orgId: organizationId,
        purchasedSlots: parseInt(metadata.data.slots),
      });

      break;
    }
    default: {
      return {
        status: "error",
        message: "unknown session metadata type",
      } as const;
    }
  }

  return {
    status: "success",
  } as const;
}

function createCheckoutSessionRedirectUrls({
  organizationId,
  organizationSlug,
  action,
}: {
  organizationId: string;
  organizationSlug: string;
  action: "create_subscription" | "update_subscription";
}) {
  return {
    success: `${baseUrl}/billing-return?orgId=${organizationId}&success=true&session_id={CHECKOUT_SESSION_ID}&action=${action}`,
    cancel: `${baseUrl}/${organizationSlug}/settings?canceled=true`,
  };
}
