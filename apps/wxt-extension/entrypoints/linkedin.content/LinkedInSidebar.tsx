import { BarChart3, Feather, User, Users } from "lucide-react";

import { ExpandableTabs } from "@sassy/ui/expandable-tabs";
import { SheetContent, SheetHeader } from "@sassy/ui/sheet";

import { useAuthStore } from "../../stores/auth-store";
import { AccountMismatchOverlay } from "./_components/AccountMismatchOverlay";
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

// Tab items for the expandable tabs menu
// Order: Compose, Connect, Analytics, Account (4 tabs)
const tabs = [
  { title: "Compose", icon: Feather },
  { title: "Connect", icon: Users },
  { title: "Analytics", icon: BarChart3 },
  { title: "Account", icon: User },
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

        {/* Account mismatch overlay - shows on non-Account tabs when LinkedIn not registered */}
        {showMismatchOverlay && <AccountMismatchOverlay />}
      </div>
    </SheetContent>
  );
}
