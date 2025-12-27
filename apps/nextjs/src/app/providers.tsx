"use client";

import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

import { ThemeProvider } from "@sassy/ui/theme";

import { LinkedInAccountProvider } from "~/stores/linkedin-account-store";
import { TRPCReactProvider } from "~/trpc/react";

export function Providers({
  children,
  initialAccountId,
  initialAssumedUserToken,
}: {
  children: ReactNode;
  initialAccountId?: string;
  initialAssumedUserToken?: string;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      {/* important to have linkedIn account provider outside of TRPC provider */}
      <LinkedInAccountProvider
        initialAccountId={initialAccountId}
        initialAssumedUserToken={initialAssumedUserToken}
      >
        <TRPCReactProvider>
          <ClerkProvider afterSignOutUrl="/" redirectUrl="/extension-auth">
            <ProgressBar height="4px" color="#155dfc" shallowRouting />
            {children}
          </ClerkProvider>
        </TRPCReactProvider>
      </LinkedInAccountProvider>
    </ThemeProvider>
  );
}
