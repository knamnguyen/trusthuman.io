import { DBOS } from "@dbos-inc/dbos-sdk";
import type { PrismaClient } from "@sassy/db";
import { StripeService } from "@sassy/stripe";
import { compareTwoStrings } from "string-similarity";

import { SocialReferralService } from "@sassy/social-referral";

import { isOrgPremium, ORG_PREMIUM_SELECT } from "./org-access-control";
import { rescanSocialSubmissionWorkflow } from "../workflows/rescan-social-submission.workflow";

// ── Reward constants ──────────────────────────────────────────────────
export const MAX_DAYS_PER_POST = 3;
export const LIKES_THRESHOLD = 10; // +1 day if likes >= 10
export const COMMENTS_THRESHOLD = 5; // +1 day if comments >= 5
export const MONTHLY_CAP_DAYS = 14; // Max earned days per calendar month
const CREDIT_PER_DAY_CENTS = 100; // $1.00/day Stripe credit for paid orgs ($29.99/mo / 30)

const stripeService = new StripeService({
  secretKey: process.env.STRIPE_SECRET_KEY ?? "",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
});

/**
 * Calculate days to award based on engagement metrics.
 * 1 day for verified post + 1 for 10+ likes + 1 for 3+ comments = max 3.
 * Returns only the NEW days to award (delta from already-awarded).
 */
export function calculateDaysToAward(
  likes: number,
  comments: number,
  currentDaysAwarded: number,
): number {
  let totalEarned = 1; // base: 1 day for verified post
  if (likes >= LIKES_THRESHOLD) totalEarned += 1;
  if (comments >= COMMENTS_THRESHOLD) totalEarned += 1;
  totalEarned = Math.min(totalEarned, MAX_DAYS_PER_POST);
  return Math.max(totalEarned - currentDaysAwarded, 0);
}

/**
 * Get total days already awarded to an org in the current calendar month.
 */
async function getMonthlyDaysAwarded(
  db: PrismaClient,
  orgId: string,
): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const result = await db.socialSubmission.aggregate({
    where: {
      organizationId: orgId,
      status: "VERIFIED",
      verifiedAt: { gte: startOfMonth },
    },
    _sum: { daysAwarded: true },
  });
  return result._sum.daysAwarded ?? 0;
}

/**
 * Get platform-specific required keyword
 * - X/Threads: @engagekit_io
 * - LinkedIn/Facebook: #engagekit_io
 */
const getRequiredKeyword = (
  platform: "x" | "linkedin" | "threads" | "facebook",
): string => {
  if (platform === "x" || platform === "threads") {
    return "@engagekit_io";
  }
  // LinkedIn and Facebook
  return "#engagekit_io";
};

interface VerificationResult {
  success: boolean;
  containsKeyword: boolean;
  daysAwarded: number;
  message: string;
}

/**
 * Verify a social submission and award premium days
 * Phase 1: Synchronous verification with immediate rewards
 */
