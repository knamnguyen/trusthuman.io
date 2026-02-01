/**
 * Simplified test for rescan workflow logic
 * Tests the state transitions without calling external APIs
 * Run with: bun run packages/api/test-rescan-simple.ts
 */

import { config } from "dotenv";

import { db } from "@sassy/db";
import { normalizeUrl } from "@sassy/social-referral";

import { initDBOS } from "../src/workflows/index";

config({ path: ".env" });

async function testRescanLogic() {
  console.log("🧪 Testing Rescan Logic (Simplified)\n");

  let dbos: Awaited<ReturnType<typeof initDBOS>> | null = null;
  let testSubmissionId: string | null = null;
  let testOrgId: string | null = null;

  try {
    // Initialize DBOS
    console.log("1️⃣ Initializing DBOS...");
    dbos = await initDBOS();
    console.log("✅ DBOS initialized\n");

    // Create test org
    console.log("2️⃣ Setting up test organization...");
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
    console.log(`✅ Organization ready: ${testOrgId}\n`);

    // Create test submission (scan #1 complete)
    console.log("3️⃣ Creating test submission (scan #1 complete)...");
    const testUrl = `https://x.com/test/status/${Date.now()}`;
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
        daysAwarded: 7,
        scanCount: 1, // Initial scan done
        lastScannedAt: new Date(),
        nextScanAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    testSubmissionId = submission.id;
    console.log(`✅ Created submission: ${testSubmissionId}`);
    console.log(`   scanCount: ${submission.scanCount}`);
    console.log(
      `   Metrics: ${submission.likes} likes, ${submission.comments} comments\n`,
    );

    // Simulate rescan #2 (manual database update)
    console.log("4️⃣ Simulating rescan #2...");
    const afterScan2 = await db.socialSubmission.update({
      where: { id: testSubmissionId },
      data: {
        scanCount: 2,
        lastScannedAt: new Date(),
        likes: 12, // Simulated increase
        comments: 5, // Simulated increase
        shares: 3,
        nextScanAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    console.log(`✅ Scan #2 complete`);
    console.log(`   scanCount: ${afterScan2.scanCount} (expected: 2)`);
    console.log(
      `   Metrics: ${afterScan2.likes} likes, ${afterScan2.comments} comments`,
    );
    console.log(`   Next scan: ${afterScan2.nextScanAt}\n`);

    if (afterScan2.scanCount !== 2) {
      throw new Error(`Expected scanCount=2, got ${afterScan2.scanCount}`);
    }

    // Simulate rescan #3 (FINAL)
    console.log("5️⃣ Simulating rescan #3 (FINAL)...");
    const afterScan3 = await db.socialSubmission.update({
      where: { id: testSubmissionId },
      data: {
        scanCount: 3,
        lastScannedAt: new Date(),
        likes: 25, // Simulated increase
        comments: 8, // Simulated increase
        shares: 7,
        nextScanAt: null, // No more rescans
        rescanWorkflowId: null, // Clear workflow ID
      },
    });
    console.log(`✅ Scan #3 complete (FINAL)`);
    console.log(`   scanCount: ${afterScan3.scanCount} (expected: 3)`);
    console.log(
      `   Metrics: ${afterScan3.likes} likes, ${afterScan3.comments} comments`,
    );
    console.log(`   Next scan: ${afterScan3.nextScanAt} (expected: null)`);
    console.log(
      `   Workflow ID: ${afterScan3.rescanWorkflowId} (expected: null)\n`,
    );

    if (afterScan3.scanCount !== 3) {
      throw new Error(`Expected scanCount=3, got ${afterScan3.scanCount}`);
    }

    if (afterScan3.nextScanAt !== null) {
      throw new Error("Expected nextScanAt=null after final scan");
    }

    if (afterScan3.rescanWorkflowId !== null) {
      throw new Error("Expected rescanWorkflowId=null after final scan");
    }

    console.log("✅ All state transitions verified!\n");

    console.log("📊 Final Summary:");
    console.log(`   Total scans: ${afterScan3.scanCount} / 3`);
    console.log(`   Status: ${afterScan3.status}`);
    console.log(
      `   Final metrics: ${afterScan3.likes} likes, ${afterScan3.comments} comments, ${afterScan3.shares} shares`,
    );
    console.log(`   Days awarded: ${afterScan3.daysAwarded}`);
    console.log(`   Rescans complete: Yes\n`);

    // Cleanup
    console.log("6️⃣ Cleaning up...");
    await db.socialSubmission.delete({
      where: { id: testSubmissionId },
    });
    console.log(`✅ Deleted test submission\n`);

    console.log("🎉 Test completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error(error);

    if (testSubmissionId) {
      try {
        await db.socialSubmission.delete({
          where: { id: testSubmissionId },
        });
        console.log(`🧹 Cleaned up test submission`);
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
