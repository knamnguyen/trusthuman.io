import { useEffect } from "react";
import {
  Camera,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Award,
  Flame,
  Trophy,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@sassy/ui/avatar";
import { Badge } from "@sassy/ui/badge";
import { Button } from "@sassy/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@sassy/ui/card";
import { SheetContent, SheetHeader } from "@sassy/ui/sheet";
import { ExpandableTabs } from "@sassy/ui/expandable-tabs";

import { useAuthStore } from "../../lib/auth-store";
import { SignInOverlay } from "./SignInOverlay";
import { ToggleButton } from "./ToggleButton";
import { CheckHumanTab } from "./CheckHumanTab";
import { useCheckHumanStore } from "./stores/check-human-store";
import { useMyProfileStore, type Activity } from "./stores/my-profile-store";
import { useShadowRootStore } from "./stores/shadow-root-store";
import { useSidebarStore, SIDEBAR_TABS, type SidebarTab } from "./stores/sidebar-store";

// Tab configuration for ExpandableTabs
const tabs = [
  { id: "th-verify-tab", title: "Verify", icon: ShieldCheck },
  { id: "th-check-tab", title: "Check Human", icon: Search },
];

interface VerificationSidebarProps {
  onClose: () => void;
}

/**
 * Activity Card - displays a verified activity from any platform
 * Matches the web profile page design (standardized schema)
 */
function ActivityCard({ activity }: { activity: Activity }) {
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

/**
 * Verify Tab Content - shows user's full profile mirroring trusthuman.io/username
 */
function VerifyTabContent() {
  const { profile, isLoading, error } = useMyProfileStore();
  const { isSignedIn } = useAuthStore();

  // Get initials for avatar fallback
  const getInitials = (name: string | undefined | null): string => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0]?.charAt(0).toUpperCase() || "?";
    return ((parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "")).toUpperCase();
  };

  function handleGrantCamera() {
    chrome.runtime.sendMessage({ action: "openSetup" });
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold mb-2">Sign in to verify</h3>
        <p className="text-sm text-muted-foreground">
          Sign in to start verifying your comments and building your trust profile.
        </p>
      </div>
    );
  }

  // Loading
  if (isLoading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-3">Loading profile...</p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <XCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="font-semibold mb-2">Failed to load profile</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  // No profile yet (first-time user)
  if (!profile) {
    return (
      <div className="flex flex-col p-4 gap-4">
        {/* Camera permission banner */}
        <Button
          onClick={handleGrantCamera}
          variant="outline"
          className="w-full gap-2"
          size="sm"
        >
          <Camera className="h-4 w-4" />
          Grant Camera Access
        </Button>

        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Get Your Human Number</h3>
            <p className="text-sm text-muted-foreground">
              Post a comment on LinkedIn or X to complete your first verification
              and get your unique Human number!
            </p>
          </CardContent>
        </Card>

        {/* Recording indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
          Monitoring {window.location.hostname.includes("x.com") || window.location.hostname.includes("twitter.com") ? "X" : "LinkedIn"}
        </div>
      </div>
    );
  }

  // Profile loaded - show full profile like trusthuman.io/username
  return (
    <div className="flex flex-col h-full">
      {/* Profile Header Card */}
      <Card className="mx-4 mt-3 border-primary/30">
        <CardHeader className="pb-2 pt-3 px-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback>{getInitials(profile.displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">
                  {profile.displayName || profile.username}
                </h3>
                <Badge variant="default" className="shrink-0 text-[10px] px-1.5 py-0">
                  <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
                  Human
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                #{profile.humanNumber} • Rank #{profile.rank}
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
                <span className="font-bold text-sm">{profile.totalVerifications}</span>
              </div>
              <p className="text-[9px] text-muted-foreground">Verified</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-1.5">
              <div className="flex items-center justify-center gap-1">
                <Flame className="h-3.5 w-3.5 text-orange-500" />
                <span className="font-bold text-sm">{profile.currentStreak}</span>
              </div>
              <p className="text-[9px] text-muted-foreground">Streak</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-1.5">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                <span className="font-bold text-sm">{profile.longestStreak}</span>
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
              window.open(`${baseUrl}/${profile.username}`, "_blank");
            }}
          >
            <ExternalLink className="h-3 w-3" />
            View Full Profile
          </Button>
        </CardContent>
      </Card>

      {/* Camera + Recording Status */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
          Monitoring {window.location.hostname.includes("x.com") || window.location.hostname.includes("twitter.com") ? "X" : "LinkedIn"}
        </div>
        <Button
          onClick={handleGrantCamera}
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs"
        >
          <Camera className="h-3 w-3" />
          Camera
        </Button>
      </div>

      {/* Recent Activity Header */}
      <div className="px-4 pt-4 pb-2">
        <h4 className="text-sm font-medium">Recent Verified Activity</h4>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {profile.recentActivities.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground">
                No verifications yet. Post a comment to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {profile.recentActivities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function VerificationSidebar({ onClose }: VerificationSidebarProps) {
  const shadowRoot = useShadowRootStore((s) => s.shadowRoot);
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuthStore();
  const { selectedTab, setSelectedTab } = useSidebarStore();
  const detectedProfile = useCheckHumanStore((s) => s.detectedProfile);

  // Auto-switch to Check Human tab when on a profile page
  useEffect(() => {
    if (detectedProfile) {
      setSelectedTab(SIDEBAR_TABS.CHECK);
    }
  }, [detectedProfile, setSelectedTab]);

  // Show sign-in overlay when not authenticated
  const showSignInOverlay = isAuthLoaded && !isSignedIn;

  return (
    <SheetContent
      side="right"
      // ============ POSITION KNOBS ============
      // Width: w-[40vw] = 40% viewport width
      // Min width: min-w-[490px] = minimum 490px
      // Z-index: z-[9999] = stacking order
      // To adjust: change these values
      className="z-[9999] w-[40vw] min-w-[490px] gap-0 flex flex-col"
      portalContainer={shadowRoot}
    >
      {/* ============ TOGGLE BUTTON POSITION ============ */}
      {/* Position: top-1/2 = vertically centered */}
      {/* left-0 -translate-x-full = attached to left edge of sidebar */}
      {/* To move up/down: change top-1/2 to top-1/3, top-[100px], etc */}
      <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2">
        <ToggleButton isOpen={true} onToggle={onClose} />
      </div>

      <SheetHeader className="pb-2">
        {/* ============ TAB NAVIGATION ============ */}
        {/* Centered with justify-center */}
        <div className="flex justify-center pt-2">
          <ExpandableTabs
            tabs={tabs}
            value={selectedTab}
            onChange={(index) => setSelectedTab(index as SidebarTab)}
          />
        </div>
      </SheetHeader>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {selectedTab === SIDEBAR_TABS.VERIFY && <VerifyTabContent />}
        {selectedTab === SIDEBAR_TABS.CHECK && <CheckHumanTab />}
      </div>

      {/* Sign-in overlay - covers everything when not signed in */}
      {showSignInOverlay && <SignInOverlay />}
    </SheetContent>
  );
}
