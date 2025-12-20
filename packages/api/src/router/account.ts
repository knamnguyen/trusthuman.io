import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { ulid } from "ulidx";
import z from "zod";

import { countrySchema } from "@sassy/validators";

import { protectedProcedure, publicProcedure } from "../trpc";
import {
  assumedAccountJwt,
  browserRegistry,
  hyperbrowser,
} from "../utils/browser-session";
import { paginate } from "../utils/pagination";
import { registerOrGetBrowserSession } from "./browser";

/**
 * Extract profile slug from LinkedIn URL
 * Handles: linkedin.com/in/john-doe-123, with/without www, with query params
 */
function extractProfileSlug(url: string): string {
  const match = url.match(/linkedin\.com\/in\/([^\/\?]+)/);
  if (!match || !match[1]) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid LinkedIn profile URL. Expected format: linkedin.com/in/username",
    });
  }
  return match[1];
}

export const accountRouter = {
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const account = await ctx.db.linkedInAccount.findFirst({
        where: { id: input.id, userId: ctx.user.id },
      });

      return account;
    }),

  init: {
    create: protectedProcedure
      .input(
        z.object({
          email: z.string(),
          name: z.string().optional(),
          location: countrySchema,
        }),
      )
      .mutation(async function* ({ ctx, input, signal }) {
        const existingAccount = await ctx.db.linkedInAccount.findFirst({
          where: { email: input.email, userId: ctx.user.id },
        });

        let accountId;

        if (existingAccount !== null && existingAccount.status === "ACTIVE") {
          yield {
            status: "signed_in",
          } as const;
          return;
        }

        if (existingAccount !== null) {
          accountId = existingAccount.id;
        } else {
          accountId = ulid();
          const profile = await hyperbrowser.profiles.create({
            name: input.email,
          });

          await ctx.db.linkedInAccount.create({
            data: {
              id: accountId,
              userId: ctx.user.id,
              email: input.email,
              name: input.name,
              browserProfileId: profile.id,
              location: input.location,
              status: "CONNECTING",
            },
          });
        }

        const result = await registerOrGetBrowserSession(
          ctx.db,
          ctx.user.id,
          accountId,
        );

        if (result.status === "error") {
          yield {
            status: "error",
            reason: "Failed to start browser session",
          } as const;
          return;
        }

        const instance = result.instance;

        yield {
          status: "initialized",
          accountId,
          liveUrl: instance.liveUrl,
        } as const;

        const signedIn = await instance.waitForSigninSuccess(
          signal ?? instance.signal,
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
          await instance.destroy();
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
        const account = await ctx.db.linkedInAccount.findFirst({
          where: { id: input.accountId },
          select: {
            userId: true,
          },
        });

        if (account === null || account.userId !== ctx.user.id) {
          return {
            status: "error",
            error: "Not Permitted",
          } as const;
        }

        await browserRegistry.destroy(input.accountId);

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
        where: { userId: ctx.user.id, id: { lt: input?.cursor ?? undefined } },
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
            message: "This LinkedIn account is already registered in your organization",
          });
        } else if (existing.organizationId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This LinkedIn account is registered in another organization",
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
          userId: ctx.user.id,
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
} satisfies TRPCRouterRecord;
