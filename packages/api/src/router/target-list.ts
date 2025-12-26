import { DBOS } from "@dbos-inc/dbos-sdk";
import { ulid } from "ulidx";
import { z } from "zod";

import type { LinkedinProfileSearchInput } from "@sassy/apify-runners/linkedin-profile-explorer";
import { linkedinProfileSearchInputSchema } from "@sassy/apify-runners/linkedin-profile-explorer";

import { protectedProcedure } from "../trpc";
import { LinkedInIndustrySearch } from "../utils/industry-search";
import { paginate } from "../utils/pagination";
import { buildTargetListWorkflow } from "../workflows";

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
  buildList: protectedProcedure
    .input(
      z.object({
        params: linkedinProfileSearchInputSchema.omit({
          startPage: true,
          maxItems: true,
        }),
        name: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const targetListId = ulid();

      if (ctx.account === null) {
        return {
          status: "error",
          code: 400,
          message: "You must link a LinkedIn account to build a target list",
        } as const;
      }

      // TODO: target list building rate limits for account subscriptions

      const workflow = await DBOS.startWorkflow(buildTargetListWorkflow, {
        workflowID: targetListId,
      })({
        targetListId,
        accountId: ctx.account.id,
        targetListName: input.name,
        // idk why the f input.params is inferred as unknown, so just cast for now
        params: input.params as LinkedinProfileSearchInput,
      });

      return {
        status: "success",
        workflowId: workflow.workflowID,
      };
    }),
  addList: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.account === null) {
        return {
          status: "error",
          code: 400,
          message: "You must link a LinkedIn account to create a target list",
        } as const;
      }

      const id = ulid();
      await ctx.db.targetList.create({
        data: {
          status: "COMPLETED",
          accountId: ctx.account.id,
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
      if (ctx.account === null) {
        return {
          data: [],
          next: null,
          hasNextPage: false,
        };
      }
      const lists = await ctx.db.targetList.findMany({
        where: {
          AND: [
            { accountId: ctx.account.id },
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
      if (ctx.account === null) {
        return null;
      }

      const list = await ctx.db.targetList.findFirst({
        where: {
          id: input.id,
          accountId: ctx.account.id,
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
      if (ctx.account === null) {
        return {
          status: "error",
          code: 400,
          message:
            "You must link a LinkedIn account to add profiles to a target list",
        } as const;
      }

      const existing = await ctx.db.targetProfile.createMany({
        data: {
          id: ulid(),
          listId: input.listId,
          profileUrn: input.profileUrn,
          accountId: ctx.account.id,
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
      if (ctx.account === null) {
        return {
          status: "error",
          code: 404,
          message: "Target list not found",
        } as const;
      }

      await ctx.db.targetProfile.deleteMany({
        where: {
          listId: input.listId,
          profileUrn: input.profileUrn,
          accountId: ctx.account.id,
        },
      });

      return {
        status: "success",
      } as const;
    }),
};
