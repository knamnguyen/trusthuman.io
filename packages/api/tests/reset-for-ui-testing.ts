/**
 * Reset org for fresh UI testing
 */
import { db } from "@sassy/db";

async function main() {
  const org = await db.organization.findFirst({ where: { name: "engagekit" } });
  if (!org) {
    console.log("No engagekit org found");
    await db.$disconnect();
    return;
  }

  // Delete all submissions for this org
  const deleted = await db.socialSubmission.deleteMany({
    where: { organizationId: org.id },
  });
  console.log("Deleted submissions:", deleted.count);

  // Reset earnedPremiumExpiresAt
  await db.organization.update({
    where: { id: org.id },
    data: { earnedPremiumExpiresAt: null },
  });
  console.log("Reset earnedPremiumExpiresAt to null");

  // Verify
  const updated = await db.organization.findUnique({
    where: { id: org.id },
    select: {
      earnedPremiumExpiresAt: true,
      _count: { select: { socialSubmissions: true } },
    },
  });
  console.log("\nOrg is ready for UI testing:");
  console.log("  earnedPremiumExpiresAt:", updated?.earnedPremiumExpiresAt);
  console.log("  socialSubmissions:", updated?._count.socialSubmissions);

  await db.$disconnect();
}

main().catch(console.error);
