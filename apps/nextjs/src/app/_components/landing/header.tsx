"use client";

import Link from "next/link";
import Image from "next/image";
import { SignInButton, SignedIn, SignedOut, UserButton, useAuth, ClerkLoaded, ClerkLoading } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@sassy/ui/button";

import { useTRPC } from "~/trpc/react";

export function Header() {
  const { isSignedIn } = useAuth();
  const trpc = useTRPC();

  // Get current user's profile if signed in
  const { data: myProfile } = useQuery({
    ...trpc.trustProfile.getMyProfile.queryOptions(),
    enabled: isSignedIn,
  });

  return (
    <header className="bg-card/80 sticky top-0 z-50 w-full backdrop-blur-sm">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 sm:h-16">
        {/* Logo - hide text on very small screens */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/trusthuman-logo.svg"
            alt="TrustHuman"
            width={32}
            height={32}
            className="h-7 w-7 sm:h-8 sm:w-8"
          />
          <span className="text-lg font-bold sm:text-xl">
            <span className="text-primary">Trust</span>Human
          </span>
        </Link>

        {/* Nav - compact on mobile */}
        <nav className="flex items-center gap-2 sm:gap-4">
          {/* Hide "Leaderboard" text on mobile, show icon or hide completely */}
          <Link
            href="/leaderboard"
            className="text-muted-foreground hover:text-foreground hidden text-sm font-medium transition-colors sm:block"
          >
            Leaderboard
          </Link>

          {/* Show CTA while Clerk is loading to prevent layout shift */}
          <ClerkLoading>
            <Button variant="primary" size="sm" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Claim Your Human Status</span>
              <span className="sm:hidden">Join</span>
            </Button>
          </ClerkLoading>

          <ClerkLoaded>
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/welcome">
                <Button variant="primary" size="sm" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">Claim Your Human Status</span>
                  <span className="sm:hidden">Join</span>
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              {/* Always show a CTA button when signed in */}
              <Link href={myProfile?.username ? `/${myProfile.username}` : "/welcome"}>
                <Button variant="primary" size="sm" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">
                    {myProfile?.username ? "View My Profile" : "Complete Profile"}
                  </span>
                  <span className="sm:hidden">
                    {myProfile?.username ? "Profile" : "Setup"}
                  </span>
                </Button>
              </Link>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-7 w-7 sm:h-8 sm:w-8",
                  },
                }}
              />
            </SignedIn>
          </ClerkLoaded>
        </nav>
      </div>
    </header>
  );
}
