import { DBOS } from "@dbos-inc/dbos-sdk";

import { db } from "@sassy/db";
import { SocialReferralService } from "@sassy/social-referral";
import { StripeService } from "@sassy/stripe";

import {
  calculateDaysToAward,
  MONTHLY_CAP_DAYS,
} from "../services/social-referral-verification";

const CREDIT_PER_DAY_CENTS = 100; // $1.00/day ($29.99/mo / 30)

const stripeService = new StripeService({
  secretKey: process.env.STRIPE_SECRET_KEY ?? "",
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
});

/**
 * Rescan a social submission to update engagement metrics
 * Runs at 24-hour intervals, performs 2 additional scans (total 3 scans including initial)
 *
 * Flow:
 * 1. Initial verification (scan #1) - happens in social-referral-verification.ts
 * 2. This workflow is started and waits 24h
 * 3. Scan #2 executes, then waits another 24h
 * 4. Scan #3 executes, workflow completes
 *
 * Uses a loop instead of child workflows to avoid recursion risks.
 */
export const rescanSocialSubmissionWorkflow = DBOS.registerWorkflow(
  async (submissionId: string, delayMs: number = 24 * 60 * 60 * 1000) => {
    console.log(
      `[Rescan] Starting rescan workflow for submission ${submissionId}`,
    );

    // Loop for 2 additional scans (scan #2 and #3)
    for (let scanNumber = 2; scanNumber <= 3; scanNumber++) {
      // Sleep before each scan (configurable for testing, default 24 hours)
      if (delayMs > 0) {
        console.log(
          `[Rescan] Waiting ${delayMs}ms before scan #${scanNumber} for ${submissionId}`,
        );
        await DBOS.sleepms(delayMs);
      } else {
        console.log(
          `[Rescan] Skipping delay for scan #${scanNumber} (testing mode)`,
        );
      }

      console.log(`[Rescan] Starting scan #${scanNumber} for ${submissionId}`);

      // Step 1: Fetch current submission state
      const submission = await DBOS.runStep(
        async () => {
          const sub = await db.socialSubmission.findUnique({
            where: { id: submissionId },
          });

          if (!sub) {
            throw new Error(`Submission ${submissionId} not found`);
          }

          return sub;
        },
        { name: `fetch-submission-scan${scanNumber}` },
      );

      // Step 2: Check if submission is still VERIFIED (not REVOKED or FAILED)
      if (submission.status !== "VERIFIED") {
        console.log(
          `[Rescan] Submission ${submissionId} status is ${submission.status}, stopping rescans`,
        );
        return {
          status: "stopped",
          reason: "not_verified",
          currentStatus: submission.status,
          completedScans: scanNumber - 1,
        } as const;
      }

      // Step 3: Check if we've already completed this scan (idempotency check)
      if (submission.scanCount >= scanNumber) {
        console.log(
          `[Rescan] Scan #${scanNumber} already completed (current scanCount: ${submission.scanCount}), skipping`,
        );
        continue;
      }

      // Step 4: Fetch updated engagement metrics
      const rescanResult = await DBOS.runStep(
        async () => {
          try {
            // Determine platform and required keyword
            const platform = submission.platform.toLowerCase() as
              | "x"
              | "linkedin"
              | "threads"
              | "facebook";
            const requiredKeyword =
              platform === "x" || platform === "threads"
                ? "@engagekit_io"
                : "#engagekit_io";

            // Fetch updated engagement metrics
            const verificationService = new SocialReferralService();
            const result = await verificationService.verifyKeywords({
              url: submission.postUrl,
              keywords: [requiredKeyword],
              platform,
            });

            return {
              success: true,
              likes: result.likes,
              comments: result.comments,
              shares: result.shares,
            };
          } catch (error) {
            console.error(
              `[Rescan] Failed to rescan submission ${submissionId}:`,
              error,
            );
            return {
              success: false,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        },
        { name: `rescan-verification-scan${scanNumber}` },
      );

      if (!rescanResult.success) {
        console.warn(
          `[Rescan] Verification failed for ${submissionId} on scan #${scanNumber}:`,
          rescanResult.error,
        );
        // Continue to next scan instead of stopping
        continue;
      }

      // Step 5: Update metrics + award engagement bonuses
      await DBOS.runStep(
        async () => {
          // Calculate additional days from updated engagement
          const additionalDays = calculateDaysToAward(
            rescanResult.likes ?? 0,
            rescanResult.comments ?? 0,
            submission.daysAwarded,
          );

          // Apply monthly cap
          let cappedDays = 0;
          if (additionalDays > 0) {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthlyResult = await db.socialSubmission.aggregate({
              where: {
                organizationId: submission.organizationId,
                status: "VERIFIED",
                verifiedAt: { gte: startOfMonth },
              },
              _sum: { daysAwarded: true },
            });
            const monthlyUsed = monthlyResult._sum.daysAwarded ?? 0;
            cappedDays = Math.min(
              additionalDays,
              MONTHLY_CAP_DAYS - monthlyUsed,
            );
            cappedDays = Math.max(cappedDays, 0);
          }

          const newTotalDays = submission.daysAwarded + cappedDays;

          const updated = await db.socialSubmission.update({
            where: { id: submissionId },
            data: {
              scanCount: scanNumber,
              lastScannedAt: new Date(),
              likes: rescanResult.likes,
              comments: rescanResult.comments,
              shares: rescanResult.shares,
              daysAwarded: newTotalDays,
              nextScanAt:
                scanNumber >= 3
                  ? null
                  : new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });

          // Award engagement bonus if any
          if (cappedDays > 0) {
            const org = await db.organization.findUnique({
              where: { id: submission.organizationId },
              select: {
                subscriptionTier: true,
                subscriptionExpiresAt: true,
                earnedPremiumExpiresAt: true,
                payerId: true,
              },
            });

            if (org) {
              const now = new Date();
              const isPaidPremium =
                org.subscriptionTier === "PREMIUM" &&
                org.subscriptionExpiresAt != null &&
                org.subscriptionExpiresAt > now;

              if (isPaidPremium && org.payerId) {
                const payer = await db.user.findUnique({
                  where: { id: org.payerId },
                  select: { stripeCustomerId: true },
                });
                if (payer?.stripeCustomerId) {
                  try {
                    await stripeService.createBalanceCredit(
                      payer.stripeCustomerId,
                      cappedDays * CREDIT_PER_DAY_CENTS,
                      `Social referral rescan: +${cappedDays} day(s) credit for submission ${submissionId}`,
                    );
                  } catch (err) {
                    console.error(`[Rescan] Stripe credit failed:`, err);
                  }
                }
              } else {
                const currentExpiry = org.earnedPremiumExpiresAt;
                const baseDate =
                  currentExpiry && currentExpiry > now ? currentExpiry : now;
                const newExpiry = new Date(baseDate);
                newExpiry.setDate(newExpiry.getDate() + cappedDays);
                await db.organization.update({
                  where: { id: submission.organizationId },
                  data: { earnedPremiumExpiresAt: newExpiry },
                });
              }
            }

            console.log(
              `[Rescan] Awarded +${cappedDays} engagement bonus day(s) for ${submissionId}`,
            );
          }

          console.log(
            `[Rescan] Completed scan #${scanNumber} for ${submissionId}: likes=${updated.likes}, comments=${updated.comments}, shares=${updated.shares}, daysAwarded=${newTotalDays}`,
          );

          return updated;
        },
        { name: `update-scan-metadata-scan${scanNumber}` },
      );
    }

    console.log(
      `[Rescan] Workflow completed for ${submissionId}, all 3 scans finished`,
    );

    // Clear rescanWorkflowId since workflow is complete
    await DBOS.runStep(
      async () => {
        await db.socialSubmission.update({
          where: { id: submissionId },
          data: { rescanWorkflowId: null },
        });
      },
      { name: "clear-workflow-id" },
    );

    return {
      status: "success",
      completedScans: 3,
    } as const;
  },
  { name: "rescanSocialSubmissionWorkflow" },
);
