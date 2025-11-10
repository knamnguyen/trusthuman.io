import { ulid } from "ulidx";
import { z } from "zod";

import { protectedProcedure } from "../trpc";
import { getPaginationMeta } from "../utils/pagination";

export const blacklistRouter = {
  addToBlacklist: protectedProcedure
    .input(
      z.object({
        profileUrn: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.blacklistedProfile.createMany({
        data: {
          id: ulid(),
          userId: ctx.user.id,
          profileUrn: input.profileUrn,
        },
        skipDuplicates: true,
      });

      return { status: "success", created: result.count > 0 } as const;
    }),
  removeFromBlacklist: protectedProcedure
    .input(
      z.object({
        profileUrn: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.blacklistedProfile.deleteMany({
        where: {
          userId: ctx.user.id,
          profileUrn: input.profileUrn,
        },
      });

      return { status: "success" } as const;
    }),
  findBlacklistedProfiles: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const clauses = [];
      clauses.push({ userId: ctx.user.id });
      if (input.cursor !== undefined) {
        clauses.push({ profileUrn: { lt: input.cursor } });
      }
      const profiles = await ctx.db.blacklistedProfile.findMany({
        where: {
          AND: clauses,
        },
        select: {
          id: true,
          profileUrn: true,
        },
        orderBy: {
          id: "desc",
        },
        take: 20,
      });

      const meta = getPaginationMeta(profiles, {
        key: "id",
        size: 20,
      });

      return {
        data: profiles,
        next: meta.cursor,
        hasNextPage: meta.hasNextPage,
      };
    }),
};
