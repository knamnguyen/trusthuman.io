import { TRPCError } from "@trpc/server";
import z from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { analyticsSyncInputSchema } from "../schema-validators";
import { env } from "../utils/env";

/**
 * Analytics Router
 * Handles analytics-related endpoints including email reports
 */

/**
 * Normalize date to start-of-day UTC (00:00:00)
 * Ensures consistent date format for composite unique constraint @@unique([accountId, date])
 *
 * @param date - Date object or ISO string (optional, defaults to today)
 * @returns Date object set to midnight UTC
 *
 * @example
 * normalizeToStartOfDay(new Date('2025-02-08T15:30:00Z')) // Returns 2025-02-08T00:00:00Z
 * normalizeToStartOfDay() // Returns today at 00:00:00Z
 */
function normalizeToStartOfDay(date?: Date | string): Date {
  const d = date ? (typeof date === "string" ? new Date(date) : date) : new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Metric display names for user-facing text
 */
const METRIC_DISPLAY_NAMES: Record<string, string> = {
  followers: "Followers",
  invites: "Invites",
  comments: "Comments",
  contentReach: "Content Reach",
  profileViews: "Profile Views",
  engageReach: "Engage Reach",
};

/**
 * Calculate percentage change from first to last value in array
 * Returns null if invalid data (division by zero, etc.)
 */
function calculatePercentageChange(data: number[]): number | null {
  if (data.length < 2) return null;
  const first = data[0]!;
  const last = data[data.length - 1]!;
  if (first === 0) return last > 0 ? 100 : 0; // Avoid division by zero
  return Math.round(((last - first) / first) * 100);
}

/**
 * Format percentage change for display (e.g., "+14%" or "-8%")
 */
function formatPercentageChange(change: number | null): string {
  if (change === null) return "0%";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change}%`;
}

/**
 * Format large numbers with abbreviations (e.g., 1000 → "1k", 1500 → "1.5k")
 * Matches the extension's display format
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    const value = num / 1000000;
    return value % 1 === 0 ? `${value}M` : `${value.toFixed(1)}M`;
  }
  if (num >= 1000) {
    const value = num / 1000;
    return value % 1 === 0 ? `${value}k` : `${value.toFixed(1)}k`;
  }
  return String(num);
}

/**
 * Find the top performing metric (highest absolute growth)
 */
function findTopMetric(percentageChanges: Record<string, number | null>): {
  key: string;
  name: string;
  growth: number;
} {
  const entries = Object.entries(percentageChanges)
    .filter(([_, value]) => value !== null && !isNaN(value as number))
    .sort((a, b) => Math.abs((b[1] as number)) - Math.abs((a[1] as number)));

  if (entries.length === 0) {
    return { key: "followers", name: "Followers", growth: 0 };
  }

  const [key, growth] = entries[0]!;
  return {
    key,
    name: METRIC_DISPLAY_NAMES[key] || key,
    growth: growth as number,
  };
}

/**
 * Subject line patterns based on Duolingo psychology strategy
 */
type SubjectCategory = "CELEBRATION" | "CHALLENGE" | "EMPATHY" | "URGENCY" | "MILESTONE" | "CURIOSITY" | "HUMOR" | "NEUTRAL";

const SUBJECT_PATTERNS: Record<SubjectCategory, string[]> = {
  CELEBRATION: [
    "Congrats {firstName}, {change} this week! 🎉",
    "{firstName}, you're crushing it! {change} 🔥",
    "Amazing week, {firstName}! {change} 🚀",
    "{firstName}, new record! {change} 📈",
    "You're on fire, {firstName}! {change} 💪",
  ],
  CHALLENGE: [
    "Did you beat last week, {firstName}? 💪",
    "{firstName}, keep pushing! {change}",
    "Almost there, {firstName}! {change}",
    "Can you do better, {firstName}? {change}",
  ],
  EMPATHY: [
    "Don't be sad, {firstName}... {metric} {change}",
    "Tough week, {firstName}? {metric} down {changeAbs}%",
    "{firstName}, let's bounce back! {change} last week",
    "It happens, {firstName}. {change} this week",
  ],
  URGENCY: [
    "Uh oh, {firstName}. {metric} dropped {changeAbs}%",
    "{firstName}, we need to talk... {change} 📉",
    "Don't let it slide, {firstName}! {change}",
  ],
  MILESTONE: [
    "{firstName}, {total} LinkedIn wins this week!",
    "{total} activities! Keep going, {firstName}",
    "You hit {followers} followers, {firstName}! 🎯",
  ],
  CURIOSITY: [
    "{firstName}, you won't believe this... 👀",
    "Interesting week, {firstName} 🤔",
    "{firstName}, check this out...",
    "Hmm, {firstName}. Interesting. 💭",
  ],
  HUMOR: [
    "{firstName}, LinkedIn ghost mode? 👻",
    "Did LinkedIn break, {firstName}? 🤷",
    "Still alive, {firstName}? 😴",
    "{firstName}, your LinkedIn needs you! 💼",
  ],
  NEUTRAL: [
    "{firstName}'s LinkedIn stats 📊",
    "This week's report, {firstName} 📈",
    "Stats are in, {firstName}! 🎯",
  ],
};

/**
 * Select subject line category based on growth and activity
 */
function selectSubjectCategory(growth: number, totalActivities: number): SubjectCategory {
  if (growth >= 20) return "CELEBRATION";
  if (growth >= 5 && growth < 20) return "CHALLENGE";
  if (growth < 0 && growth >= -20) return "EMPATHY";
  if (growth < -20) return "URGENCY";
  if (totalActivities >= 50) return "MILESTONE";
  if (Math.abs(growth) <= 5) return "CURIOSITY";
  if (totalActivities < 10) return "HUMOR";
  return "NEUTRAL";
}

/**
 * Generate dynamic subject line with psychology patterns
 */
function generateSubjectLine(
  firstName: string,
  topMetric: { name: string; growth: number },
  totalActivities: number,
  followers: number,
): string {
  const category = selectSubjectCategory(topMetric.growth, totalActivities);
  const patterns = SUBJECT_PATTERNS[category];
  const pattern = patterns[Math.floor(Math.random() * patterns.length)]!;

  const change = formatPercentageChange(topMetric.growth);
  const changeAbs = Math.abs(topMetric.growth);

  return pattern
    .replace(/{firstName}/g, firstName)
    .replace(/{change}/g, change)
    .replace(/{changeAbs}/g, String(changeAbs))
    .replace(/{metric}/g, topMetric.name)
    .replace(/{total}/g, String(totalActivities))
    .replace(/{followers}/g, String(followers));
}

/**
 * Generate QuickChart.io chart URL for 7-day analytics visualization
 * Increased dimensions for better readability
 *
 * @param data - 7-day data arrays for each metric
 * @param labels - Date labels for the X-axis
 * @returns Encoded QuickChart.io URL
 */
function generateChartUrl(data: {
  followers: number[];
  invites: number[];
  comments: number[];
  contentReach: number[];
  profileViews: number[];
  engageReach: number[];
  labels: string[];
}): string {
  // Define all metrics with their styling
  const metrics = [
    {
      key: "followers",
      label: "Followers",
      data: data.followers,
      borderColor: "#1b9aaa",
      backgroundColor: "rgba(27, 154, 170, 0.1)",
    },
    {
      key: "invites",
      label: "Invites",
      data: data.invites,
      borderColor: "#308169",
      backgroundColor: "rgba(48, 129, 105, 0.1)",
    },
    {
      key: "comments",
      label: "Comments",
      data: data.comments,
      borderColor: "#ffc63d",
      backgroundColor: "rgba(255, 198, 61, 0.1)",
    },
    {
      key: "contentReach",
      label: "Content Reach",
      data: data.contentReach,
      borderColor: "#ed6b67",
      backgroundColor: "rgba(237, 107, 103, 0.1)",
    },
    {
      key: "profileViews",
      label: "Profile Views",
      data: data.profileViews,
      borderColor: "#e5496d",
      backgroundColor: "rgba(229, 73, 109, 0.1)",
    },
    {
      key: "engageReach",
      label: "Engage Reach",
      data: data.engageReach,
      borderColor: "#f9dcec",
      backgroundColor: "rgba(249, 220, 236, 0.1)",
    },
  ];

  // Find the metric with the highest max value (the "top" line on the chart)
  const topMetricKey = metrics.reduce((topKey, metric) => {
    const currentMax = Math.max(...metric.data);
    const topMax = Math.max(
      ...metrics.find((m) => m.key === topKey)!.data,
    );
    return currentMax > topMax ? metric.key : topKey;
  }, metrics[0].key);

  // Build datasets with data labels only on the top line
  const datasets = metrics.map((metric) => ({
    label: metric.label,
    data: metric.data,
    borderColor: metric.borderColor,
    backgroundColor: metric.backgroundColor,
    borderWidth: 6,
    tension: 0.3,
    pointRadius: 10,
    datalabels:
      metric.key === topMetricKey
        ? {
            display: true,
            anchor: "end",
            align: "top",
            font: { size: 24, weight: "bold" },
            color: metric.borderColor,
          }
        : { display: false },
  }));

  const chartConfig = {
    type: "line",
    data: {
      labels: data.labels,
      datasets,
    },
    options: {
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            font: { size: 360 },
            padding: 100,
            boxWidth: 200,
          },
        },
        // Global datalabels default (disabled, overridden per dataset)
        datalabels: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { font: { size: 300 } },
        },
        x: {
          ticks: { font: { size: 300 } },
        },
      },
    },
  };

  // Using devicePixelRatio=0.5 to make fonts appear larger relative to the chart
  return `https://quickchart.io/chart?width=800&height=400&devicePixelRatio=0.5&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
}

