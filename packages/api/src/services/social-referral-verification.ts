import { DBOS } from "@dbos-inc/dbos-sdk";
import type { PrismaClient } from "@sassy/db";
import { compareTwoStrings } from "string-similarity";

import { SocialReferralService } from "@sassy/social-referral";

import { rescanSocialSubmissionWorkflow } from "../workflows/rescan-social-submission.workflow";

const DAYS_PER_VERIFIED_POST = 7;

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
          stripeCustomerId: true,
          earnedPremiumExpiresAt: true,
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

    // Update submission with results
    const now = new Date();
    const nextScan = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours

    await db.socialSubmission.update({
      where: { id: submissionId },
      data: {
        status: result.containsAll ? "VERIFIED" : "FAILED",
        verifiedAt: now,
        containsKeyword: result.containsAll,
        postText: result.text,
        likes: result.likes,
        comments: result.comments,
        shares: result.shares,
        daysAwarded: result.containsAll ? DAYS_PER_VERIFIED_POST : 0,
        // Set scan metadata for rescans
        scanCount: 1, // This is scan #1
        lastScannedAt: now,
        nextScanAt: result.containsAll ? nextScan : null, // Only schedule rescans for VERIFIED posts
      },
    });

    // Award premium days if verified
    if (result.containsAll) {
      const isPremium = !!submission.organization.stripeCustomerId;

      if (isPremium) {
        // Phase 1 STUB: Console log for PREMIUM users
        console.log(
          `[STUB - Phase 2] Would credit ${DAYS_PER_VERIFIED_POST} days to Stripe customer`,
        );
        console.log(`Organization ID: ${submission.organization.id}`);
        console.log(
          `Stripe Customer ID: ${submission.organization.stripeCustomerId}`,
        );
        // Phase 2: await stripeService.createCustomerBalance(...)
      } else {
        // FREE tier: Extend earnedPremiumExpiresAt
        const now = new Date();
        const currentExpiry = submission.organization.earnedPremiumExpiresAt;
        const baseDate =
          currentExpiry && currentExpiry > now ? currentExpiry : now;
        const newExpiry = new Date(baseDate);
        newExpiry.setDate(newExpiry.getDate() + DAYS_PER_VERIFIED_POST);

        await db.organization.update({
          where: { id: submission.organization.id },
          data: {
            earnedPremiumExpiresAt: newExpiry,
          },
        });
      }

      // Schedule rescan workflow (will perform scan #2 and #3 at 24-hour intervals)
      try {
        const workflowHandle = await DBOS.startWorkflow(
          rescanSocialSubmissionWorkflow,
          {
            workflowID: `rescan-${submissionId}-${Date.now()}`,
          },
        )(submissionId);

        // Store workflow ID for tracking
        await db.socialSubmission.update({
          where: { id: submissionId },
          data: {
            rescanWorkflowId: workflowHandle.workflowID,
          },
        });

        console.log(
          `[Social Referral] Scheduled rescan workflow ${workflowHandle.workflowID} for submission ${submissionId}`,
        );
      } catch (error) {
        // Log error but don't fail verification - rescans are a nice-to-have
        console.error(
          `[Social Referral] Failed to schedule rescan for ${submissionId}:`,
          error,
        );
      }

      return {
        success: true,
        containsKeyword: true,
        daysAwarded: DAYS_PER_VERIFIED_POST,
        message: `Post verified! Awarded ${DAYS_PER_VERIFIED_POST} days of premium access`,
      };
    }

    return {
      success: false,
      containsKeyword: false,
      daysAwarded: 0,
      message: `Post does not contain required keyword: "${requiredKeyword}"`,
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
