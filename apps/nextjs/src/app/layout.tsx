import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import { ThemeProvider } from "@sassy/ui/theme";
import { Toaster } from "@sassy/ui/toast";
import { cn } from "@sassy/ui/utils";

import { TRPCReactProvider } from "~/trpc/react";

import "~/app/globals.css";

import { env } from "~/env";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://turbo.t3.gg"
      : "http://localhost:3000",
  ),
  title: "EngageKit",
  description: "The ultimate AI-powered LinkedIn outreach assistant",
  openGraph: {
    title: "EngageKit",
    description: "The ultimate AI-powered LinkedIn outreach assistant",
    url: "https://engagekit.co",
    siteName: "EngageKit",
  },
  twitter: {
    card: "summary_large_image",
    site: "@engagekit",
    creator: "@knam_nguyen",
  },
  icons: {
    icon: "/engagekit-logo.svg",
    shortcut: "/engagekit-logo.svg",
    apple: "/engagekit-logo.svg",
  },
};

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          plusJakartaSans.variable,
        )}
      >
        <ClerkProvider
          afterSignOutUrl="/"
          afterSignInUrl="/extension-auth"
          afterSignUpUrl="/extension-auth"
        >
          <ThemeProvider attribute="class" defaultTheme="light">
            <TRPCReactProvider>{props.children}</TRPCReactProvider>
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
