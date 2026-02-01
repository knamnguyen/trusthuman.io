"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@sassy/ui/dialog";
import { Separator } from "@sassy/ui/separator";
import { Textarea } from "@sassy/ui/textarea";

import { useOrgSubscription } from "~/hooks/use-org-subscription";
import { useTRPC } from "~/trpc/react";

const normalizeUrls = (raw: string): string[] => {
  const candidates = raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const normalized = candidates.map((u) => {
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    return `https://${u}`;
  });
  return Array.from(new Set(normalized));
};

export default function ProfileImportPage() {
  const { data, isPending: isLoading } = useOrgSubscription();
  const hasAccess = data?.isPremium ?? false;
  const subscriptionTier = data?.subscriptionTier ?? "FREE";
  const trpc = useTRPC();
  const router = useRouter();
  const [rawInput, setRawInput] = React.useState<string>("");
  const createRun = useMutation(trpc.profileImport.createRun.mutationOptions());
  const retrieveOnly = useMutation(
    trpc.profileImport.createRetrieveOnly.mutationOptions({
      onSuccess: (res) => {
        const id = (res as { id: string }).id;
        if (id) router.push(`/profile-list/${id}`);
      },
    }),
  );
  const { data: previousRuns } = useQuery({
    ...trpc.profileImport.listRuns.queryOptions(),
    refetchInterval: 5000,
  });

  const isRun = (
    value: unknown,
  ): value is { id: string; createdAt: string | Date; urls: string[] } => {
    if (!value || typeof value !== "object") return false;
    const v = value as Record<string, unknown>;
    return (
      typeof v.id === "string" &&
      (typeof v.createdAt === "string" || v.createdAt instanceof Date) &&
      Array.isArray(v.urls) &&
      v.urls.every((u) => typeof u === "string")
    );
  };

  const previousRunItems = React.useMemo(() => {
    if (!Array.isArray(previousRuns))
      return [] as {
        id: string;
        createdAt: string | Date;
        urls: string[];
      }[];
    return previousRuns.filter(isRun);
  }, [previousRuns]);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingUrls, setPendingUrls] = React.useState<string[]>([]);

  const onScrapeClick = React.useCallback(() => {
    if (!hasAccess) return;
    const urls = normalizeUrls(rawInput);
    if (urls.length === 0) return;
    if (urls.length > 100) {
      // basic alert fallback (replace with toast system if available)
      alert("Maximum 100 URLs per run.");
      return;
    }
    setPendingUrls(urls);
    setConfirmOpen(true);
  }, [hasAccess, rawInput]);

  const onConfirm = React.useCallback(async () => {
    try {
      const res = (await createRun.mutateAsync({ urls: pendingUrls })) as {
        id: string;
      };
      if (res?.id) router.push(`/profile-list/${res.id}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg || "Unable to create run (possibly an existing active run).");
    } finally {
      setConfirmOpen(false);
    }
  }, [pendingUrls, createRun, router]);

  return (
    <>
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
            {/* Left Column: Input */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Paste URLs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[420px] space-y-4 overflow-auto pr-1">
                  <Textarea
                    placeholder={
                      "https://linkedin.com/in/example\nhttps://www.linkedin.com/in/another"
                    }
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    className="min-h-[300px]"
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={onScrapeClick}
                      disabled={!hasAccess || isLoading || createRun.isPending}
                    >
                      Scrape LinkedIn data
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const urls = normalizeUrls(rawInput);
                        if (urls.length === 0) return;
                        retrieveOnly.mutate({ urls });
                      }}
                      disabled={
                        !hasAccess || isLoading || retrieveOnly.isPending
                      }
                    >
                      Retrieve data, no scrape
                    </Button>
                    {!hasAccess && (
                      <span className="text-sm text-zinc-500">
                        Premium plan required to scrape
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Column: Previous Runs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Previous runs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[420px] overflow-auto pr-1">
                  {previousRunItems.length > 0 ? (
                    <ul className="space-y-3">
                      {previousRunItems.map((run: any) => (
                        <li key={run.id}>
                          <div className="flex items-center justify-between rounded-md border p-3">
                            <div>
                              <div className="text-sm font-medium">
                                {new Date(run.createdAt).toLocaleString()}
                              </div>
                              <div className="text-xs text-zinc-500">
                                {run.urls.length} links · status: {run.status} ·
                                succeeded: {run.succeededCount} · failed:{" "}
                                {run.failedCount}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() =>
                                router.push(`/profile-list/${run.id}`)
                              }
                            >
                              View
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center text-zinc-500">
                      No previous runs
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start new import run?</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-zinc-600">
            Only one run can be active at a time. This run will start
            immediately and continue in the background even if you close this
            page.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onConfirm} disabled={createRun.isPending}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
