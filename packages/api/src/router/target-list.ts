import { ulid } from "ulidx";
import { z } from "zod/v4";

import { protectedProcedure } from "../trpc";
import { LinkedInIndustrySearch } from "../utils/industry-search";
import { paginate } from "../utils/pagination";

const linkedInIndustrySearch = new LinkedInIndustrySearch();

export const targetListRouter = {
  industries: {
    list: protectedProcedure
      .input(
        z.object({
          offset: z.number().optional(),
          limit: z.number().optional(),
        }),
      )
      .query(({ input }) => {
        return linkedInIndustrySearch.list({
          offset: input.offset,
          limit: input.limit,
        });
      }),
    search: protectedProcedure
      .input(
        z.object({
          query: z.string().trim().optional(),
        }),
      )
      .query(({ input }) => {
        return linkedInIndustrySearch.search(input.query ?? null, 20);
      }),
  },
  addList: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = ulid();
      await ctx.db.targetList.create({
        data: {
          userId: ctx.user.id,
          id: ulid(),
          name: input.name,
        },
      });

      return {
        status: "success",
        id,
      } as const;
    }),
  findLists: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const lists = await ctx.db.targetList.findMany({
        where: {
          AND: [
            { userId: ctx.user.id },
            {
              id: input.cursor ? { lt: input.cursor } : undefined,
            },
          ],
        },
        orderBy: {
          id: "desc",
        },
        take: 21,
      });

      return paginate(lists, {
        key: "id",
        size: 20,
      });
    }),
  findListById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const list = await ctx.db.targetList.findFirst({
        where: {
          id: input.id,
          userId: ctx.user.id,
        },
      });

      return list;
    }),
  findProfileByListId: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const clauses = [];
      clauses.push({
        listId: input.listId,
        userId: ctx.user.id,
      });

      if (input.cursor !== undefined) {
        clauses.push({ id: { lt: input.cursor } });
      }
      const profiles = await ctx.db.targetProfile.findMany({
        where: {
          AND: clauses,
        },
        orderBy: {
          id: "desc",
        },
        take: 21,
      });

      return paginate(profiles, {
        key: "id",
        size: 20,
      });
    }),
  addProfileToList: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        profileUrn: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.targetProfile.createMany({
        data: {
          id: ulid(),
          listId: input.listId,
          profileUrn: input.profileUrn,
          userId: ctx.user.id,
        },
        skipDuplicates: true,
      });

      return {
        status: "success",
        created: existing.count > 0,
      } as const;
    }),
  removeProfileFromList: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        profileUrn: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.targetProfile.deleteMany({
        where: {
          listId: input.listId,
          profileUrn: input.profileUrn,
          userId: ctx.user.id,
        },
      });

      return {
        status: "success",
      } as const;
    }),
};
