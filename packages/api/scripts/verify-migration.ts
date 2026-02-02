/**
 * Verification Script: Subscription Migration Verification
 *
 * This script verifies that the migration from user-level to org-level subscriptions succeeded.
 *
 * Checks:
 * 1. All premium users have corresponding org with payerId = userId
 * 2. All premium orgs have valid Stripe subscription metadata
 * 3. No orphaned subscriptions (users with accessType != 'FREE' but no org subscription)
 *
 * Usage:
 *   pnpm tsx packages/api/scripts/verify-migration.ts
 */

import Stripe from "stripe";

import { db } from "@sassy/db";

import { env } from "../src/utils/env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});

interface VerificationResult {
  check: string;
  status: "pass" | "fail" | "warning";
  details: string;
  items?: string[];
}

async function verifyPremiumUsersMigrated(): Promise<VerificationResult> {
  // Count users with active subscriptions
  const premiumUsers = await db.user.findMany({
    where: {
      accessType: { not: "FREE" },
      stripeCustomerId: { not: null },
    },
    select: {
      id: true,
      primaryEmailAddress: true,
      accessType: true,
    },
  });

  // Count orgs with premium subscriptions
  const premiumOrgs = await db.organization.findMany({
    where: {
      subscriptionTier: "PREMIUM",
      payerId: { not: null },
    },
    select: {
      id: true,
      name: true,
      payerId: true,
    },
  });

  // Find users whose orgs weren't migrated
  const payerIds = new Set(premiumOrgs.map((org) => org.payerId));
  const unmigrated = premiumUsers.filter((user) => !payerIds.has(user.id));

  if (unmigrated.length === 0) {
    return {
      check: "Premium users migrated",
      status: "pass",
      details: `All ${premiumUsers.length} premium users have corresponding org subscriptions (${premiumOrgs.length} orgs)`,
    };
  }

  return {
    check: "Premium users migrated",
    status: "warning",
    details: `${unmigrated.length} of ${premiumUsers.length} premium users not migrated`,
    items: unmigrated.map((u) => `${u.primaryEmailAddress} (${u.accessType})`),
  };
}

async function verifyStripeMetadata(): Promise<VerificationResult> {
  const premiumOrgs = await db.organization.findMany({
    where: {
      subscriptionTier: "PREMIUM",
      stripeSubscriptionId: { not: null },
    },
    select: {
      id: true,
      name: true,
      stripeSubscriptionId: true,
      payerId: true,
    },
  });

  if (premiumOrgs.length === 0) {
    return {
      check: "Stripe metadata",
      status: "pass",
      details: "No premium orgs with subscriptions to verify",
    };
  }

  // Sample check: verify metadata on a few subscriptions
  const sampleSize = Math.min(5, premiumOrgs.length);
  const sample = premiumOrgs.slice(0, sampleSize);
  const issues: string[] = [];

  for (const org of sample) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        org.stripeSubscriptionId!,
      );

      if (subscription.metadata.organizationId !== org.id) {
        issues.push(
          `Org "${org.name}": metadata.organizationId mismatch (expected ${org.id}, got ${subscription.metadata.organizationId})`,
        );
      }

      if (subscription.metadata.payerId !== org.payerId) {
        issues.push(
          `Org "${org.name}": metadata.payerId mismatch (expected ${org.payerId}, got ${subscription.metadata.payerId})`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      issues.push(`Org "${org.name}": Failed to fetch subscription - ${message}`);
    }
  }

  if (issues.length === 0) {
    return {
      check: "Stripe metadata",
      status: "pass",
      details: `Verified ${sampleSize} of ${premiumOrgs.length} subscriptions have correct metadata`,
    };
  }

  return {
    check: "Stripe metadata",
    status: "fail",
    details: `${issues.length} metadata issues found in sample of ${sampleSize}`,
    items: issues,
  };
}

async function verifyNoOrphanedSubscriptions(): Promise<VerificationResult> {
  // Find users with accessType != 'FREE' who don't have a corresponding org
  const premiumUsers = await db.user.findMany({
    where: {
      accessType: { not: "FREE" },
    },
    select: {
      id: true,
      primaryEmailAddress: true,
      accessType: true,
    },
  });

  const orphaned: string[] = [];

  for (const user of premiumUsers) {
    // Check if user is a payer for any org
    const paidOrg = await db.organization.findFirst({
      where: {
        payerId: user.id,
        subscriptionTier: "PREMIUM",
      },
      select: { id: true, name: true },
    });

    if (!paidOrg) {
      orphaned.push(`${user.primaryEmailAddress} (${user.accessType})`);
    }
  }

  if (orphaned.length === 0) {
    return {
      check: "No orphaned subscriptions",
      status: "pass",
      details: `All ${premiumUsers.length} premium users have corresponding org subscriptions`,
    };
  }

  return {
    check: "No orphaned subscriptions",
    status: "warning",
    details: `${orphaned.length} premium users without org subscriptions`,
    items: orphaned,
  };
}

