import { createTRPCRouter, protectedProcedure } from "../trpc";

export const organizationRouter = () =>
  createTRPCRouter({
    /**
     * Get the user's current organization based on Clerk's active org
     * Uses orgId from Clerk's org switcher context
     */
    getCurrent: protectedProcedure.query(async ({ ctx }) => {
      // If no active org selected in Clerk, fall back to first membership
      const orgId = ctx.orgId;

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
  });
