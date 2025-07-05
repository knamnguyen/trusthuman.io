"use client";

import { useEffect, useRef, useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  useUser,
} from "@clerk/nextjs";
import { ArrowLeft, CheckCircle, Chrome } from "lucide-react";

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
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const signInButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSignedIn && user) {
      setShowSuccessMessage(true);

      // Get the session token and store it for the chrome extension
      // const storeSessionToken = async () => {
      //   try {
      //     // Get the session token from Clerk
      //     const session = await (window as any).Clerk?.session?.getToken();

      //     if (session) {
      //       // Store the token in chrome storage for the extension to use
      //       if (typeof chrome !== "undefined" && chrome.storage) {
      //         await chrome.storage.local.set({
      //           __clerk_session_token: session,
      //           clerk_user_id: user.id,
      //           hasEverSignedIn: true,
      //         });
      //       } else {
      //         console.warn(
      //           "Chrome storage not available - this should only happen in development",
      //         );
      //       }
      //     }
      //   } catch (error) {
      //     console.error("Failed to store session token:", error);
      //   }
      // };

      // storeSessionToken();

      // Auto-close tab after success message is shown (optional)
      // const timer = setTimeout(() => {
      //   window.close();
      // }, 3000);

      // return () => clearTimeout(timer);
    }
  }, [isSignedIn, user]);

  // Auto-trigger sign-in modal when page loads
  useEffect(() => {
    if (!isSignedIn) {
      const timer = setTimeout(() => {
        signInButtonRef.current?.click();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isSignedIn]);

  const handleReturnToExtension = () => {
    window.close();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <Chrome className="mx-auto h-12 w-12 text-blue-600" />
          <CardTitle className="mt-4 text-2xl font-bold">
            Connect to EngageKit
          </CardTitle>
          <CardDescription>
            Sign in to link your Chrome extension and start engaging.
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
            {showSuccessMessage ? (
              <div className="flex flex-col items-center space-y-4 text-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">
                    Successfully Connected!
                  </h3>
                  <p className="text-muted-foreground">
                    Welcome, {user?.firstName}! Your extension is ready.
                  </p>
                </div>
                <Button onClick={handleReturnToExtension} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Close this window
                </Button>
                <p className="text-muted-foreground text-xs">
                  This window will close automatically.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-muted-foreground">
                  Connecting your extension...
                </p>
              </div>
            )}
          </SignedIn>
        </CardContent>
      </Card>
    </div>
  );
}
