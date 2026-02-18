import type { Metadata, Viewport } from "next";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights as VercelSpeedInsights } from "@vercel/speed-insights/next";

import { Toaster } from "@sassy/ui/toast";

import "~/app/globals.css";

import { env } from "~/env";
import { Providers } from "../lib/providers/providers";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://trusthuman.io"
      : (process.env.NEXTJS_URL ??
        `http://localhost:${process.env.PORT ?? "3000"}`),
  ),
  title: "TrustHuman",
  description: "Prove you're human with verified social engagement",
  openGraph: {
    title: "TrustHuman",
    description: "Prove you're human with verified social engagement",
    url: "https://trusthuman.io",
    siteName: "TrustHuman",
  },
  twitter: {
    card: "summary_large_image",
    creator: "@knam_nguyen",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-full font-sans antialiased">
        <Providers>
          {props.children}
          <Toaster />
          {env.VERCEL_ENV === "production" && <VercelAnalytics />}
          {env.VERCEL_ENV === "production" && <VercelSpeedInsights />}
        </Providers>
      </body>
    </html>
  );
}
