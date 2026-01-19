/**
 * CreateLinkedInAccountOverlay - Shows when current signed in user or organization does not have any linked in accounts registered.
 * Displayed on all tabs
 */

import { AlertTriangle, Loader2, UserPlus } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

import { getSyncHostUrl } from "../../../lib/get-sync-host-url";
import { useAccountStore } from "../stores";

export function CreateLinkedInAccountOverlay() {
  const { organization, fetchAccountData, isLoading, accounts, isLoaded } =
    useAccountStore();

  const handleRegisterNewLinkedInAccount = () => {
    const syncHost = getSyncHostUrl();
    const registerUrl = `${syncHost}/${organization?.slug}/accounts`;
    window.open(registerUrl, "_blank");
  };

  if (isLoaded === false || isLoading) {
    return (
      <div className="bg-background/90 absolute inset-0 z-40 grid place-items-center backdrop-blur-sm">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  const showNoAccountRegisteredOverlay = accounts.length === 0;

  if (!showNoAccountRegisteredOverlay) {
    return null;
  }

  return (
    <div className="bg-background/90 absolute inset-0 z-40 flex items-center justify-center backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle>No LinkedIn accounts registered</CardTitle>
          <CardDescription>
            Please add your linked in account to have access to Engagekit's
            features.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            onClick={handleRegisterNewLinkedInAccount}
            className="w-full"
            size="lg"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Linked In Account
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            Already added?{" "}
            <button
              onClick={() => fetchAccountData()}
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
