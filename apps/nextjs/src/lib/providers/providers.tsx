"use client";

import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

import { ThemeProvider } from "@sassy/ui/theme";

import { TRPCReactProvider } from "~/trpc/react";

// Debug: log Clerk env vars on client
if (typeof window !== "undefined") {
  console.log("[Providers] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:", process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 20) + "...");
  console.log("[Providers] NEXT_PUBLIC_CLERK_DOMAIN:", process.env.NEXT_PUBLIC_CLERK_DOMAIN);
}

// Extension ID from Chrome Web Store
const EXTENSION_ID = "fgoghbbgplmlpjccglfbaccokbklhnal";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light" defaultTheme="light">
      <TRPCReactProvider>
        <ClerkProvider
          afterSignOutUrl="/"
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
          allowedRedirectOrigins={[`chrome-extension://${EXTENSION_ID}`]}
        >
          {children}
        </ClerkProvider>
      </TRPCReactProvider>
    </ThemeProvider>
  );
}
