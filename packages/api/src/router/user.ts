import type { TRPCRouterRecord } from "@trpc/server";
import { authenticator } from "otplib";
import { ulid } from "ulidx";
import z from "zod";

import {
  UserCreateInputSchema,
  UserUpdateInputSchema,
} from "@sassy/db/schema-validators";
import { countrySchema } from "@sassy/validators";

// import {
//   userCreateSchema,
//   userUpdateSchema,
// } from "@sassy/db/schema-validators";

import { protectedProcedure, publicProcedure } from "../trpc";
import { checkPremiumAccess } from "../utils/check-premium-access";
import {
  assumedAccountJwt,
  browserRegistry,
  hyperbrowser,
  LinkedInBrowserSession,
} from "../utils/linkedin-browser-session";

export const userRouter = {
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

  verifyTwoFactorSecretKey: protectedProcedure
    .input(
      z.object({
        twoFactorSecretKey: z.string(),
        otp: z.string(),
      }),
    )
    .mutation(({ input }) => {
      const correctOtp = authenticator.generate(input.twoFactorSecretKey);

      return {
        valid: input.otp === correctOtp,
      };
    }),

  getLinkedInAccount: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .query(async ({ ctx, input }) => {
      const account = await ctx.db.linkedInAccount.findFirst({
        where: { id: input.accountId, userId: ctx.user.id },
      });

      return account;
    }),

  initAddAccountSession: protectedProcedure
    .input(
      z.object({
        email: z.string(),
        name: z.string(),
        location: countrySchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const accountId = ulid();
      const profile = await hyperbrowser.profiles.create({
        name: ctx.user.primaryEmailAddress,
      });

      const { instance } = await LinkedInBrowserSession.getOrCreate(
        browserRegistry,
        ctx.db,
        {
          accountId,
          location: input.location,
          browserProfileId: profile.id,
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      void instance.pages.linkedin.on("framenavigated", async (frame) => {
        // attach a framenavigated here to detect succesful logins
        const currentUrl = frame.url();
        if (currentUrl.includes("linkedin.com/feed")) {
          // User has successfully logged in, destroy the instance and update the account status
          await ctx.db.linkedInAccount.update({
            where: { id: accountId },
            data: { status: "ACTIVE" },
          });
          await instance.destroy();
        }
      });

      await ctx.db.linkedInAccount.create({
        data: {
          id: accountId,
          userId: ctx.user.id,
          email: input.email,
          browserProfileId: profile.id,
          location: input.location,
          status: "CONNECTING",
        },
      });

      return {
        status: "success",
        accountId,
        liveUrl: instance.liveUrl,
      } as const;
    }),

  listLinkedInAccounts: protectedProcedure
    .input(
      z
        .object({
          cursor: z.string().nullish(),
        })
        .optional(),
    )
    .query(({ ctx, input }) =>
      ctx.db.linkedInAccount.findMany({
        where: { userId: ctx.user.id, id: { gt: input?.cursor ?? undefined } },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
        take: 20,
        orderBy: { id: "asc" },
      }),
    ),

  verifyAssumedUserJwt: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const decoded = await assumedAccountJwt.decode(input.token);
      if (decoded.success) {
        return {
          status: "success",
        } as const;
      }

      return {
        status: "error",
        error: decoded.error,
      } as const;
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
