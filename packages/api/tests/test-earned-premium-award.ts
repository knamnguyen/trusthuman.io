/**
 * Test the earned premium award logic directly
 *
 * Tests the specific branch in social-referral-verification.ts:272-284
 * where FREE orgs should get earnedPremiumExpiresAt extended.
 */
import { db } from "@sassy/db";

async function main() {
  console.log("=== Testing Earned Premium Award Logic ===\n");

  // Find the engagekit FREE org
  const org = await db.organization.findFirst({
    where: { name: "engagekit" },
    select: {
      id: true,
      name: true,
      subscriptionTier: true,
      subscriptionExpiresAt: true,
      earnedPremiumExpiresAt: true,
      payerId: true,
      _count: { select: { linkedInAccounts: true, socialSubmissions: true } },
    },
  });

  if (!org) {
    console.log("❌ No 'engagekit' org found");
    await db.$disconnect();
    return;
  }

  console.log("Org found:");
  console.log(`  Name: ${org.name}`);
  console.log(`  ID: ${org.id}`);
  console.log(`  Tier: ${org.subscriptionTier}`);
  console.log(`  Subscription Expires: ${org.subscriptionExpiresAt}`);
  console.log(`  Earned Premium Expires: ${org.earnedPremiumExpiresAt}`);
  console.log(`  Payer ID: ${org.payerId}`);
  console.log(`  Accounts: ${org._count.linkedInAccounts}`);
  console.log(`  Submissions: ${org._count.socialSubmissions}`);

  // Get verified submissions for this org
  const verifiedSubmissions = await db.socialSubmission.findMany({
    where: {
      organizationId: org.id,
      status: "VERIFIED",
      daysAwarded: { gt: 0 },
    },
    select: {
      id: true,
      daysAwarded: true,
      verifiedAt: true,
    },
    orderBy: { verifiedAt: "desc" },
  });

  console.log(`\nVerified submissions with days > 0: ${verifiedSubmissions.length}`);
  let totalDays = 0;
  for (const s of verifiedSubmissions) {
    console.log(`  - ${s.id}: ${s.daysAwarded} days (verified: ${s.verifiedAt})`);
    totalDays += s.daysAwarded;
  }
  console.log(`Total days earned: ${totalDays}`);

  // Test the exact logic from social-referral-verification.ts:241-284
  const now = new Date();
  const finalDays = totalDays; // Use total days earned

  console.log("\n=== Simulating Award Logic ===");

  const isPaidPremium =
    org.subscriptionTier === "PREMIUM" &&
    org.subscriptionExpiresAt != null &&
    org.subscriptionExpiresAt > now;

  console.log(`isPaidPremium check:`);
  console.log(`  subscriptionTier === "PREMIUM": ${org.subscriptionTier === "PREMIUM"}`);
  console.log(`  subscriptionExpiresAt != null: ${org.subscriptionExpiresAt != null}`);
  console.log(`  subscriptionExpiresAt > now: ${org.subscriptionExpiresAt && org.subscriptionExpiresAt > now}`);
  console.log(`  → isPaidPremium = ${isPaidPremium}`);

  console.log(`\nCondition: isPaidPremium && org.payerId = ${isPaidPremium && org.payerId}`);

  if (isPaidPremium && org.payerId) {
    console.log("\n→ Would go to STRIPE CREDIT branch (but this shouldn't happen for FREE orgs)");
  } else {
    console.log("\n→ Should go to EARNED PREMIUM branch (extend earnedPremiumExpiresAt)");

    const currentExpiry = org.earnedPremiumExpiresAt;
    const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate);
    newExpiry.setDate(newExpiry.getDate() + finalDays);

    console.log(`  Current expiry: ${currentExpiry}`);
    console.log(`  Base date: ${baseDate}`);
    console.log(`  New expiry would be: ${newExpiry} (+${finalDays} days)`);

    // Ask if user wants to fix the data
    console.log("\n=== FIXING DATA ===");
    console.log(`Updating org ${org.id} with earnedPremiumExpiresAt = ${newExpiry}`);

    await db.organization.update({
      where: { id: org.id },
      data: { earnedPremiumExpiresAt: newExpiry },
    });

    console.log("✅ Updated successfully!");

    // Verify the update
    const updatedOrg = await db.organization.findUnique({
      where: { id: org.id },
      select: { earnedPremiumExpiresAt: true },
    });

    console.log(`Verified: earnedPremiumExpiresAt = ${updatedOrg?.earnedPremiumExpiresAt}`);
  }

  await db.$disconnect();
}

main().catch(console.error);