/**
 * Pad data arrays to 7 days by repeating the first value for missing days
 * Handles cases where users have less than 7 days of data
 *
 * @param data - Array of data points (1-7 values)
 * @returns Array padded to exactly 7 values
 */
function padToSevenDays<T>(data: T[]): T[] {
  if (data.length === 7) return data;
  if (data.length === 0) return Array(7).fill(0 as T);

  // Pad by repeating the first value for earlier days
  const paddingNeeded = 7 - data.length;
  const padding = Array(paddingNeeded).fill(data[0]);
  return [...padding, ...data];
}

/**
 * Generate date labels for the last 7 days
 * If fewer labels provided, generates labels for earlier days
 *
 * @param labels - Existing labels (1-7 values)
 * @returns Array of 7 date labels
 */
function padDateLabels(labels: string[]): string[] {
  if (labels.length === 7) return labels;

  // Generate missing labels by going back in time
  const paddingNeeded = 7 - labels.length;
  const missingLabels: string[] = [];

  // Parse the earliest date and go backwards
  // For simplicity, just use generic labels like "Day -6", "Day -5", etc.
  for (let i = paddingNeeded; i > 0; i--) {
    missingLabels.push(`-${i}d`);
  }

  return [...missingLabels, ...labels];
}

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
        const dynamicSubject = generateSubjectLine(
          firstName,
          topMetric,
          totalActivities,
          input.followers,
        );

        // Generate chart URL using QuickChart.io (with larger dimensions)
        const chartUrl = generateChartUrl(paddedData);

        // Construct URLs - using main website domain
        const ctaEarnPremiumUrl = "https://engagekit.io/earn-premium";
        const ctaSubscribeUrl = "https://engagekit.io/subscription";
        const baseUrl = env.NEXT_PUBLIC_APP_URL || "https://app.engagekit.io";

        // Sample encouragement meme (same for all users in weekly batch)
        // Memegen.link - Meme with motivational text
        const memeUrl = "https://api.memegen.link/images/success/Keep_crushing_it!/Your_consistency_is_paying_off.png";

        try {
          // Call Loops transactional API
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
                  // Subject line (dynamic based on psychology patterns)
                  subject: dynamicSubject,
                  // User info
                  userFirstName: firstName,
                  // Static assets
                  kitGifUrl: `${baseUrl}/email-assets/kit-sprite-blink.gif`,
                  // Dynamic URLs (chart and meme generated per send)
                  chartUrl,
                  memeUrl,
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
            console.error("Loops API error:", errorText);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Failed to send email: ${response.status} ${response.statusText}`,
            });
          }

          const result = await response.json();
          console.log("Email sent successfully to:", userEmail, result);

          return {
            success: true,
            message: "Test email sent successfully",
            recipient: userEmail,
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
  });
