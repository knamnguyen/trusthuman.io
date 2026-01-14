"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { ClerkProvider } from "@clerk/nextjs";

// TODO: figure out a way to pass in the source so we can redirect properly
export function EngagekitClerkProvider({ children }: { children: ReactNode }) {
  // by default we redirect to extension auth
  // but if the source is app, we redirect to home
  const params = useParams<{ source: "extension" | "app" }>();

  let redirectUrl;

  switch (params.source) {
    case "extension":
      redirectUrl = "/extension-auth";
      break;
    case "app":
      redirectUrl = "/home";
      break;
    default:
      redirectUrl = "/extension-auth";
  }

  return (
    <ClerkProvider afterSignOutUrl="/" redirectUrl={redirectUrl}>
      {children}
    </ClerkProvider>
  );
}
