/**
 * AccountMismatchOverlay - Shows when current LinkedIn doesn't match registered accounts
 * Displayed on all tabs except Account tab
 */

import { AlertTriangle, ExternalLink, Link, User } from "lucide-react";

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

export function AccountMismatchOverlay() {
  const { accounts, currentLinkedIn, organization } = useAccountStore();

  const handleRegister = () => {
    const syncHost = getSyncHostUrl();
    // TODO: Update to actual registration page when available
    const registerUrl = `${syncHost}/dashboard/accounts`;
    window.open(registerUrl, "_blank");
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <CardTitle>LinkedIn Account Not Registered</CardTitle>
          <CardDescription>
            The LinkedIn account you're using isn't registered with your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Current LinkedIn Account */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="mb-1 text-xs font-medium text-amber-800 uppercase">
              Currently Logged In
            </p>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-amber-600" />
              <span className="font-mono text-sm font-medium text-amber-900">
                {currentLinkedIn.publicIdentifier || "Unknown"}
              </span>
            </div>
          </div>

          {/* Registered Accounts */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
              {organization?.name}'s Registered Accounts
            </p>
            {accounts.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {accounts.map((account) => (
                  <li key={account.id} className="flex items-center gap-2">
                    <Link className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-sm">
                      {account.profileSlug}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No accounts registered yet
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button onClick={handleRegister} className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              Register This Account
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Or log in to one of the registered LinkedIn accounts above
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
