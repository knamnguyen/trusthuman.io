/**
 * Quick check of org state
 */
import { db } from "@sassy/db";

async function main() {
  const org = await db.organization.findFirst({
    where: { name: "engagekit" },
    select: {
      id: true,
      name: true,
      subscriptionTier: true,
      subscriptionExpiresAt: true,
      earnedPremiumExpiresAt: true,
      payerId: true,
      purchasedSlots: true,
      _count: { select: { socialSubmissions: true, linkedInAccounts: true } },
    },
  });

  if (!org) {
    console.log("No engagekit org found");
    await db.$disconnect();
    return;
  }

  console.log("=== ENGAGEKIT ORG STATE ===\n");
  console.log(`ID: ${org.id}`);
  console.log(`Tier: ${org.subscriptionTier}`);
  console.log(`Subscription Expires: ${org.subscriptionExpiresAt}`);
  console.log(`Earned Premium Expires: ${org.earnedPremiumExpiresAt}`);
  console.log(`Payer ID: ${org.payerId}`);
  console.log(`Purchased Slots: ${org.purchasedSlots}`);
  console.log(`LinkedIn Accounts: ${org._count.linkedInAccounts}`);
  console.log(`Social Submissions: ${org._count.socialSubmissions}`);

  // Check if this is a "clean" FREE org
  const isCleanFree =
    org.subscriptionTier === "FREE" &&
    org.subscriptionExpiresAt === null &&
    org.earnedPremiumExpiresAt === null &&
    org.payerId === null;

  console.log(`\nIs clean FREE org: ${isCleanFree ? "✅ YES" : "❌ NO"}`);

  await db.$disconnect();
}

main().catch(console.error);
