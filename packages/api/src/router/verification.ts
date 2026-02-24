import { z } from "zod";
import {
  DetectFacesCommand,
  RekognitionClient,
} from "@aws-sdk/client-rekognition";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

// Initialize AWS Rekognition client
const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

/**
 * Analyze photo using AWS Rekognition DetectFaces
 * Returns verification result with face detection details
 */
async function detectFaces(photoBase64: string): Promise<{
  verified: boolean;
  confidence: number;
  faceCount: number;
  boundingBox: { width: number; height: number; left: number; top: number } | null;
  rawResponse: unknown;
}> {
  const buffer = Buffer.from(photoBase64, "base64");

  const response = await rekognition.send(
    new DetectFacesCommand({
      Image: { Bytes: buffer },
      Attributes: ["DEFAULT"],
    }),
  );

  const faces = response.FaceDetails ?? [];
  const faceCount = faces.length;
  const confidence = faces[0]?.Confidence ?? 0;

  // Verified = at least 1 face with confidence >= 70%
  // We allow multiple faces (e.g., someone in background) as long as there's a human
  const verified = faceCount >= 1 && confidence >= 70;

  const boundingBox = faces[0]?.BoundingBox
    ? {
        width: faces[0].BoundingBox.Width ?? 0,
        height: faces[0].BoundingBox.Height ?? 0,
        left: faces[0].BoundingBox.Left ?? 0,
        top: faces[0].BoundingBox.Top ?? 0,
      }
    : null;

  return { verified, confidence, faceCount, boundingBox, rawResponse: response };
}

// Platform types
const platformSchema = z.enum(["linkedin", "x", "facebook", "threads", "reddit", "ph", "github", "hn"]);
type Platform = z.infer<typeof platformSchema>;

// Standardized activity schema for all platforms
const activitySchema = z.object({
  commentText: z.string(),
  commentUrl: z.string().optional(), // Direct URL to user's comment (optional)
  parentUrl: z.string().optional(), // Link to parent post (fallback if no commentUrl)
  parentAuthorName: z.string(),
  parentAuthorAvatarUrl: z.string(),
  parentTextSnippet: z.string(),
  activityAt: z.date().optional(), // When the comment was posted (defaults to now)
});

// User profile info scraped from DOM
const userProfileSchema = z.object({
  profileUrl: z.string(),
  profileHandle: z.string(),
  displayName: z.string().optional(),
  avatarUrl: z.string().optional(),
});

/**
 * Calculate streak based on last verification date
 * Returns { currentStreak, longestStreak, lastStreakDate }
 */
function calculateStreak(
  lastStreakDate: Date | null,
  currentStreak: number,
  longestStreak: number,
): { currentStreak: number; longestStreak: number; lastStreakDate: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toISOString().split("T")[0];

  if (!lastStreakDate) {
    // First verification ever
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, longestStreak),
      lastStreakDate: today,
    };
  }

  const lastDate = new Date(lastStreakDate);
  lastDate.setHours(0, 0, 0, 0);
  const lastDateStr = lastDate.toISOString().split("T")[0];

  if (lastDateStr === todayStr) {
    // Already verified today, no change
    return { currentStreak, longestStreak, lastStreakDate: today };
  }

  // Check if yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastDateStr === yesterdayStr) {
    // Consecutive day - increment streak
    const newStreak = currentStreak + 1;
    return {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, longestStreak),
      lastStreakDate: today,
    };
  }

  // Streak broken - reset to 1
  return {
    currentStreak: 1,
    longestStreak: Math.max(1, longestStreak),
    lastStreakDate: today,
  };
}

/**
 * Create platform-specific activity record
 */
async function createActivityRecord(
  db: any,
  platform: Platform,
  trustProfileId: string,
  verificationId: string,
  activity: z.infer<typeof activitySchema>,
) {
  const commonData = {
    trustProfileId,
    verificationId,
    commentText: activity.commentText,
    commentUrl: activity.commentUrl,
    parentUrl: activity.parentUrl,
    parentAuthorName: activity.parentAuthorName,
    parentAuthorAvatarUrl: activity.parentAuthorAvatarUrl,
    parentTextSnippet: activity.parentTextSnippet,
    activityAt: activity.activityAt ?? new Date(),
  };

  switch (platform) {
    case "linkedin":
      return db.verifiedLinkedInActivity.create({ data: commonData });
    case "x":
      return db.verifiedXActivity.create({ data: commonData });
    case "facebook":
      return db.verifiedFacebookActivity.create({ data: commonData });
    case "threads":
      return db.verifiedThreadsActivity.create({ data: commonData });
    case "reddit":
      return db.verifiedRedditActivity.create({ data: commonData });
    case "ph":
      return db.verifiedPHActivity.create({ data: commonData });
    case "github":
      return db.verifiedGitHubActivity.create({ data: commonData });
    case "hn":
      return db.verifiedHNActivity.create({ data: commonData });
    default:
      throw new Error(`Unknown platform: ${platform}`);
  }
}

