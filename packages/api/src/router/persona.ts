import { ulid } from "ulidx";
import z from "zod";

import type { PrismaClient } from "@sassy/db";

import {
  accountProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "../trpc";
import { paginate } from "../utils/pagination";
import { hasPermissionToAccessAccount } from "./account";

export const personaRouter = () =>
  createTRPCRouter({
    commentStyle: {
      create: protectedProcedure
        .input(
          z.object({
            name: z.string(),
            description: z.string(),
            content: z.string(),
            // AI Generation Config
            // "Comment Length" in words (1-300)
            maxWords: z.number().min(1).max(300).optional().default(100),
            // "Creativity Level" - temperature (0.0-2.0)
            creativity: z.number().min(0).max(2).optional().default(1.0),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          if (ctx.activeAccount === null) {
            return {
              status: "error",
              message: "No active account selected",
            } as const;
          }

          const hasPermission = await hasPermissionToManagePersona(ctx.db, {
            actorUserId: ctx.user.id,
            accountId: ctx.activeAccount.id,
          });

          if (!hasPermission) {
            return {
              status: "error",
              message:
                "You do not have permission to manage personas for this account",
            } as const;
          }

          const id = ulid();
          await ctx.db.commentStyle.create({
            data: {
              id,
              accountId: ctx.activeAccount!.id,
              name: input.name,
              content: input.content,
              description: input.description,
              maxWords: input.maxWords,
              creativity: input.creativity,
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
          const styles = await ctx.db.commentStyle.findMany({
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

          return paginate(styles, { key: "id", size: 20 });
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

          const hasPermission = await hasPermissionToManagePersona(ctx.db, {
            actorUserId: ctx.user.id,
            accountId: ctx.activeAccount.id,
          });

          if (!hasPermission) {
            return {
              status: "error",
              message:
                "You do not have permission to manage personas for this account",
            } as const;
          }

          const result = await ctx.db.commentStyle.deleteMany({
            where: {
              id: input.id,
              accountId: ctx.activeAccount.id,
            },
          });

          if (result.count === 0) {
            return {
              status: "error",
              message: "Comment style not found",
            } as const;
          }

          return {
            status: "success",
          } as const;
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

          const style = await ctx.db.commentStyle.findFirst({
            where: {
              id: input.id,
              accountId: ctx.activeAccount.id,
            },
          });

          return style;
        }),

      update: protectedProcedure
        .input(
          z.object({
            id: z.string(),
            name: z.string().optional(),
            description: z.string().optional(),
            content: z.string().optional(),
            // AI Generation Config
            maxWords: z.number().min(1).max(300).optional(),
            creativity: z.number().min(0).max(2).optional(),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          if (ctx.activeAccount === null) {
            return {
              status: "error",
              message: "No active account selected",
            } as const;
          }

          const hasPermission = await hasPermissionToManagePersona(ctx.db, {
            actorUserId: ctx.user.id,
            accountId: ctx.activeAccount.id,
          });

          if (!hasPermission) {
            return {
              status: "error",
              message:
                "You do not have permission to manage personas for this account",
            } as const;
          }

          const result = await ctx.db.commentStyle.updateMany({
            where: {
              id: input.id,
              accountId: ctx.activeAccount.id,
            },
            data: {
              name: input.name,
              content: input.content,
              description: input.description,
              maxWords: input.maxWords,
              creativity: input.creativity,
            },
          });

          if (result.count === 0) {
            return {
              status: "error",
              message: "Comment style not found",
            } as const;
          }

          return {
            status: "success",
          } as const;
        }),
    },
  });

function hasPermissionToManagePersona(
  db: PrismaClient,
  { actorUserId, accountId }: { actorUserId: string; accountId: string },
) {
  return hasPermissionToAccessAccount(db, {
    actorUserId,
    accountId,
  });
}
