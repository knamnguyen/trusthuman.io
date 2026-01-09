import {
  Building2,
  CheckCircle,
  ExternalLink,
  Link,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

import { getSyncHostUrl } from "../../../lib/get-sync-host-url";
import { useAuthStore } from "../../../stores/auth-store";
import { useAccountStore } from "../stores";

/**
 * Organization & LinkedIn Accounts Card
 * Uses the account store for instant data access
 */
function OrgAccountsCard() {
  const {
    organization,
    accounts,
    currentLinkedIn,
    currentLinkedInStatus,
    matchingAccount,
    isLoading,
  } = useAccountStore();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <CardTitle className="text-base">Loading...</CardTitle>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (!organization) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <CardTitle className="text-base">Organization</CardTitle>
          </div>
          <CardDescription>No organization</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            You're not a member of any organization yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <CardTitle className="text-base">Organization</CardTitle>
        </div>
        <CardDescription>{organization.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {/* Org Info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="secondary">{organization.role}</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Slots</span>
            <span>
              {accounts.length} / {organization.purchasedSlots}
            </span>
          </div>

          {/* LinkedIn Accounts */}
          <div className="border-t pt-3">
            <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
              LinkedIn Accounts
            </p>
            {accounts.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {accounts.map((account) => {
                  const isCurrentAccount =
                    account.profileSlug === currentLinkedIn.profileSlug;
                  return (
                    <li
                      key={account.id}
                      className={`flex items-center justify-between rounded-md p-2 text-sm ${
                        isCurrentAccount
                          ? "border border-green-200 bg-green-50"
                          : "bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Link className="h-3 w-3" />
                        <span className="font-mono text-xs">
                          {account.profileSlug}
                        </span>
                      </div>
                      {isCurrentAccount ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          {account.status}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">
                No accounts registered yet
              </p>
            )}
          </div>

          {/* Current LinkedIn Match Status */}
          {currentLinkedIn.profileSlug && (
            <div className="border-t pt-3">
              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                Current LinkedIn
              </p>
              {currentLinkedInStatus === "registered" && matchingAccount ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Matches registered account</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <XCircle className="h-4 w-4" />
                  <span>
                    <span className="font-mono">
                      {currentLinkedIn.profileSlug}
                    </span>{" "}
                    not registered
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Current LinkedIn Profile Card
 * Shows the LinkedIn account the user is currently logged into
 */
function CurrentLinkedInCard() {
  const { currentLinkedIn } = useAccountStore();

  if (!currentLinkedIn.profileUrl) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>LinkedIn Account</CardTitle>
        <CardDescription>Currently logged in to LinkedIn</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-muted-foreground text-xs">Profile URL</p>
            <a
              href={currentLinkedIn.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-sm break-all hover:underline"
            >
              {currentLinkedIn.profileUrl}
            </a>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Username</p>
            <p className="font-mono text-sm">{currentLinkedIn.profileSlug}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Profile URN</p>
            <p className="font-mono text-xs break-all">
              {currentLinkedIn.profileUrn}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountTab() {
  // Auth store for user info (read-only, all actions via webapp)
  // Note: isSignedIn check is done at LinkedInSidebar level via SignInOverlay
  const { user, fetchAuthStatus } = useAuthStore();
  const { isLoading, fetchAccountData } = useAccountStore();
  const organization = useAuthStore.getState().organization;

  const handleRefresh = async () => {
    // Force refresh auth (invalidates Clerk cache) then re-fetch account data
    await fetchAuthStatus(true);
    await fetchAccountData();
  };

  const handleManageAccount = () => {
    const syncHost = getSyncHostUrl();
    window.open(`${syncHost}/org-accounts`, "_blank");
  };

  // Signed in - show features UI (SignInOverlay handles unauthenticated state)
  return (
    <div className="flex flex-col gap-4 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Welcome back, {user?.firstName || "User"}!</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0"
              title="Refresh account data"
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
          <CardDescription>
            You're signed in and ready to engage on LinkedIn
          </CardDescription>
          <CardDescription>Organization: {organization?.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt="Profile"
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div>
                <p className="text-sm font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-muted-foreground text-xs">
                  {user?.emailAddress}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManageAccount}
              className="text-muted-foreground hover:text-destructive"
            >
              Manage Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Organization & LinkedIn Accounts - data from store */}
      <OrgAccountsCard />

      {/* Current LinkedIn Profile - data from store */}
      <CurrentLinkedInCard />
    </div>
  );
}
