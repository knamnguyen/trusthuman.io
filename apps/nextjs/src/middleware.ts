import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/trpc/post.all",
  "/api/trpc(.*)", // Allow all tRPC routes - authentication is handled in tRPC context
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/extension-auth(.*)", // Allow extension auth page to be public
  "/api/webhooks/stripe", // Allow Stripe webhooks
  "/api/webhooks/clerk", // Allow Clerk webhooks
  // Generation routes are protected - removed from public routes
  // Add more public routes as needed
]);

// This is the standard Clerk authentication middleware with our configuration.
// It will handle authentication and redirection for protected routes.
const clerkAuthMiddleware = clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    // If the route is not public, protect it.
    // This will throw a redirect error if the user is not authenticated.
    auth.protect();
  }
});

// We are wrapping the Clerk middleware to modify the response headers.
// This is necessary to change the SameSite attribute of the session cookie
// to allow cross-origin requests from the Chrome extension.
export default async function middleware(
  req: NextRequest,
  event: NextFetchEvent,
) {
  // Get the response from the Clerk middleware by calling it with the request.
  // It can return a NextResponse (e.g., a redirect) or undefined if it does nothing.
  const res = await clerkAuthMiddleware(req, event);

  // If the clerk middleware returned a response, we use it. Otherwise, we create
  // a new one to continue the middleware chain.
  const response =
    res ?? NextResponse.next({ request: { headers: req.headers } });

  // Get all `Set-Cookie` headers from the response.
  const setCookieHeaders = response.headers.getSetCookie();

  if (setCookieHeaders.length > 0) {
    const rewrittenHeaders: string[] = [];

    setCookieHeaders.forEach((cookie) => {
      // Find the `__session` cookie set by Clerk.
      if (cookie.startsWith("__session")) {
        // Rewrite the cookie to use `SameSite=None; Secure`.
        // This is required for the Chrome extension to be able to send the
        // cookie with requests to the `engagekit.io` domain.
        const newCookie = cookie.replace(
          /SameSite=Lax/g,
          "SameSite=None; Secure",
        );
        rewrittenHeaders.push(newCookie);
      } else {
        // Keep other cookies as they are.
        rewrittenHeaders.push(cookie);
      }
    });

    // Delete the original `Set-Cookie` header.
    response.headers.delete("Set-Cookie");

    // Set the rewritten `Set-Cookie` headers.
    rewrittenHeaders.forEach((cookie) => {
      response.headers.append("Set-Cookie", cookie);
    });
  }

  // Return the modified response.
  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
