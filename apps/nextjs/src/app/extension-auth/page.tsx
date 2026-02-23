"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  useUser,
} from "@clerk/nextjs";
import { Loader2, Shield } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

export default function ExtensionAuthPage() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const signInButtonRef = useRef<HTMLButtonElement>(null);

  // Redirect to profile page after sign in
  useEffect(() => {
    if (isSignedIn && user?.username) {
      // Redirect to profile page with fromExtension param (skips install modal)
      router.push(`/${user.username}?fromExtension=true`);
    }
  }, [isSignedIn, user?.username, router]);

  // Auto-trigger sign-in modal when page loads
  useEffect(() => {
    if (!isSignedIn) {
      const timer = setTimeout(() => {
        signInButtonRef.current?.click();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isSignedIn]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <Shield className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="mt-4 text-2xl font-bold">
            Connect to TrustHuman
          </CardTitle>
          <CardDescription>
            Sign in to verify your humanity and earn your Human # badge.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <SignedOut>
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">
                The sign-in window should open automatically.
              </p>
              {/* Hidden SignInButton for auto-triggering */}
              <SignInButton mode="modal">
                <button ref={signInButtonRef} className="hidden" />
              </SignInButton>
              <p className="text-muted-foreground text-sm">
                Don&apos;t have an account?
              </p>
              <SignUpButton mode="modal">
                <Button variant="outline" className="w-full">
                  Create Account
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="flex flex-col items-center space-y-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Redirecting to your profile...
              </p>
            </div>
          </SignedIn>
        </CardContent>
      </Card>
    </div>
  );
}
