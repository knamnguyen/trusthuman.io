import type { TRPCRouterRecord } from "@trpc/server";
import type { Page } from "puppeteer-core";
import { ulid } from "ulidx";
import z from "zod";

import { countrySchema } from "@sassy/validators";

import { protectedProcedure, publicProcedure } from "../trpc";
import {
  assumedAccountJwt,
  browserRegistry,
  hyperbrowser,
} from "../utils/linkedin-browser-session";
import { paginate } from "../utils/pagination";
import { registerOrGetBrowserSession } from "./browser";

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
      .mutation(async function* ({ ctx, input }) {
        const existingAccount = await ctx.db.linkedInAccount.findFirst({
          where: { email: input.email, userId: ctx.user.id },
        });

        let accountId;

        if (existingAccount !== null && existingAccount.status === "ACTIVE") {
          yield {
            status: "signed_in",
          } as const;
          return;
        }

        if (existingAccount !== null) {
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
        }

        const result = await registerOrGetBrowserSession(
          ctx.db,
          ctx.user.id,
          accountId,
        );

        if (result.status === "error") {
          yield {
            status: "error",
            reason: "Failed to start browser session",
          } as const;
          return;
        }

        const instance = result.instance;

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

        await browserRegistry.destroy(input.accountId);

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
