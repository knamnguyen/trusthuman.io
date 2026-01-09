import z from "zod";

import {
  UserCreateInputSchema,
  UserUpdateInputSchema,
} from "@sassy/db/schema-validators";

// import {
//   userCreateSchema,
//   userUpdateSchema,
// } from "@sassy/db/schema-validators";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { checkPremiumAccess } from "../utils/check-premium-access";

export const userRouter = () =>
  createTRPCRouter({
    /**
     * Warmup endpoint - called on page load and periodically
     * This prevents cold start latency on the first real API call
     */
    warmup: protectedProcedure.query(() => {
      return { status: "warm" as const };
    }),

    checkAccess: protectedProcedure.query(async ({ ctx }) => {
      const access = await checkPremiumAccess(ctx);
      return access;
    }),

    /**
     * Get the current user's daily AI comment count
     * Used by extension to display daily limits
     */
    getDailyCommentCount: protectedProcedure.query(
      ({ ctx }) => ctx.user.dailyAIcomments,
    ),

    create: publicProcedure
      .input(UserCreateInputSchema)
      .mutation(async ({ ctx, input }) => {
        return await ctx.db.user.create({
          data: {
            id: input.id,
            firstName: input.firstName,
            lastName: input.lastName,
            primaryEmailAddress: input.primaryEmailAddress,
            imageUrl: input.imageUrl,
            clerkUserProperties: input.clerkUserProperties,
          },
        });
      }),

    /**
     * Update an existing user in the database
     * This is primarily used by the webhook handler
     */
    update: publicProcedure
      .input(
        z.object({
          id: z.string(),
          data: UserUpdateInputSchema,
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return await ctx.db.user.update({
          where: { id: input.id },
          data: input.data,
        });
      }),

    /**
     * Delete a user from the database
     * This is primarily used by the webhook handler
     */
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return await ctx.db.user.delete({
          where: { id: input.id },
        });
      }),

    /**
     * Get the current authenticated user
     * This is primarily used by client applications
     */
    me: protectedProcedure.query(({ ctx }) => ctx.user),

    //get user object from our db

    meDb: protectedProcedure.query(async ({ ctx }) => {
      return await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
      });
    }),

    /**
     * Get a user by ID
     * This is primarily used by client applications
     */
    // byId: publicProcedure
    //   .input(z.object({ id: z.string() }))
    //   .query(async ({ ctx, input }) => {
    //     try {
    //       return await ctx.db.user.findUnique({
    //         where: { id: input.id },
    //       });
    //     } catch (error) {
    //       console.error("Error fetching user by ID:", error);
    //       throw new TRPCError({
    //         code: "INTERNAL_SERVER_ERROR",
    //         message: "Failed to fetch user by ID",
    //         cause: error,
    //       });
    //     }
    //   }),
  });
