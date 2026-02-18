import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/privacy-policy",
  "/api/trpc(.*)", // Allow all tRPC routes - authentication is handled in tRPC context
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/extension-auth(.*)",
  "/api/webhooks/clerk",
  // Public profile pages
  "/[username](.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect({
      token: "any",
    });
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/extension-auth(.*)",
  ],
};
