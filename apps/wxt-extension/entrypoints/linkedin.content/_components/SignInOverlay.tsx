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

import { useAuthStore } from "../../../stores/auth-store";
import { getSyncHostUrl } from "../../../lib/get-sync-host-url";
import { useAccountStore } from "../stores";

export function SignInOverlay() {
  const { isLoaded, fetchAuthStatus } = useAuthStore();
  const { currentLinkedIn } = useAccountStore();

  const handleSignIn = () => {
    const syncHost = getSyncHostUrl();
    const authUrl = `${syncHost}/extension-auth`;
    window.open(authUrl, "_blank");
  };

  if (!isLoaded) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>Sign in to EngageKit</CardTitle>
          <CardDescription>
            Access AI-powered LinkedIn engagement features
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Current LinkedIn Account */}
          {currentLinkedIn.publicIdentifier && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground uppercase">
                Current LinkedIn Account
              </p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">
                  {currentLinkedIn.publicIdentifier}
                </span>
              </div>
            </div>
          )}

          <Button onClick={handleSignIn} className="w-full" size="lg">
            <LogIn className="mr-2 h-4 w-4" />
            Sign In to EngageKit
          </Button>

          <p className="text-center text-xs text-muted-foreground">
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
