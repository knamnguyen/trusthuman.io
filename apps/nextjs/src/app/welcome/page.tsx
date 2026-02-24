"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";

/**
 * Welcome page - redirects new users to their profile page
 * This is the landing page after signup
 *
 * Uses client-side redirect to ensure the browser actually navigates
 * after Clerk's modal sign-in flow completes.
 */
export default function WelcomePage() {
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const trpc = useTRPC();

  // Fetch the user's profile
  const { data: myProfile, isLoading: isProfileLoading } = useQuery({
    ...trpc.trustProfile.getMyProfile.queryOptions(),
    enabled: isUserLoaded && !!user,
    retry: 3, // Retry a few times in case of webhook race condition
    retryDelay: 1000, // Wait 1s between retries
  });

  useEffect(() => {
    console.log("[WelcomePage] Effect running:", {
      isUserLoaded,
      hasUser: !!user,
      isProfileLoading,
      hasProfile: !!myProfile,
      username: myProfile?.username,
      isRedirecting
    });

    // Wait for Clerk to load
    if (!isUserLoaded) {
      console.log("[WelcomePage] Waiting for Clerk to load...");
      return;
    }

    // If no user, redirect to home
    if (!user) {
      console.log("[WelcomePage] No user, redirecting to /");
      router.replace("/");
      return;
    }

    // Wait for profile to load
    if (isProfileLoading) {
      console.log("[WelcomePage] Waiting for profile to load...");
      return;
    }

    // If we have a profile with username, redirect there
    if (myProfile?.username && !isRedirecting) {
      console.log("[WelcomePage] Redirecting to profile:", myProfile.username);
      setIsRedirecting(true);
      router.replace(`/${myProfile.username}?welcome=true`);
      return;
    }

    // If profile loaded but no username (shouldn't happen), go home
    if (!isProfileLoading && !myProfile?.username && !isRedirecting) {
      console.log("[WelcomePage] No profile found after loading, redirecting to /");
      // Wait a bit more in case webhook is still processing
      const timeout = setTimeout(() => {
        if (!isRedirecting) {
          setIsRedirecting(true);
          router.replace("/");
        }
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isUserLoaded, user, isProfileLoading, myProfile, isRedirecting, router]);

  // Show loading state
  return (
    <div className="flex min-h-screen items-center justify-center bg-card">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 mx-auto animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground">Setting up your profile...</p>
      </div>
    </div>
  );
}
