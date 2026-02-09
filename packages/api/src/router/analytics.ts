import { TRPCError } from "@trpc/server";
import z from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { analyticsSyncInputSchema } from "../schema-validators";
import { env } from "../utils/env";
import {
  normalizeToStartOfDay,
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
 * Analytics Router
 * Handles analytics-related endpoints including email reports
 */

export const analyticsRouter = () =>
  createTRPCRouter({
    /**
     * Sync Daily Analytics Metrics
     * Upserts LinkedIn analytics data for the current account
     * One record per account per day (based on normalized UTC date)
     */
    syncDailyMetrics: protectedProcedure
      .input(analyticsSyncInputSchema)
      .mutation(async ({ ctx, input }) => {
        if (!ctx.activeAccount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No active account selected",
          });
        }

        // Normalize date to start-of-day UTC (defaults to today if not provided)
        const normalizedDate = normalizeToStartOfDay(input.date);

        // Upsert: update if record exists for this account+date, create if new
        const record = await ctx.db.linkedInAnalyticsDaily.upsert({
          where: {
            accountId_date: {
              accountId: ctx.activeAccount.id,
              date: normalizedDate,
            },
          },
          update: {
            followers: input.followers,
            invites: input.invites,
            comments: input.comments,
            contentReach: input.contentReach,
            profileViews: input.profileViews,
            engageReach: input.engageReach,
          },
          create: {
            accountId: ctx.activeAccount.id,
            date: normalizedDate,
            followers: input.followers,
            invites: input.invites,
            comments: input.comments,
            contentReach: input.contentReach,
            profileViews: input.profileViews,
            engageReach: input.engageReach,
          },
        });

        console.log(
          "Analytics synced for account:",
          ctx.activeAccount.id,
          "date:",
          normalizedDate.toISOString(),
        );

        return record;
      }),

    /**
     * Backfill Analytics (Batch Sync)
     * One-time sync of historical analytics data from extension local storage
     * Upserts multiple daily records in a single transaction
     */
    backfillAnalytics: protectedProcedure
      .input(
        z.object({
          dailyRecords: z.array(analyticsSyncInputSchema),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.activeAccount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No active account selected",
          });
        }

        if (input.dailyRecords.length === 0) {
          return { synced: 0, accountId: ctx.activeAccount.id };
        }

        // Capture accountId for use in transaction
        const accountId = ctx.activeAccount.id;

        try {
          // Batch upsert all records in a transaction
          const results = await ctx.db.$transaction(
            input.dailyRecords.map((record) => {
              const normalizedDate = normalizeToStartOfDay(record.date);

              return ctx.db.linkedInAnalyticsDaily.upsert({
                where: {
                  accountId_date: {
                    accountId,
                    date: normalizedDate,
                  },
                },
                update: {
                  followers: record.followers,
                  invites: record.invites,
                  comments: record.comments,
                  contentReach: record.contentReach,
                  profileViews: record.profileViews,
                  engageReach: record.engageReach,
                },
                create: {
                  accountId,
                  date: normalizedDate,
                  followers: record.followers,
                  invites: record.invites,
                  comments: record.comments,
                  contentReach: record.contentReach,
                  profileViews: record.profileViews,
                  engageReach: record.engageReach,
                },
              });
            }),
          );

          console.log(
            "Backfill completed for account:",
            accountId,
            "records synced:",
            results.length,
          );

          return {
            synced: results.length,
            accountId,
          };
        } catch (error) {
          console.error("Backfill analytics error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to backfill analytics data",
          });
        }
      }),

    /**
     * Send Test Analytics Email
     * Sends a test email with LinkedIn analytics metrics to the current user
     * Uses Loops transactional email API with new weekly template design
     */
    sendTestAnalyticsEmail: protectedProcedure
      .input(
        z.object({
          // Current metrics (single values)
          followers: z.number().int().nonnegative(),
          invites: z.number().int().nonnegative(),
          comments: z.number().int().nonnegative(),
          contentReach: z.number().int().nonnegative(),
          profileViews: z.number().int().nonnegative(),
          engageReach: z.number().int().nonnegative(),
          // Historical data (1-7 days, will be padded to 7 if needed)
          followersWeek: z.array(z.number().int().nonnegative()).min(1).max(7),
          invitesWeek: z.array(z.number().int().nonnegative()).min(1).max(7),
          commentsWeek: z.array(z.number().int().nonnegative()).min(1).max(7),
          contentReachWeek: z.array(z.number().int().nonnegative()).min(1).max(7),
          profileViewsWeek: z.array(z.number().int().nonnegative()).min(1).max(7),
          engageReachWeek: z.array(z.number().int().nonnegative()).min(1).max(7),
          // Date labels for chart (e.g., ["Feb 1", "Feb 2", ...])
          dateLabels: z.array(z.string()).min(1).max(7),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const userEmail = ctx.user.primaryEmailAddress;

        if (!userEmail) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User email not found",
          });
        }

        if (!ctx.activeAccount) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No active account selected",
          });
        }

        const LOOPS_API_KEY = env.LOOPS_API_KEY;
        const LOOPS_TEMPLATE_ID = "cmlc5hhdz1ebf0i25hqomb3zf"; // Template ID from Loops dashboard (will be updated)

        // Pad data to 7 days if needed (handles new accounts with <7 days of data)
        const paddedData = {
          followers: padToSevenDays(input.followersWeek),
          invites: padToSevenDays(input.invitesWeek),
          comments: padToSevenDays(input.commentsWeek),
          contentReach: padToSevenDays(input.contentReachWeek),
          profileViews: padToSevenDays(input.profileViewsWeek),
          engageReach: padToSevenDays(input.engageReachWeek),
          labels: padDateLabels(input.dateLabels),
        };

        // Calculate percentage changes for each metric (first day vs last day)
        const percentageChanges: Record<string, number | null> = {
          followers: calculatePercentageChange(paddedData.followers),
          invites: calculatePercentageChange(paddedData.invites),
          comments: calculatePercentageChange(paddedData.comments),
          contentReach: calculatePercentageChange(paddedData.contentReach),
          profileViews: calculatePercentageChange(paddedData.profileViews),
          engageReach: calculatePercentageChange(paddedData.engageReach),
        };

        // Find top metric (highest absolute growth)
        const topMetric = findTopMetric(percentageChanges);

        // Calculate total activities for subject line logic
        const totalActivities = input.followers + input.invites + input.comments +
          input.contentReach + input.profileViews + input.engageReach;

        // Generate dynamic subject line with psychology patterns
        const firstName = ctx.user.firstName || "there";

        // Add week ending date to subject to prevent email threading
        const weekEndDate = new Date();
        const weekEndFormatted = weekEndDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        const baseSubject = generateSubjectLine(
          firstName,
          topMetric,
          totalActivities,
          input.followers,
        );
        // Append date to make subject unique each week
        const dynamicSubject = `${baseSubject} (Week of ${weekEndFormatted})`;

        // Generate chart URL using QuickChart.io (with larger dimensions)
        const chartUrl = generateChartUrl(paddedData);

        // Construct URLs - using main website domain
        const ctaEarnPremiumUrl = "https://engagekit.io/earn-premium";
        const ctaSubscribeUrl = "https://engagekit.io/subscription";
        const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://app.engagekit.io";

        // Generate dynamic meme based on user performance
        const memeUrl = generateMemeUrl(firstName, topMetric);

        // Additional test recipients
        const testRecipients = [
          userEmail,
          "knamnguyen.work@gmail.com",
          "lamzihao98@gmail.com",
        ];

        try {
          // Send to all recipients
          const sendResults = await Promise.all(
            testRecipients.map(async (recipientEmail) => {
              // Generate unique meme for each recipient
              const recipientMemeUrl = generateMemeUrl(firstName, topMetric);

              const response = await fetch(
                "https://app.loops.so/api/v1/transactional",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${LOOPS_API_KEY}`,
                  },
                  body: JSON.stringify({
                    transactionalId: LOOPS_TEMPLATE_ID,
                    email: recipientEmail,
                    dataVariables: {
                      // Subject line (dynamic based on psychology patterns + date for uniqueness)
                      subject: dynamicSubject,
                      // User info
                      userFirstName: firstName,
                      // Static assets
                      kitGifUrl: `${baseUrl}/email-assets/kit-sprite-blink.gif`,
                      // Icon URLs (passed as variables to avoid Loops URL processing issues)
                      iconFollowers: "https://engagekit.io/email-assets/icons/users-white.png",
                      iconInvites: "https://engagekit.io/email-assets/icons/mail-white.png",
                      iconComments: "https://engagekit.io/email-assets/icons/message-square-white.png",
                      iconContentReach: "https://engagekit.io/email-assets/icons/trending-up-white.png",
                      iconProfileViews: "https://engagekit.io/email-assets/icons/bar-chart-3-white.png",
                      iconEngageReach: "https://engagekit.io/email-assets/icons/eye-black.png",
                      // Dynamic URLs (chart and meme generated per send)
                      chartUrl,
                      memeUrl: recipientMemeUrl,
                      ctaUrl: ctaEarnPremiumUrl,
                      ctaSubscribeUrl,
                      // Hero highlight - top performing metric
                      highlightMetric: topMetric.name,
                      highlightValue: formatNumber(Number(input[topMetric.key as keyof typeof input]) || 0),
                      highlightChange: formatPercentageChange(topMetric.growth),
                      highlightIsPositive: topMetric.growth >= 0 ? "true" : "false",
                      // Current metrics (formatted with abbreviations for large numbers)
                      followers: formatNumber(input.followers),
                      invites: formatNumber(input.invites),
                      comments: formatNumber(input.comments),
                      contentReach: formatNumber(input.contentReach),
                      profileViews: formatNumber(input.profileViews),
                      engageReach: formatNumber(input.engageReach),
                      // Percentage changes for each metric
                      followersChange: formatPercentageChange(percentageChanges.followers ?? null),
                      invitesChange: formatPercentageChange(percentageChanges.invites ?? null),
                      commentsChange: formatPercentageChange(percentageChanges.comments ?? null),
                      contentReachChange: formatPercentageChange(percentageChanges.contentReach ?? null),
                      profileViewsChange: formatPercentageChange(percentageChanges.profileViews ?? null),
                      engageReachChange: formatPercentageChange(percentageChanges.engageReach ?? null),
                    },
                  }),
                },
              );

              if (!response.ok) {
                const errorText = await response.text();
                console.error(`Loops API error for ${recipientEmail}:`, errorText);
                return { email: recipientEmail, success: false, error: errorText };
              }

              const result = await response.json();
              console.log("Email sent successfully to:", recipientEmail, result);
              return { email: recipientEmail, success: true };
            }),
          );

          const successCount = sendResults.filter((r) => r.success).length;
          const failedRecipients = sendResults.filter((r) => !r.success).map((r) => r.email);

          return {
            success: successCount > 0,
            message: `Test email sent to ${successCount}/${testRecipients.length} recipients`,
            recipients: testRecipients,
            failedRecipients,
            chartUrl, // Return for debugging
          };
        } catch (error) {
          console.error("Error sending test analytics email:", error);

          if (error instanceof TRPCError) {
            throw error;
          }

          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send test email",
          });
        }
      }),

    /**
     * Send Test Analytics Email from Real DB Data
     * Queries actual analytics data from DB and sends test email
     * Validates the full flow before scheduled workflow runs
     */
    sendTestEmailFromDB: protectedProcedure.mutation(async ({ ctx }) => {
      const userEmail = ctx.user.primaryEmailAddress;

      if (!userEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User email not found",
        });
      }

      if (!ctx.activeAccount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active account selected",
        });
      }

      // Query last 7 days of analytics data for this account
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const analyticsRecords = await ctx.db.linkedInAnalyticsDaily.findMany({
        where: {
          accountId: ctx.activeAccount.id,
          date: {
            gte: sevenDaysAgo,
          },
        },
        orderBy: {
          date: "asc",
        },
      });

      if (analyticsRecords.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "No analytics data found for this account. Please sync analytics data first by visiting the Analytics tab in the extension.",
        });
      }

      // Extract arrays from records
      const followersWeek = analyticsRecords.map((r) => r.followers);
      const invitesWeek = analyticsRecords.map((r) => r.invites);
      const commentsWeek = analyticsRecords.map((r) => r.comments);
      const contentReachWeek = analyticsRecords.map((r) => r.contentReach);
      const profileViewsWeek = analyticsRecords.map((r) => r.profileViews);
      const engageReachWeek = analyticsRecords.map((r) => r.engageReach);

      // Generate date labels from actual dates
      const dateLabels = analyticsRecords.map((r) =>
        r.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      );

      // Get latest values as current metrics
      const latestRecord = analyticsRecords[analyticsRecords.length - 1]!;
      const currentMetrics = {
        followers: latestRecord.followers,
        invites: latestRecord.invites,
        comments: latestRecord.comments,
        contentReach: latestRecord.contentReach,
        profileViews: latestRecord.profileViews,
        engageReach: latestRecord.engageReach,
      };

      const LOOPS_API_KEY = env.LOOPS_API_KEY;
      const LOOPS_TEMPLATE_ID = "cmlc5hhdz1ebf0i25hqomb3zf";

      // Pad data to 7 days if needed
      const paddedData = {
        followers: padToSevenDays(followersWeek),
        invites: padToSevenDays(invitesWeek),
        comments: padToSevenDays(commentsWeek),
        contentReach: padToSevenDays(contentReachWeek),
        profileViews: padToSevenDays(profileViewsWeek),
        engageReach: padToSevenDays(engageReachWeek),
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

      // Calculate total activities
      const totalActivities =
        currentMetrics.followers +
        currentMetrics.invites +
        currentMetrics.comments +
        currentMetrics.contentReach +
        currentMetrics.profileViews +
        currentMetrics.engageReach;

      // Generate dynamic subject line
      const firstName = ctx.user.firstName || "there";
      const weekEndDate = new Date();
      const weekEndFormatted = weekEndDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const baseSubject = generateSubjectLine(
        firstName,
        topMetric,
        totalActivities,
        currentMetrics.followers,
      );
      const dynamicSubject = `${baseSubject} (Week of ${weekEndFormatted})`;

      // Generate chart URL
      const chartUrl = generateChartUrl(paddedData);

      // Construct URLs
      const ctaEarnPremiumUrl = "https://engagekit.io/earn-premium";
      const ctaSubscribeUrl = "https://engagekit.io/subscription";
      const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://app.engagekit.io";

      // Generate meme
      const memeUrl = generateMemeUrl(firstName, topMetric);

      try {
        const response = await fetch(
          "https://app.loops.so/api/v1/transactional",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LOOPS_API_KEY}`,
            },
            body: JSON.stringify({
              transactionalId: LOOPS_TEMPLATE_ID,
              email: userEmail,
              dataVariables: {
                subject: dynamicSubject,
                userFirstName: firstName,
                kitGifUrl: `${baseUrl}/email-assets/kit-sprite-blink.gif`,
                iconFollowers:
                  "https://engagekit.io/email-assets/icons/users-white.png",
                iconInvites:
                  "https://engagekit.io/email-assets/icons/mail-white.png",
                iconComments:
                  "https://engagekit.io/email-assets/icons/message-square-white.png",
                iconContentReach:
                  "https://engagekit.io/email-assets/icons/trending-up-white.png",
                iconProfileViews:
                  "https://engagekit.io/email-assets/icons/bar-chart-3-white.png",
                iconEngageReach:
                  "https://engagekit.io/email-assets/icons/eye-black.png",
                chartUrl,
                memeUrl,
                ctaUrl: ctaEarnPremiumUrl,
                ctaSubscribeUrl,
                highlightMetric: topMetric.name,
                highlightValue: formatNumber(
                  currentMetrics[
                    topMetric.key as keyof typeof currentMetrics
                  ] || 0,
                ),
                highlightChange: formatPercentageChange(topMetric.growth),
                highlightIsPositive: topMetric.growth >= 0 ? "true" : "false",
                followers: formatNumber(currentMetrics.followers),
                invites: formatNumber(currentMetrics.invites),
                comments: formatNumber(currentMetrics.comments),
                contentReach: formatNumber(currentMetrics.contentReach),
                profileViews: formatNumber(currentMetrics.profileViews),
                engageReach: formatNumber(currentMetrics.engageReach),
                followersChange: formatPercentageChange(
                  percentageChanges.followers ?? null,
                ),
                invitesChange: formatPercentageChange(
                  percentageChanges.invites ?? null,
                ),
                commentsChange: formatPercentageChange(
                  percentageChanges.comments ?? null,
                ),
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
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Loops API error:", errorText);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Email service error: ${errorText}`,
          });
        }

        const result = await response.json();
        console.log("Test email (from DB) sent successfully to:", userEmail, result);

        return {
          success: true,
          recipient: userEmail,
          recordsUsed: analyticsRecords.length,
          dateRange: {
            from: analyticsRecords[0]!.date.toISOString(),
            to: latestRecord.date.toISOString(),
          },
          chartUrl,
          topMetric: topMetric.name,
        };
      } catch (error) {
        console.error("Error sending test analytics email from DB:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send test email",
        });
      }
    }),
  });
