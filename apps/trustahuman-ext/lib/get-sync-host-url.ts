/**
 * URL utilities for TrustHuman Chrome Extension
 *
 * - getSyncHostUrl(): Clerk cookie sync domain (must match where user logs in)
 * - getWebAppUrl(): Next.js frontend for auth redirects
 * - getApiUrl(): tRPC API endpoint (uses ngrok in dev for content script CORS)
 */

const PROD_URL = "https://trusthuman.io";
const DEV_URL = "https://dev.trusthuman.io";

// Clerk proxy domain for cookie syncing (must match Clerk DNS CNAME setup)
const PROD_SYNC_HOST = "https://clerk.trusthuman.io";

/**
 * Returns the sync host URL for Clerk authentication.
 * This MUST be the Clerk proxy domain (clerk.trusthuman.io), NOT the main app domain.
 * The Clerk proxy domain is where Clerk sets auth cookies that can be shared with extensions.
 */
export function getSyncHostUrl(): string {
  if (import.meta.env.MODE === "production") {
    return PROD_SYNC_HOST;
  }
  // In dev, sync with the public dev URL (ngrok/cloudflare tunnel)
  return import.meta.env.VITE_NGROK_URL ?? DEV_URL;
}

/**
 * Returns the web app URL for auth redirects and links.
 */
export function getWebAppUrl(): string {
  if (import.meta.env.MODE === "production") {
    return PROD_URL;
  }
  // Use ngrok URL for dev to work from content script
  return import.meta.env.VITE_NGROK_URL ?? DEV_URL;
}

/**
 * Returns the API URL for tRPC calls.
 *
 * IMPORTANT: Content scripts run on linkedin.com origin and CANNOT call localhost.
 * Must use a publicly accessible URL (ngrok tunnel or dev subdomain).
 */
export function getApiUrl(): string {
  if (import.meta.env.MODE === "production") {
    return PROD_URL;
  }
  // Priority: VITE_NGROK_URL > VITE_APP_URL > dev.trusthuman.io
  if (import.meta.env.VITE_NGROK_URL) {
    return import.meta.env.VITE_NGROK_URL;
  }
  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL;
  }
  return DEV_URL;
}
