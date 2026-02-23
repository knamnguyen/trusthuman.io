/**
 * Check Human Tab
 *
 * Allows users to check if a LinkedIn/X/Facebook profile is verified on TrustHuman.
 * - Auto-detects profile URL when on a profile page (data prefetched on page load)
 * - Manual input for pasting profile URLs
 * - Displays mini profile with verification history
 */

import { useState, useEffect } from "react";
import {
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldX,
  Flame,
  Award,
  Trophy,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";
import { Input } from "@sassy/ui/input";
import { trpc } from "@/lib/trpc-client";
import {
  useCheckHumanStore,
  detectCurrentProfileUrl,
} from "./stores/check-human-store";

// Re-export for sidebar to use
export { detectCurrentProfileUrl };

// Standardized activity type (same as profile page)
interface StandardizedActivity {
  id: string;
  type: "linkedin" | "x" | "facebook" | "threads" | "reddit" | "ph" | "github" | "hn";
  commentText: string;
  commentUrl: string | null;
  parentUrl: string | null;
  parentAuthorName: string;
  parentAuthorAvatarUrl: string;
  parentTextSnippet: string;
  verified: boolean;
  activityAt: Date | string;
  createdAt: Date | string;
}

interface TrustProfile {
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  humanNumber: number;
  totalVerifications: number;
  currentStreak: number;
  longestStreak: number;
  rank?: number;
  recentActivities: StandardizedActivity[];
}

/**
 * Parse a pasted URL into platform + canonical URL
 */
function parseProfileUrl(input: string): { platform: "linkedin" | "x" | "facebook"; profileUrl: string } | null {
  const trimmed = input.trim().toLowerCase();

  // LinkedIn patterns
  const linkedinMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([^/?]+)/);
  if (linkedinMatch) {
    return {
      platform: "linkedin",
      profileUrl: `linkedin.com/in/${linkedinMatch[1]}`,
    };
  }

  // X/Twitter patterns
  const xMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/([^/?]+)/);
  if (xMatch) {
    return {
      platform: "x",
      profileUrl: `x.com/${xMatch[1]}`,
    };
  }

  // Facebook patterns - store with full URL to match how verification stores it
  const facebookMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/([^/?]+)/);
  if (facebookMatch) {
    return {
      platform: "facebook",
      profileUrl: `https://www.facebook.com/${facebookMatch[1]}`,
    };
  }

  // Just @username - assume X
  if (trimmed.startsWith("@")) {
    return {
      platform: "x",
      profileUrl: `x.com/${trimmed.slice(1)}`,
    };
  }

  return null;
}

/**
 * Activity Card - displays a verified activity (same design as profile page)
 */
