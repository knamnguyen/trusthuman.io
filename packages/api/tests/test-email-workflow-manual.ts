/**
 * Manual Test: Weekly Analytics Email Workflow
 *
 * This script manually triggers the email workflow using your LOCAL database.
 * It tests the full flow: DB query → data processing → Loops API
 *
 * Prerequisites:
 * 1. Local PostgreSQL running with DBOS database
 * 2. At least one LinkedInAccount with analytics data in your local DB
 * 3. LOOPS_API_KEY set in .env (will send real emails!)
 *
 * Usage:
 *   bun run packages/api/scripts/test-email-workflow-manual.ts
 *
 * Options:
 *   DRY_RUN=true - Skip actual email sending, just log payload
 *   TEST_EMAIL=your@email.com - Override recipient email for testing
 */

import { config } from "dotenv";
config({ path: ".env" });

import { db } from "@sassy/db";
import {
  calculatePercentageChange,
  formatPercentageChange,
  formatNumber,
  findTopMetric,
  generateSubjectLine,
  generateChartUrl,
  generateMemeUrl,
  padToSevenDays,
  padDateLabels,
} from "../src/utils/email-analytics";

const DRY_RUN = process.env.DRY_RUN === "true";
const TEST_EMAIL = process.env.TEST_EMAIL;
const LOOPS_API_KEY = process.env.LOOPS_API_KEY;
const LOOPS_TEMPLATE_ID = "cmlc5hhdz1ebf0i25hqomb3zf";
const LOOPS_API_URL = "https://app.loops.so/api/v1/transactional";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.engagekit.io";

