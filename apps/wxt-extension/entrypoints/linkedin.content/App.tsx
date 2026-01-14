import { useEffect, useState } from "react";

import { createFeedUtilities } from "@sassy/linkedin-automation/feed/create-feed-utilities";
import { Sheet } from "@sassy/ui/sheet";
import { ToasterSimple } from "@sassy/ui/toast";

import { ToggleButton } from "./_components/ToggleButton";
import { PostNavigator } from "./compose-tab/PostNavigator";
import { SpacebarEngageObserver } from "./engage-button/SpacebarEngageObserver";
import { useAutoEngage } from "./engage-button/useAutoEngage";
import { useEngageButtons } from "./engage-button/useEngageButtons";
import { LinkedInSidebar } from "./LinkedInSidebar";
import { useProfilePageButton } from "./save-profile/useProfilePageButton";
import { useSaveProfileButtons } from "./save-profile/useSaveProfileButtons";
import { useShadowRootStore, useSidebarStore } from "./stores";

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
  useEffect(() => {
    chrome.storage.local.get(["hasOpenedSidebar"], (result) => {
      if (!result.hasOpenedSidebar) {
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

  // Watch for author profiles and inject save buttons (vanilla JS)
  useSaveProfileButtons();

  // Watch for profile page and inject save button (vanilla JS)
  useProfilePageButton();

  // Watch for comment editors and inject engage buttons (vanilla JS, DOM v1/v2 support)
  useEngageButtons();

  // Watch for native comment button clicks and auto-engage (DOM v1/v2 support)
  useAutoEngage();

  return (
    <>
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
    </>
  );
}
