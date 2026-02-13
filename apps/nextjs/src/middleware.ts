import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/privacy-policy", // Public privacy policy page
  "/api/trpc/post.all",
  "/api/trpc(.*)", // Allow all tRPC routes - authentication is handled in tRPC context
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/extension-auth(.*)", // Allow extension auth page to be public
  "/api/webhooks/stripe", // Allow Stripe webhooks
  "/api/webhooks/clerk", // Allow Clerk webhooks
  "/api/cron(.*)", // Allow cron jobs to bypass authentication
  "/tools/linkedinpreview(.*)", // Allow LinkedIn preview tool (public routes)
  "/api/mobile-oauth-callback", // Allow mobile OAuth callback for Capacitor apps
  // Generation routes are protected - removed from public routes
  // Add more public routes as needed
]);

// Shortcut paths that redirect to /{orgSlug}/{accountSlug}/{path}
// Add new shortcuts here as needed
const SHORTCUT_PATHS = [
  "discovery-sets",
  "earn-premium",
  "history",
  "personas",
  "run-settings",
  "settings",
  "target-list",
  "test-email",
];

function isShortcutPath(pathname: string): boolean {
  const firstSegment = pathname.split("/")[1];
  return firstSegment ? SHORTCUT_PATHS.includes(firstSegment) : false;
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // Handle shortcut redirects for authenticated users
  if (isShortcutPath(pathname)) {
    const user = await auth();

    if (user.userId && user.orgSlug) {
      const accountSlug = request.cookies.get("account_slug")?.value;

      if (accountSlug) {
        const url = request.nextUrl.clone();
        url.pathname = `/${user.orgSlug}/${accountSlug}${pathname}`;
        return NextResponse.redirect(url);
      }

      // No account selected, redirect to accounts list
      const url = request.nextUrl.clone();
      url.pathname = `/${user.orgSlug}/accounts`;
      return NextResponse.redirect(url);
    }
  }

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
    "/extension-auth(.*)",
  ],
};
