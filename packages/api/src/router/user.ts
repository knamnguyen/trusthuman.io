import { ulid } from "ulidx";
import z from "zod";

import {
  UserCreateInputSchema,
  UserUpdateInputSchema,
} from "@sassy/db/schema-validators";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const userRouter = () =>
  createTRPCRouter({
    /**
     * Warmup endpoint - called on page load and periodically
     * This prevents cold start latency on the first real API call
     */
    warmup: protectedProcedure.query(() => {
      return { status: "warm" as const };
    }),

    /**
     * Get the current user's daily AI comment count
     * Used by extension to display daily limits
     */
    getDailyCommentCount: protectedProcedure.query(
      ({ ctx }) => ctx.user.dailyAIcomments,
    ),

    create: publicProcedure
      .input(UserCreateInputSchema)
      .mutation(async ({ ctx, input }) => {
        return await ctx.db.user.create({
          data: {
            id: input.id,
            firstName: input.firstName,
            lastName: input.lastName,
            primaryEmailAddress: input.primaryEmailAddress,
            imageUrl: input.imageUrl,
            clerkUserProperties: input.clerkUserProperties,
          },
        });
      }),

    /**
     * Update an existing user in the database
     * This is primarily used by the webhook handler
     */
    update: publicProcedure
      .input(
        z.object({
          id: z.string(),
          data: UserUpdateInputSchema,
        }),
      )
      .mutation(async ({ ctx, input }) => {
        return await ctx.db.user.update({
          where: { id: input.id },
          data: input.data,
        });
      }),

    /**
     * Delete a user from the database
     * This is primarily used by the webhook handler
     */
    delete: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return await ctx.db.user.delete({
          where: { id: input.id },
        });
      }),

    /**
     * Get the current authenticated user
     * This is primarily used by client applications
     */
    me: protectedProcedure.query(({ ctx }) => ctx.user),

    //get user object from our db

    meDb: protectedProcedure.query(async ({ ctx }) => {
      return await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
      });
    }),

    /**
     * Get a user by ID
     * This is primarily used by client applications
     */
    // byId: publicProcedure
    //   .input(z.object({ id: z.string() }))
    //   .query(async ({ ctx, input }) => {
    //     try {
    //       return await ctx.db.user.findUnique({
    //         where: { id: input.id },
    //       });
    //     } catch (error) {
    //       console.error("Error fetching user by ID:", error);
    //       throw new TRPCError({
    //         code: "INTERNAL_SERVER_ERROR",
    //         message: "Failed to fetch user by ID",
    //         cause: error,
    //       });
    //     }
    //   }),

    saveDataFromLegacyStorage: protectedProcedure
      .input(
        z.object({
          lists: z.array(z.string()).nullable(),
          profileData: z
            .record(
              z.string(),
              z.object({
                profilePhotoUrl: z.string().optional(),
                profileUrl: z.string(),
                fullName: z.string().optional(),
                headline: z.string().optional(),
                profileUrn: z.string().optional(),
                lists: z.array(z.string()),
              }),
            )
            .nullable(),
          personas: z
            .array(
              z.object({
                name: z.string(),
                prompt: z.string(),
              }),
            )
            .nullable(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (ctx.activeAccount === null) {
          return {
            status: "error",
            reason: "No active account to save data for",
          } as const;
        }

        const activeAccountId = ctx.activeAccount.id;

        return await ctx.db.$transaction(async (tx) => {
          const listIdMapping = new Map<string, string>();

          if (input.lists && input.lists.length > 0) {
            const existingLists = await tx.targetList.findMany({
              where: {
                accountId: activeAccountId,
                name: { in: input.lists },
              },
              select: { name: true, id: true },
            });

            existingLists.forEach((list) => {
              listIdMapping.set(list.name, list.id);
            });

            const listsToCreate = new Set<string>();

            input.lists.forEach((listName) => {
              if (!listIdMapping.has(listName)) {
                listsToCreate.add(listName);
              }
            });

            for (const profile of Object.values(input.profileData ?? {})) {
              for (const listName of profile.lists) {
                if (!listIdMapping.has(listName)) {
                  listsToCreate.add(listName);
                }
              }
            }

            const newlyCreatedLists = await tx.targetList.createManyAndReturn({
              data: Array.from(listsToCreate).map((listName) => ({
                id: ulid(),
                name: listName,
                accountId: activeAccountId,
                status: "COMPLETED",
              })),
            });

            newlyCreatedLists.forEach((list) => {
              listIdMapping.set(list.name, list.id);
            });
          }

          if (input.profileData && Object.keys(input.profileData).length > 0) {
            // map of profileUrl to profileId
            const profiles = new Map<string, string>();
            const existing = await tx.targetProfile.findMany({
              where: {
                accountId: activeAccountId,
                linkedinUrl: {
                  in: Object.values(input.profileData).map((p) => p.profileUrl),
                },
              },
              select: {
                id: true,
                linkedinUrl: true,
              },
            });

            existing.forEach((profile) => {
              profiles.set(profile.linkedinUrl, profile.id);
            });

            const nonExistingProfiles = Object.values(input.profileData).filter(
              (p) => !profiles.has(p.profileUrl),
            );

            const newlyInserted = await tx.targetProfile.createManyAndReturn({
              data: nonExistingProfiles.map((profile) => ({
                id: ulid(),
                accountId: activeAccountId,
                linkedinUrl: profile.profileUrl,
                photoUrl: profile.profilePhotoUrl,
                headline: profile.headline,
                profileUrn: profile.profileUrn,
              })),
              skipDuplicates: true,
            });

            newlyInserted.forEach((profile) => {
              profiles.set(profile.linkedinUrl, profile.id);
            });

            await tx.targetListProfile.createMany({
              data: Object.values(input.profileData).flatMap((profile) =>
                profile.lists.map((listName) => ({
                  id: ulid(),
                  accountId: activeAccountId,
                  // we can null assert here because we know for sure we just created the missing profiles or list id mappings
                  profileId: profiles.get(profile.profileUrl)!,
                  listId: listIdMapping.get(listName)!,
                })),
              ),
            });
          }

          if (input.personas && input.personas.length > 0) {
            await tx.commentStyle.createMany({
              data: input.personas.map((persona) => ({
                id: ulid(),
                accountId: activeAccountId,
                name: persona.name,
                content: persona.prompt,
                description: "",
              })),
            });
          }

          return {
            status: "success",
          } as const;
        });
      }),
  });