function ActivityCard({ activity }: { activity: StandardizedActivity }) {
  // Platform badge colors and labels
  const platformConfig: Record<string, { label: string; bgClass: string }> = {
    linkedin: { label: "LinkedIn", bgClass: "bg-[#0a66c2] text-white" },
    x: { label: "X", bgClass: "bg-black text-white" },
    facebook: { label: "Facebook", bgClass: "bg-[#1877f2] text-white" },
    threads: { label: "Threads", bgClass: "bg-black text-white" },
    reddit: { label: "Reddit", bgClass: "bg-[#ff4500] text-white" },
    ph: { label: "Product Hunt", bgClass: "bg-[#da552f] text-white" },
    github: { label: "GitHub", bgClass: "bg-[#24292f] text-white" },
    hn: { label: "HN", bgClass: "bg-[#ff6600] text-white" },
  };

  const platform = platformConfig[activity.type] || { label: activity.type, bgClass: "bg-gray-500 text-white" };

  // Get initials for avatar fallback
  const getInitials = (name: string | undefined | null): string => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "?";
    return (
      (parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")
    ).toUpperCase();
  };

  // Truncate text for preview
  const truncate = (text: string | undefined | null, maxLength: number): string => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  // Get the activity URL (prefer commentUrl, fallback to parentUrl)
  const getActivityUrl = (): string | undefined => {
    return activity.commentUrl || activity.parentUrl || undefined;
  };

  const handleViewActivity = () => {
    const url = getActivityUrl();
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <Card className={`relative ${activity.verified ? "ring-1 ring-primary/30" : "ring-1 ring-destructive/30"}`}>
      <CardContent className="flex flex-col gap-2 p-3">
        {/* Platform indicator + Author Header */}
        <div className="flex items-center gap-2">
          {/* Platform badge */}
          <div className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium ${platform.bgClass}`}>
            {platform.label}
          </div>

          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={activity.parentAuthorAvatarUrl || undefined} alt={activity.parentAuthorName} />
            <AvatarFallback className="text-[10px]">
              {getInitials(activity.parentAuthorName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium">
              {activity.parentAuthorName}
            </span>
            <span className="text-muted-foreground block truncate text-[10px]">
              {truncate(activity.parentTextSnippet, 50)}
            </span>
          </div>
          <Badge
            variant={activity.verified ? "default" : "destructive"}
            className="shrink-0 px-1.5 py-0 text-[10px]"
          >
            {activity.verified ? "Verified" : "Failed"}
          </Badge>
        </div>

        {/* User's comment text */}
        {activity.commentText && (
          <div className="bg-muted/30 rounded-md border p-2 text-sm line-clamp-3">
            {activity.commentText}
          </div>
        )}

        {/* Status + Actions Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Verification status + date */}
          <div className="flex items-center gap-2 text-xs">
            {activity.verified ? (
              <div className="flex items-center gap-1 text-primary">
                <CheckCircle2 className="h-3 w-3" />
                <span className="font-medium">Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-destructive">
                <XCircle className="h-3 w-3" />
                <span className="font-medium">Failed</span>
              </div>
            )}
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              {new Date(activity.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Action button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewActivity}
            disabled={!getActivityUrl()}
            className="h-7 gap-1 px-2 text-xs"
          >
            <ExternalLink className="h-3 w-3" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CheckHumanTab() {
  // Use store for prefetched data
  const { detectedProfile, result, isLoading, error, fetchProfile, clearResult } = useCheckHumanStore();

  // Local state for manual input
  const [inputValue, setInputValue] = useState(detectedProfile?.profileUrl || "");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualResult, setManualResult] = useState<{ found: boolean; trustProfile?: TrustProfile } | null>(null);

  // Sync input value with detected profile when it changes (SPA navigation)
  useEffect(() => {
    if (detectedProfile?.profileUrl) {
      setInputValue(detectedProfile.profileUrl);
      // Clear manual result when auto-detected profile changes
      setManualResult(null);
      setManualError(null);
    }
  }, [detectedProfile?.profileUrl]);

  // Use manual result if available, otherwise use prefetched result
  const displayResult = manualResult || result;
  const displayLoading = manualLoading || isLoading;
  const displayError = manualError || error;

  const handleCheck = async () => {
    const parsed = parseProfileUrl(inputValue);
    if (!parsed) {
      setManualError("Invalid profile URL. Enter a LinkedIn or X profile URL.");
      return;
    }

    // If checking the same profile as prefetched, use prefetched data
    if (
      detectedProfile &&
      parsed.platform === detectedProfile.platform &&
      parsed.profileUrl === detectedProfile.profileUrl &&
      result
    ) {
      return; // Already have the result
    }

    setManualLoading(true);
    setManualError(null);
    setManualResult(null);

    try {
      const lookupResult = await trpc.platformLink.lookupFullProfile.query({
        platform: parsed.platform,
        profileUrl: parsed.profileUrl,
      });

      if (lookupResult.found) {
        // Type assertion - API returns standardized format
        const trustProfile = lookupResult.trustProfile as unknown as TrustProfile;
        setManualResult({
          found: true,
          trustProfile,
        });
      } else {
        setManualResult({ found: false });
      }
    } catch (err) {
      console.error("TrustHuman: Lookup failed", err);
      setManualError("Failed to check profile. Please try again.");
    } finally {
      setManualLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !displayLoading) {
      handleCheck();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Clear manual result when input changes
    if (manualResult) {
      setManualResult(null);
      setManualError(null);
    }
  };

  const getInitials = (name: string | undefined | null): string => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "?";
    return ((parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Search Input */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="Paste LinkedIn, X, or Facebook URL..."
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button onClick={handleCheck} disabled={displayLoading || !inputValue.trim()}>
            {displayLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Auto-detect indicator */}
        {detectedProfile && (
          <p className="text-xs text-muted-foreground">
            Auto-detected: {detectedProfile.platform === "linkedin" ? "LinkedIn" : detectedProfile.platform === "facebook" ? "Facebook" : "X"} profile
          </p>
        )}

        {/* Error message */}
        {displayError && <p className="text-xs text-destructive">{displayError}</p>}
      </div>

      {/* Results */}
      {displayResult && (
        <div className="space-y-4">
          {displayResult.found && displayResult.trustProfile ? (
            <>
              {/* Profile Card */}
              <Card className="border-primary/30">
                <CardHeader className="pb-2 pt-3 px-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={displayResult.trustProfile.avatarUrl || undefined} />
                      <AvatarFallback>{getInitials(displayResult.trustProfile.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">
                          {displayResult.trustProfile.displayName || displayResult.trustProfile.username}
                        </h3>
                        <Badge variant="default" className="shrink-0 text-[10px] px-1.5 py-0">
                          <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
                          Human
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        #{displayResult.trustProfile.humanNumber} • Rank #{displayResult.trustProfile.rank || "—"}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3 px-3">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/50 rounded-lg p-1.5">
                      <div className="flex items-center justify-center gap-1">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        <span className="font-bold text-sm">{displayResult.trustProfile.totalVerifications}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">Verified</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-1.5">
                      <div className="flex items-center justify-center gap-1">
                        <Flame className="h-3.5 w-3.5 text-orange-500" />
                        <span className="font-bold text-sm">{displayResult.trustProfile.currentStreak}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">Streak</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-1.5">
                      <div className="flex items-center justify-center gap-1">
                        <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                        <span className="font-bold text-sm">{displayResult.trustProfile.longestStreak}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">Best</p>
                    </div>
                  </div>

                  {/* View Full Profile Link */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 gap-1.5 h-7 text-xs"
                    onClick={() => {
                      const baseUrl = import.meta.env.VITE_SYNC_HOST_URL || "https://trusthuman.io";
                      window.open(`${baseUrl}/${displayResult.trustProfile!.username}`, "_blank");
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Full Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Activities - using same card design as profile page */}
              {displayResult.trustProfile.recentActivities && displayResult.trustProfile.recentActivities.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Recent Verified Activity</h4>
                  {displayResult.trustProfile.recentActivities.slice(0, 5).map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Not Found Card */
            <Card className="border-muted">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <ShieldX className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="font-semibold">Not Verified</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This profile hasn't been verified on TrustHuman yet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!displayResult && !displayLoading && (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <Search className="h-8 w-8 mb-3 opacity-50" />
          <p className="text-sm">
            {detectedProfile
              ? "Loading profile..."
              : "Enter a LinkedIn, X, or Facebook URL to check verification status"}
          </p>
        </div>
      )}

      {/* Loading State (when prefetching) */}
      {displayLoading && !displayResult && (
        <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <Loader2 className="h-8 w-8 mb-3 animate-spin" />
          <p className="text-sm">Checking profile...</p>
        </div>
      )}
    </div>
  );
}
