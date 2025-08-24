"use client";

import * as React from "react";
import { UserButton } from "@clerk/nextjs";

import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";
import { Separator } from "@sassy/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sassy/ui/table";
import { Textarea } from "@sassy/ui/textarea";
import { cn } from "@sassy/ui/utils";

import { useSubscription } from "~/hooks/use-subscription";

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
  const { hasAccess, accessType, isLoading } = useSubscription();
  const [rawInput, setRawInput] = React.useState<string>("");
  const [scrapedUrls, setScrapedUrls] = React.useState<string[]>([]);

  const onScrape = React.useCallback(() => {
    if (!hasAccess) return;
    const urls = normalizeUrls(rawInput);
    setScrapedUrls(urls);
  }, [hasAccess, rawInput]);

  return (
    <div className="bg-zinc-50 text-black">
      <div className="container mx-auto max-w-7xl px-4 py-8 md:px-8">
        {/* Hero Row */}
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-3">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div className="text-sm text-zinc-600">
              Subscription:
              <span className="pl-1 font-medium uppercase">{accessType}</span>
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
              <div className="space-y-4">
                <Textarea
                  placeholder={
                    "https://linkedin.com/in/example\nhttps://www.linkedin.com/in/another"
                  }
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  className="min-h-[300px]"
                />
                <div className="flex items-center gap-3">
                  <Button onClick={onScrape} disabled={!hasAccess || isLoading}>
                    Scrape LinkedIn data
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

          {/* Right Column: Preview */}
          {scrapedUrls.length === 0 ? (
            <Card className="flex min-h-[360px] items-center justify-center">
              <CardContent className="p-6">
                <div className="text-center text-zinc-500">No data yet</div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption>Scraped input preview</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Index</TableHead>
                      <TableHead>URL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scrapedUrls.map((url, index) => (
                      <TableRow key={`${url}-${index}`}>
                        <TableCell className="text-zinc-700">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className={cn("text-blue-600 hover:underline")}
                          >
                            {url}
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
