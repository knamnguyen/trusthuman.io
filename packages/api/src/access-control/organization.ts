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
