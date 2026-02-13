import { ulid } from "ulidx";
import { z } from "zod";

import type { PrismaClient } from "@sassy/db";
import {
  discoverySetCreateSchema,
  discoverySetUpdateSchema,
} from "@sassy/db/schema-validators";

import {
  accountProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../trpc";
import { paginate } from "../utils/pagination";
import { hasPermissionToAccessAccount } from "./account";

export const discoverySetRouter = () =>
  createTRPCRouter({
    create: protectedProcedure
      .input(discoverySetCreateSchema)
      .mutation(async ({ ctx, input }) => {
        if (ctx.activeAccount === null) {
          return {
            status: "error",
            message: "No active account selected",
          } as const;
        }

        const hasPermission = await hasPermissionToManageDiscoverySet(ctx.db, {
          actorUserId: ctx.user.id,
          accountId: ctx.activeAccount.id,
        });

        if (!hasPermission) {
          return {
            status: "error",
            message:
              "You do not have permission to manage discovery sets for this account",
          } as const;
        }

        const id = ulid();
        await ctx.db.discoverySet.create({
          data: {
            id,
            accountId: ctx.activeAccount.id,
            name: input.name,
            keywords: input.keywords,
            keywordsMode: input.keywordsMode,
            excluded: input.excluded,
            authorJobTitle: input.authorJobTitle,
            authorIndustries: input.authorIndustries,
          },
        });

        return {
          status: "success",
          id,
        } as const;
      }),

    list: accountProcedure
      .input(
        z.object({
          cursor: z.string().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const sets = await ctx.db.discoverySet.findMany({
          where: {
            accountId: ctx.activeAccount.id,
            id: input.cursor
              ? {
                  lt: input.cursor,
                }
              : undefined,
          },
          orderBy: { id: "desc" },
          take: 21,
        });

        return paginate(sets, { key: "id", size: 20 });
      }),

    findById: protectedProcedure
      .input(
        z.object({
          id: z.string(),
        }),
      )
      .query(async ({ ctx, input }) => {
        if (ctx.activeAccount === null) {
          return null;
        }

        const set = await ctx.db.discoverySet.findFirst({
          where: {
            id: input.id,
            accountId: ctx.activeAccount.id,
          },
        });

        return set;
      }),

    update: protectedProcedure
      .input(discoverySetUpdateSchema)
      .mutation(async ({ ctx, input }) => {
        if (ctx.activeAccount === null) {
          return {
            status: "error",
            message: "No active account selected",
          } as const;
        }

        const hasPermission = await hasPermissionToManageDiscoverySet(ctx.db, {
          actorUserId: ctx.user.id,
          accountId: ctx.activeAccount.id,
        });

        if (!hasPermission) {
          return {
            status: "error",
            message:
              "You do not have permission to manage discovery sets for this account",
          } as const;
        }

        const result = await ctx.db.discoverySet.updateMany({
          where: {
            id: input.id,
            accountId: ctx.activeAccount.id,
          },
          data: {
            name: input.name,
            keywords: input.keywords,
            keywordsMode: input.keywordsMode,
            excluded: input.excluded,
            authorJobTitle: input.authorJobTitle,
            authorIndustries: input.authorIndustries,
          },
        });

        if (result.count === 0) {
          return {
            status: "error",
            message: "Discovery set not found",
          } as const;
        }

        return {
          status: "success",
        } as const;
      }),

    delete: protectedProcedure
      .input(
        z.object({
          id: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.activeAccount === null) {
          return {
            status: "error",
            message: "No active account selected",
          } as const;
        }

        const hasPermission = await hasPermissionToManageDiscoverySet(ctx.db, {
          actorUserId: ctx.user.id,
          accountId: ctx.activeAccount.id,
        });

        if (!hasPermission) {
          return {
            status: "error",
            message:
              "You do not have permission to manage discovery sets for this account",
          } as const;
        }

        const result = await ctx.db.discoverySet.deleteMany({
          where: {
            id: input.id,
            accountId: ctx.activeAccount.id,
          },
        });

        if (result.count === 0) {
          return {
            status: "error",
            message: "Discovery set not found",
          } as const;
        }

        return {
          status: "success",
        } as const;
      }),
  });

function hasPermissionToManageDiscoverySet(
  db: PrismaClient,
  { actorUserId, accountId }: { actorUserId: string; accountId: string },
) {
  return hasPermissionToAccessAccount(db, {
    actorUserId,
    accountId,
  });
}
