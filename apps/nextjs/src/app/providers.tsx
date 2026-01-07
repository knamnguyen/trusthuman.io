import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

import { ThemeProvider } from "@sassy/ui/theme";

import { WarmupProvider } from "~/app/_components/warmup-provider";
import { LinkedInAccountProvider } from "~/stores/linkedin-account-store";
import { TRPCReactProvider } from "~/trpc/react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      {/* important to have linkedIn account provider outside of TRPC provider */}
      <LinkedInAccountProvider>
        <TRPCReactProvider>
          <ClerkProvider afterSignOutUrl="/" redirectUrl="/extension-auth">
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
