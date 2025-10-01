import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import type { PrismaClient } from "@sassy/db";
import {
  UserCreateInputSchema,
  UserUpdateInputSchema,
} from "@sassy/db/schema-validators";

// import {
//   userCreateSchema,
//   userUpdateSchema,
// } from "@sassy/db/schema-validators";

import { protectedProcedure, publicProcedure } from "../trpc";
import { checkPremiumAccess } from "../utils/check-premium-access";

async function upsertClerkUserToDb(
  db: PrismaClient,
  user: {
    firstName: string | null;
    lastName: string | null;
    username: string | null;
    primaryEmailAddress: string;
    imageUrl: string | null;
    id: string;
  },
) {
  await db.user.upsert({
    where: { id: user.id },
    update: {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      primaryEmailAddress: user.primaryEmailAddress,
      imageUrl: user.imageUrl,
      updatedAt: new Date(),
    },
    create: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      primaryEmailAddress: user.primaryEmailAddress,
      imageUrl: user.imageUrl,
    },
  });
}

export const userRouter = {
  checkAccess: protectedProcedure.query(async ({ ctx }) => {
    const access = await checkPremiumAccess(ctx);
    return access;
  }),

  /**
   * Get the current user's daily AI comment count
   * Used by extension to display daily limits
   */
  getDailyCommentCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: { dailyAIcomments: true },
      });

      if (user !== null) {
        return user.dailyAIcomments;
      }

      const primaryEmailAddress = ctx.user.primaryEmailAddress?.emailAddress;
      if (primaryEmailAddress === undefined) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No clerk email found",
        });
      }

      await upsertClerkUserToDb(ctx.db, {
        ...ctx.user,
        primaryEmailAddress,
      });
      const newUser = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: { dailyAIcomments: true },
      });

      // technically shouldnt happen but just for type narrowing
      if (newUser === null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User not found after upsert",
        });
      }

      return newUser.dailyAIcomments;
    } catch (error) {
      console.error("Error fetching daily comment count:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch daily comment count",
        cause: error,
      });
    }
  }),

  create: publicProcedure
    .input(UserCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
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
      } catch (error) {
        console.error("Error creating user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create user",
          cause: error,
        });
      }
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
      try {
        return await ctx.db.user.update({
          where: { id: input.id },
          data: input.data,
        });
      } catch (error) {
        console.error("Error updating user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update user",
          cause: error,
        });
      }
    }),

  /**
   * Delete a user from the database
   * This is primarily used by the webhook handler
   */
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.user.delete({
          where: { id: input.id },
        });
      } catch (error) {
        console.error("Error deleting user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete user",
          cause: error,
        });
      }
    }),

  /**
   * Get the current authenticated user
   * This is primarily used by client applications
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    // const prismaType = ctx.Prisma;

    try {
      console.log("found user");
      console.log("user id is: " + ctx.user.id);
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
      });

      if (user !== null) {
        return user;
      }

      const primaryEmailAddress = ctx.user.primaryEmailAddress?.emailAddress;
      if (primaryEmailAddress === undefined) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No clerk email found",
        });
      }

      await upsertClerkUserToDb(ctx.db, {
        ...ctx.user,
        primaryEmailAddress,
      });
      const newUser = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
      });

      // technically shouldnt happen but just for type narrowing
      if (newUser === null) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User not found after upsert",
        });
      }

      return newUser;
    } catch (error) {
      console.error("Error fetching user:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user",
        cause: error,
      });
    }
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
} satisfies TRPCRouterRecord;
