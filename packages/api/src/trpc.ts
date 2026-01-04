/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */

import { createClerkClient, verifyToken } from "@clerk/backend";
import { auth } from "@clerk/nextjs/server";
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
 * This middleware handles authentication for both Next.js and Chrome extension requests
 * - Next.js requests: Uses currentUser() from @clerk/nextjs/server
 * - Chrome extension requests: Uses Backend SDK to verify Authorization header
 */
const isAuthed = t.middleware(async ({ ctx, next }) => {
  // assumedUserToken is for assumed accounts from browserbase
  const assumedUserToken = ctx.headers.get("x-assumed-user-token");

  // check for assumedUserToken
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

  const accountId = ctx.headers.get("x-linkedin-account-id") ?? null;

  const source = ctx.headers.get("x-trpc-source");

  if (source === "chrome-extension") {
    // Handle Chrome extension authentication using Backend SDK
    const authHeader = ctx.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Missing or invalid authorization header",
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    console.log(
      "Chrome extension token received - length:",
      token.length,
      "dots:",
      token.split(".").length,
    );

    const userId = await getUserIdFromClerkToken(token);

    const clerkUser = await clerkClient.users.getUser(userId);

    const result = await getOrInsertUser(ctx.db, {
      userId,
      currentAccountId: accountId,
      clerkUser,
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
  }

  const auth = await clerkClient.authenticateRequest(ctx.req);
  console.info(ctx.req.headers);
  const state = auth.toAuth();

  if (state === null || state.isAuthenticated === false) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  const clerkUser = await clerkClient.users.getUser(state.userId);

  const result = await getOrInsertUser(ctx.db, {
    userId: state.userId,
    currentAccountId: accountId,
    clerkUser,
  });

  if (result.account !== null && result.account.permitted === false) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Access to this account is forbidden",
    });
  }

  return next({
    ctx: {
      ...ctx, // Keep existing context with db and headers
      user: result.user, // Add the user to the context
      account: result.account,
      memberships: result.memberships,
    },
  });
});

async function getUserIdFromClerkToken(token: string) {
  if (token.split(".").length === 3) {
    // This is a JWT - use verifyToken
    console.log("Attempting JWT verification...");
    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    return verifiedToken.sub;
  }

  // This is likely a session ID - use Clerk client directly
  console.log("Attempting session ID verification...");

  try {
    // Try to get session information using the token as a session ID
    const session = await clerkClient.sessions.getSession(token);

    return session.userId;
  } catch (sessionError) {
    console.error("Session verification failed:", sessionError);

    // If session lookup fails, try to verify as a JWT anyway (fallback)
    console.log("Falling back to JWT verification...");
    const verifiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    return verifiedToken.sub;
  }
}

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
