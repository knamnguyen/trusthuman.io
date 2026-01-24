import { useEffect, useRef, useState } from "react";

import { createFeedUtilities } from "@sassy/linkedin-automation/feed/create-feed-utilities";
import { TourProvider, useTour } from "@sassy/ui/components/tour";
import { Sheet } from "@sassy/ui/sheet";
import { ToasterSimple } from "@sassy/ui/toast";
import { TooltipProvider } from "@sassy/ui/tooltip";

import { useMigrateLegacyStorage } from "../../lib/migrate-legacy-storage";
import { ToggleButton } from "./_components/ToggleButton";
import { SpacebarEngageObserver } from "./compose-tab/engage-button/SpacebarEngageObserver";
import { useAutoEngage } from "./compose-tab/engage-button/useAutoEngage";
import { useEngageButtons } from "./compose-tab/engage-button/useEngageButtons";
import { PostNavigator } from "./compose-tab/PostNavigator";
import { LinkedInSidebar } from "./LinkedInSidebar";
import { useProfilePageButton } from "./save-profile/useProfilePageButton";
import { useSaveProfileButtons } from "./save-profile/useSaveProfileButtons";
import { useAccountStore, useShadowRootStore, useSidebarStore } from "./stores";
import { tourFlows } from "./tour-flows";

const TOUR_STORAGE_KEY = "hasSeenExtensionIntroTour";

/**
 * Module-level flag to prevent race condition when multiple tabs open simultaneously.
 * This prevents the sidebar from auto-opening on every tab during:
 * - Initial extension installation with multiple LinkedIn tabs open
 * - Browser restart/session restore with multiple tabs
 * - Extension reload/update with multiple tabs
 *
 * Without this, multiple tabs can read hasOpenedSidebar as undefined before
 * any tab finishes writing it, causing all tabs to auto-open the sidebar.
 */
// eslint-disable-next-line prefer-const
let hasAutoOpenedThisSession = false;

/**
 * Hook to auto-start the tour when user first registers their account
 */
function useAutoStartTour() {
  const { startTour } = useTour();
  const { currentLinkedInStatus } = useAccountStore();
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // Only trigger once per session, when status becomes "registered"
    if (currentLinkedInStatus !== "registered" || hasTriggeredRef.current) {
      return;
    }

    // Check if user has already seen the tour
    chrome.storage.local.get([TOUR_STORAGE_KEY], (result) => {
      if (!result[TOUR_STORAGE_KEY]) {
        console.log(
          "EngageKit: First time registered account, auto-starting tour",
        );
        hasTriggeredRef.current = true;
        // onBeforeTour in TourProvider will handle opening sidebar
        startTour("extension-intro");
      }
    });
  }, [currentLinkedInStatus, startTour]);
}

/**
 * Component that uses the tour context to auto-start
 * Must be rendered inside TourProvider
 */
function TourAutoStarter() {
  useAutoStartTour();
  return null;
}

interface AppProps {
  shadowRoot: HTMLElement;
}

export default function App({ shadowRoot }: AppProps) {
  // Sidebar state from Zustand store (allows EngageButton to open it)
  const { isOpen, setIsOpen } = useSidebarStore();
  const setShadowRoot = useShadowRootStore((s) => s.setShadowRoot);
  const [showOpenButton, setShowOpenButton] = useState(true);

  // Set shadow root in store for Radix portals (popover, dialog, etc.)
  useEffect(() => {
    setShadowRoot(shadowRoot);
  }, [shadowRoot, setShadowRoot]);

  // Handle first install: auto-open sidebar
  // Uses module-level flag to prevent race condition across multiple tabs
  useEffect(() => {
    // Quick synchronous check first to prevent race condition
    if (hasAutoOpenedThisSession) {
      console.log(
        "EngageKit WXT: Skipping auto-open, already opened in another tab this session",
      );
      return;
    }

    chrome.storage.local.get(["hasOpenedSidebar"], (result) => {
      // Double-check in case another tab set the flag while we were waiting
      if (!result.hasOpenedSidebar && !hasAutoOpenedThisSession) {
        // Set flag immediately (before async operations) to prevent other tabs from racing
        hasAutoOpenedThisSession = true;

        // First install - auto-open sidebar
        console.log(
          "EngageKit WXT: First install detected, auto-opening sidebar",
        );
        setIsOpen(true);
        chrome.storage.local.set({ hasOpenedSidebar: true });
      }
    });
  }, [setIsOpen]);

  // Handle button visibility with animation delay
  useEffect(() => {
    if (isOpen) {
      // Hide open button immediately when opening
      setShowOpenButton(false);
    } else {
      // Show open button after close animation completes (300ms)
      const timer = setTimeout(() => {
        setShowOpenButton(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Watch and remove "New posts" pill from feed
  useEffect(() => {
    const feedUtilities = createFeedUtilities();
    return feedUtilities.watchAndRemoveNewPostsPill();
  }, []);

  useMigrateLegacyStorage();

  // Watch for author profiles and inject save buttons (vanilla JS)
  useSaveProfileButtons();

  // Watch for profile page and inject save button (vanilla JS)
  useProfilePageButton();

  // Watch for comment editors and inject engage buttons (vanilla JS, DOM v1/v2 support)
  useEngageButtons();

  // Watch for native comment button clicks and auto-engage (DOM v1/v2 support)
  useAutoEngage();

  return (
    <TourProvider
      flows={tourFlows}
      portalContainer={shadowRoot}
      onTourEnd={(flowId, completed) => {
        console.log(`EngageKit Tour: ${flowId} ended, completed: ${completed}`);
        // Mark tour as seen so it won't auto-start again
        if (flowId === "extension-intro") {
          chrome.storage.local.set({ [TOUR_STORAGE_KEY]: true });
        }
      }}
    >
      {/* Auto-start tour for first-time registered users */}
      <TourAutoStarter />
      <TooltipProvider>
        {/* Open button - only visible when sidebar is closed and animation finished */}
        {showOpenButton && (
          <div className="fixed top-1/2 right-0 z-[9999] -translate-y-1/2">
            <ToggleButton isOpen={false} onToggle={() => setIsOpen(true)} />
          </div>
        )}

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <LinkedInSidebar onClose={() => setIsOpen(false)} />
        </Sheet>

        {/* Observer for spacebar auto-engage - highlights most visible post */}
        <SpacebarEngageObserver />

        {/* Floating post navigator UI for quick scrolling between posts */}
        <PostNavigator />

        {/* Toast notifications */}
        <ToasterSimple container={shadowRoot} />
      </TooltipProvider>
    </TourProvider>
  );
}
