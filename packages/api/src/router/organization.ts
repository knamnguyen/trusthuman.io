import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { z } from "zod";

import type { PrismaClient, PrismaTransactionalClient } from "@sassy/db";
import {
  QUANTITY_PRICING_CONFIG,
  STRIPE_QUANTITY_PRICES,
} from "@sassy/stripe/schema-validators";

import { hasPermissionToUpdateOrgSubscriptionClause } from "../access-control/organization";
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
              stripeCustomerId: true,
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
        endorsely_referral: z.string().optional(),
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
        success_url: `${baseUrl}/billing-return?orgId=${organizationId}&success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/${adminOrg.orgSlug ?? ""}/settings?canceled=true`,
        allow_promotion_codes: true,
        subscription_data: {
          metadata: {
            organizationId,
            organizationName: adminOrg.name,
            payerId: ctx.user.id,
          },
        },
        metadata: {
          organizationId,
          payerId: ctx.user.id,
          endorsely_referral: input.endorsely_referral,
        },
      });

      return { url: session.url };
    }),

  // in addition to webhooks, we have this manual capture endpoint so that redirects will also idempotently capture and update organization stuff
  capture: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const session = await stripe.checkout.sessions.retrieve(input.sessionId, {
        expand: ["subscription"],
      });

      const organizationId = session.metadata?.organizationId;

      if (!organizationId) {
        return {
          status: "error",
          message: "invalid session metadata",
        } as const;
      }

      // Verify user is admin of the organization
      const organization = await ctx.db.organization.findFirst({
        where: {
          id: organizationId,
          ...hasOrgAdminPermissionClause(ctx.user.id),
        },
      });

      if (!organization) {
        return {
          status: "error",
          message: "organization not found",
        } as const;
      }

      if (!session.subscription || session.status !== "complete") {
        return {
          status: "error",
          message: "subscription not found or session not complete",
        } as const;
      }

      const subscription = session.subscription;

      if (typeof subscription === "string") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected subscription type",
        });
      }

      const quantity = subscription.items.data[0]?.quantity ?? 1;
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

      await convertOrgSubscriptionToPremium(ctx.db, {
        orgId: organizationId,
        purchasedSlots: quantity,
        stripeSubscriptionId: subscription.id,
        payerId: ctx.user.id,
        subscriptionExpiresAt: currentPeriodEnd,
      });

      return {
        status: "success",
      } as const;
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
          proration_behavior: "always_invoice",
          payment_behavior: "pending_if_incomplete",
        }),
      );

      if (!updateResult.ok) {
        return { success: false, error: updateResult.error.message } as const;
      }

      const invoiceResult = await safe(() =>
        stripe.invoices.retrieve(updateResult.output.latest_invoice as string, {
          expand: ["payment_intent"],
        }),
      );

      if (!invoiceResult.ok || !invoiceResult.output.hosted_invoice_url) {
        console.error(
          "Error retrieving invoice:",
          invoiceResult.ok ? "invoice not found" : invoiceResult.error,
        );
        return {
          success: false,
          error: "Internal server error",
        } as const;
      }

      return {
        success: true,
        isDowngrade: false,
        url: invoiceResult.output.hosted_invoice_url,
        invoiceId: invoiceResult.output.id,
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

/**
 * Prisma where clause to filter organizations where user is an admin.
 * Use for admin-only operations like billing, member management.
 *
 * @example
 * const adminOrgs = await db.organization.findMany({
 *   where: isOrgAdminClause(userId),
 * });
 */
export function hasOrgAdminPermissionClause(userId: string) {
  return {
    members: {
      some: {
        userId,
        role: "admin",
      },
    },
  };
}

/**
 * Async function to check if a user is an admin of an organization.
 *
 * @example
 * const isAdmin = await isOrgAdmin(db, { actorUserId, orgId });
 * if (!isAdmin) return { success: false, error: "Admin only" };
 */
export async function hasOrgAdminPermission(
  db: PrismaClient,
  { actorUserId, orgId }: { actorUserId: string; orgId: string },
): Promise<boolean> {
  const exists = await db.organization.count({
    where: {
      AND: [{ id: orgId }, hasOrgAdminPermissionClause(actorUserId)],
    },
  });

  return exists > 0;
}

export function hasPermissionToAccessOrgClause(userId: string) {
  return {
    members: {
      some: {
        userId,
      },
    },
  };
}

/**
 * Async function to check if a user has permission to access an organization.
 * Use when you need a boolean check before performing an action.
 *
 * @example
 * const canAccess = await hasPermissionToAccessOrg(db, { actorUserId, orgId });
 * if (!canAccess) return { success: false, error: "No access" };
 */
export async function hasPermissionToAccessOrg(
  db: PrismaClient,
  { actorUserId, orgId }: { actorUserId: string; orgId: string },
): Promise<boolean> {
  const exists = await db.organization.count({
    where: {
      AND: [{ id: orgId }, hasPermissionToAccessOrgClause(actorUserId)],
    },
  });

  return exists > 0;
}

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
