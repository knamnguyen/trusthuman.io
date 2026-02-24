/**
 * URL utilities for TrustHuman Chrome Extension
 *
 * CRITICAL: Understanding the different URLs:
 *
 * 1. syncHost (getSyncHostUrl):
 *    - Used by Clerk chrome-extension client to sync auth cookies
 *    - In PROD: Must be the Clerk proxy domain (clerk.trusthuman.io)
 *    - In DEV: localhost where Next.js runs (Clerk dev instance sets cookies there)
 *
 * 2. webAppUrl (getWebAppUrl):
 *    - Used for auth redirects and opening pages (e.g., /extension-auth)
 *    - In PROD: https://trusthuman.io
 *    - In DEV: VITE_NGROK_URL or localhost
 *
 * 3. apiUrl (getApiUrl):
 *    - Used for tRPC API calls from content scripts
 *    - Content scripts run on linkedin.com origin and CANNOT call localhost directly
 *    - Must use a publicly accessible URL (ngrok tunnel or dev subdomain)
 */

// Production URLs
const PROD_SYNC_HOST = "https://clerk.trusthuman.io"; // Clerk proxy domain for cookie sync
const PROD_WEB_APP = "https://trusthuman.io";         // Main web app domain

// Development defaults
const DEV_LOCALHOST = "http://localhost:3000";
const DEV_FALLBACK = "https://dev.trusthuman.io";

/**
 * Returns the sync host URL for Clerk authentication.
 *
 * In production: Uses clerk.trusthuman.io (Clerk proxy domain where cookies are set)
 * In development: Uses localhost (where Clerk dev instance sets cookies)
 *
 * This follows the same pattern as engagekit-turborepo.
 */
export function getSyncHostUrl(): string {
  if (import.meta.env.MODE === "production") {
    return PROD_SYNC_HOST;
  }
  // In dev, Clerk sets cookies on localhost where Next.js runs
  // Use VITE_NEXTJS_URL if set (for worktree port support), otherwise localhost:3000
  return import.meta.env.VITE_NEXTJS_URL ?? DEV_LOCALHOST;
}

/**
 * Returns the web app URL for auth redirects and opening pages.
 *
 * In production: https://trusthuman.io
 * In development: Uses VITE_NGROK_URL for content script compatibility, or localhost
 */
export function getWebAppUrl(): string {
  if (import.meta.env.MODE === "production") {
    return PROD_WEB_APP;
  }
  // For opening auth pages from extension popup/background, we can use localhost
  // But for content scripts that need to redirect, we need a public URL
  return import.meta.env.VITE_NGROK_URL ?? import.meta.env.VITE_NEXTJS_URL ?? DEV_LOCALHOST;
}

/**
 * Returns the API URL for tRPC calls.
 *
 * IMPORTANT: Content scripts run on linkedin.com origin and CANNOT call localhost.
 * Must use a publicly accessible URL (ngrok tunnel or dev subdomain).
 *
 * In production: https://trusthuman.io
 * In development: VITE_NGROK_URL (required for content scripts)
 */
export function getApiUrl(): string {
  if (import.meta.env.MODE === "production") {
    return PROD_WEB_APP;
  }
  // Content scripts MUST use ngrok/public URL - they cannot call localhost
  if (import.meta.env.VITE_NGROK_URL) {
    return import.meta.env.VITE_NGROK_URL;
  }
  // Fallback to dev subdomain if no ngrok
  return DEV_FALLBACK;
}
