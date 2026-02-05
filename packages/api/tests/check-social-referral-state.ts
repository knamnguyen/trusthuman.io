/**
 * Check current state of social referral system
 */
import { db } from "@sassy/db";

async function main() {
  // Find all users with stripeCustomerId
  const users = await db.user.findMany({
    where: { stripeCustomerId: { not: null } },
    select: {
      id: true,
      stripeCustomerId: true,
      primaryEmailAddress: true,
    },
  });

  console.log("Users with stripeCustomerId:", users.length);
  users.forEach((u) =>
    console.log(`  - ${u.primaryEmailAddress}: ${u.stripeCustomerId}`),
  );

  // Find orgs with PREMIUM tier
  const premiumOrgs = await db.organization.findMany({
    where: { subscriptionTier: "PREMIUM" },
    select: {
      id: true,
      name: true,
      payerId: true,
      stripeSubscriptionId: true,
      subscriptionExpiresAt: true,
      purchasedSlots: true,
    },
  });

  console.log("\nPremium orgs:", premiumOrgs.length);
  premiumOrgs.forEach((o) =>
    console.log(
      `  - ${o.name} (payerId: ${o.payerId}, subId: ${o.stripeSubscriptionId}, expires: ${o.subscriptionExpiresAt})`,
    ),
  );

  // Find orgs with earnedPremium
  const earnedOrgs = await db.organization.findMany({
    where: { earnedPremiumExpiresAt: { not: null } },
    select: {
      id: true,
      name: true,
      subscriptionTier: true,
      earnedPremiumExpiresAt: true,
    },
  });

  console.log("\nOrgs with earnedPremium:", earnedOrgs.length);
  earnedOrgs.forEach((o) => {
    const expiry = o.earnedPremiumExpiresAt
      ? o.earnedPremiumExpiresAt.toISOString()
      : "null";
    console.log(`  - ${o.name}: tier=${o.subscriptionTier}, expires=${expiry}`);
  });

  // Find social submissions
  const submissions = await db.socialSubmission.findMany({
    take: 10,
    orderBy: { submittedAt: "desc" },
    select: {
      id: true,
      status: true,
      daysAwarded: true,
      organizationId: true,
      platform: true,
      postUrl: true,
      verifiedAt: true,
    },
  });

  console.log("\nRecent submissions:", submissions.length);
  submissions.forEach((s) =>
    console.log(
      `  - ${s.platform} [${s.status}]: ${s.daysAwarded} days, verified: ${s.verifiedAt}`,
    ),
  );

  // Find FREE orgs (for testing earned premium path)
  const freeOrgs = await db.organization.findMany({
    where: { subscriptionTier: "FREE" },
    take: 5,
    select: {
      id: true,
      name: true,
      orgSlug: true,
      earnedPremiumExpiresAt: true,
      _count: { select: { linkedInAccounts: true } },
    },
  });

  console.log("\nFREE orgs (for testing):", freeOrgs.length);
  freeOrgs.forEach((o) => {
    const expiry = o.earnedPremiumExpiresAt
      ? o.earnedPremiumExpiresAt.toISOString()
      : "null";
    console.log(
      `  - ${o.name} (slug: ${o.orgSlug}, accounts: ${o._count.linkedInAccounts}, earnedExpires: ${expiry})`,
    );
  });

  await db.$disconnect();
}

main().catch(console.error);
