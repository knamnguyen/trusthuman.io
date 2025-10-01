import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/seats(.*)",
  "/api/trpc/post.all",
  "/api/trpc(.*)", // Allow all tRPC routes - authentication is handled in tRPC context
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/extension-auth(.*)", // Allow extension auth page to be public
  "/api/webhooks/stripe", // Allow Stripe webhooks
  "/api/webhooks/clerk", // Allow Clerk webhooks
  "/api/cron(.*)", // Allow cron jobs to bypass authentication
  // Generation routes are protected - removed from public routes
  // Add more public routes as needed
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
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    "/extension-auth(.*)",
  ],
};
