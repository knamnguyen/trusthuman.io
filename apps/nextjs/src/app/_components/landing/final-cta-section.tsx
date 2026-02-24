"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@sassy/ui/button";

import { useTRPC } from "~/trpc/react";
import { MESSAGING } from "./landing-content";

export function FinalCTASection() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const trpc = useTRPC();

  // Debug logging
  console.log("[FinalCTASection] Auth state:", { isSignedIn, isLoaded });

  // Get current user's profile if signed in
  const { data: myProfile } = useQuery({
    ...trpc.trustProfile.getMyProfile.queryOptions(),
    enabled: isSignedIn,
  });

  const handleClick = () => {
    console.log("[FinalCTASection] handleClick called, myProfile:", myProfile);
    if (myProfile?.username) {
      console.log("[FinalCTASection] Navigating to profile:", myProfile.username);
      router.push(`/${myProfile.username}`);
    } else {
      console.log("[FinalCTASection] Navigating to /welcome");
      router.push("/welcome");
    }
  };

  return (
    <section className="bg-primary text-primary-foreground py-20 md:py-32">
      <div className="container mx-auto max-w-4xl px-4 text-center">
        <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {MESSAGING.finalCTA.headline}
        </h2>
        <p className="text-primary-foreground/80 mb-8 text-xl">
          {MESSAGING.finalCTA.subheadline}
        </p>

        {(() => {
          console.log("[FinalCTASection] Rendering CTA, isSignedIn:", isSignedIn);
          return null;
        })()}
        {isSignedIn ? (
          <Button
            size="lg"
            variant="secondary"
            className="text-lg font-semibold"
            onClick={handleClick}
          >
            {myProfile?.username ? "View My Profile" : "Complete Your Profile"}
          </Button>
        ) : (
          <SignInButton mode="modal" forceRedirectUrl="/welcome">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg font-semibold"
              onClick={() => console.log("[FinalCTASection] SignInButton clicked")}
            >
              {MESSAGING.finalCTA.primaryCTA}
            </Button>
          </SignInButton>
        )}
      </div>
    </section>
  );
}
