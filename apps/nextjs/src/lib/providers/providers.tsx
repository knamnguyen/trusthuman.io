import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

import { ThemeProvider } from "@sassy/ui/theme";

import { WarmupProvider } from "~/app/_components/warmup-provider";
import { LinkedInAccountProvider } from "~/stores/linkedin-account-store";
import { TRPCReactProvider } from "~/trpc/react";
import { PosthogIdentifier } from "../posthog";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light" defaultTheme="light">
      {/* important to have linkedIn account provider outside of TRPC provider */}
      <LinkedInAccountProvider>
        <TRPCReactProvider>
          <ClerkProvider afterSignOutUrl="/">
            <PosthogIdentifier />
            <WarmupProvider>
              {/* <ProgressBar height="4px" color="#155dfc" shallowRouting /> */}
              {children}
            </WarmupProvider>
          </ClerkProvider>
        </TRPCReactProvider>
      </LinkedInAccountProvider>
    </ThemeProvider>
  );
}
