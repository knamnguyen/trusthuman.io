"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useOrganization } from "@clerk/nextjs";
import { faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, Copy, Loader2, RefreshCw } from "lucide-react";
import { siFacebook, siThreads, siX } from "simple-icons";
import { toast } from "sonner";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@sassy/ui/collapsible";
import { Input } from "@sassy/ui/input";
import { Label } from "@sassy/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@sassy/ui/table";
import { Textarea } from "@sassy/ui/textarea";

import { useTRPC } from "~/trpc/react";

export default function EarnPremiumPage() {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const { organization } = useOrganization();
  const trpc = useTRPC();

  // State
  const [caption, setCaption] = useState("");
  const [postUrl, setPostUrl] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<
    "x" | "linkedin" | "threads" | "facebook"
  >("x");
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  // Mutations
  const submitMutation = useMutation(
    trpc.socialReferral.submit.mutationOptions({}),
  );

  const generateCaptionMutation = useMutation(
    trpc.socialReferral.generateCaption.mutationOptions({}),
  );

  // Queries
  const { data: premiumStatus } = useQuery({
    ...trpc.socialReferral.getEarnedPremiumStatus.queryOptions(),
    enabled: !!organization?.id,
  });

  const { data: submissions, refetch: refetchSubmissions } = useQuery({
    ...trpc.socialReferral.list.queryOptions({ limit: 10, offset: 0 }),
    enabled: !!organization?.id,
    refetchInterval: (query) => {
      // Auto-refresh every 3 seconds if there are any VERIFYING submissions
      const hasVerifying = query.state.data?.some(
        (s) => s.status === "VERIFYING",
      );
      return hasVerifying ? 3000 : false;
    },
  });

  /**
   * Copy caption to clipboard
   */
  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      toast.success("Caption copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy caption");
    }
  };

  // Share handlers
  const handleShareX = async () => {
    await handleCopyCaption();
    const encodedText = encodeURIComponent(caption);
    const shareUrl = `https://x.com/intent/tweet?text=${encodedText}`;
    window.open(shareUrl, "_blank", "width=550,height=420");
  };

  const handleShareLinkedIn = async () => {
    await handleCopyCaption();
    const url = encodeURIComponent(window.location.origin);
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite?mini=true&url=${url}`;
    window.open(shareUrl, "_blank", "width=550,height=420");
    toast.info("Paste your caption in the LinkedIn share dialog");
  };

  const handleShareThreads = async () => {
    await handleCopyCaption();
    const encodedText = encodeURIComponent(caption);
    const shareUrl = `https://www.threads.net/intent/post?text=${encodedText}`;
    window.open(shareUrl, "_blank", "width=550,height=420");
  };

  const handleShareFacebook = async () => {
    await handleCopyCaption();
    const url = encodeURIComponent(window.location.origin);
    const shareUrl = `https://www.facebook.com/share_channel/?type=reshare&link=${url}&app_id=542599432471018&source_surface=external_reshare&display=page`;
    window.open(shareUrl, "_blank", "width=550,height=420");
    toast.info("Paste your caption in the Facebook share dialog");
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postUrl.trim()) {
      toast.error("Please enter a post URL");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        platform: selectedPlatform,
        postUrl: postUrl.trim(),
      });

      toast.success("Submission received! Verification in progress...");
      setPostUrl("");
      void refetchSubmissions();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit post",
      );
    }
  };

  const truncateUrl = (url: string, maxLength = 40): string => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + "...";
  };

  /**
   * Auto-detect platform from URL
   */
  const detectPlatform = (
    url: string,
  ): "x" | "linkedin" | "threads" | "facebook" | null => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("x.com") || lowerUrl.includes("twitter.com")) {
      return "x";
    }
    if (lowerUrl.includes("linkedin.com")) {
      return "linkedin";
    }
    if (lowerUrl.includes("threads.net") || lowerUrl.includes("threads.com")) {
      return "threads";
    }
    if (lowerUrl.includes("facebook.com")) {
      return "facebook";
    }
    return null;
  };

  /**
   * Handle URL input change - auto-detect platform
   */
  const handleUrlChange = (url: string) => {
    setPostUrl(url);
    const detected = detectPlatform(url);
    if (detected) {
      setSelectedPlatform(detected);
    }
  };

  /**
   * Generate a new caption
   */
  const handleGenerateCaption = async () => {
    try {
      const result = await generateCaptionMutation.mutateAsync();
      setCaption(result.caption);
      if (result.success) {
        toast.success("New caption generated!");
      } else {
        toast.warning("Used fallback caption");
      }
    } catch (error) {
      toast.error("Failed to generate caption");
    }
  };

  /**
   * Check if caption has required keywords
   */
  const getCaptionWarning = (): string | null => {
    if (!caption.trim()) return null;

    const hasAtKeyword = caption.includes("@engagekit_io");
    const hasHashKeyword = caption.includes("#engagekit_io");

    if (!hasAtKeyword && !hasHashKeyword) {
      return "⚠️ Caption must include @engagekit_io or #engagekit_io";
    }
    if (!hasAtKeyword) {
      return "⚠️ Caption should include @engagekit_io for X/Threads posts";
    }
    if (!hasHashKeyword) {
      return "⚠️ Caption should include #engagekit_io for LinkedIn/Facebook posts";
    }
    return null;
  };

  // Generate caption on mount
  React.useEffect(() => {
    if (organization?.id && !caption) {
      void handleGenerateCaption();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.id]);

  return (
    <div className="flex h-screen flex-col overflow-y-auto bg-gray-50 p-6">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Earn Premium Access
            </h1>
            <p className="text-gray-600">
              Share EngageKit on social media and earn free premium days!
            </p>
          </div>
          {/* Status badge - different for FREE vs PREMIUM orgs */}
          {premiumStatus?.isPaidPremium && premiumStatus.totalCreditsEarned > 0 && (
            <div className="rounded-full border border-blue-600 bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
              💰 ${premiumStatus.totalCreditsDollars.toFixed(2)} credits earned
            </div>
          )}
          {!premiumStatus?.isPaidPremium && premiumStatus?.isActive && (
            <div className="rounded-full border border-green-600 bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
              🎉 Premium Earned Active: {premiumStatus.daysRemaining} days
              remaining
            </div>
          )}
        </div>

        {/* How It Works - Collapsible Card */}
        <Collapsible open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <CardTitle>How It Works</CardTitle>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform duration-200 ${
                      howItWorksOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Rewards Section */}
                    <div>
                      <h3 className="mb-2 font-semibold text-gray-900">
                        🎁 Rewards
                      </h3>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>
                          • <strong>+1 day</strong> for each verified post (base
                          reward)
                        </li>
                        <li>
                          • <strong>+1 day</strong> bonus if post gets 10+ likes
                        </li>
                        <li>
                          • <strong>+1 day</strong> bonus if post gets 5+
                          comments
                        </li>
                        <li>
                          • <strong>Max 3 days</strong> per post
                        </li>
                        <li>
                          • Posts rescanned every 24 hours (3 scans total) to
                          capture growing engagement
                        </li>
                        <li>
                          • FREE users: Premium access extends from current
                          expiration
                        </li>
                        <li>
                          • PREMIUM users: Earn Stripe credits ($1.00/day)
                          applied to your next invoice
                        </li>
                      </ul>
                    </div>

                    {/* Verification Rules Section */}
                    <div>
                      <h3 className="mb-2 font-semibold text-gray-900">
                        ✅ Verification Rules
                      </h3>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>
                          • <strong>X/Threads:</strong> Must include{" "}
                          <code className="rounded bg-gray-100 px-1 py-0.5">
                            @engagekit_io
                          </code>
                        </li>
                        <li>
                          • <strong>LinkedIn/Facebook:</strong> Must include{" "}
                          <code className="rounded bg-gray-100 px-1 py-0.5">
                            #engagekit_io
                          </code>
                        </li>
                        <li>
                          • Verification happens immediately after submission
                        </li>
                        <li>• Post must be public and accessible</li>
                      </ul>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Limits Section */}
                    <div>
                      <h3 className="mb-2 font-semibold text-gray-900">
                        ⚖️ Limits
                      </h3>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• 2 posts per platform per week</li>
                        <li>• 14 days maximum per month</li>
                        <li>
                          • Earned premium only for organizations with 1
                          LinkedIn account
                        </li>
                        <li>
                          • Posts must be public and remain live to keep rewards
                        </li>
                      </ul>
                    </div>

                    {/* Invalid Reasons Section */}
                    <div>
                      <h3 className="mb-2 font-semibold text-gray-900">
                        ❌ Why Posts Fail
                      </h3>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>
                          • Missing required keyword (@engagekit_io or
                          #engagekit_io)
                        </li>
                        <li>
                          • Caption too similar (&gt;95%) to recent post (last 7
                          days, same platform)
                        </li>
                        <li>• Post deleted or made private</li>
                        <li>
                          • Duplicate submission (already submitted this URL)
                        </li>
                        <li>
                          • Not eligible (organization has multiple accounts)
                        </li>
                        <li>
                          • Rate limit exceeded (already submitted to this
                          platform today)
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Row 1: Write & Share + Submit */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Write & Share */}
          <Card>
            <div className="flex gap-1">
              <div className="flex-1">
                <CardHeader>
                  <CardTitle>
                    Step 1 - Post caption with word{" "}
                    <span className="font-bold text-pink-600">
                      @engagekit_io
                    </span>{" "}
                    or{" "}
                    <span className="font-bold text-pink-600">
                      #engagekit_io
                    </span>{" "}
                  </CardTitle>
                  <CardDescription>
                    X/Threads must include the exact word{" "}
                    <span className="font-semibold">@engagekit_io</span>
                    <br />
                    LinkedIn/Facebook must include the exact word{" "}
                    <span className="font-semibold">#engagekit_io</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleGenerateCaption}
                        disabled={generateCaptionMutation.isPending}
                        title="Regenerate caption"
                      >
                        <RefreshCw
                          className={`h-3.5 w-3.5 ${generateCaptionMutation.isPending ? "animate-spin" : ""}`}
                        />
                      </Button>
                      <Label>Sample caption (you can edit this)</Label>
                    </div>
                    <Textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={6}
                      className="mt-2 font-mono text-sm"
                      placeholder="Generating caption..."
                    />
                    {getCaptionWarning() && (
                      <p className="mt-2 text-sm text-amber-600">
                        {getCaptionWarning()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </div>

              {/* Social buttons - vertical stack, aligned to top of card */}
              <div className="flex flex-col justify-center gap-1.5 pr-6">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleCopyCaption}
                  title="Copy caption"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleShareX}
                  title="Share on X"
                >
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d={siX.path} />
                  </svg>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleShareLinkedIn}
                  title="Share on LinkedIn"
                >
                  <FontAwesomeIcon
                    icon={faLinkedin}
                    className="h-4 w-4 text-black"
                  />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleShareThreads}
                  title="Share on Threads"
                >
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d={siThreads.path} />
                  </svg>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleShareFacebook}
                  title="Share on Facebook"
                >
                  <svg
                    role="img"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d={siFacebook.path} />
                  </svg>
                </Button>
              </div>
            </div>
          </Card>

          {/* Submit */}
          <Card>
            <CardHeader>
              <CardTitle>
                Step 2 - Paste the link to your post to earn immediate days here
              </CardTitle>
              <CardDescription>
                Platform will be auto-detected from URL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="postUrl">Post URL</Label>
                  <Input
                    id="postUrl"
                    type="url"
                    placeholder="Paste your share link here..."
                    value={postUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    className="mt-2"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Supported: X, LinkedIn, Threads, Facebook
                  </p>
                  {postUrl && selectedPlatform && (
                    <p className="mt-1 text-xs font-medium text-blue-600">
                      Detected platform:{" "}
                      {selectedPlatform === "x"
                        ? "X (Twitter)"
                        : selectedPlatform.charAt(0).toUpperCase() +
                          selectedPlatform.slice(1)}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Submission History Table */}
        <Card>
          <CardHeader>
            <CardTitle>Share Submission History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reward</TableHead>
                    <TableHead>Likes</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead className="min-w-[200px]">
                      Post Content
                    </TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!submissions || submissions.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-8 text-center text-sm text-gray-500"
                      >
                        You haven't submitted any posts yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <a
                            href={submission.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 capitalize hover:underline"
                          >
                            {submission.platform.toLowerCase()}
                          </a>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                              submission.status === "VERIFIED"
                                ? "bg-green-100 text-green-800"
                                : submission.status === "FAILED"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {submission.status === "VERIFYING" && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                            {submission.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          {submission.awardType === "STRIPE_CREDIT" ? (
                            <span className="text-blue-600">
                              ${((submission.creditAmountCents ?? 0) / 100).toFixed(2)}
                            </span>
                          ) : submission.daysAwarded > 0 ? (
                            <span>
                              {submission.daysAwarded} day{submission.daysAwarded !== 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>{submission.likes}</TableCell>
                        <TableCell>{submission.comments}</TableCell>
                        <TableCell>
                          <div className="max-h-12 max-w-xs overflow-y-auto text-xs text-gray-600">
                            {submission.postText || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(
                            submission.submittedAt,
                          ).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
