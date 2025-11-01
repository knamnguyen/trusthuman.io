import { TRPCError } from "@trpc/server";
import z from "zod";

import { storageStateSchema } from "@sassy/validators";

// import {
//   userCreateSchema,
//   userUpdateSchema,
// } from "@sassy/db/schema-validators";

import { protectedProcedure } from "../trpc";
import { cryptography } from "../utils/encryption";
import { env } from "../utils/env";
import {
  browserRegistry,
  hyperbrowser,
  LinkedInBrowserSession,
  ProxyLocation,
} from "../utils/linkedin-browser-session";

export const browserRouter = {
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
          location: true,
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
        new LinkedInBrowserSession(browserRegistry, {
          id: account.id,
          userId: account.id,
          username: account.email,
          password: decryptedPassword.data,
          // technically this account.location should be filled when adding seat, db allows null though so just fallback to US
          location: (account.location ?? "US") as ProxyLocation,
          twoFactorSecretKey: decryptedTwoFASecretKey.data,
          browserProfileId: account.browserProfileId ?? undefined,
          staticIpId: account.staticIpId ?? undefined,
          sessionId:
            process.env.NODE_ENV === "production" ? account.id : "mock",
        }),
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

  saveBrowserState: protectedProcedure
    .input(storageStateSchema)
    .mutation(async ({ ctx, input }) => {
      const serialized = JSON.stringify(input);
      await ctx.db.userBrowserState.upsert({
        update: {
          state: serialized,
        },
        where: {
          userId: ctx.user.id,
        },
        create: {
          userId: ctx.user.id,
          state: serialized,
        },
      });

      return {
        status: "success",
      } as const;
    }),

  getBrowserState: protectedProcedure.query(async ({ ctx }) => {
    const state = await ctx.db.userBrowserState.findUnique({
      where: {
        userId: ctx.user.id,
      },
      select: {
        state: true,
      },
    });

    return state ? storageStateSchema.parse(JSON.parse(state.state)) : null;
  }),
};
