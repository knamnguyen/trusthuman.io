"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";

import { useTRPC } from "~/trpc/react";

export default function AccountDashboardPage() {
  const { accountSlug } = useParams<{ accountSlug: string }>();
  const trpc = useTRPC();

  const { data: account } = useQuery(
    trpc.account.getBySlug.queryOptions({ slug: accountSlug }),
  );

  return (
    <div className="min-h-dvh bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Account Dashboard
        </h1>
        <p className="mb-6 text-gray-600">
          Overview for {account?.profileSlug ?? accountSlug}
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Account Info</CardTitle>
              <CardDescription>LinkedIn account details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="text-gray-500">Profile:</span>{" "}
                  {account?.profileSlug}
                </p>
                <p>
                  <span className="text-gray-500">Status:</span>{" "}
                  {account?.status ?? "Unknown"}
                </p>
                {account?.profileUrl && (
                  <a
                    href={account.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View LinkedIn Profile →
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Use the sidebar to navigate to different sections.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
