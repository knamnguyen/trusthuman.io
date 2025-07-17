import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { ThemeProvider } from "@sassy/ui/theme";
import { Toaster } from "@sassy/ui/toast";
import { cn } from "@sassy/ui/utils";

import { TRPCReactProvider } from "~/trpc/react";

import "~/app/globals.css";

import { env } from "~/env";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://engagekit.io"
      : "http://localhost:3000",
  ),
  title: "EngageKit",
  description: "The ultimate AI-powered LinkedIn engagement assistant",
  openGraph: {
    title: "EngageKit",
    description: "The ultimate AI-powered LinkedIn engagement assistant",
    url: "https://engagekit.co",
    siteName: "EngageKit",
    images: [
      {
        url: "/pictures/meta-link-preview.png",
        width: 1200,
        height: 630,
        alt: "EngageKit preview image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@engagekit",
    creator: "@knam_nguyen",
    images: ["/pictures/meta-link-preview.png"],
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
        <ClerkProvider afterSignOutUrl="/" redirectUrl="/extension-auth">
          <ThemeProvider attribute="class" defaultTheme="light">
            <TRPCReactProvider>{props.children}</TRPCReactProvider>
            <Toaster />
            {env.VERCEL_ENV === "production" && <Analytics />}
            {env.VERCEL_ENV === "production" && <SpeedInsights />}
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
