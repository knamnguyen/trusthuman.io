import type { TRPCRouterRecord } from "@trpc/server";

import { protectedProcedure } from "../trpc";

export const organizationRouter = {
  /**
   * Get the user's current organization
   * For now, returns the first org the user is a member of (their personal org)
   * Later: could support org switching via stored preference
   */
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const membership = await ctx.db.organizationMember.findFirst({
      where: { userId: ctx.user.id },
      include: {
        org: {
          select: {
            id: true,
            name: true,
            purchasedSlots: true,
            stripeCustomerId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: "asc" }, // Oldest = their personal org
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
} satisfies TRPCRouterRecord;
