/**
 * Returns the sync host URL for Clerk authentication.
 * Reads from environment variables with dynamic port support.
 *
 * In development:
 * - Main repo: http://localhost:3000
 * - Worktrees: http://localhost:3010, 3020, etc. (from .env.local override)
 *
 * In production:
 * - Uses VITE_NEXTJS_URL or falls back to production domain
 */
export function getSyncHostUrl(): string {
  // VITE_NEXTJS_URL is set in .env (or .env.local for worktrees)
  // Examples:
  // - Main repo: http://localhost:3000
  // - Worktree: http://localhost:3010
  // - Production: https://engagekit.io
  const syncHost = import.meta.env.VITE_NEXTJS_URL;

  if (!syncHost) {
    throw new Error(
      "VITE_NEXTJS_URL is not defined. Please check your .env file.",
    );
  }

  return syncHost;
}
