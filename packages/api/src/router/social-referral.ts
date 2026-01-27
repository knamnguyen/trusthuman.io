import { TRPCError } from "@trpc/server";

import {
  getSubmissionStatusSchema,
  listSubmissionsSchema,
  submitPostSchema,
} from "@sassy/social-referral/schema-validators";

import { verifySocialSubmission } from "../services/social-referral-verification";
import { createTRPCRouter, protectedProcedure } from "../trpc";

/**
 * Social Referral Router - Handle social media post submissions for premium rewards
 *
 * All procedures require authenticated user + selected organization
 */
export const socialReferralRouter = () =>
  createTRPCRouter({
    /**
     * Submit a social media post for verification
     * Creates a submission record and triggers async verification
     */
    submit: protectedProcedure
      .input(submitPostSchema)
      .mutation(async ({ ctx, input }) => {
        if (!ctx.activeOrg) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No active organization selected",
          });
        }

        // Check eligibility: org must have exactly 1 LinkedIn account
        const accountCount = await ctx.db.linkedInAccount.count({
          where: { organizationId: ctx.activeOrg.id },
        });

        if (accountCount !== 1) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Organization must have exactly 1 LinkedIn account to participate in social referral program",
          });
        }

        // Check if URL already submitted
        const existingSubmission = await ctx.db.socialSubmission.findFirst({
          where: {
            organizationId: ctx.activeOrg.id,
            postUrl: input.postUrl,
          },
        });

        if (existingSubmission) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This post has already been submitted",
          });
        }

        // Create submission record with VERIFYING status
        const submission = await ctx.db.socialSubmission.create({
          data: {
            organizationId: ctx.activeOrg.id,
            platform: input.platform.toUpperCase() as
              | "X"
              | "LINKEDIN"
              | "THREADS"
              | "FACEBOOK",
            postUrl: input.postUrl,
            status: "VERIFYING",
          },
        });

        // Trigger verification asynchronously (fire-and-forget)
        // Phase 2: Replace with proper job queue
        void verifySocialSubmission(ctx.db, submission.id).catch((error) => {
          console.error(
            `[Social Referral] Async verification failed for ${submission.id}:`,
            error,
          );
        });

        // Return immediately - verification happens in background
        return {
          id: submission.id,
          status: "verifying" as const,
          daysAwarded: 0,
        };
      }),

    /**
     * Get submission status by ID
     */
    getStatus: protectedProcedure
      .input(getSubmissionStatusSchema)
      .query(async ({ ctx, input }) => {
        if (!ctx.activeOrg) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No active organization selected",
          });
        }

        const submission = await ctx.db.socialSubmission.findUnique({
          where: {
            id: input.submissionId,
            organizationId: ctx.activeOrg.id,
          },
        });

        if (!submission) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Submission not found",
          });
        }

        return {
          id: submission.id,
          platform: submission.platform.toLowerCase(),
          postUrl: submission.postUrl,
          status: submission.status,
          submittedAt: submission.submittedAt,
          verifiedAt: submission.verifiedAt,
          containsKeyword: submission.containsKeyword,
          postText: submission.postText,
          likes: submission.likes,
          comments: submission.comments,
          shares: submission.shares,
          daysAwarded: submission.daysAwarded,
        };
      }),

    /**
     * List all submissions for current organization
     */
    list: protectedProcedure
      .input(listSubmissionsSchema)
      .query(async ({ ctx, input }) => {
        if (!ctx.activeOrg) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No active organization selected",
          });
        }

        const submissions = await ctx.db.socialSubmission.findMany({
          where: {
            organizationId: ctx.activeOrg.id,
          },
          orderBy: {
            submittedAt: "desc",
          },
          take: input.limit,
          skip: input.offset,
        });

        return submissions.map((submission) => ({
          id: submission.id,
          platform: submission.platform.toLowerCase(),
          postUrl: submission.postUrl,
          status: submission.status,
          submittedAt: submission.submittedAt,
          verifiedAt: submission.verifiedAt,
          containsKeyword: submission.containsKeyword,
          daysAwarded: submission.daysAwarded,
          likes: submission.likes,
          comments: submission.comments,
          shares: submission.shares,
        }));
      }),

    /**
     * Get current organization's earned premium status
     */
    getEarnedPremiumStatus: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.activeOrg) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active organization selected",
        });
      }

      const org = await ctx.db.organization.findUnique({
        where: { id: ctx.activeOrg.id },
        select: {
          earnedPremiumExpiresAt: true,
        },
      });

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      const now = new Date();
      const isActive = org.earnedPremiumExpiresAt
        ? org.earnedPremiumExpiresAt > now
        : false;
      const daysRemaining = org.earnedPremiumExpiresAt
        ? Math.ceil(
            (org.earnedPremiumExpiresAt.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;

      return {
        isActive,
        expiresAt: org.earnedPremiumExpiresAt,
        daysRemaining: isActive ? daysRemaining : 0,
      };
    }),
  });
