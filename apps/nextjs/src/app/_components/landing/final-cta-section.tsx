"use client";

import Link from "next/link";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@sassy/ui/button";

import { useTRPC } from "~/trpc/react";
import { MESSAGING } from "./landing-content";

export function FinalCTASection() {
  const { isSignedIn } = useAuth();
  const trpc = useTRPC();

  // Get current user's profile if signed in
  const { data: myProfile } = useQuery({
    ...trpc.trustProfile.getMyProfile.queryOptions(),
    enabled: isSignedIn,
  });

  return (
    <section className="bg-primary text-primary-foreground py-20 md:py-32">
      <div className="container mx-auto max-w-4xl px-4 text-center">
        <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {MESSAGING.finalCTA.headline}
        </h2>
        <p className="text-primary-foreground/80 mb-8 text-xl">
          {MESSAGING.finalCTA.subheadline}
        </p>

        {isSignedIn && myProfile?.username ? (
          <Link href={`/${myProfile.username}`}>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg font-semibold"
            >
              View My Profile
            </Button>
          </Link>
        ) : (
          <SignInButton mode="modal" forceRedirectUrl="/welcome">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg font-semibold"
            >
              {MESSAGING.finalCTA.primaryCTA}
            </Button>
          </SignInButton>
        )}
      </div>
    </section>
  );
}
