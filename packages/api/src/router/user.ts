import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { authenticator } from "otplib";
import z from "zod";

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
import { cryptography } from "../utils/encryption";
import { env } from "../utils/env";
import {
  assumedUserJwt,
  browserRegistry,
  hyperbrowser,
  LinkedInBrowserSession,
  tempAuthJwt,
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

  addLinkedInAccount: protectedProcedure
    .input(
      z.object({
        email: z.string(),
        password: z.string(),
        twoFactorSecretKey: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [encryptedPassword, encryptedTwoFASecretKey, browserProfileId] =
        await Promise.all([
          cryptography.encrypt(
            input.password,
            env.LINKEDIN_PASSWORD_SECRET_KEY,
          ),
          cryptography.encrypt(
            input.twoFactorSecretKey,
            env.LINKEDIN_TWO_FA_SECRET_KEY,
          ),
          hyperbrowser.profiles
            .create({ name: ctx.user.primaryEmailAddress })
            .then((p) => p.id),
        ]);

      const account = await ctx.db.linkedInAccount.create({
        data: {
          userId: ctx.user.id,
          email: input.email,
          encryptedPassword,
          twoFactorSecretKey: encryptedTwoFASecretKey,
          browserProfileId,
        },
        select: {
          id: true,
        },
      });

      return account.id;
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

  attachTempTokenToSession: publicProcedure
    .input(
      z.object({
        tempAuthToken: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // validate temp auth token
      const decoded = await tempAuthJwt.decode(input.tempAuthToken);

      if (decoded.success === false) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Session not found for the provided temporary token",
        });
      }

      const account = await ctx.db.linkedInAccount.findUnique({
        where: { id: decoded.payload.userId },
        select: {
          id: true,
        },
      });

      if (account === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "LinkedIn account not found for the provided temporary token",
        });
      }

      const token = await assumedUserJwt.encode({
        userId: account.id,
      });

      return {
        status: "success",
        token,
      } as const;
    }),

  startBrowserSession: protectedProcedure
    .input(
      z.object({
        linkedInAccountId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.linkedInAccount.findUnique({
        where: { id: input.linkedInAccountId, userId: ctx.user.id },
        select: {
          id: true,
          email: true,
          encryptedPassword: true,
          twoFactorSecretKey: true,
          browserProfileId: true,
          staticIpId: true,
        },
      });

      if (account === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "LinkedIn account not found",
        });
      }

      const decryptedPassword = await cryptography.decrypt(
        account.encryptedPassword,
        env.LINKEDIN_PASSWORD_SECRET_KEY,
      );

      if (!decryptedPassword.success) {
        return {
          status: "error",
          message: "Failed to decrypt LinkedIn password",
        } as const;
      }

      const decryptedTwoFASecretKey = await cryptography.decrypt(
        account.twoFactorSecretKey,
        env.LINKEDIN_TWO_FA_SECRET_KEY,
      );

      if (!decryptedTwoFASecretKey.success) {
        return {
          status: "error",
          message: "Failed to decrypt LinkedIn 2FA secret key",
        } as const;
      }

      await browserRegistry.register(
        account.id,
        new LinkedInBrowserSession(
          {
            userId: account.id,
            username: account.email,
            password: decryptedPassword.data,
            location: "MY", // TODO: add location in account settings
            twoFactorSecretKey: decryptedTwoFASecretKey.data,
            browserProfileId: account.browserProfileId ?? undefined,
            staticIpId: account.staticIpId ?? undefined,
          },
          console,
          process.env.NODE_ENV === "production" ? account.id : "mock",
        ),
      );

      return {
        status: "success",
      } as const;
    }),

  browserSessionStatus: protectedProcedure
    .input(
      z.object({
        linkedInAccountId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const account = await ctx.db.linkedInAccount.findUnique({
        where: { id: input.linkedInAccountId, userId: ctx.user.id },
        select: {
          id: true,
        },
      });

      if (account === null) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "LinkedIn account not found",
        });
      }

      const session = browserRegistry.get(account.id);

      if (session === undefined) {
        return {
          status: "offline",
        } as const;
      }

      if (session.sessionId === "mock") {
        return {
          status: "online",
        } as const;
      }

      const details = await hyperbrowser.sessions.get(session.sessionId);

      return {
        status: details.status,
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
