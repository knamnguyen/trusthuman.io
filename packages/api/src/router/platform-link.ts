import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const platformLinkRouter = createTRPCRouter({
  /**
   * Auto-link platform account (called on first verification from extension)
   */
  autoLink: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["linkedin", "x"]),
        profileUrl: z.string(),
        profileHandle: z.string(),
        displayName: z.string().optional(),
        avatarUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const trustProfile = await ctx.db.trustProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!trustProfile) {
        throw new Error("Trust profile not found. Create a profile first.");
      }

      // Check if this profile URL is already connected to another user
      const existingLink = await ctx.db.platformLink.findUnique({
        where: {
          platform_profileUrl: {
            platform: input.platform,
            profileUrl: input.profileUrl,
          },
        },
      });

      if (existingLink && existingLink.trustProfileId !== trustProfile.id) {
        throw new Error("This profile is already connected to another account");
      }

      // Upsert platform link
      const link = await ctx.db.platformLink.upsert({
        where: {
          trustProfileId_platform: {
            trustProfileId: trustProfile.id,
            platform: input.platform,
          },
        },
        create: {
          trustProfileId: trustProfile.id,
          platform: input.platform,
          profileUrl: input.profileUrl,
          profileHandle: input.profileHandle,
          displayName: input.displayName,
          avatarUrl: input.avatarUrl,
          autoDetected: true,
        },
        update: {
          profileUrl: input.profileUrl,
          profileHandle: input.profileHandle,
          displayName: input.displayName,
          avatarUrl: input.avatarUrl,
        },
      });

      return {
        success: true,
        isUpdate: !!existingLink,
        link,
      };
    }),

  /**
   * Update platform link (manual override from settings)
   */
  update: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["linkedin", "x"]),
        profileUrl: z.string(),
        profileHandle: z.string(),
        displayName: z.string().optional(),
        avatarUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const trustProfile = await ctx.db.trustProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!trustProfile) {
        throw new Error("Trust profile not found");
      }

      // Check if new URL is already taken by another user
      const existingLink = await ctx.db.platformLink.findUnique({
        where: {
          platform_profileUrl: {
            platform: input.platform,
            profileUrl: input.profileUrl,
          },
        },
      });

      if (existingLink && existingLink.trustProfileId !== trustProfile.id) {
        throw new Error("This profile is already connected to another account");
      }

      return ctx.db.platformLink.upsert({
        where: {
          trustProfileId_platform: {
            trustProfileId: trustProfile.id,
            platform: input.platform,
          },
        },
        create: {
          trustProfileId: trustProfile.id,
          platform: input.platform,
          profileUrl: input.profileUrl,
          profileHandle: input.profileHandle,
          displayName: input.displayName,
          avatarUrl: input.avatarUrl,
          autoDetected: false, // Manual update
        },
        update: {
          profileUrl: input.profileUrl,
          profileHandle: input.profileHandle,
          displayName: input.displayName,
          avatarUrl: input.avatarUrl,
          autoDetected: false,
        },
      });
    }),

  /**
   * Disconnect platform account
   */
  disconnect: protectedProcedure
    .input(z.object({ platform: z.enum(["linkedin", "x"]) }))
    .mutation(async ({ ctx, input }) => {
      const trustProfile = await ctx.db.trustProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!trustProfile) {
        throw new Error("Trust profile not found");
      }

      return ctx.db.platformLink.delete({
        where: {
          trustProfileId_platform: {
            trustProfileId: trustProfile.id,
            platform: input.platform,
          },
        },
      });
    }),

  /**
   * Get my connected accounts
   */
  getMyLinks: protectedProcedure.query(async ({ ctx }) => {
    const trustProfile = await ctx.db.trustProfile.findUnique({
      where: { userId: ctx.user.id },
    });

    if (!trustProfile) {
      return [];
    }

    return ctx.db.platformLink.findMany({
      where: { trustProfileId: trustProfile.id },
    });
  }),

  /**
   * Batch lookup profiles by URL (for badge overlay)
   * Public endpoint - extension can check any profiles
   */
  batchLookup: publicProcedure
    .input(
      z.object({
        platform: z.enum(["linkedin", "x"]),
        profileUrls: z.array(z.string()).max(50), // Limit batch size
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.profileUrls.length === 0) {
        return { results: [] };
      }

      const links = await ctx.db.platformLink.findMany({
        where: {
          platform: input.platform,
          profileUrl: { in: input.profileUrls },
        },
        include: {
          trustProfile: {
            select: {
              humanNumber: true,
              username: true,
              totalVerifications: true,
              currentStreak: true,
            },
          },
        },
      });

      // Create lookup map
      const linkMap = new Map(links.map((l) => [l.profileUrl, l]));

      return {
        results: input.profileUrls.map((url) => {
          const link = linkMap.get(url);
          if (!link) {
            return { profileUrl: url, found: false };
          }
          return {
            profileUrl: url,
            found: true,
            trustProfile: link.trustProfile,
          };
        }),
      };
    }),

  /**
   * Single lookup by profile URL (simpler version for single profile)
   */
  lookupByProfileUrl: publicProcedure
    .input(
      z.object({
        platform: z.enum(["linkedin", "x"]),
        profileUrl: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const link = await ctx.db.platformLink.findUnique({
        where: {
          platform_profileUrl: {
            platform: input.platform,
            profileUrl: input.profileUrl,
          },
        },
        include: {
          trustProfile: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
              humanNumber: true,
              totalVerifications: true,
              currentStreak: true,
            },
          },
        },
      });

      if (!link) {
        return null;
      }

      return {
        isVerified: true,
        trustProfile: link.trustProfile,
      };
    }),

  /**
   * Full profile lookup by platform URL - SINGLE API CALL
   * Returns complete profile with recent activities in one request
   * Optimized for Check Human tab to avoid sequential calls
   */
  lookupFullProfile: publicProcedure
    .input(
      z.object({
        platform: z.enum(["linkedin", "x", "facebook"]),
        profileUrl: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Normalize URL - try multiple formats since storage may vary
      // e.g., "x.com/user" vs "https://x.com/user"
      const normalizedUrl = input.profileUrl.replace(/^https?:\/\//, "");
      const urlVariants = [
        normalizedUrl,
        `https://${normalizedUrl}`,
        `http://${normalizedUrl}`,
      ];

      // Try to find with any URL variant
      const link = await ctx.db.platformLink.findFirst({
        where: {
          platform: input.platform,
          profileUrl: { in: urlVariants },
        },
        include: {
          trustProfile: {
            include: {
              linkedinActivity: {
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                  verification: {
                    select: { verified: true },
                  },
                },
              },
              xActivity: {
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                  verification: {
                    select: { verified: true },
                  },
                },
              },
              facebookActivity: {
                take: 5,
                orderBy: { createdAt: "desc" },
                include: {
                  verification: {
                    select: { verified: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!link) {
        return { found: false as const };
      }

      const profile = link.trustProfile;

      // Merge and sort activities - using standardized format
      const recentActivities = [
        ...profile.linkedinActivity.map((a) => ({
          id: a.id,
          type: "linkedin" as const,
          commentText: a.commentText,
          commentUrl: a.commentUrl,
          parentUrl: a.parentUrl,
          parentAuthorName: a.parentAuthorName,
          parentAuthorAvatarUrl: a.parentAuthorAvatarUrl,
          parentTextSnippet: a.parentTextSnippet,
          verified: a.verification?.verified ?? false,
          activityAt: a.activityAt,
          createdAt: a.createdAt,
        })),
        ...profile.xActivity.map((a) => ({
          id: a.id,
          type: "x" as const,
          commentText: a.commentText,
          commentUrl: a.commentUrl,
          parentUrl: a.parentUrl,
          parentAuthorName: a.parentAuthorName,
          parentAuthorAvatarUrl: a.parentAuthorAvatarUrl,
          parentTextSnippet: a.parentTextSnippet,
          verified: a.verification?.verified ?? false,
          activityAt: a.activityAt,
          createdAt: a.createdAt,
        })),
        ...profile.facebookActivity.map((a) => ({
          id: a.id,
          type: "facebook" as const,
          commentText: a.commentText,
          commentUrl: a.commentUrl,
          parentUrl: a.parentUrl,
          parentAuthorName: a.parentAuthorName,
          parentAuthorAvatarUrl: a.parentAuthorAvatarUrl,
          parentTextSnippet: a.parentTextSnippet,
          verified: a.verification?.verified ?? false,
          activityAt: a.activityAt,
          createdAt: a.createdAt,
        })),
      ]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Get user's rank
      const higherRanked = await ctx.db.trustProfile.count({
        where: { totalVerifications: { gt: profile.totalVerifications } },
      });
      const rank = higherRanked + 1;

      return {
        found: true as const,
        trustProfile: {
          username: profile.username,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
          humanNumber: profile.humanNumber,
          totalVerifications: profile.totalVerifications,
          currentStreak: profile.currentStreak,
          longestStreak: profile.longestStreak,
          rank,
          recentActivities,
        },
      };
    }),
});
