"use client";

import type { LucideProps } from "lucide-react";
import {
  forwardRef,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  LayoutGrid,
  Linkedin,
  ShieldCheck,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";
import { HeatmapCalendar } from "@sassy/ui/components/heatmap-calendar";

// Standardized activity type from backend (dates come as strings over tRPC)
type StandardizedActivity = {
  type: "linkedin" | "x" | "facebook" | "threads" | "reddit" | "ph" | "github" | "hn";
  id: string;
  commentText: string;
  commentUrl: string | null;
  parentUrl: string | null;
  parentAuthorName: string;
  parentAuthorAvatarUrl: string;
  parentTextSnippet: string;
  verified: boolean;
  activityAt: Date | string;
  createdAt: Date | string;
};
import { TrustBadge } from "@sassy/ui/components/trust-badge";
import { ExpandableTabs } from "@sassy/ui/expandable-tabs";
import { cn } from "@sassy/ui/utils";

import { Footer } from "~/app/_components/landing/footer";
import { Header } from "~/app/_components/landing/header";
import { useTRPC } from "~/trpc/react";
import { EmptyProfileState } from "./_components/EmptyProfileState";
import { ExtensionInstallModal } from "./_components/ExtensionInstallModal";
import { MiniLeaderboard } from "./_components/MiniLeaderboard";
import { ProfileSettingsSidebar } from "./_components/ProfileSettingsSidebar";

// Layout types
type ProfileLayout = "horizontal" | "vertical";

// X icon component (lucide-react doesn't have X/Twitter brand icon)
const XIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
);
XIcon.displayName = "XIcon";

// Facebook icon component
const FacebookIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      {...props}
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
);
FacebookIcon.displayName = "FacebookIcon";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "?";
  return (
    (parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")
  ).toUpperCase();
}

