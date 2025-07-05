import { ReactNode } from "react";
import { ClerkProvider as BaseClerkProvider } from "@clerk/chrome-extension";
import { getSyncHost } from "@src/utils/get-sync-host";

interface ClerkProviderProps {
  children: ReactNode;
}

// Use environment variables from Vite
const publishableKey = import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = import.meta.env.VITE_CLERK_SECRET_KEY;
const clerkWebhookSecret = import.meta.env.VITE_CLERK_WEBHOOK_SECRET;
const clerkFrontendApiVite = import.meta.env.VITE_CLERK_FRONTEND_API;

console.log("publishableKey", publishableKey);
console.log("clerkSecretKey", clerkSecretKey);
console.log("clerkWebhookSecret", clerkWebhookSecret);
console.log("clerkFrontendApiVite", clerkFrontendApiVite);

// Get the correct sync host from our centralized utility
const SYNC_HOST = getSyncHost();
const EXTENSION_URL = chrome.runtime.getURL(".");
console.log("SYNC_HOST", SYNC_HOST);
console.log("EXTENSION_URL", EXTENSION_URL);
console.log("Clerk sync host configured:", SYNC_HOST);
console.log("Extension URL configured:", EXTENSION_URL);

if (!publishableKey) {
  throw new Error(
    "Please add the NEXT_PUBLIC_CLERK_PUBpLISHABLE_KEY to your environment variables",
  );
}

export const ClerkProvider = ({ children }: ClerkProviderProps) => {
  return (
    <BaseClerkProvider
      publishableKey={publishableKey}
      syncHost={SYNC_HOST}
      afterSignOutUrl={`${EXTENSION_URL}src/pages/popup/index.html`}
      signInFallbackRedirectUrl={`${EXTENSION_URL}src/pages/popup/index.html`}
      signUpFallbackRedirectUrl={`${EXTENSION_URL}src/pages/popup/index.html`}
    >
      {children}
    </BaseClerkProvider>
  );
};
