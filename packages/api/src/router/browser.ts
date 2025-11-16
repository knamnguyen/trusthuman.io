import { TRPCError } from "@trpc/server";
import z from "zod";

import type { PrismaClient } from "@sassy/db";
import { storageStateSchema } from "@sassy/validators";

import type {
  BrowserBackendChannelMessage,
  ProxyLocation,
} from "../utils/linkedin-browser-session";
import { protectedProcedure } from "../trpc";
import {
  browserRegistry,
  hyperbrowser,
  LinkedInBrowserSession,
} from "../utils/linkedin-browser-session";

function getLatestEngagekitExtensionId(db: PrismaClient) {
  return db.extensionDeploymentMeta.findFirst({
    orderBy: { createdAt: "desc" },
  });
}

export async function registerOrGetBrowserSession(
  prisma: PrismaClient,
  userId: string,
  linkedInAccountId: string,
  onBrowserMessage?: (
    this: LinkedInBrowserSession,
    data: BrowserBackendChannelMessage,
  ) => unknown,
) {
  const account = await prisma.linkedInAccount.findUnique({
    where: { id: linkedInAccountId, userId },
  });

  if (account === null) {
    return {
      status: "error",
      code: 404,
      message: "LinkedIn account not found",
    } as const;
  }

  const engagekitExtensionId = await getLatestEngagekitExtensionId(prisma);

  if (engagekitExtensionId === null) {
    return {
      status: "error",
      code: 500,
      message: "Engagekit extension not deployed",
    } as const;
  }

  const { instance, status } = await LinkedInBrowserSession.getOrCreate(
    browserRegistry,
    {
      accountId: account.id,
      location: account.location as ProxyLocation,
      browserProfileId: account.browserProfileId,
      engagekitExtensionId: engagekitExtensionId.id,
      onBrowserMessage,
    },
  );

  return {
    status: "success",
    created: status === "new",
    instance,
  } as const;
}

export const browserRouter = {
  startBrowserSession: protectedProcedure
    .input(
      z.object({
        linkedInAccountId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await registerOrGetBrowserSession(
        ctx.db,
        ctx.user.id,
        input.linkedInAccountId,
      );

      if (result.status === "error") {
        return result;
      }

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
