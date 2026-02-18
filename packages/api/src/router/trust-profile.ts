import { z } from "zod";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";

export const trustProfileRouter = createTRPCRouter({
  /**
   * Get public profile by username
   */
  getByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.trustProfile.findUnique({
        where: { username: input.username },
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              imageUrl: true,
            },
          },
          verifications: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
          platformLinks: true,
        },
      });
    }),

  /**
   * Create trust profile (on first verification)
   */
  create: protectedProcedure
    .input(
      z.object({
        username: z.string(),
        displayName: z.string().optional(),
        bio: z.string().max(280).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if profile already exists
      const existing = await ctx.db.trustProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (existing) {
        throw new Error("Trust profile already exists");
      }

      // Create profile
      const profile = await ctx.db.trustProfile.create({
        data: {
          userId: ctx.user.id,
          username: input.username,
          displayName: input.displayName,
          bio: input.bio,
          referralCode: "", // Will be set by DB trigger based on humanNumber
        },
      });

      // Update referralCode to "human-{humanNumber}"
      return ctx.db.trustProfile.update({
        where: { id: profile.id },
        data: {
          referralCode: `human-${profile.humanNumber}`,
        },
      });
    }),

  /**
   * Update trust profile
   */
  update: protectedProcedure
    .input(
      z.object({
        displayName: z.string().optional(),
        bio: z.string().max(280).optional(),
        avatarUrl: z.string().optional(),
        isPublic: z.boolean().optional(),
        cameraMode: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Find user's trust profile
      const profile = await ctx.db.trustProfile.findUnique({
        where: { userId: ctx.user.id },
      });

      if (!profile) {
        throw new Error("Trust profile not found");
      }

      return ctx.db.trustProfile.update({
        where: { id: profile.id },
        data: input,
      });
    }),

  /**
   * Get my trust profile
   */
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.trustProfile.findUnique({
      where: { userId: ctx.user.id },
      include: {
        verifications: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        platformLinks: true,
      },
    });
  }),
});
