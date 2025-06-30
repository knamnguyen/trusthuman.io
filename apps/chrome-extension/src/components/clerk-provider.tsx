import { ReactNode } from "react";
import { ClerkProvider as BaseClerkProvider } from "@clerk/chrome-extension";

interface ClerkProviderProps {
  children: ReactNode;
}

// Use environment variables from Vite
const publishableKey = import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Determine sync host based on environment
const getSyncHost = () => {
  // For ngrok testing (you can update this with your specific ngrok URL)
  if (import.meta.env.VITE_NGROK_URL) {
    console.log(
      "Using ngrok URL for sync host:",
      import.meta.env.VITE_NGROK_URL,
    );
    return import.meta.env.VITE_NGROK_URL;
  }

  // Default to localhost for development
  console.log("Using localhost for sync host");
  return "http://localhost:3000";
};

const SYNC_HOST = getSyncHost();
console.log("Clerk sync host configured:", SYNC_HOST);

if (!publishableKey) {
  throw new Error(
    "Please add the NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to your environment variables",
  );
}

export const ClerkProvider = ({ children }: ClerkProviderProps) => {
  return (
    <BaseClerkProvider publishableKey={publishableKey} syncHost={SYNC_HOST}>
      {children}
    </BaseClerkProvider>
  );
};
