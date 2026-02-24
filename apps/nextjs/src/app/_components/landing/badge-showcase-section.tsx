"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { SignInButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { TrustBadge } from "@sassy/ui/components/trust-badge";

import { useTRPC } from "~/trpc/react";
import { MESSAGING } from "./landing-content";

// Mock users for fallback when not enough real users
const MOCK_USERS = [
  { username: "sarahchen", humanNumber: 42, totalVerified: 156, seed: "Sarah" },
  { username: "alexjohnson", humanNumber: 7, totalVerified: 342, seed: "Alex" },
  { username: "mikepatel", humanNumber: 156, totalVerified: 89, seed: "Mike" },
  { username: "emilydavis", humanNumber: 23, totalVerified: 201, seed: "Emily" },
  { username: "jasonkim", humanNumber: 89, totalVerified: 67, seed: "Jason" },
  { username: "lisawong", humanNumber: 312, totalVerified: 445, seed: "Lisa" },
  { username: "davidmiller", humanNumber: 5, totalVerified: 523, seed: "David" },
  { username: "rachelgreen", humanNumber: 178, totalVerified: 134, seed: "Rachel" },
  { username: "chrislee", humanNumber: 64, totalVerified: 278, seed: "Chris" },
  { username: "amandabrown", humanNumber: 421, totalVerified: 92, seed: "Amanda" },
  { username: "ryanwilson", humanNumber: 15, totalVerified: 387, seed: "Ryan" },
  { username: "jessicataylor", humanNumber: 203, totalVerified: 156, seed: "Jessica" },
  { username: "kevinmoore", humanNumber: 88, totalVerified: 211, seed: "Kevin" },
  { username: "nicolethomas", humanNumber: 347, totalVerified: 78, seed: "Nicole" },
  { username: "brandonwhite", humanNumber: 12, totalVerified: 456, seed: "Brandon" },
  { username: "stephanieharris", humanNumber: 99, totalVerified: 189, seed: "Stephanie" },
];

interface BadgeUser {
  username: string;
  humanNumber: number;
  totalVerified: number;
  avatarUrl?: string;
  isMock: boolean;
}

interface MarqueeRowProps {
  users: BadgeUser[];
  direction?: "left" | "right";
  speed?: number;
  isSignedIn: boolean;
  myUsername?: string;
}

function MarqueeRow({ users, direction = "left", speed = 30, isSignedIn, myUsername }: MarqueeRowProps) {
  const router = useRouter();
  // Duplicate items for seamless loop
  const items = [...users, ...users];

  const handleMockClick = () => {
    if (isSignedIn && myUsername) {
      router.push(`/${myUsername}`);
    }
    // For non-signed-in users, the SignInButton wrapper handles it
  };

  return (
    <div className="group relative w-full overflow-hidden">
      {/* Gradient masks for fade effect on edges */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-40 bg-gradient-to-r from-[#fbf6e5] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-40 bg-gradient-to-l from-[#fbf6e5] to-transparent" />

      <div
        className="inline-flex w-max items-center gap-6"
        style={{
          animation: `${direction === "left" ? "scroll-left" : "scroll-right"} ${speed}s linear infinite`,
        }}
      >
        {items.map((user, index) => {
          // Alternate between Triss logo and user avatar
          const useAvatar = index % 2 === 1;
          const avatarUrl = useAvatar
            ? user.avatarUrl || `https://api.dicebear.com/9.x/notionists/svg?seed=${user.username}`
            : undefined;

          // Real users get direct links, mock users trigger auth flow
          if (user.isMock) {
            // For mock users - wrap in SignInButton if not signed in
            if (!isSignedIn) {
              return (
                <SignInButton key={`${user.username}-${index}`} mode="modal" forceRedirectUrl="/welcome">
                  <div className="cursor-pointer">
                    <TrustBadge
                      username={user.username}
                      humanNumber={user.humanNumber}
                      totalVerified={user.totalVerified}
                      variant="full"
                      logoUrl="/trusthuman-logo.svg"
                      avatarUrl={avatarUrl}
                    />
                  </div>
                </SignInButton>
              );
            } else {
              // Signed in - navigate to their profile
              return (
                <div
                  key={`${user.username}-${index}`}
                  className="cursor-pointer"
                  onClick={handleMockClick}
                >
                  <TrustBadge
                    username={user.username}
                    humanNumber={user.humanNumber}
                    totalVerified={user.totalVerified}
                    variant="full"
                    logoUrl="/trusthuman-logo.svg"
                    avatarUrl={avatarUrl}
                  />
                </div>
              );
            }
          }

          // Real users - direct link to their profile
          return (
            <TrustBadge
              key={`${user.username}-${index}`}
              username={user.username}
              humanNumber={user.humanNumber}
              totalVerified={user.totalVerified}
              variant="full"
              logoUrl="/trusthuman-logo.svg"
              avatarUrl={avatarUrl}
            />
          );
        })}
      </div>
    </div>
  );
}

export function BadgeShowcaseSection() {
  const { isSignedIn } = useAuth();
  const trpc = useTRPC();

  // Get current user's profile if signed in
  const { data: myProfile } = useQuery({
    ...trpc.trustProfile.getMyProfile.queryOptions(),
    enabled: isSignedIn,
  });

  // Get leaderboard for real users
  const { data: leaderboardData } = useQuery({
    ...trpc.trustProfile.getLeaderboard.queryOptions({ limit: 16, offset: 0 }),
  });

  // Build badge users: real users first, then mock users to fill to 16
  const badgeUsers = useMemo((): BadgeUser[] => {
    const realUsers = leaderboardData?.users ?? [];
    const totalNeeded = 16;

    // Map real users
    const realBadgeUsers: BadgeUser[] = realUsers.map((user) => ({
      username: user.username,
      humanNumber: user.humanNumber,
      totalVerified: user.totalVerifications,
      avatarUrl: user.avatarUrl || undefined,
      isMock: false,
    }));

    // Fill remaining with mock users
    const mockCount = Math.max(0, totalNeeded - realBadgeUsers.length);
    const mockBadgeUsers: BadgeUser[] = MOCK_USERS.slice(0, mockCount).map((mock) => ({
      username: mock.username,
      humanNumber: mock.humanNumber,
      totalVerified: mock.totalVerified,
      avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${mock.seed}`,
      isMock: true,
    }));

    return [...realBadgeUsers, ...mockBadgeUsers];
  }, [leaderboardData?.users]);

  // Split into two rows
  const row1Users = badgeUsers.slice(0, 8);
  const row2Users = badgeUsers.slice(8, 16);

  return (
    <section className="overflow-hidden bg-[#fbf6e5] py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {MESSAGING.badgeShowcase.headline}
          </h2>
          <p className="text-muted-foreground text-xl">
            {MESSAGING.badgeShowcase.subheadline}
          </p>
        </div>
      </div>

      {/* Marquee rows - full width, outside container */}
      <div className="space-y-6">
        <MarqueeRow
          users={row1Users}
          direction="left"
          speed={50}
          isSignedIn={!!isSignedIn}
          myUsername={myProfile?.username}
        />
        <MarqueeRow
          users={row2Users}
          direction="right"
          speed={45}
          isSignedIn={!!isSignedIn}
          myUsername={myProfile?.username}
        />
      </div>

    </section>
  );
}
