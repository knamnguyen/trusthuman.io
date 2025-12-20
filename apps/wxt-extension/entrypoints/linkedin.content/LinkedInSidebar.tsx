import { OrganizationSwitcher, UserButton } from "@clerk/chrome-extension";
import { useQuery } from "@tanstack/react-query";
import { Building2, CheckCircle, Link, XCircle } from "lucide-react";

import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@sassy/ui/sheet";

import { useBackgroundAuth } from "../../hooks/use-background-auth";
import { getSyncHostUrl } from "../../lib/get-sync-host-url";
import { useTRPC } from "../../lib/trpc/client";
import { ToggleButton } from "./ToggleButton";
import { useLinkedInProfile } from "./use-linkedin-profile";

/**
 * Organization & LinkedIn Accounts Card
 * Shows the user's current org and registered LinkedIn accounts
 */
function OrgAccountsCard({
  linkedInProfile,
  isSignedIn,
}: {
  linkedInProfile: ReturnType<typeof useLinkedInProfile>;
  isSignedIn: boolean;
}) {
  const trpc = useTRPC();

  // Get current organization
  const { data: currentOrg, isLoading: isOrgLoading } = useQuery(
    trpc.organization.getCurrent.queryOptions(undefined, {
      enabled: isSignedIn,
    }),
  );

  // Get accounts for current org
  const { data: accounts, isLoading: isAccountsLoading } = useQuery(
    trpc.account.listByOrg.queryOptions(
      { organizationId: currentOrg?.id ?? "" },
      {
        enabled: isSignedIn && !!currentOrg?.id,
      },
    ),
  );

  // Check if current LinkedIn matches any registered account
  const currentLinkedInSlug = linkedInProfile.publicIdentifier;
  const matchingAccount = accounts?.find(
    (acc) => acc.profileSlug === currentLinkedInSlug,
  );

  if (!isSignedIn) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <CardTitle className="text-base">Organization</CardTitle>
        </div>
        <CardDescription>
          {isOrgLoading
            ? "Loading..."
            : currentOrg
              ? currentOrg.name
              : "No organization"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentOrg && (
          <div className="flex flex-col gap-3">
            {/* Org Info */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="secondary">{currentOrg.role}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Slots</span>
              <span>
                {accounts?.length ?? 0} / {currentOrg.purchasedSlots}
              </span>
            </div>

            {/* LinkedIn Accounts */}
            <div className="border-t pt-3">
              <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                LinkedIn Accounts
              </p>
              {isAccountsLoading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : accounts && accounts.length > 0 ? (
                <ul className="flex flex-col gap-2">
                  {accounts.map((account) => {
                    const isCurrentAccount =
                      account.profileSlug === currentLinkedInSlug;
                    return (
                      <li
                        key={account.id}
                        className={`flex items-center justify-between rounded-md p-2 text-sm ${
                          isCurrentAccount
                            ? "bg-green-50 border border-green-200"
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
                            {account.registrationStatus}
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
            {linkedInProfile.isLoaded && currentLinkedInSlug && (
              <div className="border-t pt-3">
                <p className="text-muted-foreground mb-2 text-xs font-medium uppercase">
                  Current LinkedIn
                </p>
                {matchingAccount ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Matches registered account</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <XCircle className="h-4 w-4" />
                    <span>
                      <span className="font-mono">{currentLinkedInSlug}</span>{" "}
                      not registered
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!currentOrg && !isOrgLoading && (
          <p className="text-muted-foreground text-sm">
            You're not a member of any organization yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface LinkedInSidebarProps {
  portalContainer: HTMLElement;
  onClose: () => void;
}

export function LinkedInSidebar({
  portalContainer,
  onClose,
}: LinkedInSidebarProps) {
  const { isSignedIn, isLoaded, user, refreshAuth } = useBackgroundAuth();
  const linkedInProfile = useLinkedInProfile();

  // tRPC v11 pattern: useTRPC + useQuery
  const trpc = useTRPC();
  const {
    data: userDb,
    isLoading: isUserDbLoading,
    error: userDbError,
    status,
    fetchStatus,
  } = useQuery(
    trpc.user.meDb.queryOptions(undefined, {
      enabled: isSignedIn,
    }),
  );

  // Debug logging
  console.log("tRPC Query Debug:", {
    isSignedIn,
    status,
    fetchStatus,
    userDb,
    error: userDbError?.message,
  });

  const handleSignIn = () => {
    const syncHost = getSyncHostUrl();
    const authUrl = `${syncHost}/extension-auth`;
    window.open(authUrl, "_blank");
  };

  return (
    <SheetContent
      side="right"
      className="w-[25vw] max-w-[400px] min-w-[320px]"
      portalContainer={portalContainer}
    >
      {/* Close button attached to the left edge of sidebar */}
      <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2">
        <ToggleButton isOpen={true} onToggle={onClose} />
      </div>
      <SheetHeader>
        <div className="flex items-center gap-3">
          <div className="border-border bg-primary text-primary-foreground flex h-9 w-9 items-center justify-center rounded-md border-2 font-bold">
            E
          </div>
          <div>
            <SheetTitle>EngageKit</SheetTitle>
            <SheetDescription>LinkedIn engagement sidebar</SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto py-4">
        {!isLoaded ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        ) : !isSignedIn ? (
          // Not signed in - show sign-in UI
          <div className="flex flex-col gap-4 px-4">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to EngageKit</CardTitle>
                <CardDescription>
                  Sign in to access AI-powered LinkedIn engagement features
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Button onClick={handleSignIn} className="w-full">
                  Sign In to EngageKit
                </Button>
                <p className="text-muted-foreground text-center text-xs">
                  Already signed in?{" "}
                  <button
                    onClick={refreshAuth}
                    className="text-primary hover:underline"
                  >
                    Refresh
                  </button>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {[
                    "AI-powered comment generation",
                    "LinkedIn engagement automation",
                    "Style guide customization",
                  ].map((item) => (
                    <li
                      key={item}
                      className="text-muted-foreground flex items-center gap-2 text-sm"
                    >
                      <span className="text-primary">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Signed in - show features UI
          <div className="flex flex-col gap-4 px-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  Welcome back, {user?.firstName || "User"}!
                </CardTitle>
                <CardDescription>
                  You're signed in and ready to engage on LinkedIn
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Organization & LinkedIn Accounts */}
            <OrgAccountsCard
              linkedInProfile={linkedInProfile}
              isSignedIn={isSignedIn}
            />

            {linkedInProfile.isLoaded && linkedInProfile.profileUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>LinkedIn Account</CardTitle>
                  <CardDescription>
                    Currently logged in to LinkedIn
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Profile URL
                      </p>
                      <a
                        href={linkedInProfile.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm break-all hover:underline"
                      >
                        {linkedInProfile.profileUrl}
                      </a>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Username</p>
                      <p className="font-mono text-sm">
                        {linkedInProfile.publicIdentifier}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Profile ID
                      </p>
                      <p className="font-mono text-sm text-xs break-all">
                        {linkedInProfile.miniProfileId}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* tRPC Test: User Database Fields */}
            <Card>
              <CardHeader>
                <CardTitle>User Database (tRPC Test)</CardTitle>
                <CardDescription>Data from user.meDb route</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Debug info */}
                <div className="mb-2 rounded bg-gray-100 p-2 text-xs">
                  <p>status: {status}</p>
                  <p>fetchStatus: {fetchStatus}</p>
                  <p>isSignedIn: {String(isSignedIn)}</p>
                </div>

                {userDbError ? (
                  <div className="text-sm text-red-500">
                    <p className="font-semibold">Error:</p>
                    <p className="font-mono text-xs break-all">
                      {userDbError.message}
                    </p>
                  </div>
                ) : isUserDbLoading ? (
                  <p className="text-muted-foreground text-sm">Loading...</p>
                ) : userDb ? (
                  <div className="flex flex-col gap-2">
                    {Object.entries(userDb).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-muted-foreground text-xs">{key}</p>
                        <p className="font-mono text-xs break-all">
                          {value === null
                            ? "null"
                            : typeof value === "object"
                              ? JSON.stringify(value, null, 2)
                              : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No data</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Implementation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {[
                    "Shadow DOM isolation",
                    "WXT framework",
                    "Clerk authentication",
                    "tRPC integration",
                    "Auto-refresh on sign-in",
                  ].map((item) => (
                    <li
                      key={item}
                      className="text-muted-foreground flex items-center gap-2 text-sm"
                    >
                      <span className="text-green-500">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1">
                  {[
                    "Comment generation UI",
                    "Style guide editor",
                    "Engagement analytics",
                  ].map((item) => (
                    <li key={item} className="text-muted-foreground text-sm">
                      • {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <SheetFooter>
        <p className="text-muted-foreground w-full text-center text-xs">
          EngageKit WXT POC v0.0.1
        </p>
        <SheetClose asChild>
          <button className="sr-only">Close</button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  );
}
