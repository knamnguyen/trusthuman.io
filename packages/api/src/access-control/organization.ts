import type { PrismaClient } from "@sassy/db";

/**
 * Prisma where clause to filter organizations with active premium access.
 * Use in findFirst/findMany queries to filter by premium status.
 *
 * @example
 * const premiumOrg = await db.organization.findFirst({
 *   where: {
 *     id: orgId,
 *     ...hasPremiumAccessClause(),
 *   },
 * });
 */
export function hasPremiumAccessClause() {
  return {
    subscriptionTier: "PREMIUM",
    subscriptionExpiresAt: {
      gt: new Date(),
    },
  };
}

/**
 * Prisma where clause to filter organizations where user is the subscription payer.
 * Use for subscription update operations (only payer can modify quantity).
 *
 * @example
 * const org = await db.organization.findFirst({
 *   where: {
 *     id: orgId,
 *     ...hasPermissionToUpdateOrgSubscriptionClause(userId),
 *   },
 * });
 */
export function hasPermissionToUpdateOrgSubscriptionClause(userId: string) {
  return {
    payerId: userId,
    stripeSubscriptionId: { not: null },
  };
}

/**
 * Check if a user has permission to update an organization's subscription.
 * Only the payer can update subscription quantity.
 *
 * @example
 * const canUpdate = await hasPermissionToUpdateOrgSubscription(db, { actorUserId, orgId });
 * if (!canUpdate) return { success: false, error: "Only payer can update" };
 */
export async function hasPermissionToUpdateOrgSubscription(
  db: PrismaClient,
  { actorUserId, orgId }: { actorUserId: string; orgId: string },
): Promise<boolean> {
  const count = await db.organization.count({
    where: {
      id: orgId,
      ...hasPermissionToUpdateOrgSubscriptionClause(actorUserId),
    },
  });

  return count > 0;
}

/**
 * Check if an organization has premium access.
 * Use when you need a boolean check before performing an action.
 *
 * @example
 * const isPremium = await hasPremiumAccess(db, { orgId });
 * if (!isPremium) throw new TRPCError({ code: "FORBIDDEN" });
 */
export async function hasPremiumAccess(
  db: PrismaClient,
  { orgId }: { orgId: string },
): Promise<boolean> {
  const count = await db.organization.count({
    where: {
      id: orgId,
      ...hasPremiumAccessClause(),
    },
  });

  return count > 0;
}
