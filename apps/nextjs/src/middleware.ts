import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/privacy-policy",
  "/leaderboard",
  "/api/trpc(.*)", // Allow all tRPC routes - authentication is handled in tRPC context
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/extension-auth(.*)",
  "/api/webhooks/clerk",
  "/api/badge(.*)", // Badge generation API
]);

// Known internal routes that should NOT be treated as usernames
const INTERNAL_ROUTES = new Set([
  "welcome",
  "settings",
  "dashboard",
  "admin",
  "_next",
  "api",
]);

// Check if a path is a potential username profile page
// Username routes are like /johndoe (single segment, not a known route)
function isUsernameRoute(pathname: string): boolean {
  // Remove leading slash and split
  const segments = pathname.slice(1).split("/");
  const firstSegment = segments[0];

  // Must have exactly one segment (the username)
  if (!firstSegment || segments.length > 1) return false;

  // Must not be a known internal route
  if (INTERNAL_ROUTES.has(firstSegment)) return false;

  // Must match username pattern (alphanumeric + underscore, 3-30 chars)
  return /^[a-z0-9_]{3,30}$/.test(firstSegment);
}

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname;

  // Allow public routes and username profile pages
  if (isPublicRoute(request) || isUsernameRoute(pathname)) {
    return;
  }

  await auth.protect({
    token: "any",
  });
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/extension-auth(.*)",
  ],
};
