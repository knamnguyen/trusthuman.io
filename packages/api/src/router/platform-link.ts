import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const platformLinkRouter = createTRPCRouter({
  /**
   * Connect platform account (called from extension with scraped profile info)
   */
  connect: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["linkedin", "x"]),
        profileUrl: z.string(),
        profileHandle: z.string().optional(),
        displayName: z.string().optional(),
        avatarUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Find user's trust profile
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
          verified: true, // Connected via extension = verified ownership
        },
        update: {
          profileUrl: input.profileUrl,
          profileHandle: input.profileHandle,
          displayName: input.displayName,
          avatarUrl: input.avatarUrl,
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
   * Lookup profile by URL (for badge overlay - check if profile is verified)
   * Public endpoint so extension can check any LinkedIn/X profile
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
            },
          },
        },
      });

      if (!link || !link.verified) {
        return null;
      }

      return {
        isVerified: true,
        trustProfile: link.trustProfile,
      };
    }),
});
