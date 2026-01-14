import type { ReactNode } from "react";

import { ThemeProvider } from "@sassy/ui/theme";

import { WarmupProvider } from "~/app/_components/warmup-provider";
import { LinkedInAccountProvider } from "~/stores/linkedin-account-store";
import { TRPCReactProvider } from "~/trpc/react";
import { EngagekitClerkProvider } from "./clerk-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      {/* important to have linkedIn account provider outside of TRPC provider */}
      <LinkedInAccountProvider>
        <TRPCReactProvider>
          <EngagekitClerkProvider>
            <WarmupProvider>
              {/* <ProgressBar height="4px" color="#155dfc" shallowRouting /> */}
              {children}
            </WarmupProvider>
          </EngagekitClerkProvider>
        </TRPCReactProvider>
      </LinkedInAccountProvider>
    </ThemeProvider>
  );
}
