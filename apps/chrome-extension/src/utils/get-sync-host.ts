const PROD_SYNC_HOST = "https://clerk.engagekit.io";
const DEV_SYNC_HOST = "http://localhost:3000";

/**
 * Returns the correct Clerk sync host URL based on the Vite build mode.
 * @returns The sync host URL.
 */
export const getSyncHost = (): string => {
  if (import.meta.env.MODE === "production") {
    return PROD_SYNC_HOST;
  }
  return DEV_SYNC_HOST;
};
