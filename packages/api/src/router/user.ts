import type { User } from "@clerk/nextjs/server";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import z from "zod";

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
    const dbUser = await getOrCreateUser(ctx.db, ctx.user);

    return dbUser.dailyAIcomments;
  }),

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
  me: protectedProcedure.query(({ ctx }) => {
    return getOrCreateUser(ctx.db, ctx.user);
  }),

  addLinkedInAccount: protectedProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
        twoFactorySecretKey: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getOrCreateUser(ctx.db, ctx.user);
      const account = await ctx.db.linkedInAccount.create({
        data: {
          userId: ctx.user.id,
          username: input.username,
          encryptedPassword: input.password,
        },
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
} satisfies TRPCRouterRecord;

async function getOrCreateUser(db: PrismaClient, userParams: User) {
  const dbUser = await db.user.findUnique({
    where: {
      id: userParams.id,
    },
    select: {
      accessType: true,
      dailyAIcomments: true,
    },
  });

  if (dbUser !== null) {
    return dbUser;
  }

  const primaryEmailAddress = userParams.primaryEmailAddress?.emailAddress;

  if (primaryEmailAddress === undefined) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "User must have a primary email address",
    });
  }

  const newUser = await db.user.upsert({
    where: { id: userParams.id },
    update: {
      firstName: userParams.firstName,
      lastName: userParams.lastName,
      username: userParams.username,
      primaryEmailAddress,
      imageUrl: userParams.imageUrl,
      updatedAt: new Date(),
    },
    create: {
      id: userParams.id,
      firstName: userParams.firstName,
      lastName: userParams.lastName,
      username: userParams.username,
      primaryEmailAddress,
      imageUrl: userParams.imageUrl,
    },
    select: {
      accessType: true,
      dailyAIcomments: true,
    },
  });

  return newUser;
}
