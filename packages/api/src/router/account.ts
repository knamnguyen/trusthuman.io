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

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  assumedAccountJwt,
  BrowserSession,
  hyperbrowser,
} from "../utils/browser-session";
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
          name: true,
          email: true,
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
          readerUserId: ctx.user.id,
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
              readerUserId: ctx.user.id,
              accountId: existingAccount.id,
            });

            if (permitted === false) {
              yield {
                status: "error",
                error: "Not permitted",
              } as const;
              return;
            }

            if (existingAccount.status === "ACTIVE") {
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
                location: input.location,
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
                status: "ACTIVE",
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
            readerUserId: ctx.user.id,
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
    registerByUrl: protectedProcedure
      .input(
        z.object({
          profileUrl: z.string().url(),
          organizationId: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        // 1. Validate user is member of the organization
        const membership = await ctx.db.organizationMember.findUnique({
          where: {
            orgId_userId: {
              orgId: input.organizationId,
              userId: ctx.user.id,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not a member of this organization",
          });
        }

        // 2. Extract profileSlug from URL
        const profileSlug = extractProfileSlug(input.profileUrl);

        // 3. Check if already registered (globally unique)
        const existing = await ctx.db.linkedInAccount.findUnique({
          where: { profileSlug },
        });

        if (existing) {
          // Already registered - check if it's in this org or another
          if (existing.organizationId === input.organizationId) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "This LinkedIn account is already registered in your organization",
            });
          } else if (existing.organizationId) {
            throw new TRPCError({
              code: "CONFLICT",
              message:
                "This LinkedIn account is registered in another organization",
            });
          }
          // If organizationId is null, we could claim it - but for simplicity, block
          throw new TRPCError({
            code: "CONFLICT",
            message: "This LinkedIn account already exists in the system",
          });
        }

        // 4. Check slot limit
        const org = await ctx.db.organization.findUnique({
          where: { id: input.organizationId },
          select: { purchasedSlots: true },
        });

        const currentAccountCount = await ctx.db.linkedInAccount.count({
          where: { organizationId: input.organizationId },
        });

        if (org && currentAccountCount >= org.purchasedSlots) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Organization has reached its limit of ${org.purchasedSlots} LinkedIn account(s). Upgrade to add more.`,
          });
        }

        // 5. Create the account
        const accountId = ulid();
        const account = await ctx.db.linkedInAccount.create({
          data: {
            id: accountId,
            organizationId: input.organizationId,
            profileUrl: input.profileUrl,
            profileSlug,
            registrationStatus: "registered",
            // Legacy required fields - fill with placeholders
            ownerId: ctx.user.id,
            email: `${profileSlug}@placeholder.linkedin`,
            status: "CONNECTING",
            browserProfileId: "pending",
            location: "unknown",
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
     * List LinkedIn accounts for an organization
     */
    listByOrg: protectedProcedure
      .input(z.object({ organizationId: z.string() }))
      .query(async ({ ctx, input }) => {
        // Validate membership
        const membership = await ctx.db.organizationMember.findUnique({
          where: {
            orgId_userId: {
              orgId: input.organizationId,
              userId: ctx.user.id,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not a member of this organization",
          });
        }

        const accounts = await ctx.db.linkedInAccount.findMany({
          where: { organizationId: input.organizationId },
          select: {
            id: true,
            profileUrl: true,
            profileSlug: true,
            registrationStatus: true,
            name: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });

        return accounts;
      }),

    /**
     * Remove a LinkedIn account from an organization
     */
    removeFromOrg: protectedProcedure
      .input(
        z.object({
          accountId: z.string(),
          organizationId: z.string(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        // Validate membership
        const membership = await ctx.db.organizationMember.findUnique({
          where: {
            orgId_userId: {
              orgId: input.organizationId,
              userId: ctx.user.id,
            },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not a member of this organization",
          });
        }

        // Verify account belongs to org
        const account = await ctx.db.linkedInAccount.findFirst({
          where: {
            id: input.accountId,
            organizationId: input.organizationId,
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
            registrationStatus: null,
          },
        });

        return { success: true };
      }),
  });

export async function hasPermissionToAccessAccount(
  db: PrismaClient,
  { readerUserId, accountId }: { readerUserId: string; accountId: string },
) {
  const exists = await db.linkedInAccount.count({
    where: {
      AND: [
        {
          id: accountId,
        },
        hasPermissionToAccessAccountClause(readerUserId),
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

export async function getUserAccount(
  db: PrismaClient | PrismaTransactionalClient,
  userId: string,
  accountId: string | null,
) {
  const row = await db.$queryRaw<
    {
      user: DbUser;
      account: {
        id: string;
        email: string;
        profileUrl: string;
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
              lia."ownerId" = u.id
              or exists (
                select 1
                from "OrganizationMember" om
                where om."userId" = u.id
                  and om."orgId" = lia."organizationId"
              )
            )
          )
          from "LinkedInAccount" lia
          where ${accountId}::text is not null
            and lia.id = ${accountId}
        ), null) as "account",
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

export async function getOrInsertAccount(
  db: PrismaClient,
  clerkClient: ClerkClient,
  {
    userId,
    currentAccountId,
  }: { userId: string; currentAccountId: string | null },
) {
  const user = await getUserAccount(db, userId, currentAccountId);

  if (user?.account?.permitted === false) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access to this account is forbidden",
    });
  }

  if (user !== null) {
    return user;
  }

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

    return getUserAccount(tx, clerkUser.id, currentAccountId);
  });

  if (newAccount === null) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create or retrieve user account",
    });
  }

  return newAccount;
}
