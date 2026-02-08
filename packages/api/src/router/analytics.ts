import { TRPCError } from "@trpc/server";
import z from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { env } from "../utils/env";

/**
 * Analytics Router
 * Handles analytics-related endpoints including email reports
 */

export const analyticsRouter = () =>
  createTRPCRouter({
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
