/**
 * SignInOverlay - Covers the sidebar when user is not signed in to EngageKit
 * Translucent overlay with sign-in button and current LinkedIn account info
 */

import { Loader2, LogIn, User } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

import { useAuthStore } from "../../../lib/auth-store";
import { getSyncHostUrl } from "../../../lib/get-sync-host-url";
import { useAccountStore } from "../stores";

export function SignInOverlay() {
  const { isLoaded, fetchAuthStatus, isSignedIn } = useAuthStore();
  const { currentLinkedIn } = useAccountStore();

  const handleSignIn = () => {
    const syncHost = getSyncHostUrl();
    const authUrl = `${syncHost}/extension-auth`;
    window.open(authUrl, "_blank");
  };

  if (!isLoaded) {
    return (
      <div className="bg-background/80 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background/80 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>Sign in to EngageKit</CardTitle>
          <CardDescription>
            Access AI-powered LinkedIn engagement features
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Current LinkedIn Account */}
          {currentLinkedIn.profileSlug && (
            <div className="bg-muted/50 rounded-lg border p-3">
              <p className="text-muted-foreground mb-1 text-xs font-medium uppercase">
                Current LinkedIn Account
              </p>
              <div className="flex items-center gap-2">
                <User className="text-muted-foreground h-4 w-4" />
                <span className="font-mono text-sm">
                  {currentLinkedIn.profileSlug}
                </span>
              </div>
            </div>
          )}

          <Button onClick={handleSignIn} className="w-full" size="lg">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In to EngageKit
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            Already signed in?{" "}
            <button
              onClick={() => fetchAuthStatus(true)}
              className="text-primary hover:underline"
            >
              Refresh
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
