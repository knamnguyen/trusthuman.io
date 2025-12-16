import type { TRPCRouterRecord } from "@trpc/server";
import { ulid } from "ulidx";
import z from "zod";

import { countrySchema } from "@sassy/validators";

import { protectedProcedure, publicProcedure } from "../trpc";
import {
  assumedAccountJwt,
  BrowserSession,
  hyperbrowser,
} from "../utils/browser-session";
import { paginate } from "../utils/pagination";

export const accountRouter = {
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const account = await ctx.db.linkedInAccount.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });

      return account;
    }),

  init: {
    create: protectedProcedure
      .input(
        z.object({
          email: z.string(),
          name: z.string().optional(),
          location: countrySchema,
        }),
      )
      .mutation(async function* ({ ctx, input, signal }) {
        const existingAccount = await ctx.db.linkedInAccount.findFirst({
          where: { email: input.email, userId: ctx.user.id },
        });

        let accountId;
        let profileId;

        if (existingAccount !== null && existingAccount.status === "ACTIVE") {
          yield {
            status: "signed_in",
          } as const;
          return;
        }

        if (existingAccount !== null) {
          accountId = existingAccount.id;
          profileId = existingAccount.browserProfileId;
        } else {
          accountId = ulid();
          const profile = await hyperbrowser.profiles.create({
            name: input.email,
          });
          profileId = profile.id;

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
        }

        const browserSession = new BrowserSession(
          ctx.db,
          ctx.browserRegistry,
          accountId,
          {
            location: input.location,
            browserProfileId: profileId,
          },
        );

        await browserSession.ready;

        yield {
          status: "initialized",
          accountId,
          liveUrl: browserSession.liveUrl,
        } as const;

        const signedIn = await browserSession.waitForSigninSuccess(
          signal ?? browserSession.signal,
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
          await browserSession.destroy();
        } else {
          yield {
            status: "failed_to_sign_in",
          } as const;
        }
      }),
    destroy: protectedProcedure
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

        const registry = ctx.browserRegistry.get(input.accountId);

        if (registry !== undefined) {
          await registry.destroy();
        }

        return {
          status: "success",
        } as const;
      }),
  },

  list: protectedProcedure
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

  verifyJwt: publicProcedure
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
