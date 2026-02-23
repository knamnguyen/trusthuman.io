/**
 * URL utilities for TrustHuman Chrome Extension
 *
 * - getSyncHostUrl(): Clerk cookie sync domain (must match where user logs in)
 * - getWebAppUrl(): Next.js frontend for auth redirects
 * - getApiUrl(): tRPC API endpoint (uses ngrok in dev for content script CORS)
 */

const PROD_URL = "https://trusthuman.io";
const DEV_URL = "https://dev.trusthuman.io";

/**
 * Returns the sync host URL for Clerk authentication.
 * This is the domain where Clerk sets cookies.
 */
export function getSyncHostUrl(): string {
  if (import.meta.env.MODE === "production") {
    return PROD_URL;
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