export async function verifySocialSubmission(
  db: PrismaClient,
  submissionId: string,
): Promise<VerificationResult> {
  // Get submission
  const submission = await db.socialSubmission.findUnique({
    where: { id: submissionId },
    include: {
      organization: {
        select: {
          id: true,
          payerId: true,
          ...ORG_PREMIUM_SELECT,
        },
      },
    },
  });

  if (!submission) {
    throw new Error("Submission not found");
  }

  if (submission.status !== "VERIFYING") {
    throw new Error("Submission already processed");
  }

  try {
    // Initialize verification service
    const verificationService = new SocialReferralService();

    // Determine platform and required keyword
    const platform = submission.platform.toLowerCase() as
      | "x"
      | "linkedin"
      | "threads"
      | "facebook";
    const requiredKeyword = getRequiredKeyword(platform);

    // Verify keywords
    const result = await verificationService.verifyKeywords({
      url: submission.postUrl,
      keywords: [requiredKeyword],
      platform,
    });

    // Check caption similarity against recent validated posts (last 7 days, same platform)
    if (result.containsAll && result.text) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentValidatedPosts = await db.socialSubmission.findMany({
        where: {
          organizationId: submission.organizationId,
          platform: submission.platform,
          status: "VERIFIED",
          submittedAt: { gte: sevenDaysAgo },
          postText: { not: null },
        },
        select: { postText: true },
      });

      // Check if caption is too similar to any previous validated post
      for (const post of recentValidatedPosts) {
        if (post.postText) {
          const similarity = compareTwoStrings(
            result.text.toLowerCase().trim(),
            post.postText.toLowerCase().trim(),
          );

          if (similarity > 0.95) {
            // Mark as failed due to similarity
            await db.socialSubmission.update({
              where: { id: submissionId },
              data: {
                status: "FAILED",
                verifiedAt: new Date(),
                containsKeyword: true,
                postText: result.text,
                likes: result.likes,
                comments: result.comments,
                shares: result.shares,
                daysAwarded: 0,
              },
            });

            return {
              success: false,
              containsKeyword: true,
              daysAwarded: 0,
              message:
                "This caption is too similar to a previous submission. Please write a unique post.",
            };
          }
        }
      }
    }

    // If not verified, mark FAILED and return early
    if (!result.containsAll) {
      await db.socialSubmission.update({
        where: { id: submissionId },
        data: {
          status: "FAILED",
          verifiedAt: new Date(),
          containsKeyword: false,
          postText: result.text,
          likes: result.likes,
          comments: result.comments,
          shares: result.shares,
          daysAwarded: 0,
          scanCount: 1,
          lastScannedAt: new Date(),
        },
      });
      return {
        success: false,
        containsKeyword: false,
        daysAwarded: 0,
        message: `Post does not contain required keyword: "${requiredKeyword}"`,
      };
    }

    // ── Verified: calculate engagement-based reward ──────────────────
    const org = submission.organization;
    const daysToAward = calculateDaysToAward(
      result.likes,
      result.comments,
      0, // first scan, no prior award
    );

    // Apply monthly cap
    const monthlyUsed = await getMonthlyDaysAwarded(db, org.id);
    const capped = Math.min(daysToAward, MONTHLY_CAP_DAYS - monthlyUsed);
    const finalDays = Math.max(capped, 0);

    const now = new Date();
    const nextScan = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await db.socialSubmission.update({
      where: { id: submissionId },
      data: {
        status: "VERIFIED",
        verifiedAt: now,
        containsKeyword: true,
        postText: result.text,
        likes: result.likes,
        comments: result.comments,
        shares: result.shares,
        daysAwarded: finalDays,
        scanCount: 1,
        lastScannedAt: now,
        nextScanAt: nextScan,
      },
    });

    // ── Award: paid premium → Stripe credit, free → extend days ─────
    if (finalDays > 0) {
      const isPaidPremium =
        org.subscriptionTier === "PREMIUM" &&
        org.subscriptionExpiresAt != null &&
        org.subscriptionExpiresAt > now;

      if (isPaidPremium && org.payerId) {
        // Look up payer's Stripe customer ID
        const payer = await db.user.findUnique({
          where: { id: org.payerId },
          select: { stripeCustomerId: true },
        });

        const creditAmount = finalDays * CREDIT_PER_DAY_CENTS;

        if (payer?.stripeCustomerId) {
          try {
            await stripeService.createBalanceCredit(
              payer.stripeCustomerId,
              creditAmount,
              `Social referral: ${finalDays} day(s) credit for submission ${submissionId}`,
            );
            console.log(
              `[Social Referral] Stripe credit applied: ${finalDays} day(s) / ${creditAmount}¢ for org ${org.id}`,
            );
          } catch (err) {
            console.error(
              `[Social Referral] Stripe credit failed for org ${org.id}:`,
              err,
            );
          }
        }

        // Track award type for PREMIUM org
        await db.socialSubmission.update({
          where: { id: submissionId },
          data: {
            awardType: "STRIPE_CREDIT",
            creditAmountCents: creditAmount,
          },
        });
      } else {
        // FREE tier: Extend earnedPremiumExpiresAt
        const currentExpiry = org.earnedPremiumExpiresAt;
        const baseDate =
          currentExpiry && currentExpiry > now ? currentExpiry : now;
        const newExpiry = new Date(baseDate);
        newExpiry.setDate(newExpiry.getDate() + finalDays);

        await db.organization.update({
          where: { id: org.id },
          data: { earnedPremiumExpiresAt: newExpiry },
        });

        // Track award type for FREE org
        await db.socialSubmission.update({
          where: { id: submissionId },
          data: {
            awardType: "EARNED_DAYS",
          },
        });
      }
    }

    // Schedule rescan workflow (scan #2 and #3 at 24-hour intervals)
    try {
      const workflowHandle = await DBOS.startWorkflow(
        rescanSocialSubmissionWorkflow,
        { workflowID: `rescan-${submissionId}-${Date.now()}` },
      )(submissionId);

      await db.socialSubmission.update({
        where: { id: submissionId },
        data: { rescanWorkflowId: workflowHandle.workflowID },
      });

      console.log(
        `[Social Referral] Scheduled rescan workflow ${workflowHandle.workflowID} for submission ${submissionId}`,
      );
    } catch (error) {
      console.error(
        `[Social Referral] Failed to schedule rescan for ${submissionId}:`,
        error,
      );
    }

    return {
      success: true,
      containsKeyword: true,
      daysAwarded: finalDays,
      message: `Post verified! Awarded ${finalDays} day(s) of premium access`,
    };
  } catch (error) {
    // Mark as failed
    await db.socialSubmission.update({
      where: { id: submissionId },
      data: {
        status: "FAILED",
        verifiedAt: new Date(),
      },
    });

    // Log detailed error for debugging
    console.error("[Social Referral Verification Error]", {
      submissionId,
      platform: submission.platform,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });

    throw error;
  }
}
