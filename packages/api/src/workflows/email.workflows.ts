import { DBOS, SchedulerMode } from "@dbos-inc/dbos-sdk";

import { db } from "@sassy/db";
import { env } from "../utils/env";
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
} from "../utils/email-analytics";

/**
 * LOOPS email constants
 */
const LOOPS_API_KEY = env.LOOPS_API_KEY;
const LOOPS_TEMPLATE_ID = "cmlc5hhdz1ebf0i25hqomb3zf"; // Template ID from Loops dashboard
const LOOPS_API_URL = "https://app.loops.so/api/v1/transactional";

/**
 * Get deduplicated list of recipients for an account
 * Returns: Account owner + Org admins (who have weeklyAnalyticsEnabled = true)
 * Deduplicates if owner is also an org admin
 */
function getRecipientsForAccount(account: {
  owner: {
    id: string;
    primaryEmailAddress: string | null;
    firstName: string | null;
    emailPreferences: { weeklyAnalyticsEnabled: boolean } | null;
  } | null;
  org: {
    id: string;
    members: Array<{
      role: string;
      user: {
        id: string;
        primaryEmailAddress: string | null;
        firstName: string | null;
        emailPreferences: { weeklyAnalyticsEnabled: boolean } | null;
      };
    }>;
  } | null;
}): Array<{ email: string; firstName: string; userId: string }> {
  const recipients: Map<string, { email: string; firstName: string; userId: string }> = new Map();

  // Add account owner (if exists and has email preferences enabled)
  if (
    account.owner &&
    account.owner.primaryEmailAddress &&
    account.owner.emailPreferences?.weeklyAnalyticsEnabled !== false
  ) {
    recipients.set(account.owner.id, {
      email: account.owner.primaryEmailAddress,
      firstName: account.owner.firstName || "there",
      userId: account.owner.id,
    });
  }

  // Add org admins (if org exists)
  if (account.org) {
    for (const member of account.org.members) {
      if (
        member.role === "org:admin" &&
        member.user.primaryEmailAddress &&
        member.user.emailPreferences?.weeklyAnalyticsEnabled !== false
      ) {
        // Map automatically deduplicates by userId
        recipients.set(member.user.id, {
          email: member.user.primaryEmailAddress,
          firstName: member.user.firstName || "there",
          userId: member.user.id,
        });
      }
    }
  }

  return Array.from(recipients.values());
}

/**
 * Send weekly analytics email workflow
 * Runs every Tuesday at 10 AM UTC
 * Sends one email per LinkedInAccount to owner + org admins
 */
