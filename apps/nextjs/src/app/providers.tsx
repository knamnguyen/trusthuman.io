"use client";

import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

import { ThemeProvider } from "@sassy/ui/theme";

import { TRPCReactProvider } from "~/trpc/react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <TRPCReactProvider>
        <ClerkProvider afterSignOutUrl="/" redirectUrl="/extension-auth">
          <ProgressBar height="4px" color="#155dfc" shallowRouting />
          {children}
        </ClerkProvider>
      </TRPCReactProvider>
    </ThemeProvider>
  );
}