async function verifyOrgSubscriptionIntegrity(): Promise<VerificationResult> {
  // Check that all premium orgs have required fields
  const premiumOrgs = await db.organization.findMany({
    where: {
      subscriptionTier: "PREMIUM",
    },
    select: {
      id: true,
      name: true,
      payerId: true,
      stripeSubscriptionId: true,
      subscriptionExpiresAt: true,
      purchasedSlots: true,
    },
  });

  const issues: string[] = [];

  for (const org of premiumOrgs) {
    if (!org.payerId) {
      issues.push(`Org "${org.name}": missing payerId`);
    }
    if (!org.stripeSubscriptionId) {
      issues.push(`Org "${org.name}": missing stripeSubscriptionId`);
    }
    if (!org.subscriptionExpiresAt) {
      issues.push(`Org "${org.name}": missing subscriptionExpiresAt`);
    }
    if (org.purchasedSlots < 1) {
      issues.push(`Org "${org.name}": purchasedSlots is ${org.purchasedSlots}`);
    }
  }

  if (issues.length === 0) {
    return {
      check: "Org subscription integrity",
      status: "pass",
      details: `All ${premiumOrgs.length} premium orgs have complete subscription data`,
    };
  }

  return {
    check: "Org subscription integrity",
    status: "fail",
    details: `${issues.length} integrity issues found`,
    items: issues,
  };
}

async function printStats() {
  const [userStats, orgStats] = await Promise.all([
    db.user.groupBy({
      by: ["accessType"],
      _count: true,
    }),
    db.organization.groupBy({
      by: ["subscriptionTier"],
      _count: true,
    }),
  ]);

  console.log("CURRENT STATE");
  console.log("-".repeat(40));
  console.log("Users by access type:");
  for (const stat of userStats) {
    console.log(`  ${stat.accessType}: ${stat._count}`);
  }
  console.log();
  console.log("Organizations by subscription tier:");
  for (const stat of orgStats) {
    console.log(`  ${stat.subscriptionTier}: ${stat._count}`);
  }
  console.log();
}

async function main() {
  console.log("=".repeat(60));
  console.log("SUBSCRIPTION MIGRATION VERIFICATION");
  console.log("=".repeat(60));
  console.log();

  await printStats();

  console.log("RUNNING VERIFICATION CHECKS");
  console.log("-".repeat(40));
  console.log();

  const results: VerificationResult[] = [];

  // Run all verification checks
  results.push(await verifyPremiumUsersMigrated());
  results.push(await verifyNoOrphanedSubscriptions());
  results.push(await verifyOrgSubscriptionIntegrity());
  results.push(await verifyStripeMetadata());

  // Print results
  for (const result of results) {
    const icon =
      result.status === "pass"
        ? "✅"
        : result.status === "warning"
          ? "⚠️"
          : "❌";
    console.log(`${icon} ${result.check}`);
    console.log(`   ${result.details}`);

    if (result.items && result.items.length > 0) {
      for (const item of result.items.slice(0, 10)) {
        console.log(`   - ${item}`);
      }
      if (result.items.length > 10) {
        console.log(`   ... and ${result.items.length - 10} more`);
      }
    }
    console.log();
  }

  // Summary
  console.log("=".repeat(60));
  console.log("SUMMARY");
  console.log("=".repeat(60));

  const passed = results.filter((r) => r.status === "pass").length;
  const warnings = results.filter((r) => r.status === "warning").length;
  const failed = results.filter((r) => r.status === "fail").length;

  console.log(`✅ Passed:   ${passed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Failed:   ${failed}`);
  console.log();

  if (failed > 0) {
    console.log("❌ VERIFICATION FAILED - Please review the issues above");
    process.exit(1);
  } else if (warnings > 0) {
    console.log("⚠️  VERIFICATION PASSED WITH WARNINGS");
  } else {
    console.log("✅ VERIFICATION PASSED");
  }
}

await main();
