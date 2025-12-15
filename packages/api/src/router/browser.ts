import { TRPCError } from "@trpc/server";
import z from "zod";

import { storageStateSchema } from "@sassy/validators";

import { protectedProcedure } from "../trpc";
import { hyperbrowser } from "../utils/browser-session";

export const browserRouter = {
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

      // implement registry lookup here
      const session = await ctx.db.browserInstance.findFirst({
        where: {
          accountId: account.id,
        },
      });

      if (session === null) {
        return {
          status: "offline",
        } as const;
      }

      const details = await hyperbrowser.sessions.get(
        session.hyperbrowserSessionId,
      );

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
