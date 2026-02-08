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
     * Send Test Analytics Email
     * Sends a test email with LinkedIn analytics metrics to the current user
     * Uses Loops transactional email API
     */
    sendTestAnalyticsEmail: protectedProcedure
      .input(
        z.object({
          followers: z.number().int().nonnegative(),
          invites: z.number().int().nonnegative(),
          comments: z.number().int().nonnegative(),
          contentReach: z.number().int().nonnegative(),
          profileView: z.number().int().nonnegative(), // Note: singular per template
          engageReach: z.number().int().nonnegative(),
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

        const LOOPS_API_KEY = env.LOOPS_API_KEY;
        const LOOPS_TEMPLATE_ID = "cmlc5hhdz1ebf0i25hqomb3zf"; // Template ID from Loops dashboard

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
                  followers: input.followers,
                  invites: input.invites,
                  comments: input.comments,
                  contentReach: input.contentReach,
                  profileView: input.profileView,
                  engageReach: input.engageReach,
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
