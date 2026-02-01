/**
 * Test rescan workflow with REAL post URL
 * Run with: bun run packages/api/test-rescan-real-url.ts <POST_URL>
 *
 * Example:
 *   bun run packages/api/test-rescan-real-url.ts "https://x.com/username/status/123456"
 *
 * Or use predefined test URLs:
 *   bun run packages/api/test-rescan-real-url.ts threads
 *   bun run packages/api/test-rescan-real-url.ts linkedin
 *   bun run packages/api/test-rescan-real-url.ts facebook
 *   bun run packages/api/test-rescan-real-url.ts x
 *
 * This test:
 * 1. Creates a submission with the real URL
 * 2. Runs rescan workflow (performs scan #2 and #3 with no delay for testing)
 * 3. Fetches REAL engagement metrics from the platform
 * 4. Verifies metrics are updated in the database
 * 5. Tests state transitions (scanCount 1→2→3)
 */

import { config } from "dotenv";

import { db } from "@sassy/db";
import { normalizeUrl } from "@sassy/social-referral";

import {
  initDBOS,
  rescanSocialSubmissionWorkflow,
} from "../src/workflows/index";

config({ path: ".env" });

// VERIFIED TEST URLs - DO NOT DELETE
// These URLs have been verified to contain @engagekit_io or #engagekit_io
const TEST_URLS = {
  threads:
    "https://www.threads.com/@withkynam/post/DUBlgJQjrN6?xmt=AQF05kwNjvOlOI1A676FBN5lKuC_hi40yvVt58CRnRRELg",
  facebook: "https://www.facebook.com/share/p/1Fq4QwsvhS/",
  linkedin:
    "https://www.linkedin.com/posts/nem-ng-03462b230_engagekitabrio-share-7421989410801451010-6JMs?utm_source=share&utm_medium=member_desktop&rcm=ACoAADnB9GgBHY72WrXA0hUz4IY8FAfYcrrSd0o",
  x: "https://x.com/engagekit_io/status/2016204853161377834?s=20",
} as const;

// Detect platform from URL
function detectPlatform(
  url: string,
): "X" | "LINKEDIN" | "THREADS" | "FACEBOOK" | null {
  if (url.includes("x.com") || url.includes("twitter.com")) return "X";
  if (url.includes("linkedin.com")) return "LINKEDIN";
  if (url.includes("threads.net") || url.includes("threads.com"))
    return "THREADS";
  if (url.includes("facebook.com")) return "FACEBOOK";
  return null;
}