async function main() {
  console.log("🧪 Manual Test: Weekly Analytics Email Workflow\n");
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no emails sent)" : "LIVE (will send emails!)"}`);
  if (TEST_EMAIL) {
    console.log(`Override email: ${TEST_EMAIL}`);
  }
  console.log("");

  // Step 1: Query accounts with analytics data
  console.log("📊 Step 1: Querying accounts with analytics data...");
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const accounts = await db.linkedInAccount.findMany({
    where: {
      ownerId: { not: null },
      analyticsDaily: {
        some: {
          date: { gte: sevenDaysAgo },
        },
      },
    },
    include: {
      owner: {
        include: {
          emailPreferences: true,
        },
      },
      org: {
        include: {
          members: {
            include: {
              user: {
                include: {
                  emailPreferences: true,
                },
              },
            },
          },
        },
      },
      analyticsDaily: {
        where: {
          date: { gte: sevenDaysAgo },
        },
        orderBy: {
          date: "asc",
        },
      },
    },
    take: 1, // Only test with first account
  });

  if (accounts.length === 0) {
    console.log("❌ No accounts with analytics data found in last 7 days");
    console.log("\nTo test, you need:");
    console.log("  1. A LinkedInAccount with an owner");
    console.log("  2. AnalyticsDaily records for that account in the last 7 days");
    process.exit(1);
  }

  const account = accounts[0]!;
  console.log(`✅ Found account: ${account.id}`);
  console.log(`   Owner: ${account.owner?.primaryEmailAddress || "no owner"}`);
  console.log(`   Analytics records: ${account.analyticsDaily.length}`);

  // Step 2: Get recipients
  console.log("\n👥 Step 2: Determining recipients...");
  const recipients: Array<{ email: string; firstName: string; userId: string }> = [];

  // Add owner
  if (
    account.owner &&
    account.owner.primaryEmailAddress &&
    account.owner.emailPreferences?.weeklyAnalyticsEnabled !== false
  ) {
    recipients.push({
      email: TEST_EMAIL || account.owner.primaryEmailAddress,
      firstName: account.owner.firstName || "there",
      userId: account.owner.id,
    });
  }

  // Add org admins (if not testing with override email)
  if (account.org && !TEST_EMAIL) {
    for (const member of account.org.members) {
      if (
        member.role === "org:admin" &&
        member.user.primaryEmailAddress &&
        member.user.emailPreferences?.weeklyAnalyticsEnabled !== false &&
        !recipients.some((r) => r.userId === member.user.id)
      ) {
        recipients.push({
          email: member.user.primaryEmailAddress,
          firstName: member.user.firstName || "there",
          userId: member.user.id,
        });
      }
    }
  }

  if (recipients.length === 0) {
    console.log("❌ No eligible recipients found");
    process.exit(1);
  }

  console.log(`✅ Recipients: ${recipients.map((r) => r.email).join(", ")}`);

  // Step 3: Process analytics data
  console.log("\n📈 Step 3: Processing analytics data...");
  const analyticsData = account.analyticsDaily;

  const followers = analyticsData.map((d) => d.followers);
  const invites = analyticsData.map((d) => d.invites);
  const comments = analyticsData.map((d) => d.comments);
  const contentReach = analyticsData.map((d) => d.contentReach);
  const profileViews = analyticsData.map((d) => d.profileViews);
  const engageReach = analyticsData.map((d) => d.engageReach);
  const dateLabels = analyticsData.map((d) =>
    d.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  );

  const paddedData = {
    followers: padToSevenDays(followers),
    invites: padToSevenDays(invites),
    comments: padToSevenDays(comments),
    contentReach: padToSevenDays(contentReach),
    profileViews: padToSevenDays(profileViews),
    engageReach: padToSevenDays(engageReach),
    labels: padDateLabels(dateLabels),
  };

  const percentageChanges: Record<string, number | null> = {
    followers: calculatePercentageChange(paddedData.followers),
    invites: calculatePercentageChange(paddedData.invites),
    comments: calculatePercentageChange(paddedData.comments),
    contentReach: calculatePercentageChange(paddedData.contentReach),
    profileViews: calculatePercentageChange(paddedData.profileViews),
    engageReach: calculatePercentageChange(paddedData.engageReach),
  };

  const topMetric = findTopMetric(percentageChanges);
  const latestData = analyticsData[analyticsData.length - 1]!;
  const totalActivities =
    latestData.followers +
    latestData.invites +
    latestData.comments +
    latestData.contentReach +
    latestData.profileViews +
    latestData.engageReach;

  const chartUrl = generateChartUrl(paddedData);
  const weekEndFormatted = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  console.log(`✅ Top metric: ${topMetric.name} (${topMetric.growth}% growth)`);
  console.log(`✅ Total activities: ${totalActivities}`);
  console.log(`✅ Chart URL generated (${chartUrl.length} chars)`);

  // Step 4: Build and send email
  console.log("\n📧 Step 4: Sending emails...");

  for (const recipient of recipients) {
    const baseSubject = generateSubjectLine(
      recipient.firstName,
      topMetric,
      totalActivities,
      latestData.followers
    );
    const dynamicSubject = `${baseSubject} (Week of ${weekEndFormatted})`;
    const memeUrl = generateMemeUrl(recipient.firstName, topMetric);

    const emailPayload = {
      transactionalId: LOOPS_TEMPLATE_ID,
      email: recipient.email,
      dataVariables: {
        subject: dynamicSubject,
        userFirstName: recipient.firstName,
        kitGifUrl: `${BASE_URL}/email-assets/kit-sprite-blink.gif`,
        iconFollowers: "https://engagekit.io/email-assets/icons/users-white.png",
        iconInvites: "https://engagekit.io/email-assets/icons/mail-white.png",
        iconComments: "https://engagekit.io/email-assets/icons/message-square-white.png",
        iconContentReach: "https://engagekit.io/email-assets/icons/trending-up-white.png",
        iconProfileViews: "https://engagekit.io/email-assets/icons/bar-chart-3-white.png",
        iconEngageReach: "https://engagekit.io/email-assets/icons/eye-black.png",
        chartUrl,
        memeUrl,
        ctaUrl: "https://engagekit.io/earn-premium",
        ctaSubscribeUrl: "https://engagekit.io/subscription",
        highlightMetric: topMetric.name,
        highlightValue: formatNumber(latestData[topMetric.key as keyof typeof latestData] as number),
        highlightChange: formatPercentageChange(topMetric.growth),
        highlightIsPositive: topMetric.growth >= 0 ? "true" : "false",
        followers: formatNumber(latestData.followers),
        invites: formatNumber(latestData.invites),
        comments: formatNumber(latestData.comments),
        contentReach: formatNumber(latestData.contentReach),
        profileViews: formatNumber(latestData.profileViews),
        engageReach: formatNumber(latestData.engageReach),
        followersChange: formatPercentageChange(percentageChanges.followers ?? null),
        invitesChange: formatPercentageChange(percentageChanges.invites ?? null),
        commentsChange: formatPercentageChange(percentageChanges.comments ?? null),
        contentReachChange: formatPercentageChange(percentageChanges.contentReach ?? null),
        profileViewsChange: formatPercentageChange(percentageChanges.profileViews ?? null),
        engageReachChange: formatPercentageChange(percentageChanges.engageReach ?? null),
      },
    };

    console.log(`\n📬 To: ${recipient.email}`);
    console.log(`   Subject: ${dynamicSubject}`);

    if (DRY_RUN) {
      console.log(`   [DRY RUN] Would send payload:`);
      console.log(`   ${JSON.stringify(emailPayload.dataVariables, null, 2).split("\n").slice(0, 10).join("\n")}...`);
    } else {
      if (!LOOPS_API_KEY) {
        console.log("   ❌ LOOPS_API_KEY not set, skipping");
        continue;
      }

      const response = await fetch(LOOPS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOOPS_API_KEY}`,
        },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ Failed: ${errorText}`);
      } else {
        const result = await response.json();
        console.log(`   ✅ Sent successfully!`, result);
      }
    }
  }

  console.log("\n🎉 Test complete!");
  if (DRY_RUN) {
    console.log("\nTo send real emails, run without DRY_RUN:");
    console.log("  bun run packages/api/scripts/test-email-workflow-manual.ts");
    console.log("\nTo test with your email only:");
    console.log("  TEST_EMAIL=your@email.com bun run packages/api/scripts/test-email-workflow-manual.ts");
  }

  await db.$disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
