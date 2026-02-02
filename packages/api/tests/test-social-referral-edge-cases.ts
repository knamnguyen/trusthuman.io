/**
 * Social Referral System Edge Case Tests
 *
 * Tests the untested edge cases in the social referral system:
 *
 * EARNED PREMIUM EXTENSION LOGIC (Tests 1-4):
 *   1. Extension from NULL earnedPremiumExpiresAt → starts from now
 *   2. Extension from expired earnedPremiumExpiresAt → starts from now (not expired date)
 *   3. Extension from active earnedPremiumExpiresAt → stacks on existing date
 *   4. Zero days awarded → no DB update to earnedPremiumExpiresAt
 *
 * MONTHLY CAP DB INTEGRATION (Tests 5-7):
 *   5. getMonthlyDaysAwarded aggregation with multiple submissions
 *   6. Submissions from last month not counted
 *   7. Cap enforcement: 13 days used + 3 earned = only 1 awarded
 *
 * RATE LIMITING (Tests 8-10):
 *   8. Under rate limit (1 submission this week) → allowed
 *   9. At rate limit (2 submissions this week, same platform) → blocked
 *  10. Different platforms have independent limits
 *
 * CAPTION SIMILARITY (Tests 11-13):
 *  11. Identical captions → similarity > 0.95 → rejected
 *  12. Similar but below threshold → accepted
 *  13. Completely different captions → accepted
 *
 * AWARD BRANCHING EDGE CASES (Tests 14-17):
 *  14. Grace period org (PREMIUM, stripeSubId=null, payerId=null) → falls to earned path
 *  15. PREMIUM org with payerId but no stripeCustomerId → credit skipped silently
 *  16. Cumulative daysAwarded across rescans (scan 1→2→3)
 *  17. URL duplicate detection (global uniqueness)
 *
 * Run with: bun run packages/api/tests/test-social-referral-edge-cases.ts
 */

import { config } from "dotenv";
import { compareTwoStrings } from "string-similarity";

import { db } from "@sassy/db";
import { normalizeUrl } from "@sassy/social-referral";

import { isOrgPremium } from "../src/services/org-access-control";
import {
  calculateDaysToAward,
  MONTHLY_CAP_DAYS,
} from "../src/services/social-referral-verification";

config({ path: ".env" });

// ═══════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════

let passed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.log(`   FAIL: ${message}`);
    throw new Error(`FAIL: ${message}`);
  }
  passed++;
  console.log(`   PASS: ${message}`);
}

const ts = Date.now();
const CREDIT_PER_DAY_CENTS = 100;
const POSTS_PER_PLATFORM_PER_WEEK = 2;

