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
import { currentUser } from "@clerk/nextjs/server";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "@sassy/db";

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

export interface TRPCContext {
  db: typeof db;
  user?: User;
  headers: Headers;
}

export const createTRPCContext = async (opts: {
  headers: Headers;
}): Promise<TRPCContext> => {
  const source = opts.headers.get("x-trpc-source");
  console.log(">>> tRPC Request from", source || "nextjs");

  return {
    db,
    headers: opts.headers,
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

/**
 * Clerk authentication middleware
 * This middleware handles authentication for both Next.js and Chrome extension requests
 * - Next.js requests: Uses currentUser() from @clerk/nextjs/server
 * - Chrome extension requests: Uses Backend SDK to verify Authorization header
 */
const isAuthed = t.middleware(async ({ ctx, next }) => {
  const source = ctx.headers.get("x-trpc-source");
  let user: User | null = null;

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

    try {
      // Create Clerk client
      const clerkClient = createClerkClient({
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      // Check if this is a JWT (3 parts separated by dots) or a session ID
      if (token.split(".").length === 3) {
        // This is a JWT - use verifyToken
        console.log("Attempting JWT verification...");
        const verifiedToken = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });

        if (verifiedToken.sub) {
          user = await clerkClient.users.getUser(verifiedToken.sub);
          console.log("Chrome extension JWT auth success for user:", user.id);
        }
      } else {
        // This is likely a session ID - use Clerk client directly
        console.log("Attempting session ID verification...");

        try {
          // Try to get session information using the token as a session ID
          const session = await clerkClient.sessions.getSession(token);

          if (session.userId) {
            user = await clerkClient.users.getUser(session.userId);
            console.log(
              "Chrome extension session auth success for user:",
              user.id,
            );
          }
        } catch (sessionError: unknown) {
          const errorMessage =
            sessionError instanceof Error
              ? sessionError.message
              : String(sessionError);
          console.log("Session verification failed:", errorMessage);

          // If session lookup fails, try to verify as a JWT anyway (fallback)
          console.log("Falling back to JWT verification...");
          const verifiedToken = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY,
          });

          if (verifiedToken.sub) {
            user = await clerkClient.users.getUser(verifiedToken.sub);
            console.log(
              "Chrome extension fallback JWT auth success for user:",
              user.id,
            );
          }
        }
      }
    } catch (error) {
      console.error("Chrome extension auth error:", error);
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid session token",
      });
    }
  } else {
    // Handle Next.js authentication using currentUser()
    user = await currentUser();
  }

  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  return next({
    ctx: {
      ...ctx, // Keep existing context with db and headers
      user, // Add the user to the context
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
export const protectedProcedure = t.procedure.use(
  isAuthed,
) as unknown as typeof t.procedure;
