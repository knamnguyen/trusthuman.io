const PROD_SYNC_HOST = "https://clerk.engagekit.io";
// Use VITE_NEXTJS_URL in dev, or construct from PORT env var
const DEV_SYNC_HOST =
  import.meta.env.VITE_NEXTJS_URL ??
  `http://localhost:${import.meta.env.VITE_PORT ?? "3000"}`;

/**
 * Returns the sync host URL for Clerk authentication.
 * Reads from environment variables with dynamic port support.
 *
 * In development:
 * - Main repo: http://localhost:3000
 * - Worktrees: http://localhost:3010, 3020, etc. (from .env.local override)
 *
 * In production:
 * - Uses clerk.engagekit.io (where Clerk sets cookies)
 */
export function getSyncHostUrl(): string {
  console.log("GET SYNC HOST", import.meta.env);
  console.log("MODE IS:", import.meta.env.MODE);
  if (import.meta.env.MODE === "production") {
    return PROD_SYNC_HOST;
  }
  return DEV_SYNC_HOST;
}
