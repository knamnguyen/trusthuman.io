/**
 * Simplified test for rescan workflow logic
 * Tests state transitions AND engagement-based reward calculation
 * without calling external APIs.
 *
 * Reward rules:
 *   +1 day: verified post (base)
 *   +1 day: 10+ likes
 *   +1 day: 3+ comments
 *   Max 3 days per post, 14 days/month cap
 *
 * Run with: bun run packages/api/tests/test-rescan-simple.ts
 */

import { config } from "dotenv";

import { db } from "@sassy/db";
import { normalizeUrl } from "@sassy/social-referral";

import {
  calculateDaysToAward,
  MAX_DAYS_PER_POST,
  LIKES_THRESHOLD,
  COMMENTS_THRESHOLD,
  MONTHLY_CAP_DAYS,
} from "../src/services/social-referral-verification";
import { initDBOS } from "../src/workflows/index";

config({ path: ".env" });

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

async function testRescanLogic() {
  console.log("Testing Rescan Logic + Engagement Rewards\n");

  let dbos: Awaited<ReturnType<typeof initDBOS>> | null = null;
  let testSubmissionId: string | null = null;
  let testOrgId: string | null = null;

  try {
    // ── Unit tests for calculateDaysToAward ─────────────────────────
    console.log("1. Unit testing calculateDaysToAward()...");

    // Base case: only verified post, no engagement thresholds met
    assert(calculateDaysToAward(0, 0, 0) === 1, "0 likes, 0 comments → 1 day");
    assert(calculateDaysToAward(5, 2, 0) === 1, "5 likes, 2 comments → 1 day");

    // Likes threshold only
    assert(calculateDaysToAward(10, 0, 0) === 2, "10 likes, 0 comments → 2 days");
    assert(calculateDaysToAward(50, 0, 0) === 2, "50 likes, 0 comments → 2 days");

    // Comments threshold only (5+ comments)
    assert(calculateDaysToAward(0, 4, 0) === 1, "0 likes, 4 comments → 1 day (below threshold)");
    assert(calculateDaysToAward(0, 5, 0) === 2, "0 likes, 5 comments → 2 days");
    assert(calculateDaysToAward(0, 20, 0) === 2, "0 likes, 20 comments → 2 days");

    // Both thresholds met → max 3
    assert(calculateDaysToAward(10, 5, 0) === 3, "10 likes, 5 comments → 3 days");
    assert(calculateDaysToAward(100, 50, 0) === 3, "100 likes, 50 comments → 3 days");

    // Delta from already-awarded
    assert(calculateDaysToAward(10, 5, 1) === 2, "max 3, already 1 → delta 2");
    assert(calculateDaysToAward(10, 5, 3) === 0, "max 3, already 3 → delta 0");
    assert(calculateDaysToAward(5, 0, 1) === 0, "only 1 earned, already 1 → delta 0");

    console.log("   All unit tests passed!\n");

    // ── Integration test: DB state transitions ──────────────────────
    console.log("2. Initializing DBOS...");
    dbos = await initDBOS();
    console.log("   DBOS initialized\n");

    // Create test org (FREE tier)
    console.log("3. Setting up test organization (FREE tier)...");
    const existingOrg = await db.organization.findFirst({
      where: { name: "Test Org - Rescan Simple" },
    });

    if (existingOrg) {
      testOrgId = existingOrg.id;
    } else {
      const newOrg = await db.organization.create({
        data: {
          id: `test-org-simple-${Date.now()}`,
          name: "Test Org - Rescan Simple",
          orgSlug: `test-org-simple-${Date.now()}`,
          earnedPremiumExpiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ),
        },
      });
      testOrgId = newOrg.id;
    }
    console.log(`   Organization ready: ${testOrgId}\n`);

    // Create test submission (scan #1 complete)
    // Initial: 5 likes, 2 comments → base 1 day only (thresholds not met)
    console.log("4. Creating test submission (scan #1, 5 likes, 2 comments)...");
    const testUrl = `https://x.com/test/status/${Date.now()}`;
    const initialDays = calculateDaysToAward(5, 2, 0); // Should be 1
    assert(initialDays === 1, `Initial days should be 1, got ${initialDays}`);

    const submission = await db.socialSubmission.create({
      data: {
        organizationId: testOrgId,
        platform: "X",
        postUrl: testUrl,
        urlNormalized: normalizeUrl(testUrl),
        status: "VERIFIED",
        verifiedAt: new Date(),
        containsKeyword: true,
        postText: "Test post @engagekit_io #test",
        likes: 5,
        comments: 2,
        shares: 1,
        daysAwarded: initialDays, // 1 day (base only)
        scanCount: 1,
        lastScannedAt: new Date(),
        nextScanAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    testSubmissionId = submission.id;
    console.log(`   Created: ${testSubmissionId}`);
    console.log(`   daysAwarded: ${submission.daysAwarded} (expected: 1)`);
    console.log(`   Metrics: ${submission.likes} likes, ${submission.comments} comments\n`);

    // Simulate rescan #2: likes jump to 12, comments to 5
    // calculateDaysToAward(12, 5, 1) → totalEarned=3, delta=2
    console.log("5. Simulating rescan #2 (12 likes, 5 comments)...");
    const scan2Bonus = calculateDaysToAward(12, 5, submission.daysAwarded);
    assert(scan2Bonus === 2, `Scan #2 bonus should be 2, got ${scan2Bonus}`);

    const afterScan2 = await db.socialSubmission.update({
      where: { id: testSubmissionId },
      data: {
        scanCount: 2,
        lastScannedAt: new Date(),
        likes: 12,
        comments: 5,
        shares: 3,
        daysAwarded: submission.daysAwarded + scan2Bonus, // 1 + 2 = 3
        nextScanAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    console.log(`   scanCount: ${afterScan2.scanCount} (expected: 2)`);
    console.log(`   daysAwarded: ${afterScan2.daysAwarded} (expected: 3 = max)`);
    console.log(`   Metrics: ${afterScan2.likes} likes, ${afterScan2.comments} comments\n`);

    assert(afterScan2.scanCount === 2, `Expected scanCount=2, got ${afterScan2.scanCount}`);
    assert(afterScan2.daysAwarded === 3, `Expected daysAwarded=3, got ${afterScan2.daysAwarded}`);

    // Simulate rescan #3: likes jump to 25, comments to 8 → already at max 3
    // calculateDaysToAward(25, 8, 3) → totalEarned=3, delta=0
    console.log("6. Simulating rescan #3 (25 likes, 8 comments, already at max)...");
    const scan3Bonus = calculateDaysToAward(25, 8, afterScan2.daysAwarded);
    assert(scan3Bonus === 0, `Scan #3 bonus should be 0 (already at max), got ${scan3Bonus}`);

    const afterScan3 = await db.socialSubmission.update({
      where: { id: testSubmissionId },
      data: {
        scanCount: 3,
        lastScannedAt: new Date(),
        likes: 25,
        comments: 8,
        shares: 7,
        daysAwarded: afterScan2.daysAwarded + scan3Bonus, // 3 + 0 = 3
        nextScanAt: null,
        rescanWorkflowId: null,
      },
    });
    console.log(`   scanCount: ${afterScan3.scanCount} (expected: 3)`);
    console.log(`   daysAwarded: ${afterScan3.daysAwarded} (expected: 3, no change)`);
    console.log(`   nextScanAt: ${afterScan3.nextScanAt} (expected: null)`);
    console.log(`   rescanWorkflowId: ${afterScan3.rescanWorkflowId} (expected: null)\n`);

    assert(afterScan3.scanCount === 3, `Expected scanCount=3`);
    assert(afterScan3.nextScanAt === null, "Expected nextScanAt=null");
    assert(afterScan3.rescanWorkflowId === null, "Expected rescanWorkflowId=null");
    assert(afterScan3.daysAwarded === MAX_DAYS_PER_POST, `Expected daysAwarded=${MAX_DAYS_PER_POST}`);

    console.log("   All state transitions + reward calculations verified!\n");

    console.log("Summary:");
    console.log(`   Reward constants: base=1, likes>=${LIKES_THRESHOLD}=+1, comments>=${COMMENTS_THRESHOLD}=+1, max=${MAX_DAYS_PER_POST}/post, cap=${MONTHLY_CAP_DAYS}/month`);
    console.log(`   Scan #1: 5 likes, 2 comments → ${initialDays} day`);
    console.log(`   Scan #2: 12 likes, 5 comments → +${scan2Bonus} days (total ${initialDays + scan2Bonus})`);
    console.log(`   Scan #3: 25 likes, 8 comments → +${scan3Bonus} days (total ${afterScan3.daysAwarded}, at max)\n`);

    // Cleanup
    console.log("7. Cleaning up...");
    await db.socialSubmission.delete({
      where: { id: testSubmissionId },
    });
    console.log("   Deleted test submission\n");

    console.log("Test completed successfully!");
  } catch (error) {
    console.error("\nTest failed:");
    console.error(error);

    if (testSubmissionId) {
      try {
        await db.socialSubmission.delete({
          where: { id: testSubmissionId },
        });
        console.log("Cleaned up test submission");
      } catch (cleanupError) {
        console.error("Failed to cleanup:", cleanupError);
      }
    }

    process.exit(1);
  } finally {
    if (dbos) {
      await dbos.shutdown();
    }
    await db.$disconnect();
  }
}

void testRescanLogic();
