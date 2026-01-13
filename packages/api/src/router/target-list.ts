import { DBOS } from "@dbos-inc/dbos-sdk";
import { ulid } from "ulidx";
import { z } from "zod";

import { getBuildTargetListLimits } from "../../../feature-flags/src/constants";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { LinkedInIndustrySearch } from "../utils/industry-search";
import { paginate } from "../utils/pagination";
import { buildTargetListWorkflow } from "../workflows";

const linkedInIndustrySearch = new LinkedInIndustrySearch();

export const targetListRouter = () =>
  createTRPCRouter({
    industries: {
      list: protectedProcedure
        .input(
          z.object({
            cursor: z.number().optional(),
            limit: z.number().optional(),
          }),
        )
        .query(({ input }) => {
          return linkedInIndustrySearch.list({
            offset: input.cursor,
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
        if (ctx.activeAccount === null) {
          return {
            status: "error",
            code: 400,
            message: "You must link a LinkedIn account to build a target list",
          } as const;
        }

        const maxJobs = getBuildTargetListLimits(ctx.activeAccount.accessType);

        const existingJobsCount = await ctx.db.buildTargetListJob.count({
          where: {
            accountId: ctx.activeAccount.id,
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
            accountId: ctx.activeAccount.id,
            listId: targetListId,
            status: "QUEUED",
          },
        });

        const workflow = await DBOS.startWorkflow(buildTargetListWorkflow, {
          workflowID: targetListId,
        })({
          targetListId,
          accountId: ctx.activeAccount.id,
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
        if (ctx.activeAccount === null) {
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
            accountId: ctx.activeAccount.id,
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
        if (ctx.activeAccount === null) {
          return {
            data: [],
            next: null,
          };
        }
        const lists = await ctx.db.targetList.findMany({
          where: {
            AND: [
              { accountId: ctx.activeAccount.id },
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
        if (ctx.activeAccount === null) {
          return null;
        }

        const list = await ctx.db.targetList.findFirst({
          where: {
            id: input.id,
            accountId: ctx.activeAccount.id,
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
        if (ctx.activeAccount === null) {
          return {
            data: [],
            next: null,
          };
        }
        const clauses = [];
        clauses.push({
          listId: input.listId,
          accountId: ctx.activeAccount.id,
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
        if (ctx.activeAccount === null) {
          return {
            status: "error",
            code: 400,
            message:
              "You must link a LinkedIn account to add profiles to a target list",
          } as const;
        }

        const activeAccountId = ctx.activeAccount.id;

        return await ctx.db.$transaction(async (tx) => {
          // Try to find existing LinkedInProfile by URL to link immediately
          const [existingProfile, existingTargetProfile] = await Promise.all([
            tx.linkedInProfile.findFirst({
              where: { linkedinUrl: input.linkedinUrl },
              select: { urn: true },
            }),
            tx.targetProfile.findFirst({
              where: {
                linkedinUrl: input.linkedinUrl,
                accountId: activeAccountId,
              },
            }),
          ]);

          let targetProfileId: string | null = null;

          if (existingTargetProfile === null) {
            const profileId = ulid();

            await ctx.db.targetProfile.create({
              data: {
                id: profileId,
                linkedinUrl: input.linkedinUrl,
                profileUrn: existingProfile?.urn,
                accountId: activeAccountId,
              },
            });

            targetProfileId = profileId;
          } else {
            targetProfileId = existingTargetProfile.id;
          }

          const targetListProfileId = ulid();

          const result = await tx.targetListProfile.createMany({
            data: {
              id: targetListProfileId,
              profileId: targetProfileId,
              listId: input.listId,
              accountId: activeAccountId,
            },
            skipDuplicates: true,
          });

          return {
            status: "success",
            created: result.count > 0,
            linked: existingProfile !== null,
          } as const;
        });
      }),
    removeProfileFromList: protectedProcedure
      .input(
        z.object({
          id: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.activeAccount === null) {
          return {
            status: "error",
            code: 403,
            message: "You do not have access to this resource",
          } as const;
        }

        const activeAccountId = ctx.activeAccount.id;

        return await ctx.db.$transaction(async (tx) => {
          const targetListProfile = await tx.targetListProfile.findFirst({
            where: {
              id: input.id,
            },
          });

          if (targetListProfile === null) {
            return {
              status: "error",
              code: 404,
              message: "Target list profile not found",
            } as const;
          }

          await tx.targetListProfile.deleteMany({
            where: {
              id: input.id,
            },
          });

          const targetProfileAttachedToOtherLists =
            await tx.targetProfile.findFirst({
              where: {
                id: targetListProfile.profileId,
                accountId: activeAccountId,
                // we use this clause to check if the profile is still attached to other lists
                targetListProfiles: {
                  some: { id: { not: input.id } },
                },
              },
            });

          if (targetProfileAttachedToOtherLists === null) {
            // Delete target profile if not attached to any other lists
            await tx.targetProfile.deleteMany({
              where: {
                id: targetListProfile.profileId,
                accountId: activeAccountId,
              },
            });
          }

          return {
            status: "success",
          } as const;
        });
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
        if (ctx.activeAccount === null) {
          return {
            data: [],
            next: null,
          };
        }
        // Get all user's lists
        const [lists, profileLists] = await Promise.all([
          ctx.db.targetList.findMany({
            where: { accountId: ctx.activeAccount.id },
            orderBy: { createdAt: "desc" },
          }),
          ctx.db.targetProfile.findFirst({
            where: {
              accountId: ctx.activeAccount.id,
              linkedinUrl: input.linkedinUrl,
            },
            select: {
              targetListProfiles: {
                select: {
                  listId: true,
                },
              },
            },
          }),
        ]);

        // Get list IDs that contain this profile

        return {
          lists,
          listIdsWithProfile:
            profileLists?.targetListProfiles.map((l) => l.listId) ?? [],
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
        if (ctx.activeAccount === null) {
          return {
            status: "error",
            code: 400,
            message:
              "You must link a LinkedIn account to update profile's target lists",
          } as const;
        }

        const activeAccountId = ctx.activeAccount.id;

        return await ctx.db.$transaction(async (tx) => {
          // Try to find existing LinkedInProfile by URL to link immediately
          const existingProfile = await tx.targetProfile.findFirst({
            where: { linkedinUrl: input.linkedinUrl },
            select: {
              id: true,
              profileUrn: true,
            },
          });

          let targetProfileId = existingProfile?.id;
          if (targetProfileId === undefined) {
            targetProfileId = ulid();
            await tx.targetProfile.create({
              data: {
                id: targetProfileId,
                linkedinUrl: input.linkedinUrl,
                accountId: activeAccountId,
              },
            });
          }

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

          // TODO: setup access control that's tied to user instead of relying on exists check with accountId: ctx.activeAccount.id
          // validate add to and remove from lists exists and belong to user
          const validLists = await tx.targetList.findMany({
            where: {
              id: { in: listIdsToValidate },
              accountId: activeAccountId,
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
            await tx.targetListProfile.deleteMany({
              where: {
                accountId: activeAccountId,
                profile: {
                  linkedinUrl: input.linkedinUrl,
                },
                listId: { in: input.removeFromListIds },
              },
            });
          }

          // Add to lists - first validate all list IDs exist and belong to user
          if (input.addToListIds.length > 0) {
            await tx.targetListProfile.createMany({
              data: input.addToListIds.map((listId) => ({
                id: ulid(),
                accountId: ctx.activeAccount!.id,
                listId,
                profileId: targetProfileId,
              })),
              skipDuplicates: true,
            });
          }

          return {
            status: "success",
            added: input.addToListIds.length,
            removed: input.removeFromListIds.length,
          } as const;
        });
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
        if (ctx.activeAccount === null) {
          return {
            data: [],
            next: null,
          };
        }

        const profiles = await ctx.db.targetProfile.findMany({
          where: {
            targetListProfiles: {
              some: {
                listId: input.listId,
              },
            },
            accountId: ctx.activeAccount.id,
            id: input.cursor ? { lt: input.cursor } : undefined,
          },
          include: {
            profile: true,
            targetListProfiles: {
              select: {
                list: {
                  select: {
                    name: true,
                    id: true,
                  },
                },
              },
            },
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

        if (ctx.activeAccount === null) {
          return {
            status: "error",
            code: 400,
            message:
              "You must link a LinkedIn account to add profiles to a target list",
          } as const;
        }

        const activeAccountId = ctx.activeAccount.id;

        return await ctx.db.$transaction(async (tx) => {
          // Find or create "All" list
          let allList = await tx.targetList.findFirst({
            where: {
              accountId: activeAccountId,
              name: ALL_LIST_NAME,
            },
          });

          let listCreated = false;
          if (!allList) {
            const id = ulid();
            allList = await tx.targetList.create({
              data: {
                id,
                accountId: activeAccountId,
                status: "COMPLETED",
                name: ALL_LIST_NAME,
              },
            });
            listCreated = true;
          }

          // Try to find existing LinkedInProfile by URL to link immediately
          const existingProfile = await tx.targetProfile.findFirst({
            where: { linkedinUrl: input.linkedinUrl },
            select: {
              id: true,
              profile: {
                select: {
                  urn: true,
                },
              },
            },
          });

          let targetProfileId = existingProfile?.id;

          if (targetProfileId === undefined) {
            targetProfileId = ulid();

            // Add profile to "All" list (skipDuplicates handles idempotency)
            await tx.targetProfile.createMany({
              data: {
                id: targetProfileId,
                linkedinUrl: input.linkedinUrl,
                profileUrn: existingProfile?.profile?.urn,
                accountId: activeAccountId,
              },
              skipDuplicates: true,
            });
          }

          const result = await tx.targetListProfile.createMany({
            data: {
              id: ulid(),
              profileId: targetProfileId,
              listId: allList.id,
              accountId: activeAccountId,
            },
            skipDuplicates: true,
          });

          return {
            status: "success",
            list: allList,
            listCreated,
            profileAdded: result.count > 0,
          } as const;
        });
      }),
  });

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
