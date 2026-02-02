import type { PrismaClient } from "@sassy/db";

/**
 * Prisma select for fetching org fields needed by isOrgPremium().
 * Use this whenever you need to check premium status after a DB query.
 */
export const ORG_PREMIUM_SELECT = {
  subscriptionTier: true,
  subscriptionExpiresAt: true,
  purchasedSlots: true,
  earnedPremiumExpiresAt: true,
  _count: { select: { linkedInAccounts: true } },
} as const;

/**
 * Single source of truth for org premium checks.
 * Checks BOTH paid subscription AND earned premium (social referral).
 *
 * Paid premium: tier=PREMIUM + not expired + within quota
 * Earned premium: earnedPremiumExpiresAt in the future + single account only
 */
export function isOrgPremium(org: {
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
  purchasedSlots: number;
  accountCount: number;
  earnedPremiumExpiresAt: Date | null;
}): boolean {
  const now = new Date();

  const paidPremium =
    org.subscriptionTier === "PREMIUM" &&
    org.subscriptionExpiresAt != null &&
    org.subscriptionExpiresAt > now &&
    org.accountCount <= org.purchasedSlots;

  const earnedPremium =
    org.earnedPremiumExpiresAt != null &&
    org.earnedPremiumExpiresAt > now &&
    org.accountCount <= 1;

  return paidPremium || earnedPremium;
}

/**
 * Async wrapper: fetches org by ID and checks premium status.
 * Use in routers where you have orgId but haven't fetched the org yet.
 */
export async function hasPremiumAccess(
  db: PrismaClient,
  { orgId }: { orgId: string },
): Promise<boolean> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: ORG_PREMIUM_SELECT,
  });
  if (!org) return false;
  return isOrgPremium({
    ...org,
    accountCount: org._count.linkedInAccounts,
  });
}

export function hasPermissionToUpdateOrgSubscriptionClause(userId: string) {
  return {
    payerId: userId,
    stripeSubscriptionId: { not: null },
  };
}

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
