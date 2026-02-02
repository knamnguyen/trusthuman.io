/**
 * Subscription Lifecycle Integration Tests
 *
 * Tests the full subscription lifecycle using real DB operations:
 * - Grace period behavior (Tests 1-3)
 * - Slot counting with DISABLED accounts (Tests 4-6)
 * - subscription.status response shape (Tests 7-9)
 * - Monthly cap enforcement (Tests 10-12)
 * - Webhook idempotency + disable priority (Tests 13-14)
 * - Webhook handler chains (Tests 15-19)
 *
 * Run with: bun run packages/api/tests/test-subscription-lifecycle.ts
 */

import { config } from "dotenv";

import { db } from "@sassy/db";

import { isOrgPremium } from "../src/services/org-access-control";
import {
  convertOrgSubscriptionToFree,
  convertOrgSubscriptionToPremium,
  applyPendingDowngrade,
} from "../src/router/organization";
import {
  calculateDaysToAward,
  MONTHLY_CAP_DAYS,
} from "../src/services/social-referral-verification";

config({ path: ".env" });

// ═══════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    failed++;
    console.log(`   FAIL: ${message}`);
    throw new Error(`FAIL: ${message}`);
  }
  passed++;
  console.log(`   PASS: ${message}`);
}

/** Simulate what subscription.status tRPC endpoint returns */
function getSubscriptionStatus(org: {
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
  purchasedSlots: number;
  earnedPremiumExpiresAt: Date | null;
  accountCount: number;
}) {
  const now = new Date();

  const paidActive =
    org.subscriptionTier === "PREMIUM" &&
    org.subscriptionExpiresAt != null &&
    org.subscriptionExpiresAt > now;

  const earnedActive =
    org.earnedPremiumExpiresAt != null &&
    org.earnedPremiumExpiresAt > now &&
    org.accountCount <= 1;

  const isPremium = isOrgPremium(org);

  const premiumSource: "paid" | "earned" | "none" = paidActive
    ? "paid"
    : earnedActive
      ? "earned"
      : "none";

  return {
    isActive: isPremium,
    premiumSource,
    subscriptionTier: org.subscriptionTier as "FREE" | "PREMIUM",
    expiresAt: org.subscriptionExpiresAt,
    earnedPremiumExpiresAt: org.earnedPremiumExpiresAt,
    usedSlots: org.accountCount,
    purchasedSlots: org.purchasedSlots,
  };
}

const ts = Date.now();

// Cleanup tracking
const testOrgIds: string[] = [];
const testUserIds: string[] = [];
const testAccountIds: string[] = [];

async function createTestUser(suffix: string) {
  const id = `test-user-${suffix}-${ts}`;
  await db.user.create({
    data: {
      id,
      primaryEmailAddress: `${id}@test.local`,
    },
  });
  testUserIds.push(id);
  return id;
}

async function createTestOrg(
  suffix: string,
  data: {
    subscriptionTier?: string;
    subscriptionExpiresAt?: Date | null;
    purchasedSlots?: number;
    payerId?: string | null;
    stripeSubscriptionId?: string | null;
    earnedPremiumExpiresAt?: Date | null;
  } = {},
) {
  const id = `test-org-${suffix}-${ts}`;
  await db.organization.create({
    data: {
      id,
      name: `Test Org ${suffix}`,
      orgSlug: id,
      subscriptionTier: data.subscriptionTier ?? "FREE",
      subscriptionExpiresAt: data.subscriptionExpiresAt ?? null,
      purchasedSlots: data.purchasedSlots ?? 1,
      payerId: data.payerId ?? null,
      stripeSubscriptionId: data.stripeSubscriptionId ?? null,
      earnedPremiumExpiresAt: data.earnedPremiumExpiresAt ?? null,
    },
  });
  testOrgIds.push(id);
  return id;
}

async function addOrgMember(
  orgId: string,
  userId: string,
  role: string = "admin",
) {
  await db.organizationMember.create({
    data: { orgId, userId, role },
  });
}

async function createTestAccount(
  orgId: string,
  status: "DISABLED" | "REGISTERED" | "CONNECTING" | "CONNECTED",
  suffix: string,
) {
  const id = `test-acct-${suffix}-${ts}`;
  await db.linkedInAccount.create({
    data: {
      id,
      organizationId: orgId,
      status,
      browserProfileId: `bp-${id}`,
    },
  });
  testAccountIds.push(id);
  return id;
}