export const verificationRouter = createTRPCRouter({
  /**
   * Warmup endpoint - keeps serverless functions warm
   * Call this periodically (every ~55s) from extension to avoid cold starts
   */
  warmup: protectedProcedure.query(() => {
    return { status: "warm" as const };
  }),

  /**
   * Submit activity with human verification
   * OPTIMIZED: Runs AWS Rekognition in parallel with DB lookups
   */
  submitActivity: protectedProcedure
    .input(
      z.object({
        photoBase64: z.string(),
        platform: platformSchema,
        userProfile: userProfileSchema,
        activity: activitySchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const primaryEmail = ctx.user.emailAddresses?.[0]?.emailAddress || `${ctx.user.id}@trusthuman.io`;

      // OPTIMIZATION: Run AWS Rekognition AND DB lookups in PARALLEL
      // This saves ~2-3 seconds by not waiting for Rekognition before DB queries
      const [faceDetectionResult, user, trustProfile, conflictingLink] = await Promise.all([
        // 1. AWS Rekognition face detection (slowest - 2-4s)
        detectFaces(input.photoBase64),

        // 2. Get or create user (runs in parallel with Rekognition)
        ctx.db.user.upsert({
          where: { id: ctx.user.id },
          update: {}, // No update needed if exists
          create: {
            id: ctx.user.id,
            email: primaryEmail,
            firstName: ctx.user.firstName,
            lastName: ctx.user.lastName,
            imageUrl: ctx.user.imageUrl,
          },
        }),

        // 3. Get trust profile (runs in parallel)
        ctx.db.trustProfile.findUnique({
          where: { userId: ctx.user.id },
        }),

        // 4. Check for conflicting platform link (runs in parallel)
        ctx.db.platformLink.findUnique({
          where: {
            platform_profileUrl: {
              platform: input.platform,
              profileUrl: input.userProfile.profileUrl,
            },
          },
        }),
      ]);

      // Check for platform link conflict before proceeding
      // Only throw if the link belongs to a different user
      if (conflictingLink && conflictingLink.trustProfileId !== trustProfile?.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This social profile is already linked to another account",
        });
      }

      const isFirstVerification = !trustProfile;

      // Create trust profile if it doesn't exist
      let finalTrustProfile = trustProfile;
      if (!finalTrustProfile) {
        // Generate username from email or profile handle
        const baseUsername =
          input.userProfile.profileHandle?.replace(/[^a-zA-Z0-9]/g, "") ||
          primaryEmail.split("@")[0] ||
          `human${Date.now()}`;

        // Ensure unique username (this loop is usually just 1 iteration)
        let username = baseUsername;
        let counter = 1;
        while (await ctx.db.trustProfile.findUnique({ where: { username } })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }

        finalTrustProfile = await ctx.db.trustProfile.create({
          data: {
            userId: ctx.user.id,
            username,
            displayName: input.userProfile.displayName || ctx.user.firstName,
            avatarUrl: input.userProfile.avatarUrl || ctx.user.imageUrl,
          },
        });
      }

      // Calculate streak before transaction
      const streakResult = calculateStreak(
        finalTrustProfile.lastStreakDate,
        finalTrustProfile.currentStreak,
        finalTrustProfile.longestStreak,
      );

      // Create verification record first
      const verification = await ctx.db.humanVerification.create({
        data: {
          trustProfileId: finalTrustProfile.id,
          verified: faceDetectionResult.verified,
          confidence: faceDetectionResult.confidence,
          faceCount: faceDetectionResult.faceCount,
          rawResponse: faceDetectionResult.rawResponse as any,
          activityType: input.platform,
        },
      });

      // Create activity record with verification link and update profile in parallel
      const [_activityRecord, _platformLink, updatedProfile] = await Promise.all([
        // 1. Create platform-specific activity record
        createActivityRecord(
          ctx.db,
          input.platform,
          finalTrustProfile.id,
          verification.id,
          input.activity,
        ),

        // 2. Upsert platform link
        ctx.db.platformLink.upsert({
          where: {
            trustProfileId_platform: {
              trustProfileId: finalTrustProfile.id,
              platform: input.platform,
            },
          },
          update: {
            displayName: input.userProfile.displayName,
            avatarUrl: input.userProfile.avatarUrl,
          },
          create: {
            trustProfileId: finalTrustProfile.id,
            platform: input.platform,
            profileUrl: input.userProfile.profileUrl,
            profileHandle: input.userProfile.profileHandle,
            displayName: input.userProfile.displayName,
            avatarUrl: input.userProfile.avatarUrl,
            autoDetected: true,
          },
        }),

        // 3. Update stats and streak
        ctx.db.trustProfile.update({
          where: { id: finalTrustProfile.id },
          data: {
            totalVerifications: { increment: 1 },
            lastVerifiedAt: new Date(),
            currentStreak: streakResult.currentStreak,
            longestStreak: streakResult.longestStreak,
            lastStreakDate: streakResult.lastStreakDate,
          },
        }),
      ]);

      return {
        verified: faceDetectionResult.verified,
        confidence: faceDetectionResult.confidence,
        humanNumber: finalTrustProfile.humanNumber,
        isFirstVerification,
        totalVerifications: updatedProfile.totalVerifications,
        currentStreak: updatedProfile.currentStreak,
      };
    }),

  /**
   * Analyze photo for human faces (standalone - for unauthenticated users)
   */
  analyzePhoto: publicProcedure
    .input(
      z.object({
        photoBase64: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // Analyze photo using AWS Rekognition
      const result = await detectFaces(input.photoBase64);

      return {
        verified: result.verified,
        confidence: result.confidence,
        faceCount: result.faceCount,
        boundingBox: result.boundingBox,
      };
    }),

  /**
   * Get verification history for a profile
   */
  getHistory: publicProcedure
    .input(
      z.object({
        trustProfileId: z.string(),
        limit: z.number().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.humanVerification.findMany({
        where: {
          trustProfileId: input.trustProfileId,
        },
        take: input.limit,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          linkedinActivity: true,
          xActivity: true,
          facebookActivity: true,
          threadsActivity: true,
          redditActivity: true,
          phActivity: true,
          githubActivity: true,
          hnActivity: true,
        },
      });
    }),
});
