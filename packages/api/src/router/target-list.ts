import { TRPCError } from "@trpc/server";
import { ulid } from "ulidx";
import { z } from "zod/v4";

import { protectedProcedure } from "../trpc";
import { paginate } from "../utils/pagination";

export const targetListRouter = {
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
        linkedinUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
          userId: ctx.user.id,
        },
        skipDuplicates: true,
      });

      return {
        status: "success",
        created: result.count > 0,
        linked: existingProfile !== null,
      } as const;
    }),
  removeProfileFromList: protectedProcedure
    .input(
      z.object({
        listId: z.string(),
        linkedinUrl: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.targetProfile.deleteMany({
        where: {
          listId: input.listId,
          linkedinUrl: input.linkedinUrl,
          userId: ctx.user.id,
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
        linkedinUrl: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get all user's lists
      const lists = await ctx.db.targetList.findMany({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: "desc" },
      });

      // Get list IDs that contain this profile
      const profileInLists = await ctx.db.targetProfile.findMany({
        where: {
          userId: ctx.user.id,
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
        linkedinUrl: z.string().url(),
        addToListIds: z.array(z.string()),
        removeFromListIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Try to find existing LinkedInProfile by URL to link immediately
      const existingProfile = await ctx.db.linkedInProfile.findFirst({
        where: { linkedinUrl: input.linkedinUrl },
        select: { urn: true },
      });

      // Remove from lists
      if (input.removeFromListIds.length > 0) {
        await ctx.db.targetProfile.deleteMany({
          where: {
            userId: ctx.user.id,
            linkedinUrl: input.linkedinUrl,
            listId: { in: input.removeFromListIds },
          },
        });
      }

      // Add to lists - first validate all list IDs exist and belong to user
      if (input.addToListIds.length > 0) {
        const validLists = await ctx.db.targetList.findMany({
          where: {
            id: { in: input.addToListIds },
            userId: ctx.user.id,
          },
          select: { id: true },
        });

        const validListIds = new Set(validLists.map((l) => l.id));
        const invalidListIds = input.addToListIds.filter(
          (id) => !validListIds.has(id),
        );

        if (invalidListIds.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `List(s) not found: ${invalidListIds.join(", ")}`,
          });
        }

        await ctx.db.targetProfile.createMany({
          data: input.addToListIds.map((listId) => ({
            id: ulid(),
            listId,
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
        },
        orderBy: {
          id: "desc",
        },
        take: 21,
      });

      if (profiles.length === 0) {
        return { data: [], next: undefined };
      }

      // 2. Collect unique linkedinUrls
      const linkedinUrls = [...new Set(profiles.map((p) => p.linkedinUrl))];

      // 3. Batch query all list memberships for these profiles
      const allMemberships = await ctx.db.targetProfile.findMany({
        where: {
          userId: ctx.user.id,
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
        linkedinUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ALL_LIST_NAME = "All";

      // Find or create "All" list
      let allList = await ctx.db.targetList.findFirst({
        where: {
          userId: ctx.user.id,
          name: ALL_LIST_NAME,
        },
      });

      let listCreated = false;
      if (!allList) {
        const id = ulid();
        allList = await ctx.db.targetList.create({
          data: {
            id,
            userId: ctx.user.id,
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
          userId: ctx.user.id,
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
};
