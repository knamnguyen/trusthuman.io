import { BarChart3, BookOpen, Feather, User, Users } from "lucide-react";

import { detectDomVersion } from "@sassy/linkedin-automation/dom/detect";
import { Button } from "@sassy/ui/button";
import { useTour } from "@sassy/ui/components/tour";
import { ExpandableTabs } from "@sassy/ui/expandable-tabs";
import { SheetContent, SheetHeader } from "@sassy/ui/sheet";

import { useAuthStore } from "../../lib/auth-store";
import { AccountMismatchOverlay } from "./_components/AccountMismatchOverlay";
import { CreateLinkedInAccountOverlay } from "./_components/CreateLinkedInAccountOverlay";
import { DailyAIQuotaExceededOverlay } from "./_components/DailyAIQuotaExceededOverlay";
import { SignInOverlay } from "./_components/SignInOverlay";
import { ToggleButton } from "./_components/ToggleButton";
import { AccountTab } from "./account-tab/AccountTab";
import { AnalyticsTab } from "./analytics-tab/AnalyticsTab";
import { ComposeTab } from "./compose-tab/ComposeTab";
import { ConnectTab } from "./connect-tab/ConnectTab";
import {
  SIDEBAR_TABS,
  useAccountStore,
  useShadowRootStore,
  useSidebarStore,
} from "./stores";
import { useDailyQuotaLimitHitDialogStore } from "./stores/dialog-store";

// Tab items for the expandable tabs menu
// Order: Compose, Connect, Analytics, Account (4 tabs)
const tabs = [
  { id: "ek-compose-tab-button", title: "Compose", icon: Feather },
  { id: "ek-connect-tab-button", title: "Connect", icon: Users },
  { id: "ek-analytics-tab-button", title: "Analytics", icon: BarChart3 },
  { id: "ek-account-tab-button", title: "Account", icon: User },
];

export interface LinkedInSidebarProps {
  onClose: () => void;
}

export function LinkedInSidebar({ onClose }: LinkedInSidebarProps) {
  // Tab state from sidebar store (allows EngageButton to switch tabs)
  const { selectedTab, setSelectedTab } = useSidebarStore();
  const shadowRoot = useShadowRootStore((s) => s.shadowRoot);

  // Auth state from store (singleton - shared across all components)
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuthStore();
  const { currentLinkedInStatus, accounts, isLoading } = useAccountStore();

  const showDailyAILimitQuotaExceededOverlay = useDailyQuotaLimitHitDialogStore(
    (state) => state.isOpen,
  );

  // Tour context for Guide button
  const { startTour } = useTour();

  // Determine if we should show overlays
  const showSignInOverlay = isAuthLoaded && !isSignedIn;

  const showMismatchOverlay =
    isSignedIn &&
    selectedTab !== SIDEBAR_TABS.ACCOUNT &&
    currentLinkedInStatus === "not_registered";

  const minWidth =
    detectDomVersion() === "dom-v2" ? "min-w-[490px]" : "min-w-[470px]";

  return (
    <SheetContent
      side="right"
      className={`z-[9999] w-[40vw] ${minWidth} gap-0`}
      portalContainer={shadowRoot}
    >
      {/* Close button attached to the left edge of sidebar */}
      <div className="absolute top-1/2 left-0 -translate-x-full -translate-y-1/2">
        <ToggleButton isOpen={true} onToggle={onClose} />
      </div>
      <SheetHeader>
        <div className="bg-background z-10 flex items-center justify-between">
          {/* Left spacer for symmetry */}
          <div className="w-20" />
          <ExpandableTabs
            tabs={tabs}
            value={selectedTab}
            onChange={setSelectedTab}
          />
          {/* Guide button - right side */}
          <Button
            variant="ghost"
            size="sm"
            disabled={currentLinkedInStatus !== "registered"}
            onClick={() => startTour("extension-intro")}
            className="h-8 w-20 gap-1.5 px-2.5"
          >
            <BookOpen className="h-4 w-4" />
            Guide
          </Button>
        </div>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto">
        {/* Tab 0: Compose - Unified Comment Composition */}
        {selectedTab === SIDEBAR_TABS.COMPOSE && <ComposeTab />}

        {/* Tab 1: Connect - Saved Profile Display */}
        {selectedTab === SIDEBAR_TABS.CONNECT && <ConnectTab />}

        {/* Tab 2: Analytics - Profile Views */}
        {selectedTab === SIDEBAR_TABS.ANALYTICS && <AnalyticsTab />}

        {/* Tab 3: Account - Auth & Organization Info */}
        {selectedTab === SIDEBAR_TABS.ACCOUNT && <AccountTab />}

        {/* Sign-in overlay - covers everything when not signed in */}
        {showSignInOverlay && <SignInOverlay />}

        {showDailyAILimitQuotaExceededOverlay && (
          <DailyAIQuotaExceededOverlay />
        )}

        {/* No account registered overlay - shows when no LinkedIn accounts */}
        <CreateLinkedInAccountOverlay />

        {/* Account mismatch overlay - shows on non-Account tabs when LinkedIn not registered */}
        {showMismatchOverlay && <AccountMismatchOverlay />}
      </div>
    </SheetContent>
  );
}
