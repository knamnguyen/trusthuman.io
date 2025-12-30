import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights as VercelSpeedInsights } from "@vercel/speed-insights/next";

import { Toaster } from "@sassy/ui/toast";

import "~/app/globals.css";

import { env } from "~/env";
import { getQueryClient, trpc } from "~/trpc/server";
import { Providers } from "./providers";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://engagekit.io"
      : (process.env.NEXTJS_URL ??
        `http://localhost:${process.env.PORT ?? "3000"}`),
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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout(props: { children: React.ReactNode }) {
  const account = await getQueryClient().ensureQueryData(
    trpc.account.getDefaultAccount.queryOptions(),
  );

  return (
    <html lang="en" suppressHydrationWarning>
      {/* tracking for Endoresely affiliate referral */}
      <Script
        async
        src="https://assets.endorsely.com/endorsely.js"
        data-endorsely="2fb18c3c-7198-4c86-b16b-714f8e177932"
        strategy="afterInteractive"
      />
      {/* tracking for leads generation from visits rb2b */}
      <Script id="reb2b-tracking">
        {`!function(key) {if (window.reb2b) return;window.reb2b = {loaded: true};var s = document.createElement("script");s.async = true;s.src = "https://ddwl4m2hdecbv.cloudfront.net/b/" + key + "/" + key + ".js.gz";document.getElementsByTagName("script")[0].parentNode.insertBefore(s, document.getElementsByTagName("script")[0]);}("9NMMZHR79ZNW");`}
      </Script>
      {/* tracking for google analytics */}
      {/* Load Google Analytics script asynchronously */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-6V2N8LZDBF"
        strategy="afterInteractive"
      />
      {/* Initialize and configure GA4 */}
      <Script id="google-analytics" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-6V2N8LZDBF', {
              page_path: window.location.pathname,
            });
          `}
      </Script>
      <body className="bg-background text-foreground min-h-full font-sans antialiased">
        <Providers
          initialAssumedUserToken={account?.assumedUserToken}
          initialAccountId={account?.account.id}
        >
          {props.children}
          <Toaster />
          {env.VERCEL_ENV === "production" && <VercelAnalytics />}
          {env.VERCEL_ENV === "production" && <VercelSpeedInsights />}
        </Providers>
      </body>
    </html>
  );
}
