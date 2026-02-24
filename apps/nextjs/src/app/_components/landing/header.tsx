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
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/trusthuman-logo.svg"
            alt="TrustHuman"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-xl font-bold">TrustHuman</span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/leaderboard"
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
          >
            Leaderboard
          </Link>

          {/* Show CTA while Clerk is loading to prevent layout shift */}
          <ClerkLoading>
            <Button variant="primary" size="sm">
              Claim Your Human Status
            </Button>
          </ClerkLoading>

          <ClerkLoaded>
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl="/welcome">
                <Button variant="primary" size="sm">
                  Claim Your Human Status
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              {myProfile?.username && (
                <Link href={`/${myProfile.username}`}>
                  <Button variant="primary" size="sm">
                    View My Profile
                  </Button>
                </Link>
              )}
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
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
