/**
 * Migration Script: User Subscriptions → Organization Subscriptions
 *
 * This script migrates existing user-level subscriptions to org-level subscriptions.
 *
 * Logic:
 * 1. Find users with active subscriptions (accessType != 'FREE' AND stripeCustomerId IS NOT NULL)
 * 2. For each user:
 *    - Find their admin org (first org where role = "admin")
 *    - Query Stripe for active subscription
 *    - Update Stripe subscription metadata: { organizationId, payerId, migratedAt }
 *    - Update Organization: { payerId, stripeSubscriptionId, purchasedSlots, subscriptionTier, subscriptionExpiresAt }
 *
 * Usage:
 *   pnpm tsx packages/api/scripts/migrate-subscriptions.ts           # Dry run
 *   pnpm tsx packages/api/scripts/migrate-subscriptions.ts --execute # Execute migration
 */

import PQueue from "p-queue";
import Stripe from "stripe";

import { db } from "@sassy/db";

import { env } from "../src/utils/env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
});

// Rate limit Stripe API calls (100 requests per second is the limit)
const stripeQueue = new PQueue({
  interval: 1000,
  intervalCap: 50, // Stay well under the limit
});

// Parse args
const isDryRun = !process.argv.includes("--execute");

interface MigrationResult {
  userId: string;
  userEmail: string;
  orgId: string | null;
  orgName: string | null;
  status:
    | "migrated"
    | "skipped_no_admin_org"
    | "skipped_no_stripe_subscription"
    | "error";
  error?: string;
  subscriptionId?: string;
}

async function withRateLimit<T>(fn: () => Promise<T>) {
  return await stripeQueue.add(fn);
}

async function findActiveStripeSubscription(
  customerId: string,
): Promise<Stripe.Subscription | null> {
  try {
    const subscriptions = await withRateLimit(() =>
      stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      }),
    );

    return subscriptions.data[0] ?? null;
  } catch (error) {
    console.error(
      `Error fetching subscriptions for customer ${customerId}:`,
      error,
    );
    return null;
  }
}

