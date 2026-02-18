import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

import { ThemeProvider } from "@sassy/ui/theme";

import { TRPCReactProvider } from "~/trpc/react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" forcedTheme="light" defaultTheme="light">
      <TRPCReactProvider>
        <ClerkProvider afterSignOutUrl="/">
          {children}
        </ClerkProvider>
      </TRPCReactProvider>
    </ThemeProvider>
  );
}
