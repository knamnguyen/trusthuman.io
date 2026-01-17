"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
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

export default function AccountsPage() {
  const [profileUrl, setProfileUrl] = useState("");
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Get org from Clerk - OrgLayout ensures slug matches before rendering
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const orgId = organization?.id;

  // Custom query keys scoped to orgId - prevents stale data when switching orgs
  const {
    data: currentOrg,
    isLoading: isOrgLoading,
    error: orgError,
  } = useQuery({
    ...trpc.organization.getCurrent.queryOptions(),
    enabled: !!orgId,
  });

  const accountsQuery = useQuery({
    ...trpc.account.listByOrg.queryOptions(),
    enabled: !!orgId,
  });
  const { data: accounts, isLoading: isAccountsLoading } = accountsQuery;

  // Register new account mutation
  const registerMutation = useMutation({
    ...trpc.account.registerByUrl.mutationOptions(),
    onSuccess: (data) => {
      setProfileUrl("");
      // Invalidate account queries to refresh list
      void queryClient.invalidateQueries({
        queryKey: trpc.account.listByOrg.queryKey(),
      });
      // Navigate to the newly created account
      if (data.profileSlug) {
        router.push(`/${orgSlug}/${data.profileSlug}`);
      }
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
    if (!profileUrl.trim()) return;

    registerMutation.mutate({
      profileUrl: profileUrl.trim(),
    });
  };

  const handleRemove = (accountId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeMutation.mutate({ accountId });
  };

  // Show loading while Clerk org loads or org data fetches
  if (!isOrgLoaded) {
    return (
      <div className="min-h-dvh bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500">
                Loading organization...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (orgError) {
    return (
      <div className="min-h-dvh bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-red-500">
                Error loading organization: {orgError.message}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <div className="min-h-dvh bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          LinkedIn Accounts
        </h1>
        <p className="mb-6 text-gray-600">
          Manage LinkedIn accounts in your organization
        </p>

        <div className="flex flex-col gap-6">
          {/* Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle>Organization: {currentOrg.name}</CardTitle>
              <CardDescription>
                <span className="capitalize">{currentOrg.role}</span> •{" "}
                {accounts?.length ?? 0} / {currentOrg.purchasedSlots} account
                slots used
              </CardDescription>
            </CardHeader>
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
                    You've reached your account limit. Upgrade to add more
                    accounts.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* LinkedIn Accounts List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Accounts</CardTitle>
              <CardDescription>Click an account to manage it</CardDescription>
            </CardHeader>
            <CardContent>
              {isAccountsLoading ? (
                <p className="text-gray-500">Loading accounts...</p>
              ) : accounts && accounts.length > 0 ? (
                <div className="divide-y">
                  {accounts.map((account) => (
                    <Link
                      key={account.id}
                      href={`/${orgSlug}/${account.profileSlug}`}
                      className="flex items-center justify-between py-3 transition-colors hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-mono text-sm font-medium">
                          {account.profileSlug}
                        </p>
                        <p className="text-xs text-gray-500">
                          Status: {account.status ?? "unknown"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleRemove(account.id, e)}
                          disabled={removeMutation.isPending}
                        >
                          Remove
                        </Button>
                        <span className="text-gray-400">→</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No accounts registered yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