async function migrateUser(user: {
  id: string;
  primaryEmailAddress: string;
  stripeCustomerId: string;
  accessType: string;
}): Promise<MigrationResult> {
  const baseResult = {
    userId: user.id,
    userEmail: user.primaryEmailAddress,
    orgId: null as string | null,
    orgName: null as string | null,
  };

  // 1. Find user's admin org (first org where role = "admin")
  const adminMembership = await db.organizationMember.findFirst({
    where: {
      userId: user.id,
      role: "admin",
    },
    include: {
      org: {
        select: {
          id: true,
          name: true,
          stripeSubscriptionId: true,
          subscriptionTier: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" }, // First admin org
  });

  if (!adminMembership) {
    console.warn(`⚠️  User ${user.primaryEmailAddress} has no admin org`);
    return { ...baseResult, status: "skipped_no_admin_org" };
  }

  const org = adminMembership.org;
  baseResult.orgId = org.id;
  baseResult.orgName = org.name;

  // Skip if org already has a subscription (already migrated)
  if (org.stripeSubscriptionId) {
    console.log(
      `ℹ️  Org "${org.name}" already has subscription, skipping user ${user.primaryEmailAddress}`,
    );
    return {
      ...baseResult,
      status: "migrated",
      subscriptionId: org.stripeSubscriptionId,
    };
  }

  // 2. Find active Stripe subscription
  const subscription = await findActiveStripeSubscription(
    user.stripeCustomerId,
  );

  if (!subscription) {
    console.warn(
      `⚠️  User ${user.primaryEmailAddress} has no active Stripe subscription`,
    );
    return { ...baseResult, status: "skipped_no_stripe_subscription" };
  }

  // 3. Perform migration
  if (isDryRun) {
    console.log(
      `[DRY RUN] Would migrate user ${user.primaryEmailAddress} → org "${org.name}"`,
    );
    console.log(`  Subscription: ${subscription.id}`);
    console.log(`  Slots: 1 (all existing subscriptions get 1 slot)`);
    console.log(
      `  Expires: ${new Date(subscription.current_period_end * 1000).toISOString()}`,
    );
    return {
      ...baseResult,
      status: "migrated",
      subscriptionId: subscription.id,
    };
  }

  try {
    // 3a. Update Stripe subscription metadata
    await withRateLimit(() =>
      stripe.subscriptions.update(subscription.id, {
        metadata: {
          organizationId: org.id,
          organizationName: org.name,
          payerId: user.id,
          migratedAt: new Date().toISOString(),
          migratedFromLegacy: "true",
        },
      }),
    );

    // 3b. Update Organization in DB
    // All existing subscriptions get 1 slot (decision: existing users get 1 slot)
    const expiresAt = new Date(subscription.current_period_end * 1000);

    await db.organization.update({
      where: { id: org.id },
      data: {
        payerId: user.id,
        stripeSubscriptionId: subscription.id,
        purchasedSlots: 1, // All existing subscriptions get 1 slot
        subscriptionTier: "PREMIUM",
        subscriptionExpiresAt: expiresAt,
      },
    });

    console.log(
      `✅ Migrated user ${user.primaryEmailAddress} → org "${org.name}"`,
    );
    return {
      ...baseResult,
      status: "migrated",
      subscriptionId: subscription.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `❌ Error migrating user ${user.primaryEmailAddress}:`,
      errorMessage,
    );
    return {
      ...baseResult,
      status: "error",
      error: errorMessage,
    };
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log(
    isDryRun ? "🔍 DRY RUN: No changes will be made" : "🚀 EXECUTING MIGRATION",
  );
  console.log("=".repeat(60));
  console.log();

  // Find all users with active subscriptions
  const usersWithSubscriptions = await db.user.findMany({
    where: {
      accessType: { not: "FREE" },
      stripeCustomerId: { not: null },
    },
    select: {
      id: true,
      primaryEmailAddress: true,
      stripeCustomerId: true,
      accessType: true,
    },
  });

  console.log(
    `Found ${usersWithSubscriptions.length} users with subscriptions`,
  );
  console.log();

  const results: MigrationResult[] = [];

  for (const user of usersWithSubscriptions) {
    const result = await migrateUser(
      // just typecast here because we've already filtered out users with null stripeCustomerId
      user as typeof user & {
        stripeCustomerId: string;
      },
    );
    results.push(result);
  }

  // Summary
  console.log();
  console.log("=".repeat(60));
  console.log("MIGRATION SUMMARY");
  console.log("=".repeat(60));

  const migrated = results.filter((r) => r.status === "migrated");
  const skippedNoOrg = results.filter(
    (r) => r.status === "skipped_no_admin_org",
  );
  const skippedNoSub = results.filter(
    (r) => r.status === "skipped_no_stripe_subscription",
  );
  const errors = results.filter((r) => r.status === "error");

  console.log(`✅ Migrated:                    ${migrated.length}`);
  console.log(`⚠️  Skipped (no admin org):      ${skippedNoOrg.length}`);
  console.log(`⚠️  Skipped (no Stripe sub):     ${skippedNoSub.length}`);
  console.log(`❌ Errors:                      ${errors.length}`);
  console.log();

  if (skippedNoOrg.length > 0) {
    console.log("Users skipped (no admin org):");
    for (const r of skippedNoOrg) {
      console.log(`  - ${r.userEmail} (${r.userId})`);
    }
    console.log();
  }

  if (skippedNoSub.length > 0) {
    console.log("Users skipped (no Stripe subscription):");
    for (const r of skippedNoSub) {
      console.log(`  - ${r.userEmail} (${r.userId})`);
    }
    console.log();
  }

  if (errors.length > 0) {
    console.log("Errors:");
    for (const r of errors) {
      console.log(`  - ${r.userEmail}: ${r.error}`);
    }
    console.log();
  }

  if (isDryRun) {
    console.log("=".repeat(60));
    console.log("This was a DRY RUN. Run with --execute to apply changes.");
    console.log("=".repeat(60));
  }
}

await main();