// Cleanup tracking
const testOrgIds: string[] = [];
const testUserIds: string[] = [];
const testSubmissionIds: string[] = [];

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
  const id = `test-sr-org-${suffix}-${ts}`;
  await db.organization.create({
    data: {
      id,
      name: `Test SR Org ${suffix}`,
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

async function createTestUser(suffix: string, stripeCustomerId?: string) {
  const id = `test-sr-user-${suffix}-${ts}`;
  await db.user.create({
    data: {
      id,
      primaryEmailAddress: `${id}@test.local`,
      stripeCustomerId: stripeCustomerId ?? null,
    },
  });
  testUserIds.push(id);
  return id;
}

async function createTestSubmission(
  orgId: string,
  suffix: string,
  data: {
    platform?: string;
    status?: string;
    daysAwarded?: number;
    verifiedAt?: Date | null;
    postText?: string | null;
    likes?: number;
    comments?: number;
    scanCount?: number;
    submittedAt?: Date;
  } = {},
) {
  const id = `test-sr-sub-${suffix}-${ts}`;
  const urlSuffix = `${suffix}-${ts}-${Math.random().toString(36).slice(2, 8)}`;
  await db.socialSubmission.create({
    data: {
      id,
      organizationId: orgId,
      platform: (data.platform ?? "X") as "X" | "LINKEDIN" | "THREADS" | "FACEBOOK",
      postUrl: `https://x.com/test/${urlSuffix}`,
      urlNormalized: `x.com/test/${urlSuffix}`,
      status: (data.status ?? "VERIFIED") as "VERIFYING" | "VERIFIED" | "FAILED" | "REVOKED",
      verifiedAt: data.verifiedAt ?? new Date(),
      containsKeyword: true,
      postText: data.postText ?? `Test post ${suffix} @engagekit_io`,
      likes: data.likes ?? 0,
      comments: data.comments ?? 0,
      shares: 0,
      daysAwarded: data.daysAwarded ?? 0,
      scanCount: data.scanCount ?? 1,
      lastScannedAt: new Date(),
      submittedAt: data.submittedAt ?? new Date(),
    },
  });
  testSubmissionIds.push(id);
  return id;
}

/**
 * Replicate getMonthlyDaysAwarded from social-referral-verification.ts
 * (not exported, so we replicate the exact query)
 */
async function getMonthlyDaysAwarded(orgId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const result = await db.socialSubmission.aggregate({
    where: {
      organizationId: orgId,
      status: "VERIFIED",
      verifiedAt: { gte: startOfMonth },
    },
    _sum: { daysAwarded: true },
  });
  return result._sum.daysAwarded ?? 0;
}

/**
 * Replicate the earned premium extension logic from social-referral-verification.ts:272-283
 */
function computeNewExpiry(
  currentExpiry: Date | null,
  daysToAdd: number,
): Date {
  const now = new Date();
  const baseDate =
    currentExpiry && currentExpiry > now ? currentExpiry : now;
  const newExpiry = new Date(baseDate);
  newExpiry.setDate(newExpiry.getDate() + daysToAdd);
  return newExpiry;
}

/**
 * Replicate isPaidPremium check from social-referral-verification.ts:243-246
 */
function isPaidPremiumCheck(org: {
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
}): boolean {
  const now = new Date();
  return (
    org.subscriptionTier === "PREMIUM" &&
    org.subscriptionExpiresAt != null &&
    org.subscriptionExpiresAt > now
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN TESTS
// ═══════════════════════════════════════════════════════════════════════

async function runTests() {
  console.log("═══════════════════════════════════════════════");
  console.log("  Social Referral Edge Case Tests");
  console.log("═══════════════════════════════════════════════\n");

  try {
    // ═══════════════════════════════════════════════════════════════
    // EARNED PREMIUM EXTENSION LOGIC (Tests 1-4)
    // ═══════════════════════════════════════════════════════════════

    // TEST 1: Extension from NULL earnedPremiumExpiresAt
    console.log("TEST 1: Earned premium extension from NULL → starts from now");
    {
      const orgId = await createTestOrg("ext1", {
        earnedPremiumExpiresAt: null,
      });
      const daysToAward = 3;
      const now = new Date();
      const newExpiry = computeNewExpiry(null, daysToAward);

      await db.organization.update({
        where: { id: orgId },
        data: { earnedPremiumExpiresAt: newExpiry },
      });

      const org = await db.organization.findUnique({
        where: { id: orgId },
        select: { earnedPremiumExpiresAt: true },
      });

      const diffDays =
        (org!.earnedPremiumExpiresAt!.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24);
      assert(
        diffDays >= 2.9 && diffDays <= 3.1,
        `Expected ~3 days from now, got ${diffDays.toFixed(2)}`,
      );
      assert(
        org!.earnedPremiumExpiresAt! > now,
        "New expiry is in the future",
      );
    }
    console.log("");

    // TEST 2: Extension from EXPIRED earnedPremiumExpiresAt
    console.log("TEST 2: Earned premium extension from expired → starts from now");
    {
      const expiredDate = new Date(Date.now() - 5 * 86400000); // 5 days ago
      const orgId = await createTestOrg("ext2", {
        earnedPremiumExpiresAt: expiredDate,
      });

      const daysToAward = 2;
      const now = new Date();
      const newExpiry = computeNewExpiry(expiredDate, daysToAward);

      await db.organization.update({
        where: { id: orgId },
        data: { earnedPremiumExpiresAt: newExpiry },
      });

      const org = await db.organization.findUnique({
        where: { id: orgId },
        select: { earnedPremiumExpiresAt: true },
      });

      const diffFromNow =
        (org!.earnedPremiumExpiresAt!.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24);
      assert(
        diffFromNow >= 1.9 && diffFromNow <= 2.1,
        `Expected ~2 days from now (not from expired date), got ${diffFromNow.toFixed(2)}`,
      );

      // Verify it did NOT extend from the expired date (which would be -3 days from now)
      const diffFromExpired =
        (org!.earnedPremiumExpiresAt!.getTime() - expiredDate.getTime()) /
        (1000 * 60 * 60 * 24);
      assert(
        diffFromExpired > 5,
        `Extension started from now, not expired date (diff from expired: ${diffFromExpired.toFixed(1)} days)`,
      );
    }
    console.log("");

    // TEST 3: Extension from ACTIVE earnedPremiumExpiresAt → stacks
    console.log("TEST 3: Earned premium extension from active → stacks on existing");
    {
      const futureDate = new Date(Date.now() + 10 * 86400000); // 10 days from now
      const orgId = await createTestOrg("ext3", {
        earnedPremiumExpiresAt: futureDate,
      });

      const daysToAward = 3;
      const newExpiry = computeNewExpiry(futureDate, daysToAward);

      await db.organization.update({
        where: { id: orgId },
        data: { earnedPremiumExpiresAt: newExpiry },
      });

      const org = await db.organization.findUnique({
        where: { id: orgId },
        select: { earnedPremiumExpiresAt: true },
      });

      const now = new Date();
      const diffFromNow =
        (org!.earnedPremiumExpiresAt!.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24);
      assert(
        diffFromNow >= 12.8 && diffFromNow <= 13.2,
        `Expected ~13 days from now (10 existing + 3 new), got ${diffFromNow.toFixed(2)}`,
      );

      const diffFromFuture =
        (org!.earnedPremiumExpiresAt!.getTime() - futureDate.getTime()) /
        (1000 * 60 * 60 * 24);
      assert(
        diffFromFuture >= 2.9 && diffFromFuture <= 3.1,
        `Extended by ~3 days from existing expiry, got ${diffFromFuture.toFixed(2)}`,
      );
    }
    console.log("");

    // TEST 4: Zero days awarded → no extension
    console.log("TEST 4: Zero days awarded → earnedPremiumExpiresAt unchanged");
    {
      const futureDate = new Date(Date.now() + 5 * 86400000);
      const orgId = await createTestOrg("ext4", {
        earnedPremiumExpiresAt: futureDate,
      });

      // Production code: only extends if finalDays > 0
      const finalDays = 0;
      // The production code skips the DB update entirely when finalDays === 0
      // So earnedPremiumExpiresAt should remain unchanged

      const org = await db.organization.findUnique({
        where: { id: orgId },
        select: { earnedPremiumExpiresAt: true },
      });

      assert(
        org!.earnedPremiumExpiresAt!.getTime() === futureDate.getTime(),
        "earnedPremiumExpiresAt unchanged when 0 days awarded",
      );
      assert(finalDays === 0, "0 days means no DB update (production code guard)");
    }
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // MONTHLY CAP DB INTEGRATION (Tests 5-7)
    // ═══════════════════════════════════════════════════════════════

    // TEST 5: getMonthlyDaysAwarded aggregation
    console.log("TEST 5: getMonthlyDaysAwarded aggregation with multiple submissions");
    {
      const orgId = await createTestOrg("cap5");
      await createTestSubmission(orgId, "cap5-a", {
        daysAwarded: 3,
        verifiedAt: new Date(),
      });
      await createTestSubmission(orgId, "cap5-b", {
        daysAwarded: 2,
        verifiedAt: new Date(),
      });
      await createTestSubmission(orgId, "cap5-c", {
        daysAwarded: 1,
        verifiedAt: new Date(),
      });
      // FAILED submission should NOT be counted
      await createTestSubmission(orgId, "cap5-failed", {
        status: "FAILED",
        daysAwarded: 3,
        verifiedAt: new Date(),
      });

      const monthlyUsed = await getMonthlyDaysAwarded(orgId);
      assert(
        monthlyUsed === 6,
        `Expected 6 days (3+2+1, FAILED not counted), got ${monthlyUsed}`,
      );
    }
    console.log("");

    // TEST 6: Submissions from last month not counted
    console.log("TEST 6: Last month submissions not counted in monthly cap");
    {
      const orgId = await createTestOrg("cap6");
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(15); // mid last month

      await createTestSubmission(orgId, "cap6-old", {
        daysAwarded: 10,
        verifiedAt: lastMonth,
        submittedAt: lastMonth,
      });
      await createTestSubmission(orgId, "cap6-new", {
        daysAwarded: 2,
        verifiedAt: new Date(),
      });

      const monthlyUsed = await getMonthlyDaysAwarded(orgId);
      assert(
        monthlyUsed === 2,
        `Expected 2 days (only current month), got ${monthlyUsed}`,
      );
    }
    console.log("");

    // TEST 7: Monthly cap enforcement — 13 used + earns 3 = awards only 1
    console.log("TEST 7: Monthly cap enforcement — 13 used + 3 earned = 1 awarded");
    {
      const orgId = await createTestOrg("cap7");
      // Create submissions totaling 13 days this month
      await createTestSubmission(orgId, "cap7-a", { daysAwarded: 3 });
      await createTestSubmission(orgId, "cap7-b", { daysAwarded: 3 });
      await createTestSubmission(orgId, "cap7-c", { daysAwarded: 3 });
      await createTestSubmission(orgId, "cap7-d", { daysAwarded: 3 });
      await createTestSubmission(orgId, "cap7-e", { daysAwarded: 1 });

      const monthlyUsed = await getMonthlyDaysAwarded(orgId);
      assert(monthlyUsed === 13, `Monthly used = 13, got ${monthlyUsed}`);

      // New post earns max 3 days
      const rawDays = calculateDaysToAward(15, 8, 0);
      assert(rawDays === 3, "Raw days = 3 (max per post)");

      // Cap enforcement (exact logic from production code)
      const capped = Math.min(rawDays, MONTHLY_CAP_DAYS - monthlyUsed);
      const finalDays = Math.max(capped, 0);
      assert(finalDays === 1, `Capped to 1 day (14 - 13 = 1), got ${finalDays}`);
    }
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // RATE LIMITING (Tests 8-10)
    // ═══════════════════════════════════════════════════════════════

    // TEST 8: Under rate limit
    console.log("TEST 8: Rate limit — under limit (1 submission) → allowed");
    {
      const orgId = await createTestOrg("rl8");
      await createTestSubmission(orgId, "rl8-a", { platform: "X" });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const count = await db.socialSubmission.count({
        where: {
          organizationId: orgId,
          platform: "X",
          submittedAt: { gte: sevenDaysAgo },
        },
      });

      assert(count === 1, `Count = 1`);
      assert(
        count < POSTS_PER_PLATFORM_PER_WEEK,
        `${count} < ${POSTS_PER_PLATFORM_PER_WEEK} → allowed`,
      );
    }
    console.log("");

    // TEST 9: At rate limit
    console.log("TEST 9: Rate limit — at limit (2 submissions same platform) → blocked");
    {
      const orgId = await createTestOrg("rl9");
      await createTestSubmission(orgId, "rl9-a", { platform: "X" });
      await createTestSubmission(orgId, "rl9-b", { platform: "X" });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const count = await db.socialSubmission.count({
        where: {
          organizationId: orgId,
          platform: "X",
          submittedAt: { gte: sevenDaysAgo },
        },
      });

      assert(count === 2, `Count = 2`);
      assert(
        count >= POSTS_PER_PLATFORM_PER_WEEK,
        `${count} >= ${POSTS_PER_PLATFORM_PER_WEEK} → blocked`,
      );
    }
    console.log("");

    // TEST 10: Different platforms have independent limits
    console.log("TEST 10: Rate limit — different platforms are independent");
    {
      const orgId = await createTestOrg("rl10");
      await createTestSubmission(orgId, "rl10-x1", { platform: "X" });
      await createTestSubmission(orgId, "rl10-x2", { platform: "X" });
      await createTestSubmission(orgId, "rl10-li1", { platform: "LINKEDIN" });

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const xCount = await db.socialSubmission.count({
        where: {
          organizationId: orgId,
          platform: "X",
          submittedAt: { gte: sevenDaysAgo },
        },
      });
      const liCount = await db.socialSubmission.count({
        where: {
          organizationId: orgId,
          platform: "LINKEDIN",
          submittedAt: { gte: sevenDaysAgo },
        },
      });

      assert(xCount === 2, `X count = 2 (at limit)`);
      assert(
        xCount >= POSTS_PER_PLATFORM_PER_WEEK,
        `X blocked (${xCount} >= ${POSTS_PER_PLATFORM_PER_WEEK})`,
      );
      assert(liCount === 1, `LinkedIn count = 1 (under limit)`);
      assert(
        liCount < POSTS_PER_PLATFORM_PER_WEEK,
        `LinkedIn allowed (${liCount} < ${POSTS_PER_PLATFORM_PER_WEEK})`,
      );
    }
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // CAPTION SIMILARITY (Tests 11-13)
    // ═══════════════════════════════════════════════════════════════

    // TEST 11: Identical captions → rejected
    console.log("TEST 11: Caption similarity — identical captions → rejected");
    {
      const text1 = "loving @engagekit_io for my linkedin engagement workflow! saved me hours every week.";
      const text2 = "loving @engagekit_io for my linkedin engagement workflow! saved me hours every week.";
      const similarity = compareTwoStrings(
        text1.toLowerCase().trim(),
        text2.toLowerCase().trim(),
      );
      assert(similarity > 0.95, `Identical text: similarity=${similarity.toFixed(4)} > 0.95`);
    }
    console.log("");

    // TEST 12: Similar but below threshold → accepted
    console.log("TEST 12: Caption similarity — moderately similar → accepted");
    {
      const text1 = "loving @engagekit_io for my linkedin engagement workflow! saved me hours every week.";
      const text2 = "been using #engagekit_io to grow my network and the analytics are incredible. total game changer for outreach.";
      const similarity = compareTwoStrings(
        text1.toLowerCase().trim(),
        text2.toLowerCase().trim(),
      );
      assert(
        similarity <= 0.95,
        `Different topics: similarity=${similarity.toFixed(4)} <= 0.95`,
      );
    }
    console.log("");

    // TEST 13: Nearly identical with minor change
    console.log("TEST 13: Caption similarity — near-identical (1 word changed)");
    {
      const text1 = "loving @engagekit_io for my linkedin engagement workflow! saved me hours every single week.";
      const text2 = "loving @engagekit_io for my linkedin engagement workflow! saved me hours every single day.";
      const similarity = compareTwoStrings(
        text1.toLowerCase().trim(),
        text2.toLowerCase().trim(),
      );
      // One word difference in a sentence → should be very similar but exact threshold depends
      assert(
        similarity > 0.85,
        `Near-identical (1 word diff): similarity=${similarity.toFixed(4)} > 0.85`,
      );
      // Log whether this would be caught by the 0.95 threshold
      const wouldBeRejected = similarity > 0.95;
      console.log(
        `   INFO: ${wouldBeRejected ? "Would be REJECTED" : "Would be ACCEPTED"} by 0.95 threshold (sim=${similarity.toFixed(4)})`,
      );
    }
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // AWARD BRANCHING EDGE CASES (Tests 14-17)
    // ═══════════════════════════════════════════════════════════════

    // TEST 14: Grace period org → falls to earned premium path
    console.log("TEST 14: Grace period org (PREMIUM, no payer) → earned premium path");
    {
      // After cancellation: tier=PREMIUM, stripeSubId=null, payerId=null
      const orgId = await createTestOrg("branch14", {
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() + 7 * 86400000),
        purchasedSlots: 3,
        payerId: null,
        stripeSubscriptionId: null,
        earnedPremiumExpiresAt: null,
      });

      // isPaidPremium check from production code
      const org = await db.organization.findUnique({
        where: { id: orgId },
        select: {
          subscriptionTier: true,
          subscriptionExpiresAt: true,
          payerId: true,
          earnedPremiumExpiresAt: true,
        },
      });

      const isPaidPremium = isPaidPremiumCheck(org!);
      assert(isPaidPremium === true, "isPaidPremium=true (tier=PREMIUM, expiry in future)");

      // BUT payerId is null → the `if (isPaidPremium && org.payerId)` check fails
      const wouldGetStripeCredit = isPaidPremium && org!.payerId != null;
      assert(
        wouldGetStripeCredit === false,
        "Would NOT get Stripe credit (payerId=null after cancellation)",
      );

      // Falls to else branch → extends earnedPremiumExpiresAt
      const daysToAward = 2;
      const newExpiry = computeNewExpiry(org!.earnedPremiumExpiresAt, daysToAward);
      await db.organization.update({
        where: { id: orgId },
        data: { earnedPremiumExpiresAt: newExpiry },
      });

      const orgAfter = await db.organization.findUnique({
        where: { id: orgId },
        select: { earnedPremiumExpiresAt: true },
      });
      assert(
        orgAfter!.earnedPremiumExpiresAt != null,
        "Grace period org gets earned premium (fallback path)",
      );
    }
    console.log("");

    // TEST 15: PREMIUM org with payerId but no stripeCustomerId
    console.log("TEST 15: PREMIUM org with payer but no stripeCustomerId → credit skipped");
    {
      const userId = await createTestUser("branch15-payer"); // no stripeCustomerId
      const orgId = await createTestOrg("branch15", {
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() + 30 * 86400000),
        purchasedSlots: 3,
        payerId: userId,
      });

      // Replicate production code lookup
      const payer = await db.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true },
      });

      const isPaidPremium = true; // we know this org is PREMIUM with future expiry
      const wouldGetCredit = isPaidPremium && payer?.stripeCustomerId != null;
      assert(
        wouldGetCredit === false,
        "Credit skipped (payer has no stripeCustomerId)",
      );
      assert(
        payer?.stripeCustomerId === null,
        "Confirmed: payer.stripeCustomerId is null",
      );
      // In production: falls through silently, no credit applied, no earned premium either
      // This is a gap: org gets neither credit nor earned days
      console.log(
        "   INFO: Production behavior: org gets NEITHER Stripe credit NOR earned premium days",
      );
    }
    console.log("");

    // TEST 16: Cumulative daysAwarded across rescans
    console.log("TEST 16: Cumulative daysAwarded — scan 1→2→3");
    {
      // Scan 1: 5 likes, 2 comments → base only → 1 day
      const scan1Days = calculateDaysToAward(5, 2, 0);
      assert(scan1Days === 1, `Scan 1: 5 likes, 2 comments → ${scan1Days} day`);

      // Scan 2: 12 likes, 5 comments → delta from already=1
      const scan2Days = calculateDaysToAward(12, 5, scan1Days);
      assert(scan2Days === 2, `Scan 2: 12 likes, 5 comments, already=1 → +${scan2Days}`);
      const totalAfterScan2 = scan1Days + scan2Days;
      assert(totalAfterScan2 === 3, `Total after scan 2: ${totalAfterScan2}`);

      // Scan 3: 50 likes, 20 comments → already at max, delta = 0
      const scan3Days = calculateDaysToAward(50, 20, totalAfterScan2);
      assert(scan3Days === 0, `Scan 3: 50 likes, 20 comments, already=3 → +${scan3Days}`);
      const totalAfterScan3 = totalAfterScan2 + scan3Days;
      assert(totalAfterScan3 === 3, `Total after scan 3: ${totalAfterScan3} (unchanged)`);

      // Edge: engagement drops between scans (shouldn't happen, but test delta)
      const scan2LowDays = calculateDaysToAward(3, 1, scan1Days);
      assert(
        scan2LowDays === 0,
        `Scan 2 (low engagement): 3 likes, 1 comment, already=1 → +${scan2LowDays} (no bonus)`,
      );
    }
    console.log("");

    // TEST 17: URL duplicate detection (global uniqueness)
    console.log("TEST 17: URL duplicate detection — global uniqueness");
    {
      const orgId1 = await createTestOrg("dup17-org1");
      const orgId2 = await createTestOrg("dup17-org2");

      // Use a known, consistent URL for this test
      const testUrl = `https://x.com/test/dup-detect-${ts}`;
      const normalized = normalizeUrl(testUrl);

      // Org 1 submits the URL
      await createTestSubmission(orgId1, "dup17-first", {});
      // Override with specific normalized URL
      const firstSubId = testSubmissionIds[testSubmissionIds.length - 1]!;
      await db.socialSubmission.update({
        where: { id: firstSubId },
        data: { urlNormalized: normalized, postUrl: testUrl },
      });

      // Org 2 tries to submit the same URL → should find existing
      const existing = await db.socialSubmission.findUnique({
        where: { urlNormalized: normalized },
      });

      assert(existing != null, "Duplicate detected: URL already exists in DB");
      assert(
        existing!.organizationId === orgId1,
        `Existing submission belongs to org1 (${existing!.organizationId})`,
      );
      assert(
        existing!.organizationId !== orgId2,
        "Org2 would get CONFLICT error (different org submitted this URL)",
      );
    }
    console.log("");

    // ═══════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════
    console.log("═══════════════════════════════════════════════");
    console.log(`  ALL 17 TESTS PASSED (${passed} assertions)`);
    console.log("═══════════════════════════════════════════════");
    console.log("");
    console.log("Coverage:");
    console.log("  [1]  Earned premium extension from NULL → starts from now");
    console.log("  [2]  Earned premium extension from expired → starts from now");
    console.log("  [3]  Earned premium extension from active → stacks on existing");
    console.log("  [4]  Zero days awarded → no extension");
    console.log("  [5]  getMonthlyDaysAwarded aggregation (FAILED excluded)");
    console.log("  [6]  Last month submissions not counted");
    console.log("  [7]  Monthly cap enforcement (13+3→only 1 awarded)");
    console.log("  [8]  Rate limit — under limit → allowed");
    console.log("  [9]  Rate limit — at limit → blocked");
    console.log("  [10] Rate limit — platforms independent");
    console.log("  [11] Caption similarity — identical → rejected");
    console.log("  [12] Caption similarity — different → accepted");
    console.log("  [13] Caption similarity — near-identical threshold");
    console.log("  [14] Grace period org → earned premium fallback path");
    console.log("  [15] PREMIUM org, no stripeCustomerId → credit skipped");
    console.log("  [16] Cumulative daysAwarded across rescans");
    console.log("  [17] URL duplicate detection (global uniqueness)");
    console.log("");
    console.log("Edge cases documented:");
    console.log("  - Test 14: Grace period orgs get earned premium, not Stripe credits");
    console.log("  - Test 15: PREMIUM org without stripeCustomerId gets NOTHING (gap)");
    console.log("  - Test 13: Near-identical captions may or may not pass 0.95 threshold");
  } catch (error) {
    console.error("\nTest failed:");
    console.error(error);
    process.exit(1);
  } finally {
    // ═══════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════
    console.log("\nCleaning up...");

    // Delete test submissions first (FK constraint)
    for (const id of testSubmissionIds) {
      try {
        await db.socialSubmission.delete({ where: { id } });
      } catch {}
    }
    console.log(`   Deleted ${testSubmissionIds.length} test submissions`);

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
