import { ReactNode } from "react";
import { ClerkProvider as BaseClerkProvider } from "@clerk/chrome-extension";
import { getSyncHost } from "@src/utils/get-sync-host";

interface ClerkProviderProps {
  children: ReactNode;
}

// Use environment variables from Vite
const publishableKey = import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
// Do not read or log server-side secrets in the client bundle

// Get the correct sync host from our centralized utility
const SYNC_HOST = getSyncHost();
const EXTENSION_URL = chrome.runtime.getURL(".");

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
