import type { TRPCRouterRecord } from "@trpc/server";
import { authenticator } from "otplib";
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
import { cryptography } from "../utils/encryption";
import { env } from "../utils/env";
import {
  assumedUserJwt,
  browserRegistry,
  hyperbrowser,
  LinkedInBrowserSession,
} from "../utils/linkedin-browser-session";
import { registerOrGetBrowserSession } from "./browser";

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
        location: countrySchema,
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
          location: input.location,
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

  verifyAssumedUserJwt: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const decoded = await assumedUserJwt.decode(input.token);
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

  saveComments: protectedProcedure
    .input(
      z
        .object({
          comment: z.string(),
          postContentHtml: z.string().nullable(),
          autoCommentRunId: z.string().optional(),
          urn: z.string(),
          hash: z.string().nullable(),
          isDuplicate: z.boolean().default(false),
          isAutoCommented: z.boolean().default(true),
          commentedAt: z.date().optional(),
        })
        .array()
        .min(1),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const result = await ctx.db.userComment.createMany({
        data: input.map((row) => ({
          urn: row.urn,
          userId: ctx.user.id,
          autoCommentRunId: row.autoCommentRunId,
          hash: row.hash,
          comment: row.comment,
          postContentHtml: row.postContentHtml,
          commentedAt: row.commentedAt ?? now,
          isDuplicate: row.isDuplicate,
          isAutoCommented: row.isAutoCommented,
        })),
        skipDuplicates: true,
      });

      return {
        status: "success",
        inserted: result.count,
      } as const;
    }),

  hasCommentedBefore: protectedProcedure
    .input(
      z.object({
        urns: z.string().array(),
        hashes: z.string().array(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const clause = [];

      if (input.urns.length > 0) {
        clause.push({
          urn: { in: input.urns },
        } as const);
      }

      if (input.hashes.length > 0) {
        clause.push({
          hash: { in: input.hashes },
        } as const);
      }

      const comments = await ctx.db.userComment.findMany({
        where: {
          OR: clause,
        },
        select: { urn: true },
      });

      const commentedUrns = new Set(comments.map((comment) => comment.urn));

      return {
        uncommentedUrns: input.urns.filter((urn) => !commentedUrns.has(urn)),
      } as const;
    }),

  startAutoCommenting: protectedProcedure
    .input(
      z.object({
        linkedInAccountId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const browserSession = await registerOrGetBrowserSession(
        ctx.db,
        ctx.user.id,
        input.linkedInAccountId,
      );

      if (browserSession.status === "error") {
        return browserSession;
      }

      const instance = browserSession.instance;

      const autoCommentRun = await ctx.db.autoCommentRun.create({
        data: {
          userId: ctx.user.id,
          status: "pending",
        },

        select: {
          id: true,
        },
      });

      await instance.startAutoCommenting({
        autoCommentRunId: autoCommentRun.id,
        // TODO: add other props here that's given from zod input
      });
    }),

  stopAutoCommenting: protectedProcedure
    .input(
      z.object({
        autoCommentRunId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const autoCommentRun = await ctx.db.autoCommentRun.findUnique({
        where: { id: input.autoCommentRunId },
      });

      if (autoCommentRun === null) {
        return {
          status: "error",
          code: 404,
          message: "Auto comment run not found",
        } as const;
      }

      if (autoCommentRun.status !== "pending") {
        return {
          status: "success",
          message: "auto commenting already stopped",
        } as const;
      }

      const session = browserRegistry.get(ctx.user.id);

      if (session === undefined) {
        return {
          status: "error",
          code: 400,
          message: "No active browser session found",
        } as const;
      }

      await session.stopAutoCommenting();

      await ctx.db.autoCommentRun.update({
        where: { id: input.autoCommentRunId },
        data: { status: "stopped", endedAt: new Date() },
      });

      return {
        status: "success",
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