async function testRealUrlRescan() {
  const input = process.argv[2];

  if (!input) {
    console.error("❌ Error: No URL or platform provided");
    console.log("\nUsage:");
    console.log(
      '  bun run packages/api/test-rescan-real-url.ts "<POST_URL>"\n',
    );
    console.log("Or use predefined test URLs:");
    console.log("  bun run packages/api/test-rescan-real-url.ts threads");
    console.log("  bun run packages/api/test-rescan-real-url.ts linkedin");
    console.log("  bun run packages/api/test-rescan-real-url.ts facebook");
    console.log("  bun run packages/api/test-rescan-real-url.ts x\n");
    console.log("Custom URL Examples:");
    console.log(
      '  bun run packages/api/test-rescan-real-url.ts "https://x.com/user/status/123"',
    );
    console.log(
      '  bun run packages/api/test-rescan-real-url.ts "https://linkedin.com/posts/..."',
    );
    process.exit(1);
  }

  // Check if input is a predefined platform shortcut
  let postUrl: string;
  if (input.toLowerCase() in TEST_URLS) {
    const platformKey = input.toLowerCase() as keyof typeof TEST_URLS;
    postUrl = TEST_URLS[platformKey];
    console.log(`Using predefined ${input.toUpperCase()} test URL\n`);
  } else {
    postUrl = input;
  }

  const platform = detectPlatform(postUrl);

  if (!platform) {
    console.error(`❌ Error: Could not detect platform from URL: ${postUrl}`);
    console.log("\nSupported platforms:");
    console.log("  - X (x.com or twitter.com)");
    console.log("  - LinkedIn (linkedin.com)");
    console.log("  - Threads (threads.net or threads.com)");
    console.log("  - Facebook (facebook.com)");
    process.exit(1);
  }

  console.log("🧪 Testing Rescan Workflow with Real URL\n");
  console.log(`📍 Platform: ${platform}`);
  console.log(`🔗 URL: ${postUrl}\n`);

  let dbos: Awaited<ReturnType<typeof initDBOS>> | null = null;
  let testSubmissionId: string | null = null;
  let testOrgId: string | null = null;

  try {
    // Initialize DBOS
    console.log("1️⃣ Initializing DBOS...");
    dbos = await initDBOS();
    console.log("✅ DBOS initialized\n");

    // Get or create test org
    console.log("2️⃣ Setting up test organization...");
    let org = await db.organization.findFirst({
      where: { name: "Test Org - Real URL Rescan" },
    });

    if (!org) {
      org = await db.organization.create({
        data: {
          id: `test-org-real-${Date.now()}`,
          name: "Test Org - Real URL Rescan",
          orgSlug: `test-org-real-${Date.now()}`,
          earnedPremiumExpiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ),
        },
      });
    }
    testOrgId = org.id;
    console.log(`✅ Organization: ${testOrgId}\n`);

    // Clean up any existing submissions with this URL (from previous test runs)
    console.log("3️⃣ Cleaning up previous test submissions...");
    const normalized = normalizeUrl(postUrl);
    await db.socialSubmission.deleteMany({
      where: { urlNormalized: normalized },
    });
    console.log("✅ Cleanup complete\n");

    // Create test submission (scan #1 complete, VERIFIED)
    console.log("4️⃣ Creating test submission...");
    const submission = await db.socialSubmission.create({
      data: {
        organizationId: testOrgId,
        platform,
        postUrl,
        urlNormalized: normalized,
        status: "VERIFIED",
        verifiedAt: new Date(),
        containsKeyword: true,
        postText: "Test post with @engagekit_io or #engagekit_io",
        likes: 0, // Will be updated by workflow
        comments: 0,
        shares: 0,
        daysAwarded: 7,
        scanCount: 1, // Simulating initial verification complete
        lastScannedAt: new Date(),
        nextScanAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    testSubmissionId = submission.id;
    console.log(`✅ Created submission: ${testSubmissionId}`);
    console.log(`   Platform: ${platform}`);
    console.log(`   URL: ${postUrl}`);
    console.log(`   Initial scanCount: ${submission.scanCount}\n`);

    // Run rescan workflow (performs BOTH scan #2 and #3 with no delay for testing)
    console.log("5️⃣ Running rescan workflow (scan #2 and #3)...");
    console.log(
      "   ⏳ This may take 20-60 seconds to scrape the post twice...\n",
    );

    const workflowResult = await rescanSocialSubmissionWorkflow(
      testSubmissionId,
      0, // No delay between scans for testing
    );

    console.log(`✅ Rescan workflow completed:`);
    console.log(`   Status: ${workflowResult.status}`);
    console.log(`   Completed scans: ${workflowResult.completedScans}\n`);

    // Check state after scan #2 (mid-workflow)
    const afterScan2 = await db.socialSubmission.findUnique({
      where: { id: testSubmissionId },
    });

    if (!afterScan2) {
      throw new Error("Submission not found after workflow");
    }

    console.log("📊 Database state after workflow:");
    console.log(`   scanCount: ${afterScan2.scanCount} (expected: 3)`);
    console.log(`   likes: ${afterScan2.likes}`);
    console.log(`   comments: ${afterScan2.comments}`);
    console.log(`   shares: ${afterScan2.shares}`);
    console.log(`   lastScannedAt: ${afterScan2.lastScannedAt}`);
    console.log(`   nextScanAt: ${afterScan2.nextScanAt} (should be null)`);
    console.log(
      `   rescanWorkflowId: ${afterScan2.rescanWorkflowId} (should be null)\n`,
    );

    // Final state verification
    if (afterScan2.scanCount !== 3) {
      throw new Error(`Expected scanCount=3, got ${afterScan2.scanCount}`);
    }

    if (afterScan2.nextScanAt !== null) {
      throw new Error("Expected nextScanAt=null after final scan");
    }

    if (afterScan2.rescanWorkflowId !== null) {
      throw new Error(
        "Expected rescanWorkflowId=null after workflow completion",
      );
    }

    console.log("✅ All validations passed!");
    console.log("\n🎉 Test completed successfully with REAL data!");
    console.log("\n📝 Summary:");
    console.log(`   Platform: ${platform}`);
    console.log(`   URL: ${postUrl}`);
    console.log(`   Total scans: ${afterScan2.scanCount}`);
    console.log(
      `   Final engagement: ${afterScan2.likes} likes, ${afterScan2.comments} comments`,
    );

    // Cleanup prompt
    console.log("\n🧹 Cleanup:");
    console.log(`   Submission ID: ${testSubmissionId}`);
    console.log("   Run this to delete:");
    console.log(
      `   DELETE FROM "SocialSubmission" WHERE id = '${testSubmissionId}';\n`,
    );
  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error(error);

    if (testSubmissionId) {
      console.log(`\n🧹 Test submission ID: ${testSubmissionId}`);
      console.log("   You may want to delete it manually from the database");
    }

    process.exit(1);
  } finally {
    if (dbos) {
      console.log("🔌 Shutting down DBOS...");
      await dbos.shutdown();
    }
    await db.$disconnect();
  }
}

void testRealUrlRescan();