const sendWeeklyAnalyticsEmailsWorkflow = DBOS.registerWorkflow(
  async function (_scheduledTime: Date, _startTime: Date) {
    DBOS.logger.info("[send-weekly-analytics] Workflow started");

    // Step 1: Get all accounts to email
    const accounts = await DBOS.runStep(
      async () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Query accounts with:
        // - ownerId IS NOT NULL (skip orphaned accounts)
        // - Has analytics data in last 7 days
        // - Include owner, org, org members, and analytics
        const accountsWithData = await db.linkedInAccount.findMany({
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
        });

        return accountsWithData;
      },
      { name: "get-accounts-to-email" },
    );

    DBOS.logger.info(
      `[send-weekly-analytics] Found ${accounts.length} accounts with analytics data`,
    );

    // Step 2: Send emails for each account
    let totalEmailsSent = 0;
    let totalEmailsFailed = 0;

    for (const account of accounts) {
      try {
        // Get deduplicated recipients (owner + org admins)
        const recipients = getRecipientsForAccount(account);

        if (recipients.length === 0) {
          DBOS.logger.info(
            `[send-weekly-analytics] No recipients for account ${account.id} (owner/admins have unsubscribed or no email)`,
          );
          continue;
        }

        // Extract analytics data for last 7 days
        const analyticsData = account.analyticsDaily;

        if (analyticsData.length === 0) {
          DBOS.logger.warn(
            `[send-weekly-analytics] No analytics data for account ${account.id}, skipping`,
          );
          continue;
        }

        // Build metric arrays (sorted by date ascending)
        const followers = analyticsData.map((d) => d.followers);
        const invites = analyticsData.map((d) => d.invites);
        const comments = analyticsData.map((d) => d.comments);
        const contentReach = analyticsData.map((d) => d.contentReach);
        const profileViews = analyticsData.map((d) => d.profileViews);
        const engageReach = analyticsData.map((d) => d.engageReach);
        const dateLabels = analyticsData.map((d) =>
          d.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        );

        // Pad data to 7 days if needed
        const paddedData = {
          followers: padToSevenDays(followers),
          invites: padToSevenDays(invites),
          comments: padToSevenDays(comments),
          contentReach: padToSevenDays(contentReach),
          profileViews: padToSevenDays(profileViews),
          engageReach: padToSevenDays(engageReach),
          labels: padDateLabels(dateLabels),
        };

        // Calculate percentage changes
        const percentageChanges: Record<string, number | null> = {
          followers: calculatePercentageChange(paddedData.followers),
          invites: calculatePercentageChange(paddedData.invites),
          comments: calculatePercentageChange(paddedData.comments),
          contentReach: calculatePercentageChange(paddedData.contentReach),
          profileViews: calculatePercentageChange(paddedData.profileViews),
          engageReach: calculatePercentageChange(paddedData.engageReach),
        };

        // Find top metric
        const topMetric = findTopMetric(percentageChanges);

        // Get current (latest) values
        const latestData = analyticsData[analyticsData.length - 1]!;

        // Calculate total activities for subject line logic
        const totalActivities =
          latestData.followers +
          latestData.invites +
          latestData.comments +
          latestData.contentReach +
          latestData.profileViews +
          latestData.engageReach;

        // Generate chart URL
        const chartUrl = generateChartUrl(paddedData);

        // Week ending date for subject uniqueness
        const weekEndDate = new Date();
        const weekEndFormatted = weekEndDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        // Construct CTA URLs
        const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://app.engagekit.io";
        const ctaEarnPremiumUrl = "https://engagekit.io/earn-premium";
        const ctaSubscribeUrl = "https://engagekit.io/subscription";

        // Send email to each recipient
        for (const recipient of recipients) {
          await DBOS.runStep(
            async () => {
              // Generate dynamic subject line and meme for this recipient
              const baseSubject = generateSubjectLine(
                recipient.firstName,
                topMetric,
                totalActivities,
                latestData.followers,
              );
              const dynamicSubject = `${baseSubject} (Week of ${weekEndFormatted})`;
              const memeUrl = generateMemeUrl(recipient.firstName, topMetric);

              // Build email payload
              const emailPayload = {
                transactionalId: LOOPS_TEMPLATE_ID,
                email: recipient.email,
                dataVariables: {
                  // Subject line (dynamic based on psychology patterns + date for uniqueness)
                  subject: dynamicSubject,
                  // User info
                  userFirstName: recipient.firstName,
                  // Static assets
                  kitGifUrl: `${baseUrl}/email-assets/kit-sprite-blink.gif`,
                  // Icon URLs
                  iconFollowers: "https://engagekit.io/email-assets/icons/users-white.png",
                  iconInvites: "https://engagekit.io/email-assets/icons/mail-white.png",
                  iconComments:
                    "https://engagekit.io/email-assets/icons/message-square-white.png",
                  iconContentReach:
                    "https://engagekit.io/email-assets/icons/trending-up-white.png",
                  iconProfileViews:
                    "https://engagekit.io/email-assets/icons/bar-chart-3-white.png",
                  iconEngageReach: "https://engagekit.io/email-assets/icons/eye-black.png",
                  // Dynamic URLs (chart and meme)
                  chartUrl,
                  memeUrl,
                  ctaUrl: ctaEarnPremiumUrl,
                  ctaSubscribeUrl,
                  // Hero highlight - top performing metric
                  highlightMetric: topMetric.name,
                  highlightValue: formatNumber(
                    latestData[topMetric.key as keyof typeof latestData] as number,
                  ),
                  highlightChange: formatPercentageChange(topMetric.growth),
                  highlightIsPositive: topMetric.growth >= 0 ? "true" : "false",
                  // Current metrics (formatted)
                  followers: formatNumber(latestData.followers),
                  invites: formatNumber(latestData.invites),
                  comments: formatNumber(latestData.comments),
                  contentReach: formatNumber(latestData.contentReach),
                  profileViews: formatNumber(latestData.profileViews),
                  engageReach: formatNumber(latestData.engageReach),
                  // Percentage changes
                  followersChange: formatPercentageChange(percentageChanges.followers ?? null),
                  invitesChange: formatPercentageChange(percentageChanges.invites ?? null),
                  commentsChange: formatPercentageChange(percentageChanges.comments ?? null),
                  contentReachChange: formatPercentageChange(
                    percentageChanges.contentReach ?? null,
                  ),
                  profileViewsChange: formatPercentageChange(
                    percentageChanges.profileViews ?? null,
                  ),
                  engageReachChange: formatPercentageChange(
                    percentageChanges.engageReach ?? null,
                  ),
                },
              };

              // Send email via Loops API
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
                DBOS.logger.error(
                  `[send-weekly-analytics] Failed to send email to ${recipient.email}: ${errorText}`,
                );
                throw new Error(`Loops API error: ${errorText}`);
              }

              const result = await response.json();
              DBOS.logger.info(
                `[send-weekly-analytics] Email sent successfully to ${recipient.email}`,
                result,
              );
            },
            { name: `send-email-${account.id}-${recipient.userId}` },
          );

          totalEmailsSent++;
        }

        DBOS.logger.info(
          `[send-weekly-analytics] Sent ${recipients.length} emails for account ${account.id}`,
        );
      } catch (error) {
        totalEmailsFailed++;
        DBOS.logger.error(
          `[send-weekly-analytics] Error processing account ${account.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
        // Continue to next account (don't fail entire workflow)
      }
    }

    DBOS.logger.info(
      `[send-weekly-analytics] Workflow complete. Sent: ${totalEmailsSent}, Failed: ${totalEmailsFailed}`,
    );
  },
  {
    name: "send-weekly-analytics-emails-workflow",
  },
);

// Schedule workflow to run every Wednesday at 10 AM UTC
DBOS.registerScheduled(sendWeeklyAnalyticsEmailsWorkflow, {
  crontab: "0 10 * * 3", // Wednesday at 10:00 AM UTC
  mode: SchedulerMode.ExactlyOncePerInterval,
  name: sendWeeklyAnalyticsEmailsWorkflow.name,
});
