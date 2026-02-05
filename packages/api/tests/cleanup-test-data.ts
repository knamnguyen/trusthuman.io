/**
 * Clean up leftover test data
 */
import { db } from "@sassy/db";

async function main() {
  console.log("=== Cleaning up test data ===\n");

  // Find and delete test orgs
  const testOrgs = await db.organization.findMany({
    where: {
      OR: [
        { name: { startsWith: "Test Org" } },
        { id: { startsWith: "test-" } },
      ],
    },
    select: { id: true, name: true },
  });

  console.log(`Found ${testOrgs.length} test orgs to delete:`);
  for (const org of testOrgs) {
    console.log(`  - ${org.name} (${org.id})`);
  }

  if (testOrgs.length > 0) {
    // Delete submissions first (foreign key constraint)
    const submissionsDeleted = await db.socialSubmission.deleteMany({
      where: {
        organizationId: { in: testOrgs.map((o) => o.id) },
      },
    });
    console.log(`\nDeleted ${submissionsDeleted.count} submissions`);

    // Delete the orgs
    const orgsDeleted = await db.organization.deleteMany({
      where: {
        id: { in: testOrgs.map((o) => o.id) },
      },
    });
    console.log(`Deleted ${orgsDeleted.count} orgs`);
  }

  // Also check for stale Stripe customer IDs
  console.log("\n=== Checking Stripe customer IDs ===");
  const usersWithStripe = await db.user.findMany({
    where: { stripeCustomerId: { not: null } },
    select: { id: true, primaryEmailAddress: true, stripeCustomerId: true },
  });

  console.log(`Users with stripeCustomerId: ${usersWithStripe.length}`);
  for (const u of usersWithStripe) {
    console.log(`  - ${u.primaryEmailAddress}: ${u.stripeCustomerId}`);
  }

  console.log("\n✅ Cleanup complete");
  await db.$disconnect();
}

main().catch(console.error);