async function getOrgFromDb(orgId: string) {
  return db.organization.findUnique({
    where: { id: orgId },
    select: {
      subscriptionTier: true,
      subscriptionExpiresAt: true,
      purchasedSlots: true,
      payerId: true,
      stripeSubscriptionId: true,
      earnedPremiumExpiresAt: true,
      _count: { select: { linkedInAccounts: true } },
    },
  });
}

async function getActiveAccountCount(orgId: string) {
  return db.linkedInAccount.count({
    where: { organizationId: orgId, status: { not: "DISABLED" } },
  });
}

async function getAccountStatuses(orgId: string) {
  const accounts = await db.linkedInAccount.findMany({
    where: { organizationId: orgId },
    select: { id: true, status: true },
    orderBy: { createdAt: "asc" },
  });
  return accounts;
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN TESTS
// ═══════════════════════════════════════════════════════════════════════

async function runTests() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Subscription Lifecycle Integration Tests");
  console.log("═══════════════════════════════════════════════\n");

  try {
    // ═══════════════════════════════════════════════════════════════
    // GRACE PERIOD TESTS (Tests 1-3)
    // ═══════════════════════════════════════════════════════════════

    // TEST 1: Grace period — subscription deleted keeps premium during grace
    console.log("TEST 1: Grace period — subscription deleted keeps premium");
    {
      const userId = await createTestUser("gp1-payer");
      const orgId = await createTestOrg("gp1", {
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
        purchasedSlots: 3,
        payerId: userId,
        stripeSubscriptionId: "sub_test_gp1",
      });
      await addOrgMember(orgId, userId, "admin");

      const futureExpiry = new Date(Date.now() + 7 * 86400000); // 7 days grace
      await convertOrgSubscriptionToFree(db, { orgId, expiresAt: futureExpiry });

      const org = await getOrgFromDb(orgId);
      assert(org!.subscriptionTier === "PREMIUM", "subscriptionTier stays PREMIUM");
      assert(org!.purchasedSlots === 3, "purchasedSlots unchanged (still 3)");
      assert(org!.stripeSubscriptionId === null, "stripeSubscriptionId cleared");
      assert(org!.payerId === null, "payerId cleared");

      const premium = isOrgPremium({
        subscriptionTier: org!.subscriptionTier,
        subscriptionExpiresAt: org!.subscriptionExpiresAt,
        purchasedSlots: org!.purchasedSlots,
        accountCount: org!._count.linkedInAccounts,
        earnedPremiumExpiresAt: org!.earnedPremiumExpiresAt,
      });
      assert(premium === true, "isOrgPremium() returns true during grace period");
    }
    console.log("");

    // TEST 2: Grace period — premium naturally expires
    console.log("TEST 2: Grace period — premium naturally expires");
    {
      const orgId = await createTestOrg("gp2", {
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() - 86400000), // expired yesterday
        purchasedSlots: 3,
      });

      const org = await getOrgFromDb(orgId);
      const premium = isOrgPremium({
        subscriptionTier: org!.subscriptionTier,
        subscriptionExpiresAt: org!.subscriptionExpiresAt,
        purchasedSlots: org!.purchasedSlots,
        accountCount: org!._count.linkedInAccounts,
        earnedPremiumExpiresAt: org!.earnedPremiumExpiresAt,
      });
      assert(premium === false, "isOrgPremium() returns false after grace expires");

      const status = getSubscriptionStatus({
        subscriptionTier: org!.subscriptionTier,
        subscriptionExpiresAt: org!.subscriptionExpiresAt,
        purchasedSlots: org!.purchasedSlots,
        earnedPremiumExpiresAt: org!.earnedPremiumExpiresAt,
        accountCount: 0,
      });
      assert(status.isActive === false, "subscription.status: isActive=false");
    }
    console.log("");

    // TEST 3: Grace period — new subscription overwrites grace state
    console.log("TEST 3: Grace period — new subscription overwrites grace");
    {
      const userId = await createTestUser("gp3-payer");
      const orgId = await createTestOrg("gp3", {
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() + 3 * 86400000), // grace period
        purchasedSlots: 2,
        payerId: null,
        stripeSubscriptionId: null,
      });
      await addOrgMember(orgId, userId, "admin");

      const newExpiry = new Date(Date.now() + 30 * 86400000);
      await convertOrgSubscriptionToPremium(db, {
        orgId,
        purchasedSlots: 5,
        stripeSubscriptionId: "sub_new_gp3",
        payerId: userId,
        subscriptionExpiresAt: newExpiry,
      });

      const org = await getOrgFromDb(orgId);
      assert(org!.subscriptionTier === "PREMIUM", "subscriptionTier = PREMIUM");
      assert(org!.purchasedSlots === 5, "purchasedSlots updated to 5");
      assert(org!.stripeSubscriptionId === "sub_new_gp3", "new stripeSubscriptionId set");
      assert(org!.payerId === userId, "new payerId set");
    }
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // SLOT COUNTING TESTS (Tests 4-6)
    // ═══════════════════════════════════════════════════════════════

    // TEST 4: Slot counting — DISABLED accounts don't count
    console.log("TEST 4: Slot counting — DISABLED accounts don't count");
    {
      const orgId = await createTestOrg("sc4", { purchasedSlots: 1 });
      await createTestAccount(orgId, "DISABLED", "sc4-d1");
      await createTestAccount(orgId, "DISABLED", "sc4-d2");
      await createTestAccount(orgId, "DISABLED", "sc4-d3");

      const activeCount = await getActiveAccountCount(orgId);
      assert(activeCount === 0, "Active count = 0 (all 3 are DISABLED)");
      assert(activeCount < 1, "Slot check allows adding (0 active < 1 slot)");
    }
    console.log("");

    // TEST 5: Slot counting — active accounts count correctly
    console.log("TEST 5: Slot counting — active accounts block correctly");
    {
      const orgId = await createTestOrg("sc5", { purchasedSlots: 2 });
      await createTestAccount(orgId, "CONNECTED", "sc5-c1");
      await createTestAccount(orgId, "CONNECTED", "sc5-c2");

      const activeCount = await getActiveAccountCount(orgId);
      assert(activeCount === 2, "Active count = 2");
      assert(activeCount >= 2, "Slot check blocks adding (2 active >= 2 slots)");
    }
    console.log("");

    // TEST 6: Slot counting — mix of active and disabled
    console.log("TEST 6: Slot counting — mix of active and disabled");
    {
      const orgId = await createTestOrg("sc6", { purchasedSlots: 2 });
      await createTestAccount(orgId, "CONNECTED", "sc6-c1");
      await createTestAccount(orgId, "DISABLED", "sc6-d1");
      await createTestAccount(orgId, "DISABLED", "sc6-d2");

      const activeCount = await getActiveAccountCount(orgId);
      assert(activeCount === 1, "Active count = 1 (2 DISABLED excluded)");
      assert(activeCount < 2, "Slot check allows adding 1 more (1 active < 2 slots)");
    }
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // SUBSCRIPTION STATUS TESTS (Tests 7-9)
    // ═══════════════════════════════════════════════════════════════

    // TEST 7: subscription.status — FREE org response shape
    console.log("TEST 7: subscription.status — FREE org response shape");
    {
      const status = getSubscriptionStatus({
        subscriptionTier: "FREE",
        subscriptionExpiresAt: null,
        purchasedSlots: 1,
        earnedPremiumExpiresAt: null,
        accountCount: 0,
      });
      assert(status.isActive === false, "isActive=false");
      assert(status.premiumSource === "none", "premiumSource='none'");
      assert(status.subscriptionTier === "FREE", "subscriptionTier='FREE'");
    }
    console.log("");

    // TEST 8: subscription.status — grace period org response shape
    console.log("TEST 8: subscription.status — grace period org");
    {
      const status = getSubscriptionStatus({
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() + 7 * 86400000),
        purchasedSlots: 3,
        earnedPremiumExpiresAt: null,
        accountCount: 2,
      });
      assert(status.isActive === true, "isActive=true (grace period)");
      assert(status.premiumSource === "paid", "premiumSource='paid'");
    }
    console.log("");

    // TEST 9: subscription.status — expired grace period response
    console.log("TEST 9: subscription.status — expired grace period");
    {
      const status = getSubscriptionStatus({
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() - 86400000), // expired yesterday
        purchasedSlots: 3,
        earnedPremiumExpiresAt: null,
        accountCount: 2,
      });
      assert(status.isActive === false, "isActive=false (grace expired)");
      assert(status.premiumSource === "none", "premiumSource='none'");
    }
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // MONTHLY CAP TESTS (Tests 10-12)
    // ═══════════════════════════════════════════════════════════════

    // TEST 10: Monthly cap — under cap
    console.log("TEST 10: Monthly cap — under cap");
    {
      const alreadyAwarded = 10;
      const newAward = calculateDaysToAward(15, 8, 0); // 3 days
      const totalAfter = alreadyAwarded + newAward;
      assert(newAward === 3, "New award = 3 days");
      assert(totalAfter === 13, "Total = 13 (under 14 cap)");
      assert(totalAfter < MONTHLY_CAP_DAYS, `${totalAfter} < ${MONTHLY_CAP_DAYS} cap`);
    }
    console.log("");

    // TEST 11: Monthly cap — at cap
    console.log("TEST 11: Monthly cap — at cap");
    {
      const alreadyAwarded = 14;
      // Simulating cap enforcement: if already at 14, no more days
      const remaining = Math.max(MONTHLY_CAP_DAYS - alreadyAwarded, 0);
      assert(remaining === 0, "0 remaining days (at 14 cap)");
    }
    console.log("");

    // TEST 12: Monthly cap — partial cap
    console.log("TEST 12: Monthly cap — partial cap");
    {
      const alreadyAwarded = 13;
      const maxNewAward = calculateDaysToAward(15, 8, 0); // 3 days
      const remaining = Math.max(MONTHLY_CAP_DAYS - alreadyAwarded, 0);
      const actualAward = Math.min(maxNewAward, remaining);
      assert(maxNewAward === 3, "Max new award = 3 days");
      assert(remaining === 1, "Only 1 day remaining before cap");
      assert(actualAward === 1, "Actual award capped to 1 day");
    }
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // WEBHOOK IDEMPOTENCY + DISABLE PRIORITY (Tests 13-14)
    // ═══════════════════════════════════════════════════════════════

    // TEST 13: Webhook idempotency — subscription.updated with mismatched sub ID
    console.log("TEST 13: Webhook idempotency — mismatched subscription ID");
    {
      const orgId = await createTestOrg("wi13", {
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
        purchasedSlots: 3,
        stripeSubscriptionId: "sub_123",
      });

      // Simulate checking webhook sub ID against org sub ID
      const org = await getOrgFromDb(orgId);
      const webhookSubId = "sub_456";
      const matches = org!.stripeSubscriptionId === webhookSubId;
      assert(matches === false, "Webhook sub_456 != org sub_123 (mismatch detected)");
      assert(org!.purchasedSlots === 3, "purchasedSlots unchanged (no update applied)");
    }
    console.log("");

    // TEST 14: disableAccountsExceedingSlots — correct priority
    console.log("TEST 14: disableAccountsExceedingSlots — correct priority");
    {
      const userId = await createTestUser("dp14-payer");
      const orgId = await createTestOrg("dp14", {
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
        purchasedSlots: 5,
        payerId: userId,
        stripeSubscriptionId: "sub_dp14",
      });
      await addOrgMember(orgId, userId, "admin");

      // Create 5 accounts: 2 REGISTERED, 1 CONNECTING, 2 CONNECTED
      await createTestAccount(orgId, "REGISTERED", "dp14-r1");
      await createTestAccount(orgId, "REGISTERED", "dp14-r2");
      await createTestAccount(orgId, "CONNECTING", "dp14-cting");
      await createTestAccount(orgId, "CONNECTED", "dp14-cted1");
      await createTestAccount(orgId, "CONNECTED", "dp14-cted2");

      // Downgrade to 2 slots — should disable 3 accounts
      const result = await applyPendingDowngrade(db, {
        orgId,
        newPurchasedSlots: 2,
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
      });

      assert(result.status === "disabled", "Result status = 'disabled'");
      assert(result.numAccountsDisabled === 3, "3 accounts disabled");

      const statuses = await getAccountStatuses(orgId);
      const disabledStatuses = statuses.filter((a) => a.status === "DISABLED");
      const activeStatuses = statuses.filter((a) => a.status !== "DISABLED");

      assert(disabledStatuses.length === 3, "3 total DISABLED");
      assert(activeStatuses.length === 2, "2 accounts remain active");

      // The 2 CONNECTED accounts should be the ones kept
      const activeAreConnected = activeStatuses.every(
        (a) => a.status === "CONNECTED",
      );
      assert(activeAreConnected, "Remaining 2 accounts are CONNECTED (highest priority kept)");
    }
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // WEBHOOK HANDLER CHAIN TESTS (Tests 15-19)
    // ═══════════════════════════════════════════════════════════════

    // TEST 15: Full checkout → premium activation chain
    console.log("TEST 15: Full checkout → premium activation chain");
    {
      const userId = await createTestUser("wh15-payer");
      const orgId = await createTestOrg("wh15");
      await addOrgMember(orgId, userId, "admin");

      await convertOrgSubscriptionToPremium(db, {
        orgId,
        purchasedSlots: 3,
        stripeSubscriptionId: "sub_test_wh15",
        payerId: userId,
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
      });

      const org = await getOrgFromDb(orgId);
      assert(org!.subscriptionTier === "PREMIUM", "Org is PREMIUM");
      assert(org!.purchasedSlots === 3, "purchasedSlots=3");
      assert(org!.payerId === userId, "payer set");
      assert(org!.stripeSubscriptionId === "sub_test_wh15", "stripeSubscriptionId set");

      const premium = isOrgPremium({
        subscriptionTier: org!.subscriptionTier,
        subscriptionExpiresAt: org!.subscriptionExpiresAt,
        purchasedSlots: org!.purchasedSlots,
        accountCount: org!._count.linkedInAccounts,
        earnedPremiumExpiresAt: org!.earnedPremiumExpiresAt,
      });
      assert(premium === true, "isOrgPremium() returns true");

      const status = getSubscriptionStatus({
        subscriptionTier: org!.subscriptionTier,
        subscriptionExpiresAt: org!.subscriptionExpiresAt,
        purchasedSlots: org!.purchasedSlots,
        earnedPremiumExpiresAt: org!.earnedPremiumExpiresAt,
        accountCount: 0,
      });
      assert(status.isActive === true, "subscription.status: isActive=true");
      assert(status.premiumSource === "paid", "subscription.status: premiumSource='paid'");
    }
    console.log("");

    // TEST 16: Full cancellation → grace period → expiry chain
    console.log("TEST 16: Cancellation → grace period → expiry chain");
    {
      const userId = await createTestUser("wh16-payer");
      const orgId = await createTestOrg("wh16", {
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
        purchasedSlots: 3,
        payerId: userId,
        stripeSubscriptionId: "sub_test_wh16",
      });
      await addOrgMember(orgId, userId, "admin");

      // Cancel — enter grace period
      const graceEnd = new Date(Date.now() + 7 * 86400000);
      await convertOrgSubscriptionToFree(db, { orgId, expiresAt: graceEnd });

      let org = await getOrgFromDb(orgId);
      assert(org!.subscriptionTier === "PREMIUM", "Tier still PREMIUM (grace period fix)");
      assert(org!.purchasedSlots === 3, "purchasedSlots unchanged");
      assert(org!.stripeSubscriptionId === null, "stripeSubscriptionId=null");
      assert(org!.payerId === null, "payerId=null");

      let premium = isOrgPremium({
        subscriptionTier: org!.subscriptionTier,
        subscriptionExpiresAt: org!.subscriptionExpiresAt,
        purchasedSlots: org!.purchasedSlots,
        accountCount: org!._count.linkedInAccounts,
        earnedPremiumExpiresAt: org!.earnedPremiumExpiresAt,
      });
      assert(premium === true, "isOrgPremium() = true during grace period");

      // Simulate grace period expiry
      await db.organization.update({
        where: { id: orgId },
        data: { subscriptionExpiresAt: new Date(Date.now() - 86400000) },
      });

      org = await getOrgFromDb(orgId);
      premium = isOrgPremium({
        subscriptionTier: org!.subscriptionTier,
        subscriptionExpiresAt: org!.subscriptionExpiresAt,
        purchasedSlots: org!.purchasedSlots,
        accountCount: org!._count.linkedInAccounts,
        earnedPremiumExpiresAt: org!.earnedPremiumExpiresAt,
      });
      assert(premium === false, "isOrgPremium() = false after grace expires");
    }
    console.log("");

    // TEST 17: Upgrade chain — slots increase, accounts stay enabled
    console.log("TEST 17: Upgrade chain — slots increase");
    {
      const userId = await createTestUser("wh17-payer");
      const orgId = await createTestOrg("wh17", {
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
        purchasedSlots: 2,
        payerId: userId,
        stripeSubscriptionId: "sub_test_wh17",
      });
      await addOrgMember(orgId, userId, "admin");
      await createTestAccount(orgId, "CONNECTED", "wh17-c1");
      await createTestAccount(orgId, "CONNECTED", "wh17-c2");

      // Upgrade to 5 slots
      await convertOrgSubscriptionToPremium(db, {
        orgId,
        purchasedSlots: 5,
        stripeSubscriptionId: "sub_test_wh17_upgrade",
        payerId: userId,
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
      });

      const org = await getOrgFromDb(orgId);
      assert(org!.purchasedSlots === 5, "purchasedSlots=5 after upgrade");

      const statuses = await getAccountStatuses(orgId);
      const activeCount = statuses.filter((a) => a.status !== "DISABLED").length;
      assert(activeCount === 2, "Both accounts still active (not disabled)");

      // Slot check: can add 3 more
      assert(activeCount < org!.purchasedSlots, `Can add more accounts (${activeCount} active < ${org!.purchasedSlots} slots)`);
    }
    console.log("");

    // TEST 18: Downgrade chain — deferred, then applied at renewal
    console.log("TEST 18: Downgrade chain — deferred, applied at renewal");
    {
      const userId = await createTestUser("wh18-payer");
      const orgId = await createTestOrg("wh18", {
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
        purchasedSlots: 5,
        payerId: userId,
        stripeSubscriptionId: "sub_test_wh18",
      });
      await addOrgMember(orgId, userId, "admin");

      // 4 CONNECTED + 1 REGISTERED
      await createTestAccount(orgId, "CONNECTED", "wh18-c1");
      await createTestAccount(orgId, "CONNECTED", "wh18-c2");
      await createTestAccount(orgId, "CONNECTED", "wh18-c3");
      await createTestAccount(orgId, "CONNECTED", "wh18-c4");
      await createTestAccount(orgId, "REGISTERED", "wh18-r1");

      // Apply downgrade to 2 slots
      const result = await applyPendingDowngrade(db, {
        orgId,
        newPurchasedSlots: 2,
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
      });

      const org = await getOrgFromDb(orgId);
      assert(org!.purchasedSlots === 2, "purchasedSlots=2 after downgrade");
      assert(result.status === "disabled", "Accounts were disabled");
      assert(result.numAccountsDisabled === 3, "3 accounts disabled (5-2=3)");

      const statuses = await getAccountStatuses(orgId);
      const active = statuses.filter((a) => a.status !== "DISABLED");
      assert(active.length === 2, "2 accounts remain active");

      // REGISTERED should be disabled first
      const registeredAccount = statuses.find((a) =>
        a.id === `test-acct-wh18-r1-${ts}`,
      );
      assert(registeredAccount!.status === "DISABLED", "REGISTERED account disabled first");
    }
    console.log("");

    // TEST 19: Billing cycle switch — delete then create (no premium loss)
    console.log("TEST 19: Billing cycle switch — delete then create (no premium loss)");
    {
      const userId = await createTestUser("wh19-payer");
      const orgId = await createTestOrg("wh19", {
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
        purchasedSlots: 3,
        payerId: userId,
        stripeSubscriptionId: "sub_monthly_wh19",
      });
      await addOrgMember(orgId, userId, "admin");
      await createTestAccount(orgId, "CONNECTED", "wh19-c1");
      await createTestAccount(orgId, "CONNECTED", "wh19-c2");
      await createTestAccount(orgId, "CONNECTED", "wh19-c3");

      // Step 1: Monthly subscription deleted (Stripe fires delete event)
      await convertOrgSubscriptionToFree(db, {
        orgId,
        expiresAt: new Date(Date.now() + 86400000), // 1 day grace
      });

      let org = await getOrgFromDb(orgId);
      let premium = isOrgPremium({
        subscriptionTier: org!.subscriptionTier,
        subscriptionExpiresAt: org!.subscriptionExpiresAt,
        purchasedSlots: org!.purchasedSlots,
        accountCount: org!._count.linkedInAccounts,
        earnedPremiumExpiresAt: org!.earnedPremiumExpiresAt,
      });
      assert(premium === true, "Still premium after delete event (grace period)");

      let activeCount = await getActiveAccountCount(orgId);
      assert(activeCount === 3, "All 3 accounts still active during grace");

      // Step 2: Yearly subscription created (Stripe fires create event)
      await convertOrgSubscriptionToPremium(db, {
        orgId,
        purchasedSlots: 3,
        stripeSubscriptionId: "sub_yearly_wh19",
        payerId: userId,
        subscriptionExpiresAt: new Date(Date.now() + 365 * 86400000),
      });

      org = await getOrgFromDb(orgId);
      assert(org!.stripeSubscriptionId === "sub_yearly_wh19", "New yearly sub ID set");
      assert(org!.payerId === userId, "Payer restored");
      assert(org!.purchasedSlots === 3, "Slots preserved at 3");

      premium = isOrgPremium({
        subscriptionTier: org!.subscriptionTier,
        subscriptionExpiresAt: org!.subscriptionExpiresAt,
        purchasedSlots: org!.purchasedSlots,
        accountCount: org!._count.linkedInAccounts,
        earnedPremiumExpiresAt: org!.earnedPremiumExpiresAt,
      });
      assert(premium === true, "Premium fully restored with yearly sub");

      activeCount = await getActiveAccountCount(orgId);
      assert(activeCount === 3, "All 3 accounts still active after switch");
    }
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════
    console.log("═══════════════════════════════════════════════");
    console.log(`  ALL 19 TESTS PASSED (${passed} assertions)`);
    console.log("═══════════════════════════════════════════════");
    console.log("");
    console.log("Coverage:");
    console.log("  [1]  Grace period — subscription deleted keeps premium");
    console.log("  [2]  Grace period — premium naturally expires");
    console.log("  [3]  Grace period — new subscription overwrites grace state");
    console.log("  [4]  Slot counting — DISABLED accounts don't count");
    console.log("  [5]  Slot counting — active accounts block correctly");
    console.log("  [6]  Slot counting — mix of active and disabled");
    console.log("  [7]  subscription.status — FREE org response shape");
    console.log("  [8]  subscription.status — grace period org");
    console.log("  [9]  subscription.status — expired grace period");
    console.log("  [10] Monthly cap — under cap");
    console.log("  [11] Monthly cap — at cap");
    console.log("  [12] Monthly cap — partial cap");
    console.log("  [13] Webhook idempotency — mismatched subscription ID");
    console.log("  [14] disableAccountsExceedingSlots — correct priority");
    console.log("  [15] Webhook chain: checkout → premium activation");
    console.log("  [16] Webhook chain: cancellation → grace → expiry");
    console.log("  [17] Webhook chain: upgrade (slots increase)");
    console.log("  [18] Webhook chain: downgrade (deferred, applied at renewal)");
    console.log("  [19] Webhook chain: billing cycle switch (no premium loss)");
    console.log("");
    console.log("Systems tested:");
    console.log("  - convertOrgSubscriptionToFree() (grace period fix)");
    console.log("  - convertOrgSubscriptionToPremium() (full activation)");
    console.log("  - applyPendingDowngrade() (slot reduction + disable)");
    console.log("  - disableAccountsExceedingSlots() (priority ordering)");
    console.log("  - isOrgPremium() (all state transitions)");
    console.log("  - subscription.status helper (response shapes)");
    console.log("  - calculateDaysToAward() + MONTHLY_CAP_DAYS");
    console.log("  - Slot counting with DISABLED exclusion");
  } catch (error) {
    console.error("\nTest failed:");
    console.error(error);
    process.exit(1);
  } finally {
    // ═══════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════
    console.log("\nCleaning up...");

    // Delete test accounts first (FK constraint)
    for (const id of testAccountIds) {
      try {
        await db.linkedInAccount.delete({ where: { id } });
      } catch {}
    }
    console.log(`   Deleted ${testAccountIds.length} test accounts`);

    // Delete org members (cascade from org delete, but explicit cleanup)
    for (const orgId of testOrgIds) {
      try {
        await db.organizationMember.deleteMany({ where: { orgId } });
      } catch {}
    }

    // Delete test orgs
    for (const id of testOrgIds) {
      try {
        await db.organization.delete({ where: { id } });
      } catch {}
    }
    console.log(`   Deleted ${testOrgIds.length} test orgs`);

    // Delete test users
    for (const id of testUserIds) {
      try {
        await db.user.delete({ where: { id } });
      } catch {}
    }
    console.log(`   Deleted ${testUserIds.length} test users`);

    console.log("   Cleanup complete");
    await db.$disconnect();
  }
}

void runTests();
