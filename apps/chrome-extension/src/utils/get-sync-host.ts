const PROD_SYNC_HOST = "https://clerk.engagekit.io";
// Use VITE_NEXTJS_URL in dev, or construct from PORT env var
const DEV_SYNC_HOST = import.meta.env.VITE_NEXTJS_URL ?? `http://localhost:${import.meta.env.VITE_PORT ?? "3000"}`;

/**
 * Returns the correct Clerk sync host URL based on the Vite build mode.
 * @returns The sync host URL.
 */
export const getSyncHost = (): string => {
  console.log("GET SYNC HOST", import.meta.env);
  console.log("MODE IS:", import.meta.env.MODE);
  if (import.meta.env.MODE === "production") {
    return PROD_SYNC_HOST;
  }
  return DEV_SYNC_HOST;
};
