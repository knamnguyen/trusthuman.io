import { DBOS } from "@dbos-inc/dbos-sdk";

import { db } from "@sassy/db";
import { SocialReferralService } from "@sassy/social-referral";

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
  async (submissionId: string, delayMs = 24 * 60 * 60 * 1000) => {
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

      // Step 5: Update scan metadata and engagement metrics
      await DBOS.runStep(
        async () => {
          const updated = await db.socialSubmission.update({
            where: { id: submissionId },
            data: {
              scanCount: scanNumber,
              lastScannedAt: new Date(),
              // Update engagement metrics from rescan
              likes: rescanResult.likes,
              comments: rescanResult.comments,
              shares: rescanResult.shares,
              // Clear nextScanAt if this is the final scan (scan #3)
              nextScanAt:
                scanNumber >= 3
                  ? null
                  : new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
          });

          console.log(
            `[Rescan] Completed scan #${scanNumber} for ${submissionId}: likes=${updated.likes}, comments=${updated.comments}, shares=${updated.shares}`,
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
