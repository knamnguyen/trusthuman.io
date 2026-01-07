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
  promise.finally(() => {
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
  // assumedUserToken is for assumed accounts from browserbase
  const assumedUserToken = ctx.headers.get("x-assumed-user-token");

  // check for assumedUserToken (for hyper browser mode)
  if (assumedUserToken !== null) {
    const decoded = await assumedAccountJwt.decode(assumedUserToken);
    if (!decoded.success) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid assumed user token",
      });
    }

    const result = await getUserAccount(
      ctx.db,
      decoded.payload.userId,
      decoded.payload.accountId,
    );

    if (result === null) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid assumed user token - user not found",
      });
    }

    if (result.account !== null && result.account.permitted === false) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access to this account is forbidden",
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: result.user,
        account: result.account,
        memberships: result.memberships,
      },
    });
  }

  // Get account id and source for logging
  const accountId = ctx.headers.get("x-account-id") ?? null;
  const source = ctx.headers.get("x-trpc-source") ?? "nextjs";

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

  // Use cached auth to avoid redundant DB queries for parallel requests
  // Cache key: sessionId + orgId + accountId (covers all variations)
  const cacheKey = `${state.sessionId}:${state.orgId ?? "none"}:${accountId ?? "none"}`;
  const dbCacheHit = authCache.has(cacheKey);
  const result = await getCachedAuth(cacheKey, () =>
    getOrInsertUser(ctx.db, clerkClient, {
      userId: state.userId,
      currentAccountId: accountId,
    }),
  );

  // Log auth state for checking
  console.log(`>>> Auth Middleware [${source}]`);
  console.log("  [Auth State]:", {
    userId: state.userId,
    sessionId: state.sessionId,
    orgId: state.orgId ?? null,
    orgRole: state.orgRole ?? null,
    orgSlug: state.orgSlug ?? null,
  });
  console.log(`  [${dbCacheHit ? "CACHED" : "FRESH DB QUERY"}] DB Data:`, {
    requestedAccountId: accountId,
    user: {
      id: result.user.id,
      firstName: result.user.firstName,
      email: result.user.primaryEmailAddress,
      accessType: result.user.accessType,
      dailyAIcomments: result.user.dailyAIcomments,
    },
    account: result.account
      ? {
          id: result.account.id,
          email: result.account.email,
          name: result.account.name,
          accessType: result.account.accessType,
          permitted: result.account.permitted,
        }
      : null,
    memberships: result.memberships,
  });

  if (result.account !== null && result.account.permitted === false) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access to this account is forbidden",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: result.user,
      account: result.account,
      memberships: result.memberships,
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
