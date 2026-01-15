import type { ClerkClient } from "@clerk/backend";
import { TRPCError } from "@trpc/server";
import { ulid } from "ulidx";
import z from "zod";

import type {
  AccessType,
  User as DbUser,
  Prisma,
  PrismaClient,
  PrismaTransactionalClient,
} from "@sassy/db";
import { countrySchema } from "@sassy/validators";

import {
  createTRPCRouter,
  orgProcedure,
  protectedProcedure,
  publicProcedure,
} from "../trpc";
import {
  assumedAccountJwt,
  BrowserSession,
  hyperbrowser,
} from "../utils/browser-session/browser-session";
import { paginate } from "../utils/pagination";

/**
 * Extract profile slug from LinkedIn URL
 * Handles: linkedin.com/in/john-doe-123, with/without www, with query params
 */
function extractProfileSlug(url: string): string {
  const match = /linkedin\.com\/in\/([^/?]+)/.exec(url);
  if (!match?.[1]) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Invalid LinkedIn profile URL. Expected format: linkedin.com/in/username",
    });
  }
  return match[1];
}

export const accountRouter = () =>
  createTRPCRouter({
    getDefaultAccount: protectedProcedure.query(async ({ ctx }) => {
      const account = await ctx.db.linkedInAccount.findFirst({
        where: hasPermissionToAccessAccountClause(ctx.user.id),
        select: {
          id: true,
          status: true,
          ownerId: true,
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (account === null) {
        return null;
      }

      return {
        account,
        assumedUserToken: await assumedAccountJwt.encode({
          accountId: account.id,
          userId: ctx.user.id,
        }),
      };
    }),

    token: protectedProcedure
      .input(
        z.object({
          id: z.string(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const permitted = await hasPermissionToAccessAccount(ctx.db, {
          actorUserId: ctx.user.id,
          accountId: input.id,
        });

        if (permitted === false) {
          return null;
        }

        return await assumedAccountJwt.encode({
          accountId: input.id,
          userId: ctx.user.id,
        });
      }),

    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        const account = await ctx.db.linkedInAccount.findFirst({
          where: { id: input.id, ownerId: ctx.user.id },
        });

        return account;
      }),

    //we need to modify this to only allow init browser when user has registered linkedin account
    //bro please name it better - these short namings really make it confusing
    //please name it sth like connectAccToHyperBrowser
    //please make it blatantly obvious - it might look messy but much better for reading code

    init: {
      create: protectedProcedure
        .input(
          z.object({
            email: z.string().email(),
            name: z.string().optional(),
            location: countrySchema,
          }),
        )
        .mutation(async function* ({ ctx, input, signal }) {
          const existingAccount = await ctx.db.linkedInAccount.findFirst({
            where: { email: input.email, ownerId: ctx.user.id },
          });

          let accountId;
          let profileId;

          if (existingAccount !== null) {
            const permitted = await hasPermissionToAccessAccount(ctx.db, {
              actorUserId: ctx.user.id,
              accountId: existingAccount.id,
            });

            if (permitted === false) {
              yield {
                status: "error",
                error: "Not permitted",
              } as const;
              return;
            }

            if (existingAccount.status === "CONNECTED") {
              yield {
                status: "signed_in",
              } as const;
              return;
            }
          }

          if (existingAccount !== null) {
            accountId = existingAccount.id;
            profileId = existingAccount.browserProfileId;
          } else {
            accountId = ulid();
            const profile = await hyperbrowser.profiles.create({
              name: input.email,
            });
            profileId = profile.id;

            await ctx.db.linkedInAccount.create({
              data: {
                id: accountId,
                ownerId: ctx.user.id,
                email: input.email,
                name: input.name,
                browserProfileId: profile.id,
                browserLocation: input.location,
                status: "CONNECTING",
              },
            });
          }

          const browserSession = new BrowserSession(
            ctx.db,
            ctx.browserRegistry,
            accountId,
            ctx.user.id,
            {
              location: input.location,
              browserProfileId: profileId,
            },
          );

          await browserSession.ready;

          yield {
            status: "initialized",
            accountId,
            liveUrl: browserSession.liveUrl,
          } as const;

          const signedIn = await browserSession.waitForSigninSuccess(
            signal ?? browserSession.signal,
          );

          if (signedIn) {
            await ctx.db.linkedInAccount.update({
              where: {
                id: accountId,
              },
              data: {
                status: "CONNECTED",
              },
            });
            yield {
              status: "signed_in",
            } as const;
            await browserSession.destroy();
          } else {
            yield {
              status: "failed_to_sign_in",
            } as const;
          }
        }),
      destroy: protectedProcedure
        .input(
          z.object({
            accountId: z.string(),
          }),
        )
        .mutation(async ({ ctx, input }) => {
          const hasAccess = await hasPermissionToAccessAccount(ctx.db, {
            accountId: input.accountId,
            actorUserId: ctx.user.id,
          });

          if (hasAccess === false) {
            return {
              status: "error",
              error: "Not Permitted",
            } as const;
          }

          const registry = ctx.browserRegistry.get(input.accountId);

          if (registry !== undefined) {
            await registry.destroy();
          }

          return {
            status: "success",
          } as const;
        }),

      continue: protectedProcedure
        .input(
          z.object({
            accountId: z.string(),
            location: countrySchema,
          }),
        )
        .mutation(async ({ ctx, input }) => {
          const account = await ctx.db.linkedInAccount.findFirst({
            where: {
              AND: [
                { id: input.accountId },
                hasPermissionToAccessAccountClause(input.accountId),
              ],
            },
            select: {
              id: true,
              browserLocation: true,
              browserProfileId: true,
            },
          });

          if (account === null) {
            return {
              status: "error",
              error: "Account not found",
            } as const;
          }

          await ctx.db.linkedInAccount.update({
            where: { id: input.accountId },
            data: {
              browserLocation: input.location,
            },
          });

          const browserSession = new BrowserSession(
            ctx.db,
            ctx.browserRegistry,
            input.accountId,
            ctx.user.id,
            {
              location: input.location,
              browserProfileId: account.browserProfileId,
            },
          );

          await browserSession.ready;

          return {
            status: "success",
            liveUrl: browserSession.liveUrl,
          } as const;
        }),
    },

    list: protectedProcedure
      .input(
        z
          .object({
            cursor: z.string().nullish(),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        const accounts = await ctx.db.linkedInAccount.findMany({
          where: {
            ownerId: ctx.user.id,
            id: { lt: input?.cursor ?? undefined },
          },
          take: 21,
          orderBy: { id: "desc" },
        });

        return paginate(accounts, {
          key: "id",
          size: 20,
        });
      }),

    verifyJwt: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const decoded = await assumedAccountJwt.decode(input.token);
        if (decoded.success) {
          return {
            status: "success",
          } as const;
        }

        return {
          status: "error",
          error: decoded.error,
        } as const;
      }),

    // ============================================================================
    // Organization-based LinkedIn Account Management (New Multi-Tenant Flow)
    // ============================================================================

    /**
     * Register a LinkedIn account by URL
     * Links the account to the user's current organization
     */
    registerByUrl: orgProcedure
      .input(
        z.object({
          profileUrl: z.string().url(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const profileSlug = extractProfileSlug(input.profileUrl);

        // 4. Check slot limit
        const org = await ctx.db.organization.findUnique({
          where: { id: ctx.activeOrg.id },
          select: { purchasedSlots: true },
        });

        const currentAccountCount = await ctx.db.linkedInAccount.count({
          where: { organizationId: ctx.activeOrg.id },
        });

        console.log("current account count is: ", currentAccountCount);

        if (org && currentAccountCount >= org.purchasedSlots) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Organization has reached its limit of ${org.purchasedSlots} LinkedIn account(s). Upgrade to add more.`,
          });
        }

        // 3. Check if already registered (globally unique)
        const existing = await ctx.db.linkedInAccount.findUnique({
          where: { profileSlug },
        });

        if (existing) {
          // Case 1: Already in the same org
          if (existing.organizationId === ctx.activeOrg.id) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "This LinkedIn account is already registered in your organization",
            });
          }

          // Case 2: Owned by another org (orgId is not null and different)
          if (existing.organizationId !== null) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "This LinkedIn account is registered in another organization",
            });
          }

          // Case 3: Previously removed from an org (orgId and ownerId are both null)
          // Reclaim the account for the current user and org
          if (existing.ownerId === null) {
            const reclaimed = await ctx.db.linkedInAccount.update({
              where: { id: existing.id },
              data: {
                organizationId: ctx.activeOrg.id,
                ownerId: ctx.user.id,
                status: "REGISTERED",
              },
            });

            return {
              id: reclaimed.id,
              profileSlug: reclaimed.profileSlug,
              profileUrl: reclaimed.profileUrl,
              registrationStatus: reclaimed.registrationStatus,
            };
          }

          // Edge case: orgId is null but ownerId is not null (shouldn't happen with proper removeFromOrg)
          throw new TRPCError({
            code: "CONFLICT",
            message: "This LinkedIn account is in an invalid state",
          });
        }

        // Case 4: Completely new account - create it
        const accountId = ulid();
        const account = await ctx.db.linkedInAccount.create({
          data: {
            id: accountId,
            organizationId: ctx.activeOrg.id,
            profileUrl: input.profileUrl,
            profileSlug,
            registrationStatus: "registered",
            // Legacy required fields - fill with placeholders
            ownerId: ctx.user.id,
            email: `${profileSlug}@placeholder.linkedin`,
            status: "REGISTERED",
            browserProfileId: "pending",
            browserLocation: "unknown",
          },
        });

        return {
          id: account.id,
          profileSlug: account.profileSlug,
          profileUrl: account.profileUrl,
          registrationStatus: account.registrationStatus,
        };
      }),

    /**
     * List LinkedIn accounts for the user's active organization
     * Uses ctx.activeOrg from middleware (no input needed)
     */
    listByOrg: orgProcedure.query(async ({ ctx }) => {
      const accounts = await ctx.db.linkedInAccount.findMany({
        where: { organizationId: ctx.activeOrg.id },
        select: {
          id: true,
          profileUrl: true,
          profileSlug: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return accounts;
    }),

    /**
     * Get a LinkedIn account by its profile slug
     * Used by AccountLayout to validate account and sync Zustand store
     * Returns null if account doesn't exist or doesn't belong to the active org
     */
    getBySlug: orgProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ ctx, input }) => {
        const account = await ctx.db.linkedInAccount.findFirst({
          where: {
            profileSlug: input.slug,
            organizationId: ctx.activeOrg.id,
          },
          select: {
            id: true,
            profileSlug: true,
            profileUrl: true,
            name: true,
            email: true,
            status: true,
          },
        });

        return account;
      }),

    /**
     * Remove a LinkedIn account from an organization
     * Uses ctx.activeOrg from middleware for security
     */
    removeFromOrg: orgProcedure
      .input(
        z.object({
          accountId: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        // Verify account belongs to user's active org
        const account = await ctx.db.linkedInAccount.findFirst({
          where: {
            id: input.accountId,
            organizationId: ctx.activeOrg.id,
          },
        });

        if (!account) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Account not found in this organization",
          });
        }

        // Remove from org (don't delete, just unlink)
        await ctx.db.linkedInAccount.update({
          where: { id: input.accountId },
          data: {
            organizationId: null,
            ownerId: null,
            status: null,
          },
        });

        return { success: true };
      }),
  });

export async function hasPermissionToAccessAccount(
  db: PrismaClient,
  { actorUserId, accountId }: { actorUserId: string; accountId: string },
) {
  const exists = await db.linkedInAccount.count({
    where: {
      AND: [
        {
          id: accountId,
        },
        hasPermissionToAccessAccountClause(actorUserId),
      ],
    },
  });

  return exists > 0;
}

export function hasPermissionToAccessAccountClause(readerUserId: string) {
  return {
    OR: [
      {
        ownerId: readerUserId,
      },
      {
        organizationMemberships: {
          some: {
            userId: readerUserId,
          },
        },
      },
    ],
  };
}

//looks like only used in middleware now not in individual endpoints
export async function getUserAccount(
  db: PrismaClient | PrismaTransactionalClient,
  userId: string,
  activeAccountId: string | null,
  activeOrgId: string | null,
) {
  const row = await db.$queryRaw<
    {
      user: DbUser;
      activeAccount: {
        id: string;
        email: string;
        name: string | null;
        profileUrl: string | null;
        accessType: AccessType;
        permitted: boolean;
      } | null;
      memberships: string[];
    }[]
  >`
    select
      to_jsonb(u) as "user",
      coalesce(
        (
          select jsonb_build_object(
            'id', lia.id,
            'email', lia.email,
            'name', lia.name,
            'profileUrl', lia."profileUrl",
            'accessType', lia."accessType",
            'permitted', (
              -- Account must belong to user's active organization
              lia."organizationId" = ${activeOrgId}
            )
          )
          from "LinkedInAccount" lia
          where ${activeAccountId}::text is not null
            and lia.id = ${activeAccountId}
        ), null) as "activeAccount",
      coalesce(
        (
          select jsonb_agg(om."orgId")
          from "OrganizationMember" om
          where om."userId" = u.id
        ),
        '[]'::jsonb
      ) as "memberships"
    from "User" u
    where u.id = ${userId}
    limit 1
  `;

  return row[0] ?? null;
}

//looks like only used in middleware right now
export async function getOrInsertUser(
  db: PrismaClient,
  clerkClient: ClerkClient,
  {
    userId,
    activeAccountId,
    activeOrgId,
  }: {
    userId: string;
    activeAccountId: string | null;
    activeOrgId: string | null;
  },
) {
  const user = await getUserAccount(db, userId, activeAccountId, activeOrgId);

  if (user?.activeAccount?.permitted === false) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access to this account is forbidden",
    });
  }

  if (user !== null) {
    return user;
  }

  //if users do not exist in db check

  const clerkUser = await clerkClient.users.getUser(userId);

  const primaryEmailAddress = clerkUser.primaryEmailAddress?.emailAddress;

  if (primaryEmailAddress === undefined) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "User must have a primary email address",
    });
  }

  const newAccount = await db.$transaction(async (tx) => {
    await db.user.upsert({
      where: { id: clerkUser.id },
      update: {
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        username: clerkUser.username,
        primaryEmailAddress,
        imageUrl: clerkUser.imageUrl,
        clerkUserProperties: clerkUser as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
      create: {
        id: clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        username: clerkUser.username,
        primaryEmailAddress,
        imageUrl: clerkUser.imageUrl,
      },
    });

    return getUserAccount(tx, clerkUser.id, activeAccountId, activeOrgId);
  });

  if (newAccount === null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create or retrieve user account",
    });
  }

  return newAccount;
}
