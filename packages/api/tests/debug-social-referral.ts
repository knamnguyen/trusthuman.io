/**
 * Debug social referral state - more detailed
 */
import { db } from "@sassy/db";

async function main() {
  // Get detailed submission info
  const submissions = await db.socialSubmission.findMany({
    take: 10,
    orderBy: { submittedAt: "desc" },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          subscriptionTier: true,
          subscriptionExpiresAt: true,
          earnedPremiumExpiresAt: true,
          payerId: true,
        },
      },
    },
  });

  console.log("=== DETAILED SUBMISSION INFO ===\n");
  for (const s of submissions) {
    console.log(`Submission ${s.id}:`);
    console.log(`  Platform: ${s.platform}`);
    console.log(`  Status: ${s.status}`);
    console.log(`  Days Awarded: ${s.daysAwarded}`);
    console.log(`  Likes: ${s.likes}, Comments: ${s.comments}`);
    console.log(`  Org: ${s.organization.name}`);
    console.log(`  Org Tier: ${s.organization.subscriptionTier}`);
    console.log(`  Org Subscription Expires: ${s.organization.subscriptionExpiresAt}`);
    console.log(`  Org Earned Premium Expires: ${s.organization.earnedPremiumExpiresAt}`);
    console.log(`  Org Payer ID: ${s.organization.payerId}`);
    console.log("");
  }

  // Check if there's a mismatch between submissions and org earnedPremiumExpiresAt
  const orgsWithSubmissions = await db.organization.findMany({
    where: {
      socialSubmissions: {
        some: {
          status: "VERIFIED",
          daysAwarded: { gt: 0 },
        },
      },
    },
    select: {
      id: true,
      name: true,
      subscriptionTier: true,
      earnedPremiumExpiresAt: true,
      payerId: true,
      _count: { select: { socialSubmissions: true } },
    },
  });

  console.log("=== ORGS WITH VERIFIED SUBMISSIONS (days > 0) ===\n");
  for (const o of orgsWithSubmissions) {
    console.log(`${o.name}:`);
    console.log(`  Tier: ${o.subscriptionTier}`);
    console.log(`  Payer ID: ${o.payerId}`);
    console.log(`  Earned Premium Expires: ${o.earnedPremiumExpiresAt}`);
    console.log(`  Total Submissions: ${o._count.socialSubmissions}`);
    console.log("");
  }

  await db.$disconnect();
}

main().catch(console.error);
