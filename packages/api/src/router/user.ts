import type { TRPCRouterRecord } from "@trpc/server";
import type { Page } from "puppeteer";
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
import { paginate } from "../utils/pagination";

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
        name: z.string().optional(),
        location: countrySchema,
      }),
    )
    .mutation(async function* ({ ctx, input }) {
      const existingAccount = await ctx.db.linkedInAccount.findFirst({
        where: { email: input.email, userId: ctx.user.id },
      });

      let profileId;
      let accountId;

      if (existingAccount !== null && existingAccount.status === "ACTIVE") {
        yield {
          status: "signed_in",
        } as const;
        return;
      }

      if (existingAccount !== null) {
        // Reuse existing account's profile and ID
        profileId = existingAccount.browserProfileId;
        accountId = existingAccount.id;
      } else {
        accountId = ulid();
        const profile = await hyperbrowser.profiles.create({
          name: input.email,
        });

        await ctx.db.linkedInAccount.create({
          data: {
            id: accountId,
            userId: ctx.user.id,
            email: input.email,
            name: input.name,
            browserProfileId: profile.id,
            location: input.location,
            status: "CONNECTING",
          },
        });

        profileId = profile.id;
      }

      const { instance } = await LinkedInBrowserSession.getOrCreate(
        browserRegistry,
        ctx.db,
        {
          accountId,
          location: input.location,
          browserProfileId: profileId,
        },
      );

      yield {
        status: "initialized",
        accountId,
        liveUrl: instance.liveUrl,
      } as const;

      const signedIn = await waitForSigninSuccess(
        instance.pages.linkedin,
        instance.signal,
      );

      if (signedIn) {
        await ctx.db.linkedInAccount.update({
          where: {
            id: accountId,
          },
          data: {
            status: "ACTIVE",
          },
        });
        yield {
          status: "signed_in",
        } as const;
        await instance.destroy();
      } else {
        yield {
          status: "failed_to_sign_in",
        } as const;
      }
    }),

  destroyAddAccountSession: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const account = await ctx.db.linkedInAccount.findFirst({
        where: { id: input.accountId },
        select: {
          userId: true,
        },
      });

      if (account === null || account.userId !== ctx.user.id) {
        return {
          status: "error",
          error: "Not Permitted",
        } as const;
      }

      await browserRegistry.destroy(input.accountId);

      return {
        status: "success",
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
    .query(async ({ ctx, input }) => {
      const accounts = await ctx.db.linkedInAccount.findMany({
        where: { userId: ctx.user.id, id: { lt: input?.cursor ?? undefined } },
        take: 21,
        orderBy: { id: "desc" },
      });

      return paginate(accounts, {
        key: "id",
        size: 20,
      });
    }),

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

async function waitForSigninSuccess(page: Page, signal: AbortSignal) {
  // just keep polling until we hit the feed page or an error
  // if we hit the feed page, means signin has succeeded
  // 5 minute timeout
  const time = Date.now();
  while (time + 5 * 60 * 1000 > Date.now() || signal.aborted === false) {
    try {
      const url = page.url();
      console.info("Polling LinkedIn URL:", url);
      if (url.includes("linkedin.com/feed")) {
        return true;
      }

      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(resolve, 2000);
        signal.addEventListener("abort", () => {
          clearTimeout(timeoutId);
          reject(new Error("Aborted"));
        });
      });
    } catch (err) {
      console.error("Error polling LinkedIn URL:", err);
      return false;
    }
  }
}
