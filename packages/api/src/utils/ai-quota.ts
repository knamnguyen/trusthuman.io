import type { PrismaClient } from "@sassy/db";
import { FEATURE_CONFIG } from "@sassy/feature-flags";

import { isOrgPremium } from "../services/org-access-control";

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
  earnedPremiumExpiresAt: Date | null;
}): number {
  if (isOrgPremium(org)) {
    return FEATURE_CONFIG.dailyComments.premiumTierLimit; // -1 = unlimited
  }
  return FEATURE_CONFIG.dailyComments.freeTierLimit; // 5
}

const ORG_SELECT = {
  subscriptionTier: true,
  subscriptionExpiresAt: true,
  purchasedSlots: true,
  earnedPremiumExpiresAt: true,
  _count: {
    select: {
      linkedInAccounts: true,
    },
  },
} as const;

function toOrgData(
  org: {
    subscriptionTier: string;
    subscriptionExpiresAt: Date | null;
    purchasedSlots: number;
    earnedPremiumExpiresAt: Date | null;
    _count: { linkedInAccounts: number };
  } | null,
) {
  return {
    subscriptionTier: org?.subscriptionTier ?? "FREE",
    subscriptionExpiresAt: org?.subscriptionExpiresAt ?? null,
    purchasedSlots: org?.purchasedSlots ?? 0,
    accountCount: org?._count.linkedInAccounts ?? 0,
    earnedPremiumExpiresAt: org?.earnedPremiumExpiresAt ?? null,
  };
}

/**
 * Get account's AI comment quota (read-only).
 * Quota resets are handled by a scheduled DBOS cron job at midnight UTC.
 */
export async function getAccountQuota(db: PrismaClient, accountId: string) {
  const account = await db.linkedInAccount.findUnique({
    where: { id: accountId },
    select: {
      dailyAIcomments: true,
      org: { select: ORG_SELECT },
    },
  });

  if (!account) {
    return null;
  }

  const orgData = toOrgData(account.org);
  const limit = getLimit(orgData);

  return {
    used: account.dailyAIcomments,
    left: limit === -1 ? Infinity : limit - account.dailyAIcomments,
    limit,
    isPremium: isOrgPremium(orgData),
    resetsAt: getNextMidnightUTC(),
  };
}

/**
 * Atomically reserve quota for AI comment generation.
 *
 * Uses increment-then-check to avoid race conditions with concurrent requests:
 * 1. Atomically increment dailyAIcomments by `count`
 * 2. Check if the new total exceeds the limit
 * 3. If exceeded, rollback the increment and return "exceeded"
 *
 * PostgreSQL's `UPDATE SET col = col + N RETURNING col` is atomic,
 * so concurrent calls will see sequential post-increment values.
 */
export async function reserveQuota(
  db: PrismaClient,
  accountId: string,
  count: number,
) {
  const account = await db.linkedInAccount.findUnique({
    where: { id: accountId },
    select: {
      org: { select: ORG_SELECT },
    },
  });

  if (!account) {
    return { status: "not_found" } as const;
  }

  const orgData = toOrgData(account.org);
  const limit = getLimit(orgData);

  // Unlimited premium — track usage but never reject
  if (limit === -1) {
    const updated = await db.linkedInAccount.update({
      where: { id: accountId },
      data: { dailyAIcomments: { increment: count } },
      select: { dailyAIcomments: true },
    });
    return {
      status: "reserved",
      used: updated.dailyAIcomments,
      limit,
      isPremium: true,
      resetsAt: getNextMidnightUTC(),
    } as const;
  }

  // Atomically increment and get new value
  const updated = await db.linkedInAccount.update({
    where: { id: accountId },
    data: { dailyAIcomments: { increment: count } },
    select: { dailyAIcomments: true },
  });

  // Check if increment caused us to exceed limit
  if (updated.dailyAIcomments > limit) {
    // Rollback
    await db.linkedInAccount.update({
      where: { id: accountId },
      data: { dailyAIcomments: { decrement: count } },
    });
    return {
      status: "exceeded",
      used: updated.dailyAIcomments - count,
      limit,
      isPremium: false,
      resetsAt: getNextMidnightUTC(),
    } as const;
  }

  return {
    status: "reserved",
    used: updated.dailyAIcomments,
    limit,
    isPremium: isOrgPremium(orgData),
    resetsAt: getNextMidnightUTC(),
  } as const;
}

/**
 * Increment (or decrement) account's daily AI comment usage.
 * Used for rollback when AI generation fails after quota was reserved.
 */
export async function incrementDailyAiCommentUsage(
  db: PrismaClient,
  accountId: string,
  count: number,
) {
  await db.linkedInAccount.update({
    where: { id: accountId },
    data: {
      dailyAIcomments: {
        increment: count,
      },
    },
  });
}
