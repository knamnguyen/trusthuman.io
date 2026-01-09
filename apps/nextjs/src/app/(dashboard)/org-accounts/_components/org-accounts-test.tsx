"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import { Input } from "@sassy/ui/input";
import { Label } from "@sassy/ui/label";

import { useTRPC } from "~/trpc/react";

export function OrgAccountsTest() {
  const [profileUrl, setProfileUrl] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Get current organization
  const {
    data: currentOrg,
    isLoading: isOrgLoading,
    error: orgError,
  } = useQuery(trpc.organization.getCurrent.queryOptions());

  // Get accounts for current org (uses ctx.activeOrg on server)
  const { data: accounts, isLoading: isAccountsLoading } = useQuery(
    trpc.account.listByOrg.queryOptions(),
  );

  // Register new account mutation
  const registerMutation = useMutation({
    ...trpc.account.registerByUrl.mutationOptions(),
    onSuccess: () => {
      setProfileUrl("");
      void queryClient.invalidateQueries({
        queryKey: trpc.account.listByOrg.queryKey(),
      });
    },
  });

  // Remove account mutation
  const removeMutation = useMutation({
    ...trpc.account.removeFromOrg.mutationOptions(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: trpc.account.listByOrg.queryKey(),
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?.id || !profileUrl.trim()) return;

    registerMutation.mutate({
      profileUrl: profileUrl.trim(),
      organizationId: currentOrg.id,
    });
  };

  const handleRemove = (accountId: string) => {
    if (!currentOrg?.id) return;
    removeMutation.mutate({
      accountId,
      organizationId: currentOrg.id,
    });
  };

  if (isOrgLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">Loading organization...</p>
        </CardContent>
      </Card>
    );
  }

  if (orgError) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-red-500">
            Error loading organization: {orgError.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!currentOrg) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-gray-500">
            You're not a member of any organization yet.
          </p>
          <p className="mt-2 text-center text-sm text-gray-400">
            Create an organization in Clerk to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Organization Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current Organization</CardTitle>
          <CardDescription>Your active organization details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{currentOrg.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Your Role</p>
              <p className="font-medium capitalize">{currentOrg.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Slots</p>
              <p className="font-medium">
                {accounts?.length ?? 0} / {currentOrg.purchasedSlots} used
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add LinkedIn Account */}
      <Card>
        <CardHeader>
          <CardTitle>Add LinkedIn Account</CardTitle>
          <CardDescription>
            Register a LinkedIn account by entering its profile URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="profileUrl">LinkedIn Profile URL</Label>
              <Input
                id="profileUrl"
                type="url"
                placeholder="https://www.linkedin.com/in/username"
                value={profileUrl}
                onChange={(e) => setProfileUrl(e.target.value)}
                disabled={registerMutation.isPending}
              />
            </div>

            {registerMutation.error && (
              <p className="text-sm text-red-500">
                {registerMutation.error.message}
              </p>
            )}

            <Button
              type="submit"
              disabled={
                registerMutation.isPending ||
                !profileUrl.trim() ||
                (accounts?.length ?? 0) >= currentOrg.purchasedSlots
              }
            >
              {registerMutation.isPending ? "Adding..." : "Add Account"}
            </Button>

            {(accounts?.length ?? 0) >= currentOrg.purchasedSlots && (
              <p className="text-sm text-amber-600">
                You've reached your account limit. Upgrade to add more accounts.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* LinkedIn Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>LinkedIn Accounts</CardTitle>
          <CardDescription>
            Accounts registered in this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAccountsLoading ? (
            <p className="text-gray-500">Loading accounts...</p>
          ) : accounts && accounts.length > 0 ? (
            <div className="divide-y">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-mono text-sm font-medium">
                      {account.profileSlug}
                    </p>
                    <p className="text-xs text-gray-500">
                      Status: {account.status ?? "unknown"}
                    </p>
                    {account.profileUrl && (
                      <a
                        href={account.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        View Profile
                      </a>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(account.id)}
                    disabled={removeMutation.isPending}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No accounts registered yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
