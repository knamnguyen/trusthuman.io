"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";
import { Separator } from "@sassy/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sassy/ui/table";
import { Textarea } from "@sassy/ui/textarea";
import { cn } from "@sassy/ui/utils";

import { useOrgSubscription } from "~/hooks/use-org-subscription";
import { useTRPC } from "~/trpc/react";

export default function ProfileListRunPage() {
  const params = useParams<{ runId: string }>();
  const router = useRouter();
  const trpc = useTRPC();
  const { data } = useOrgSubscription();
  const subscriptionTier = data?.subscriptionTier ?? "FREE";

  const { data: runDetails } = useQuery({
    ...trpc.profileImport.getRunDetails.queryOptions({ id: params.runId }),
    enabled: !!params.runId,
    refetchInterval: 5000,
  });

  const { data: statusData } = useQuery({
    ...trpc.profileImport.checkRunStatus.queryOptions({ id: params.runId }),
    enabled: !!params.runId,
    refetchInterval: 3000,
  });

  const { data: profiles } = useQuery({
    ...trpc.profileImport.listProfilesForRun.queryOptions({ id: params.runId }),
    enabled: !!params.runId && statusData?.status === "FINISHED",
  });

  const stopRun = useMutation(
    trpc.profileImport.stopRun.mutationOptions({
      onSuccess: () => {
        // will reflect on next poll
      },
    }),
  );

  const urls = runDetails?.urls ?? [];
  const failed = runDetails?.urlsFailed ?? [];
  const status = statusData?.status ?? "PENDING";
  const succeededCount = statusData?.succeeded ?? 0;
  const failedCount = statusData?.failed ?? 0;

  const onExportCsv = React.useCallback(() => {
    if (!profiles || profiles.length === 0) return;
    const header = ["fullName", "urn", "linkedinUrl", "headline", "profilePic"];
    const rows = profiles.map((p) => [
      p.fullName,
      p.profileUrn,
      p.profileUrl,
      p.headline,
      p.profilePhotoUrl,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `profiles-${params.runId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [profiles, params.runId]);

  return (
    <div className="bg-zinc-50 text-black">
      <div className="container mx-auto max-w-7xl px-4 py-8 md:px-8">
        {/* Hero Row */}
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-3">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div className="text-sm text-zinc-600">
              Subscription:
              <span className="pl-1 font-medium uppercase">{subscriptionTier}</span>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
              LinkedIn Profile Data Scraper
            </h1>
          </div>
          <div className="flex justify-start md:justify-end">
            <Badge variant="secondary">
              Only available to premium users of EngageKit
            </Badge>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left Column: Read-only Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Imported URLs ({urls.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  readOnly
                  value={!runDetails ? "Loading..." : urls.join("\n")}
                  className="min-h-[300px]"
                />
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/profile-import")}
                  >
                    Go back
                  </Button>
                </div>
                {failed.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-sm font-medium">
                      Failed URLs ({failed.length})
                    </div>
                    <div className="max-h-[240px] space-y-1 overflow-auto pr-1 text-sm text-zinc-600">
                      {failed.map((u: string, i: number) => (
                        <div key={`${u}-${i}`}>{u}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Results only */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Results · status: {status} · succeeded: {succeededCount} ·
                failed: {failedCount}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {status !== "FINISHED" && (
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm text-zinc-600">
                    Scraping in progress... results will appear here once
                    finished.
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={stopRun.isPending}
                      onClick={() => stopRun.mutate({ id: params.runId })}
                    >
                      Stop Run
                    </Button>
                  </div>
                </div>
              )}

              {status === "FINISHED" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      Profiles ({profiles?.length ?? 0})
                    </div>
                    <Button
                      size="sm"
                      onClick={onExportCsv}
                      disabled={!profiles || profiles.length === 0}
                    >
                      Export CSV
                    </Button>
                  </div>
                  <div className="max-h-[560px] overflow-auto pr-1">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>URN</TableHead>
                          <TableHead>LinkedIn URL</TableHead>
                          <TableHead>Headline</TableHead>
                          <TableHead>Profile Pic</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(profiles ?? []).map((p, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{p.fullName}</TableCell>
                            <TableCell>{p.profileUrn}</TableCell>
                            <TableCell>
                              <a
                                href={p.profileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={cn("text-blue-600 hover:underline")}
                              >
                                {p.profileUrl}
                              </a>
                            </TableCell>
                            <TableCell>{p.headline}</TableCell>
                            <TableCell>
                              {p.profilePhotoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={p.profilePhotoUrl}
                                  alt="avatar"
                                  className="h-8 w-8 rounded-full"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-zinc-200" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
