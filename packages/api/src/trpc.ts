/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */

import type { User } from "@clerk/nextjs/server";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { auth } from "@clerk/nextjs/server";
import { Hyperbrowser } from "@hyperbrowser/sdk";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import type { Prisma, PrismaClient } from "@sassy/db";
import { db } from "@sassy/db";

import { BrowserJobWorker } from "./utils/browser-job";
import { assumedAccountJwt } from "./utils/browser-session";
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
  hyperbrowser: Hyperbrowser;
  browserJobs: BrowserJobWorker;
}

const hb = new Hyperbrowser({
  apiKey: env.HYPERBROWSER_API_KEY,
});

const browserJobs = new BrowserJobWorker(hb, db);

export const createTRPCContext = (opts: { headers: Headers }): TRPCContext => {
  const source = opts.headers.get("x-trpc-source");
  console.log(">>> tRPC Request from", source ?? "nextjs");

  return {
    db,
    headers: opts.headers,
    hyperbrowser: hb,
    browserJobs,
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
});

/**
 * Clerk authentication middleware
 * This middleware handles authentication for both Next.js and Chrome extension requests
 * - Next.js requests: Uses currentUser() from @clerk/nextjs/server
 * - Chrome extension requests: Uses Backend SDK to verify Authorization header
 */
const isAuthed = t.middleware(async ({ ctx, next }) => {
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

    const result = await getAccount(decoded.payload.accountId);

    if (result === null) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Assumed account not found",
      });
    }

    const { user, ...account } = result;

    return next({
      ctx: {
        ...ctx,
        user,
        // TODO: remove this in the future when we make sure that each signed in user has a linked in account created and linked
        // we need to cast here bcs somehow type inference is not catching that account is nullable
        account: account as typeof account | null,
      },
    });
  }

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

    const user = await getOrInsertUser(ctx.db, userId);

    return next({
      ctx: {
        ...ctx,
        user,
        account: null,
      },
    });
  }

  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  const user = await getOrInsertUser(ctx.db, userId);

  return next({
    ctx: {
      ...ctx, // Keep existing context with db and headers
      user, // Add the user to the context
      account: null,
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

const userFields = {
  id: true,
  accessType: true,
  dailyAIcomments: true,
  firstName: true,
  primaryEmailAddress: true,
} as const;

export async function getOrInsertUser(
  db: PrismaClient,
  userId: string,
  clerkUser?: User,
) {
  const dbUser = await db.user.findUnique({
    where: {
      id: userId,
    },
    select: userFields,
  });

  if (dbUser !== null) {
    return dbUser;
  }

  // query for clerk user if not provided in function argument
  clerkUser ??= await clerkClient.users.getUser(userId);

  const primaryEmailAddress = clerkUser.primaryEmailAddress?.emailAddress;

  if (primaryEmailAddress === undefined) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "User must have a primary email address",
    });
  }

  const newUser = await db.user.upsert({
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
    select: userFields,
  });

  return newUser;
}

function getAccount(accountId: string) {
  return db.linkedInAccount.findFirst({
    where: { id: accountId },
    include: {
      user: {
        select: userFields,
      },
    },
  });
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
