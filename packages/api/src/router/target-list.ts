import { DBOS } from "@dbos-inc/dbos-sdk";
import { ulid } from "ulidx";
import { z } from "zod";

import { getBuildTargetListLimits } from "../../../feature-flags/src/constants";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { LinkedInIndustrySearch } from "../utils/industry-search";
import { paginate } from "../utils/pagination";
import { buildTargetListWorkflow } from "../workflows";

const linkedInIndustrySearch = new LinkedInIndustrySearch();

const linkedInUrlSchema = z
  .string()
  .url()
  .refine((url) => {
    // normalize to https and remove search params and hash etc
    try {
      const u = new URL(url);
      return (
        u.hostname.endsWith("linkedin.com") && u.pathname.startsWith("/in/")
      );
    } catch {
      return false;
    }
  })
  .transform((url) => {
    const u = new URL(url);
    u.protocol = "https:";
    u.search = "";
    u.hash = "";
    return u.toString();
  });

export const targetListRouter = () =>
  createTRPCRouter({
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
          params: z.object({
            searchQuery: z.string().trim().min(1),
            locations: z.array(z.string().trim().min(1)).min(1),
            currentCompanies: z.array(z.string()).optional(),
            pastCompanies: z.array(z.string()).optional(),
            schools: z.array(z.string()).optional(),
            currentJobTitles: z.array(z.string()).optional(),
            pastJobTitles: z.array(z.string()).optional(),
            yearsOfExperienceIds: z.array(z.number()).optional(),
            yearsAtCurrencyCompanyIds: z.array(z.number()).optional(),
            seniorityLevelIds: z.array(z.number()).optional(),
            functionIds: z.array(z.number()).optional(),
            industryIds: z.array(z.number()).optional(),
            firstName: z.array(z.string()).optional(),
            lastName: z.array(z.string()).optional(),
            profileLanguages: z.array(z.string()).optional(),
            recentlyChangesJobs: z.boolean().optional(),
          }),
          name: z.string().trim().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.account === null) {
          return {
            status: "error",
            code: 400,
            message: "You must link a LinkedIn account to build a target list",
          } as const;
        }

        const maxJobs = getBuildTargetListLimits(ctx.account.accessType);

        const existingJobsCount = await ctx.db.buildTargetListJob.count({
          where: {
            accountId: ctx.account.id,
            createdAt: {
              gte: maxJobs.lastRefreshedAt,
            },
          },
        });

        if (existingJobsCount >= maxJobs.limit) {
          return {
            status: "error",
            code: 429,
            message: `You have reached the maximum of ${maxJobs.limit} build target list jobs. Your limit will reset on ${maxJobs.refreshesAt.toDateString()}.`,
          } as const;
        }

        const targetListId = ulid();

        const buildTargetListJobId = ulid();
        await ctx.db.buildTargetListJob.create({
          data: {
            id: buildTargetListJobId,
            workflowId: targetListId,
            accountId: ctx.account.id,
            listId: targetListId,
            status: "QUEUED",
          },
        });

        const workflow = await DBOS.startWorkflow(buildTargetListWorkflow, {
          workflowID: targetListId,
        })({
          targetListId,
          accountId: ctx.account.id,
          targetListName: input.name,
          buildTargetListJobId,
          // idk why the f input.params is inferred as unknown, so just cast for now
          params: { ...input.params, maxItems: 100 },
        });

        return {
          status: "success",
          jobId: buildTargetListJobId,
          workflowId: workflow.workflowID,
        } as const;
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
            id,
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
          include: {
            profile: true, // Include linked LinkedInProfile if scraped
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
          linkedinUrl: linkedInUrlSchema,
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

        // Try to find existing LinkedInProfile by URL to link immediately
        const existingProfile = await ctx.db.linkedInProfile.findFirst({
          where: { linkedinUrl: input.linkedinUrl },
          select: { urn: true },
        });

        const result = await ctx.db.targetProfile.createMany({
          data: {
            id: ulid(),
            listId: input.listId,
            linkedinUrl: input.linkedinUrl,
            profileUrn: existingProfile?.urn,
            accountId: ctx.account.id,
          },
          skipDuplicates: true,
        });

        return {
          status: "success",
          created: result.count > 0,
          linked: existingProfile !== null,
        } as const;
      }),
    removeTargetProfile: protectedProcedure
      .input(
        z.object({
          id: z.string(),
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
            id: input.id,
            accountId: ctx.account.id,
          },
        });

        return {
          status: "success",
        } as const;
      }),

    /**
     * Get all user's lists + which ones contain the given profile
     * Used by ManageListButton popover
     */
    findListsWithProfileStatus: protectedProcedure
      .input(
        z.object({
          linkedinUrl: linkedInUrlSchema,
        }),
      )
      .query(async ({ ctx, input }) => {
        if (ctx.account === null) {
          return {
            data: [],
            next: null,
          };
        }
        // Get all user's lists
        const lists = await ctx.db.targetList.findMany({
          where: { accountId: ctx.account.id },
          orderBy: { createdAt: "desc" },
        });

        // Get list IDs that contain this profile
        const profileInLists = await ctx.db.targetProfile.findMany({
          where: {
            accountId: ctx.account.id,
            linkedinUrl: input.linkedinUrl,
          },
          select: { listId: true },
        });

        const listIdsWithProfile = profileInLists.map((p) => p.listId);

        return {
          lists,
          listIdsWithProfile,
        };
      }),

    /**
     * Batch update profile's list membership
     * Used when ManageListButton popover closes
     */
    updateProfileLists: protectedProcedure
      .input(
        z.object({
          linkedinUrl: linkedInUrlSchema,
          addToListIds: z.array(z.string()),
          removeFromListIds: z.array(z.string()),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.account === null) {
          return {
            status: "error",
            code: 400,
            message:
              "You must link a LinkedIn account to update profile's target lists",
          } as const;
        }

        // Try to find existing LinkedInProfile by URL to link immediately
        const existingProfile = await ctx.db.linkedInProfile.findFirst({
          where: { linkedinUrl: input.linkedinUrl },
          select: { urn: true },
        });

        const listIdsToValidate = [
          ...input.addToListIds,
          ...input.removeFromListIds,
        ];

        // early return here if no lists to add or remove
        if (listIdsToValidate.length === 0) {
          return {
            status: "success",
            added: 0,
            removed: 0,
          } as const;
        }

        // TODO: setup access control that's tied to user instead of relying on exists check with accountId: ctx.account.id
        // validate add to and remove from lists exists and belong to user
        const validLists = await ctx.db.targetList.findMany({
          where: {
            id: { in: listIdsToValidate },
            accountId: ctx.account.id,
          },
          select: { id: true },
        });

        if (validLists.length !== new Set(listIdsToValidate).size) {
          return {
            status: "error",
            code: 400,
            message: "One or more target lists not found",
          } as const;
        }

        // Remove from lists
        if (input.removeFromListIds.length > 0) {
          await ctx.db.targetProfile.deleteMany({
            where: {
              accountId: ctx.account.id,
              linkedinUrl: input.linkedinUrl,
              listId: { in: input.removeFromListIds },
            },
          });
        }

        // Add to lists - first validate all list IDs exist and belong to user
        if (input.addToListIds.length > 0) {
          await ctx.db.targetProfile.createMany({
            data: input.addToListIds.map((listId) => ({
              id: ulid(),
              listId,
              accountId: ctx.account!.id,
              linkedinUrl: input.linkedinUrl,
              profileUrn: existingProfile?.urn,
              userId: ctx.user.id,
            })),
            skipDuplicates: true,
          });
        }

        return {
          status: "success",
          added: input.addToListIds.length,
          removed: input.removeFromListIds.length,
        } as const;
      }),

    /**
     * Get profiles in a list with their full list membership info
     * Used by target-list page to show profiles with list badges
     */
    findProfilesByListIdWithMembership: protectedProcedure
      .input(
        z.object({
          listId: z.string(),
          cursor: z.string().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        if (ctx.account === null) {
          return {
            data: [],
            next: null,
          };
        }
        const clauses = [];
        clauses.push({
          listId: input.listId,
          userId: ctx.user.id,
        });

        if (input.cursor !== undefined) {
          clauses.push({ id: { lt: input.cursor } });
        }

        // 1. Fetch profiles for this list
        const profiles = await ctx.db.targetProfile.findMany({
          where: {
            AND: clauses,
          },
          include: {
            profile: true,
            list: {
              select: {
                name: true,
                id: true,
              },
            },
          },
          orderBy: {
            id: "desc",
          },
          take: 21,
        });

        if (profiles.length === 0) {
          return { data: [], next: null };
        }

        // 2. Collect unique linkedinUrls
        const linkedinUrls = [...new Set(profiles.map((p) => p.linkedinUrl))];

        // 3. Batch query all list memberships for these profiles
        const allMemberships = await ctx.db.targetProfile.findMany({
          where: {
            accountId: ctx.account.id,
            linkedinUrl: { in: linkedinUrls },
          },
          select: {
            linkedinUrl: true,
            listId: true,
          },
        });

        // 4. Get list names for all referenced lists
        const listIds = [...new Set(allMemberships.map((m) => m.listId))];
        const lists = await ctx.db.targetList.findMany({
          where: {
            id: { in: listIds },
          },
          select: {
            id: true,
            name: true,
          },
        });
        const listMap = new Map(lists.map((l) => [l.id, l.name]));

        // 5. Build membership lookup by linkedinUrl
        const membershipsByUrl = new Map<
          string,
          { id: string; name: string }[]
        >();
        for (const m of allMemberships) {
          const listName = listMap.get(m.listId);
          if (listName) {
            const existing = membershipsByUrl.get(m.linkedinUrl) ?? [];
            existing.push({ id: m.listId, name: listName });
            membershipsByUrl.set(m.linkedinUrl, existing);
          }
        }

        // 6. Merge into response
        const data = profiles.slice(0, 20).map((p) => ({
          ...p,
          listMemberships: membershipsByUrl.get(p.linkedinUrl) ?? [],
        }));

        return paginate(data, {
          key: "id",
          size: 20,
        });
      }),

    /**
     * Ensure profile is added to the "All" list (creates list if needed)
     * Called automatically when a profile is saved/selected
     */
    ensureProfileInAllList: protectedProcedure
      .input(
        z.object({
          linkedinUrl: linkedInUrlSchema,
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const ALL_LIST_NAME = "All";

        if (ctx.account === null) {
          return {
            status: "error",
            code: 400,
            message:
              "You must link a LinkedIn account to add profiles to a target list",
          } as const;
        }

        // Find or create "All" list
        let allList = await ctx.db.targetList.findFirst({
          where: {
            accountId: ctx.account.id,
            name: ALL_LIST_NAME,
          },
        });

        let listCreated = false;
        if (!allList) {
          const id = ulid();
          allList = await ctx.db.targetList.create({
            data: {
              id,
              accountId: ctx.account.id,
              status: "COMPLETED",
              name: ALL_LIST_NAME,
            },
          });
          listCreated = true;
        }

        // Try to find existing LinkedInProfile by URL to link immediately
        const existingProfile = await ctx.db.linkedInProfile.findFirst({
          where: { linkedinUrl: input.linkedinUrl },
          select: { urn: true },
        });

        // Add profile to "All" list (skipDuplicates handles idempotency)
        const result = await ctx.db.targetProfile.createMany({
          data: {
            id: ulid(),
            listId: allList.id,
            linkedinUrl: input.linkedinUrl,
            profileUrn: existingProfile?.urn,
            accountId: ctx.account.id,
          },
          skipDuplicates: true,
        });

        return {
          status: "success",
          list: allList,
          listCreated,
          profileAdded: result.count > 0,
        } as const;
      }),
  });