function formatHumanSince(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

// Platform filter tabs configuration
const PLATFORM_TABS = [
  { title: "All", icon: LayoutGrid },
  { title: "X", icon: XIcon },
  { title: "LinkedIn", icon: Linkedin },
  { title: "Facebook", icon: FacebookIcon },
];

// Map tab index to filter type
const TAB_TO_FILTER = ["all", "x", "linkedin", "facebook"] as const;
type PlatformFilter = (typeof TAB_TO_FILTER)[number];

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { username } = use(params);
  const trpc = useTRPC();

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Layout state - initialized from profile data, can be previewed locally
  const [layoutPreview, setLayoutPreview] = useState<ProfileLayout | null>(
    null,
  );

  // Badge image style preview state
  const [badgeImageStylePreview, setBadgeImageStylePreview] = useState<"logo" | "avatar" | null>(null);

  // Preview state for live editing
  const [previewValues, setPreviewValues] = useState<{
    displayName?: string;
    bio?: string;
  }>({});

  // Stable callback for preview changes
  const handlePreviewChange = useCallback(
    (values: { displayName?: string; bio?: string }) => {
      setPreviewValues(values);
    },
    [],
  );

  // Clear preview values when sidebar closes so we use actual profile data
  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    setPreviewValues({});
    setLayoutPreview(null); // Reset layout preview
    setBadgeImageStylePreview(null); // Reset badge image style preview
  }, []);

  // Platform filter state (index-based for ExpandableTabs)
  const [platformTabIndex, setPlatformTabIndex] = useState(0);
  const platformFilter = TAB_TO_FILTER[platformTabIndex] || "all";

  // Pagination state
  const [activities, setActivities] = useState<StandardizedActivity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasLoadedMore, setHasLoadedMore] = useState(false);

  // Fetch profile
  const { data: profile, isLoading } = useQuery({
    ...trpc.trustProfile.getByUsername.queryOptions({ username }),
  });

  // Fetch heatmap data
  const { data: heatmapData } = useQuery({
    ...trpc.trustProfile.getHeatmapData.queryOptions({ username }),
    enabled: !!profile,
  });

  // Fetch leaderboard for mini leaderboard component
  const { data: leaderboard } = useQuery({
    ...trpc.trustProfile.getLeaderboard.queryOptions({ limit: 10, offset: 0 }),
    enabled: !!profile,
  });

  // Load more activities
  const { refetch: loadMoreActivities, isFetching: isLoadingMore } = useQuery({
    ...trpc.trustProfile.getActivities.queryOptions({
      username,
      cursor: nextCursor || undefined,
      limit: 12,
    }),
    enabled: false, // Manual trigger only
  });

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !nextCursor) return;

    const result = await loadMoreActivities();
    if (result.data) {
      setActivities((prev) => [
        ...prev,
        ...(result.data.activities as StandardizedActivity[]),
      ]);
      setNextCursor(result.data.nextCursor ?? null);
      setHasLoadedMore(true);
    }
  }, [loadMoreActivities, isLoadingMore, nextCursor]);

  // Initialize activities from profile data
  const allActivities: StandardizedActivity[] = hasLoadedMore
    ? activities
    : ((profile?.recentActivities ?? []) as StandardizedActivity[]);

  // Filter activities by platform
  const displayActivities = useMemo(() => {
    if (platformFilter === "all") return allActivities;
    // Filter by new standardized type: "linkedin" | "x" | "facebook" | etc
    return allActivities.filter((a) => a.type === platformFilter);
  }, [allActivities, platformFilter]);

  // Initialize nextCursor when profile loads (after first page)
  const initialNextCursor =
    profile?.recentActivities && profile.recentActivities.length >= 20
      ? profile.recentActivities[profile.recentActivities.length - 1]?.id
      : null;

  // Computed layout value: preview (if editing) -> profile data -> default
  const layout: ProfileLayout =
    layoutPreview ?? profile?.defaultLayout ?? "horizontal";
  const isVertical = layout === "vertical";

  // Handler for layout preview in sidebar
  const handleLayoutPreview = useCallback((newLayout: ProfileLayout) => {
    setLayoutPreview(newLayout);
  }, []);

  // Handler for badge image style preview in sidebar
  const handleBadgeImageStylePreview = useCallback((style: "logo" | "avatar") => {
    setBadgeImageStylePreview(style);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-card text-foreground min-h-screen">
        <Header />
        <main className="container mx-auto max-w-6xl px-4 pt-24 pb-16">
          <div className="flex flex-col items-center gap-6">
            <div className="bg-muted/50 h-32 w-32 animate-pulse rounded-full" />
            <div className="bg-muted/50 h-8 w-48 animate-pulse rounded" />
            <div className="bg-muted/50 h-4 w-32 animate-pulse rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-card text-foreground min-h-screen">
        <Header />
        <main className="container mx-auto max-w-6xl px-4 pt-24 pb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold">Profile Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The user @{username} doesn't exist or hasn't verified yet.
          </p>
          <Button asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </main>
      </div>
    );
  }

  // Compute display values (use preview if editing, otherwise use profile data)
  const displayName =
    isSidebarOpen && previewValues.displayName !== undefined
      ? previewValues.displayName
      : profile.displayName;
  const displayBio =
    isSidebarOpen && previewValues.bio !== undefined
      ? previewValues.bio
      : profile.bio;

  return (
    <div className="bg-card text-foreground min-h-screen">
      <Header />

      {/* Main Content - add right margin when sidebar is open */}
      <main
        className={cn(
          "pt-16 transition-all duration-200",
          isSidebarOpen && profile.isOwner && "mr-[360px]",
        )}
      >
        <div className="container mx-auto max-w-6xl px-4 py-8">
          {/* Profile Header Section - switches based on layout */}
          <div
            className={`flex flex-col ${!isVertical ? "lg:flex-row lg:items-start" : ""} gap-8 ${isVertical ? "items-center" : ""}`}
          >
            {/* Profile Info Section - sticky in horizontal layout */}
            <div
              className={`flex flex-col gap-4 ${!isVertical ? "shrink-0 items-center lg:sticky lg:top-20 lg:w-80 lg:items-start" : "items-center"}`}
            >
              {/* Avatar */}
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>

              {/* Display Name + Human Badge */}
              <div
                className={`flex flex-wrap items-center gap-2 ${!isVertical ? "justify-center lg:justify-start" : "justify-center"}`}
              >
                <h1 className="text-2xl font-bold">
                  {displayName || profile.username}
                </h1>
                <Badge
                  variant="default"
                  className="h-5 shrink-0 px-1.5 py-0 text-[10px]"
                >
                  <ShieldCheck className="mr-0.5 h-3 w-3" />
                  Human
                </Badge>
              </div>

              {/* Full TrustBadge - the big seal */}
              <TrustBadge
                humanNumber={profile.humanNumber}
                totalVerified={profile.totalVerifications}
                username={profile.username}
                variant="full"
                logoUrl="/trusthuman-logo.png"
                avatarUrl={
                  (badgeImageStylePreview ?? profile.badgeImageStyle) === "avatar"
                    ? profile.avatarUrl || undefined
                    : undefined
                }
                baseUrl={
                  typeof window !== "undefined"
                    ? window.location.origin
                    : "https://trusthuman.io"
                }
              />

              {/* Username, Date, Platform Links - all in one row */}
              <div
                className={`text-muted-foreground flex flex-wrap items-center gap-3 text-sm ${!isVertical ? "justify-center lg:justify-start" : "justify-center"}`}
              >
                <span>@{profile.username}</span>
                <span className="text-muted-foreground/50">·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Human since {formatHumanSince(profile.createdAt)}
                </span>
                {profile.platformLinks && profile.platformLinks.length > 0 && (
                  <>
                    <span className="text-muted-foreground/50">·</span>
                    {profile.platformLinks
                      .filter((link) => ["linkedin", "x", "facebook"].includes(link.platform))
                      .map((link, idx) => (
                      <span
                        key={`${link.platform}-${link.profileHandle}`}
                        className="flex items-center gap-1"
                      >
                        {idx > 0 && (
                          <span className="text-muted-foreground/50 mr-1">
                            ·
                          </span>
                        )}
                        <a
                          href={link.profileUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          {link.platform === "linkedin" ? (
                            <Linkedin className="h-3.5 w-3.5 text-[#0a66c2]" />
                          ) : link.platform === "facebook" ? (
                            <FacebookIcon size={14} className="text-[#1877f2]" />
                          ) : (
                            <span className="text-xs font-bold">X</span>
                          )}
                          <span>@{link.profileHandle}</span>
                        </a>
                      </span>
                    ))}
                  </>
                )}
              </div>

              {/* Bio Section - separate */}
              {displayBio && (
                <div className={`w-full ${isVertical ? "max-w-md" : ""} pt-2`}>
                  <p
                    className={`text-muted-foreground text-sm ${isVertical ? "text-center" : ""}`}
                  >
                    {displayBio}
                  </p>
                </div>
              )}
            </div>

            {/* Stats + Heatmap + Leaderboard Section OR Empty State */}
            {profile.totalVerifications === 0 ? (
              /* Empty Profile State - shown when user has no verified activity */
              <div className={`min-w-0 ${!isVertical ? "flex-1" : "w-full max-w-4xl"}`}>
                <EmptyProfileState
                  username={profile.username}
                  displayName={profile.displayName}
                  isOwner={profile.isOwner}
                />
              </div>
            ) : (
            /* Normal Stats + Heatmap + Leaderboard Section */
            <div
              className={`min-w-0 ${!isVertical ? "flex-1" : "w-full max-w-4xl"}`}
            >
              {/* Mobile: Stack vertically, Desktop: Side by side */}
              <div className="flex flex-col lg:flex-row lg:items-stretch gap-4">
                {/* Left: Stats cards + Heatmap (no wrapper) */}
                <div className="min-w-0 flex-1 space-y-4">
                  {/* Stats Cards Row - 2x2 on mobile, 4 cols on desktop */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    <Card>
                      <CardContent className="pt-2 pb-2 sm:pt-3 sm:pb-3 text-center">
                        <div className="text-primary text-xl sm:text-2xl font-bold">
                          #{profile.rank}
                        </div>
                        <div className="text-muted-foreground text-[9px] sm:text-[10px]">
                          🌍 Human Rank
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-2 pb-2 sm:pt-3 sm:pb-3 text-center">
                        <div className="text-xl sm:text-2xl font-bold">
                          {profile.totalVerifications}
                        </div>
                        <div className="text-muted-foreground text-[9px] sm:text-[10px]">
                          ✅ Verified Actions
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-2 pb-2 sm:pt-3 sm:pb-3 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-orange-500">
                          {profile.currentStreak}
                        </div>
                        <div className="text-muted-foreground text-[9px] sm:text-[10px]">
                          🔥 Day Streak
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-2 pb-2 sm:pt-3 sm:pb-3 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-yellow-500">
                          {profile.longestStreak}
                        </div>
                        <div className="text-muted-foreground text-[9px] sm:text-[10px]">
                          ⭐ Best Streak
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Heatmap - uses its own internal card, scrollable on mobile */}
                  <div className="overflow-x-auto">
                    <HeatmapCalendar
                      title={`📅 Verification Activity ${new Date().getFullYear()}`}
                      data={heatmapData || []}
                      startDate={new Date(new Date().getFullYear(), 0, 1)}
                      endDate={new Date(new Date().getFullYear(), 11, 31)}
                      cellSize={10}
                      cellGap={2}
                      levelClassNames={[
                        "bg-muted border border-border/50",
                        "bg-primary/25",
                        "bg-primary/50",
                        "bg-primary/75",
                        "bg-primary",
                      ]}
                      legend={{
                        placement: "bottom",
                        lessText: "Less",
                        moreText: "More",
                      }}
                      axisLabels={{
                        showMonths: true,
                        showWeekdays: true,
                        weekdayIndices: [1, 3, 5],
                      }}
                      renderTooltip={(cell) => (
                        <div className="text-sm">
                          <div className="font-medium">
                            {cell.value}{" "}
                            {cell.value === 1 ? "verification" : "verifications"}
                          </div>
                          <div className="text-muted-foreground">
                            {cell.label}
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </div>

                {/* Right: Mini Leaderboard - full width on mobile, fixed width on desktop */}
                <div className="w-full lg:w-56 shrink-0 lg:self-stretch">
                  <MiniLeaderboard
                    leaderboard={leaderboard ?? null}
                    currentProfile={{
                      username: profile.username,
                      humanNumber: profile.humanNumber,
                      totalVerifications: profile.totalVerifications,
                      rank: profile.rank,
                      avatarUrl: profile.avatarUrl,
                      displayName: profile.displayName,
                    }}
                  />
                </div>
              </div>

              {/* Recent Activity Section - aligned with stats/heatmap/leaderboard */}
              <Card className="mt-4">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>💬 Verified Human Actions</CardTitle>

                  {/* Platform Filter - ExpandableTabs */}
                  <ExpandableTabs
                    tabs={PLATFORM_TABS}
                    value={platformTabIndex}
                    onChange={setPlatformTabIndex}
                  />
                </CardHeader>
                <CardContent>
                  {displayActivities.length > 0 ? (
                    <>
                      {/* True masonry with CSS columns */}
                      <div className="columns-1 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
                        {displayActivities.map((activity) => {
                          // Standardized activity format from backend
                          const authorName = activity.parentAuthorName || "Unknown";
                          const authorAvatar = activity.parentAuthorAvatarUrl;
                          const contentSnippet = activity.parentTextSnippet;
                          const activityUrl = activity.commentUrl || activity.parentUrl;

                          return (
                            <div
                              key={activity.id}
                              className="mb-4 break-inside-avoid-column"
                            >
                              <Card
                                className={`overflow-hidden ${
                                  activity.verified
                                    ? "ring-primary/30 ring-1"
                                    : "ring-destructive/30 ring-1"
                                }`}
                              >
                                <CardContent className="space-y-3 p-4">
                                  {/* Header: Platform + Verified badge */}
                                  <div className="flex items-center justify-between">
                                    <Badge
                                      variant="outline"
                                      className={`px-1.5 py-0 text-[10px] ${
                                        activity.type === "x"
                                          ? "border-black bg-black text-white"
                                          : activity.type === "linkedin"
                                            ? "border-[#0a66c2] bg-[#0a66c2] text-white"
                                            : activity.type === "facebook"
                                              ? "border-[#1877f2] bg-[#1877f2] text-white"
                                              : "border-gray-500 bg-gray-500 text-white"
                                      }`}
                                    >
                                      {activity.type === "x" ? "X" : activity.type === "linkedin" ? "LinkedIn" : activity.type === "facebook" ? "Facebook" : activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                                    </Badge>
                                    <Badge
                                      variant={
                                        activity.verified
                                          ? "default"
                                          : "destructive"
                                      }
                                      className="px-1.5 py-0 text-[10px]"
                                    >
                                      {activity.verified
                                        ? "Verified"
                                        : "Failed"}
                                    </Badge>
                                  </div>

                                  {/* Original post/tweet context - what user replied to */}
                                  <div className="bg-muted/30 border-muted-foreground/30 rounded-lg border-l-2 p-3">
                                    <div className="mb-1.5 flex items-center gap-2">
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage
                                          src={authorAvatar || undefined}
                                        />
                                        <AvatarFallback className="text-[8px]">
                                          {getInitials(authorName)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="truncate text-xs font-medium">
                                        {authorName}
                                      </span>
                                    </div>
                                    {contentSnippet && (
                                      <p className="text-muted-foreground line-clamp-2 text-xs">
                                        {contentSnippet}
                                      </p>
                                    )}
                                  </div>

                                  {/* User's reply/comment - prominent */}
                                  <div>
                                    <div className="text-muted-foreground mb-1.5 flex items-center gap-1 text-xs">
                                      <CheckCircle2 className="text-primary h-3 w-3" />
                                      <span>
                                        Your verified{" "}
                                        {activity.type === "x" ? "reply" : "comment"}
                                      </span>
                                    </div>
                                    <p className="text-sm">{activity.commentText}</p>
                                  </div>

                                  {/* Footer: Date + View button */}
                                  <div className="flex items-center justify-between pt-1">
                                    <span className="text-muted-foreground text-xs">
                                      {new Date(
                                        activity.createdAt,
                                      ).toLocaleDateString()}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 gap-1 px-2 text-xs"
                                      onClick={() =>
                                        activityUrl &&
                                        window.open(activityUrl, "_blank")
                                      }
                                      disabled={!activityUrl}
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      View
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          );
                        })}
                      </div>

                      {/* Load more */}
                      <div className="flex justify-center pt-6">
                        {(initialNextCursor || nextCursor) &&
                          !isLoadingMore && (
                            <Button variant="outline" onClick={handleLoadMore}>
                              Load More
                            </Button>
                          )}
                        {isLoadingMore && (
                          <p className="text-muted-foreground text-sm">
                            Loading...
                          </p>
                        )}
                        {!initialNextCursor &&
                          !nextCursor &&
                          displayActivities.length > 0 && (
                            <p className="text-muted-foreground text-sm">
                              You've seen all activities
                            </p>
                          )}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground py-8 text-center">
                      {platformFilter === "all"
                        ? "No verified activity yet."
                        : `No ${platformFilter === "x" ? "X" : platformFilter === "linkedin" ? "LinkedIn" : platformFilter === "facebook" ? "Facebook" : platformFilter.charAt(0).toUpperCase() + platformFilter.slice(1)} activity yet.`}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
            )}
          </div>
        </div>

        <Footer />
      </main>

      {/* Settings Sidebar - only for profile owner */}
      {profile.isOwner && (
        <ProfileSettingsSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          profile={{
            humanNumber: profile.humanNumber,
            totalVerifications: profile.totalVerifications,
            displayName: profile.displayName,
            bio: profile.bio,
            isPublic: profile.isPublic,
            defaultLayout: profile.defaultLayout,
            badgeImageStyle: profile.badgeImageStyle,
            platformLinks: profile.platformLinks,
          }}
          onLayoutPreview={handleLayoutPreview}
          onBadgeImageStylePreview={handleBadgeImageStylePreview}
          onClose={handleCloseSidebar}
          username={username}
          onPreviewChange={handlePreviewChange}
        />
      )}

      {/* Extension install modal - shown after signup via ?welcome=true */}
      <ExtensionInstallModal />
    </div>
  );
}
