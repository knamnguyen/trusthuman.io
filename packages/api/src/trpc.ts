/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */

import { createClerkClient } from "@clerk/backend";
import { Hyperbrowser } from "@hyperbrowser/sdk";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import type { Prisma, PrismaClient } from "@sassy/db";
import { db } from "@sassy/db";

import type { BrowserSessionRegistry } from "./utils/browser-session";
import { getOrInsertUser, getUserAccount } from "./router/account";
import { AIService } from "./utils/ai-service/ai-service";
import { browserJobs } from "./utils/browser-job";
import { assumedAccountJwt, browserRegistry } from "./utils/browser-session";
import { env } from "./utils/env";

/**
 * Auth Cache - prevents redundant auth checks for parallel requests
 *
 * When 6 parallel requests arrive with the same token:
 * - Request 1: cache miss → creates Promise, stores it, does auth work
 * - Requests 2-6: cache hit → await the same Promise
 * - Result: 1 auth check instead of 6
 *
 * TTL: 60 seconds - short enough to be safe, long enough for parallel requests
 */
type AuthResult = Awaited<ReturnType<typeof getOrInsertUser>>;
const authCache = new Map<string, Promise<AuthResult>>();
const AUTH_CACHE_TTL_MS = 60_000;

function getCachedAuth(
  cacheKey: string,
  authFn: () => Promise<AuthResult>,
): Promise<AuthResult> {
  // Check if we already have a pending or resolved promise
  const existing = authCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  // Create the promise and cache it IMMEDIATELY (before awaiting)
  // This ensures parallel requests find the promise and wait for it
  const promise = authFn();
  authCache.set(cacheKey, promise);

  // Clean up after TTL (whether success or failure)
  void promise.finally(() => {
    setTimeout(() => {
      // Only delete if it's still the same promise (not replaced)
      if (authCache.get(cacheKey) === promise) {
        authCache.delete(cacheKey);
      }
    }, AUTH_CACHE_TTL_MS);
  });

  return promise;
}

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */

export type DbUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    accessType: true;
    dailyAIcomments: true;
    firstName: true;
    primaryEmailAddress: true;
  };
}>;
export interface TRPCContext {
  db: PrismaClient;
  user?: DbUser;
  headers: Headers;
  req: Request;
  hyperbrowser: Hyperbrowser;
  browserJobs: typeof browserJobs;
  browserRegistry: BrowserSessionRegistry;
  ai: AIService;
}

const hb = new Hyperbrowser({
  apiKey: env.HYPERBROWSER_API_KEY,
});

const ai = new AIService(env.GOOGLE_GENAI_API_KEY);

export const createTRPCContext = (opts: {
  headers: Headers;
  req: Request;
}): TRPCContext => {
  const source = opts.headers.get("x-trpc-source");
  console.log(">>> tRPC Request from", source ?? "nextjs");

  return {
    db,
    req: opts.req,
    headers: opts.headers,
    hyperbrowser: hb,
    browserJobs,
    browserRegistry,
    ai,
    // Note: User will be added by the auth middleware when needed
  };
};

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  }),
});

// Create Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
});

/**
 * Clerk authentication middleware
 * Unified auth for both Next.js and Chrome extension requests using authenticateRequest()
 * Returns full Auth object with orgId from active organization
 * Uses auth cache (60s TTL) to deduplicate parallel DB queries
 */
const isAuthed = t.middleware(async ({ ctx, next }) => {
  // Get account id and source for logging
  const activeAccountId = ctx.headers.get("x-account-id") ?? null;

  // Unified auth: authenticateRequest works for both NextJS and Chrome extension
  // Returns full Auth object with orgId from active organization
  const auth = await clerkClient.authenticateRequest(ctx.req);
  const state = auth.toAuth();

  if (!state?.isAuthenticated) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  // Construct activeOrg from Clerk state (no DB query needed)
  const activeOrg = state.orgId
    ? {
        id: state.orgId,
        slug: state.orgSlug ?? null,
        role: state.orgRole ?? null,
      }
    : null;

  // Use cached auth to avoid redundant DB queries for parallel requests
  // Cache key: sessionId + orgId + accountId (covers all variations)
  const cacheKey = `${state.sessionId}:${activeOrg?.id ?? "none"}:${activeAccountId ?? "none"}`;
  const result = await getCachedAuth(cacheKey, () =>
    getOrInsertUser(ctx.db, clerkClient, {
      userId: state.userId,
      activeAccountId,
      activeOrgId: activeOrg?.id ?? null,
    }),
  );

  // Only check permission if an account is selected
  if (result.activeAccount?.permitted === false) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access to this account is forbidden",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: result.user,
      activeAccount: result.activeAccount,
      memberships: result.memberships,
      activeOrg,
    },
  });
});

/**
 * Create a server-side caller
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(isAuthed);

/**
 * Organization procedure (Layer 2)
 *
 * Requires user to have an active organization selected in Clerk.
 * Use for org-level pages like /[orgSlug]/accounts where no account is required.
 *
 * @example organizationRouter: getCurrent: orgProcedure.query(...)
 */
export const orgProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.activeOrg) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No active organization selected",
    });
  }

  // Use type assertion to narrow the type after runtime check
  const activeOrg = ctx.activeOrg as {
    id: string;
    slug: string | null;
    role: string | null;
  };

  console.log("Active org: ", activeOrg.slug);
  console.log("Users membership: ", ctx.memberships);
  const isMemberOrg = ctx.memberships.includes(activeOrg.id);
  console.log("User is member of org: ", isMemberOrg);

  return next({
    ctx: {
      ...ctx,
      activeOrg,
    },
  });
});

/**
 * Account procedure (Layer 3)
 *
 * Requires both active organization AND active account.
 * Use for account-level pages like /[orgSlug]/[accountSlug]/... where account context is required.
 *
 * The x-account-id header is only sent when user is on account-level pages
 * (via Zustand store populated by AccountLayout's useEffect).
 *
 * @example accountRouter: update: accountProcedure.mutation(...)
 */
export const accountProcedure = orgProcedure.use(({ ctx, next }) => {
  if (!ctx.activeAccount) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No active account selected",
    });
  }

  console.log("Active account is: ", ctx.activeAccount.profileUrl);
  // Use type assertion to narrow the type after runtime check
  const activeAccount = ctx.activeAccount as NonNullable<
    typeof ctx.activeAccount
  >;
  return next({
    ctx: {
      ...ctx,
      activeAccount,
    },
  });
});
