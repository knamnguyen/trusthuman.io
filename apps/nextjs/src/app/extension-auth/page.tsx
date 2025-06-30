"use client";

import { useEffect, useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  useUser,
} from "@clerk/nextjs";
import { ArrowLeft, CheckCircle, Chrome } from "lucide-react";

import { Button } from "@sassy/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";

export default function ExtensionAuthPage() {
  const { isSignedIn, user } = useUser();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      setShowSuccessMessage(true);

      // Auto-close tab after success message is shown (optional)
      const timer = setTimeout(() => {
        window.close();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSignedIn]);

  const handleReturnToExtension = () => {
    window.close();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Chrome className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            EngageKit Extension
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <SignedOut>
            <div className="space-y-4 text-center">
              <p className="text-gray-600">
                Sign in to connect your EngageKit Chrome extension
              </p>

              <div className="space-y-3">
                <SignInButton mode="modal">
                  <Button size="lg" className="w-full">
                    Sign In
                  </Button>
                </SignInButton>

                <SignUpButton mode="modal">
                  <Button size="lg" variant="outline" className="w-full">
                    Create Account
                  </Button>
                </SignUpButton>
              </div>

              <div className="text-sm text-gray-500">
                <p>
                  After signing in, return to your extension to start using
                  EngageKit
                </p>
              </div>
            </div>
          </SignedOut>

          <SignedIn>
            {showSuccessMessage ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    Successfully Connected!
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Welcome {user?.firstName}! Your extension is now connected.
                  </p>
                </div>

                <Button
                  onClick={handleReturnToExtension}
                  className="w-full"
                  size="lg"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Return to Extension
                </Button>

                <p className="text-xs text-gray-500">
                  This window will close automatically in a few seconds
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600">Connecting your extension...</p>
              </div>
            )}
          </SignedIn>
        </CardContent>
      </Card>
    </div>
  );
}
