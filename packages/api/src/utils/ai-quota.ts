import type { PrismaClient } from "@sassy/db";
import { FEATURE_CONFIG, isOrgPremium } from "@sassy/feature-flags";

/**
 * Get UTC midnight for today
 * Example: 2026-02-01 15:30:00 UTC -> 2026-02-01 00:00:00 UTC
 */
function getTodayMidnightUTC(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
}

/**
 * Get UTC midnight for tomorrow
 * Used to show users when their quota resets
 */
function getNextMidnightUTC(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );
}

/**
 * Get daily comment limit based on organization premium status
 */
function getLimit(org: {
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
  purchasedSlots: number;
  accountCount: number;
}): number {
  if (isOrgPremium(org)) {
    return FEATURE_CONFIG.dailyComments.premiumTierLimit; // -1 = unlimited
  }
  return FEATURE_CONFIG.dailyComments.freeTierLimit; // 5
}

export interface QuotaStatus {
  used: number;
  limit: number;
  isPremium: boolean;
  refreshedAt: Date;
  resetsAt: Date;
}

/**
 * Get account's AI comment quota with lazy refresh
 *
 * This function:
 * 1. Checks if quota needs refresh (never refreshed OR last refresh before today's midnight UTC)
 * 2. If needed, resets dailyAIcomments to 0 and updates refreshedAt timestamp
 * 3. Returns current quota status
 *
 * @param db - Prisma client
 * @param accountId - LinkedInAccount ID
 * @returns Quota status with used count, limit, and reset time
 */
export async function getAccountQuota(
  db: PrismaClient,
  accountId: string,
): Promise<QuotaStatus> {
  const account = await db.linkedInAccount.findUnique({
    where: { id: accountId },
    select: {
      dailyAIcomments: true,
      dailyAIcommentsRefreshedAt: true,
      organization: {
        select: {
          subscriptionTier: true,
          subscriptionExpiresAt: true,
          purchasedSlots: true,
          // Need _count to calculate accountCount
          _count: {
            select: {
              linkedInAccounts: true,
            },
          },
        },
      },
    },
  });

  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }

  const todayMidnightUTC = getTodayMidnightUTC();
  const lastRefresh = account.dailyAIcommentsRefreshedAt;

  // Needs refresh if never refreshed OR last refresh was before today's midnight UTC
  const needsRefresh = !lastRefresh || lastRefresh < todayMidnightUTC;

  // Prepare org data for premium check
  const orgData = {
    subscriptionTier: account.organization?.subscriptionTier ?? "FREE",
    subscriptionExpiresAt: account.organization?.subscriptionExpiresAt ?? null,
    purchasedSlots: account.organization?.purchasedSlots ?? 0,
    accountCount: account.organization?._count.linkedInAccounts ?? 0,
  };

  if (needsRefresh) {
    // Reset quota and update timestamp
    await db.linkedInAccount.update({
      where: { id: accountId },
      data: {
        dailyAIcomments: 0,
        dailyAIcommentsRefreshedAt: todayMidnightUTC,
      },
    });

    return {
      used: 0,
      limit: getLimit(orgData),
      isPremium: isOrgPremium(orgData),
      refreshedAt: todayMidnightUTC,
      resetsAt: getNextMidnightUTC(),
    };
  }

  // No refresh needed, return current status
  return {
    used: account.dailyAIcomments,
    limit: getLimit(orgData),
    isPremium: isOrgPremium(orgData),
    refreshedAt: lastRefresh,
    resetsAt: getNextMidnightUTC(),
  };
}

/**
 * Increment account's daily AI comment usage
 *
 * IMPORTANT: This does NOT check quota limits - that should be done
 * BEFORE calling this function using getAccountQuota()
 *
 * @param db - Prisma client
 * @param accountId - LinkedInAccount ID
 * @param count - Number of comments to add to usage
 */
export async function incrementAccountUsage(
  db: PrismaClient,
  accountId: string,
  count: number,
): Promise<void> {
  await db.linkedInAccount.update({
    where: { id: accountId },
    data: {
      dailyAIcomments: {
        increment: count,
      },
    },
  });
}
