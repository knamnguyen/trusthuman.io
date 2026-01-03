import { BarChart3, Feather, Hash, Upload, User } from "lucide-react";

import { Button } from "@sassy/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@sassy/ui/card";
import { ExpandableTabs } from "@sassy/ui/expandable-tabs";
import { Label } from "@sassy/ui/label";
import { SheetContent, SheetHeader } from "@sassy/ui/sheet";
import { Switch } from "@sassy/ui/switch";

import { useAuthStore } from "../../stores/auth-store";
import { AccountMismatchOverlay } from "./_components/AccountMismatchOverlay";
import { SignInOverlay } from "./_components/SignInOverlay";
import { ToggleButton } from "./_components/ToggleButton";
import { AccountTab } from "./account-tab/AccountTab";
import { AnalyticsTab } from "./analytics-tab/AnalyticsTab";
import { ExploreTab } from "./explore-tab/ExploreTab";
import {
  SIDEBAR_TABS,
  useAccountStore,
  useCommentStore,
  useShadowRootStore,
  useSidebarStore,
} from "./stores";
import { ShareTab } from "./target-profile-tab/ShareTab";
import { insertIntoCurrentField } from "./utils";

// Tab items for the expandable tabs menu
const tabs = [
  { title: "Account", icon: User },
  { title: "Analytics", icon: BarChart3 },
  { title: "Explore", icon: Hash },
  { title: "Share", icon: Upload },
  { title: "Write", icon: Feather },
];

/**
 * Write Tab - Displays generated comment(s) from Zustand store
 * postContent is passed as prop to keep WriteTab focused on display
 */
interface WriteTabProps {
  postContent: string | null;
}

function WriteTab({ postContent }: WriteTabProps) {
  const {
    comments,
    isGenerating,
    generateVariations,
    setGenerateVariations,
    clear,
  } = useCommentStore();

  const handleSelectVariation = async (comment: string) => {
    const success = await insertIntoCurrentField(comment);
    if (success) {
      console.log("EngageKit: Inserted selected variation into comment field");
    }
  };

  // Loading state - show skeleton(s) based on variations mode
  if (isGenerating) {
    return (
      <div className="flex flex-col gap-4 px-4">
        {/* Settings toggle */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label htmlFor="variations-mode" className="text-sm font-medium">
            Generate 3 variations
          </Label>
          <Switch
            id="variations-mode"
            checked={generateVariations}
            onCheckedChange={setGenerateVariations}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Feather className="h-4 w-4 animate-pulse" />
              {generateVariations
                ? "Generating 3 Variations..."
                : "Generating Comment..."}
            </CardTitle>
            <CardDescription>AI is crafting your response</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="bg-muted h-20 animate-pulse rounded-md" />
              {generateVariations && (
                <>
                  <div className="bg-muted h-20 animate-pulse rounded-md" />
                  <div className="bg-muted h-20 animate-pulse rounded-md" />
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (comments.length === 0) {
    return (
      <div className="flex flex-col gap-4 px-4">
        {/* Settings toggle */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label htmlFor="variations-mode" className="text-sm font-medium">
            Generate 3 variations
          </Label>
          <Switch
            id="variations-mode"
            checked={generateVariations}
            onCheckedChange={setGenerateVariations}
          />
        </div>

        <div className="flex h-full flex-col items-center justify-center gap-4 py-8">
          <Feather className="text-muted-foreground h-12 w-12" />
          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              No comment generated yet
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Click the EngageKit button on any LinkedIn post to generate a
              comment
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show single comment (normal mode)
  if (comments.length === 1) {
    return (
      <div className="flex flex-col gap-4 px-4">
        {/* Settings toggle */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label htmlFor="variations-mode" className="text-sm font-medium">
            Generate 3 variations
          </Label>
          <Switch
            id="variations-mode"
            checked={generateVariations}
            onCheckedChange={setGenerateVariations}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Feather className="h-4 w-4" />
                Generated Comment
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={clear}>
                Clear
              </Button>
            </div>
            <CardDescription>Ready to post on LinkedIn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-md p-3">
              <p className="text-sm whitespace-pre-wrap">{comments[0]}</p>
            </div>
          </CardContent>
        </Card>

        {postContent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Original Post</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground line-clamp-4 text-xs">
                {postContent}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Show multiple variations (variations mode)
  return (
    <div className="flex flex-col gap-4 px-4">
      {/* Settings toggle */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label htmlFor="variations-mode" className="text-sm font-medium">
          Generate 3 variations
        </Label>
        <Switch
          id="variations-mode"
          checked={generateVariations}
          onCheckedChange={setGenerateVariations}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Choose a variation</p>
        <Button variant="ghost" size="sm" onClick={clear}>
          Clear All
        </Button>
      </div>

      {comments.map((comment, index) => (
        <Card
          key={index}
          className="hover:border-primary cursor-pointer transition-colors"
          onClick={() => handleSelectVariation(comment)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Feather className="h-4 w-4" />
                Variation {index + 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectVariation(comment);
                }}
              >
                Use This
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-md p-3">
              <p className="text-sm whitespace-pre-wrap">{comment}</p>
            </div>
          </CardContent>
        </Card>
      ))}

      {postContent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Original Post</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground line-clamp-4 text-xs">
              {postContent}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export interface LinkedInSidebarProps {
  onClose: () => void;
}

export function LinkedInSidebar({ onClose }: LinkedInSidebarProps) {
  // Tab state from sidebar store (allows EngageButton to switch tabs)
  const { selectedTab, setSelectedTab } = useSidebarStore();
  const shadowRoot = useShadowRootStore((s) => s.shadowRoot);
  // Comment state - postContent is passed to WriteTab as prop
  const { postContent } = useCommentStore();

  // Auth state from store (singleton - shared across all components)
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuthStore();
  const { currentLinkedInStatus } = useAccountStore();

  // Determine if we should show overlays
  const showSignInOverlay = isAuthLoaded && !isSignedIn;
  const showMismatchOverlay =
    isSignedIn &&
    selectedTab !== SIDEBAR_TABS.ACCOUNT &&
    currentLinkedInStatus === "not_registered";

  return (
    <SheetContent
      side="right"
      className="w-[40vw] min-w-[450px] gap-0"
      portalContainer={shadowRoot}
    >
      {/* Close button attached to the left edge of sidebar */}
      <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2">
        <ToggleButton isOpen={true} onToggle={onClose} />
      </div>
      <SheetHeader>
        <div className="bg-background z-10 flex justify-center">
          <ExpandableTabs
            tabs={tabs}
            value={selectedTab}
            onChange={setSelectedTab}
          />
        </div>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto">
        {/* Tab 0: Account - Auth & Organization Info */}
        {selectedTab === 0 && <AccountTab />}

        {/* Tab 1: Analytics - Profile Views */}
        {selectedTab === 1 && <AnalyticsTab />}

        {/* Tab 2: Explore - Feed Explorer */}
        {selectedTab === 2 && <ExploreTab />}

        {/* Tab 3: Share - Saved Profile Display */}
        {selectedTab === 3 && <ShareTab />}

        {/* Tab 4: Write - Generated Comment Display */}
        {selectedTab === 4 && <WriteTab postContent={postContent} />}

        {/* Sign-in overlay - covers everything when not signed in */}
        {showSignInOverlay && <SignInOverlay />}

        {/* Account mismatch overlay - shows on non-Account tabs when LinkedIn not registered */}
        {showMismatchOverlay && <AccountMismatchOverlay />}
      </div>
    </SheetContent>
  );
}
