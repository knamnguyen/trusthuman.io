import { create } from "zustand";

import { posthog } from "../../../lib/posthog";

// Tab indices for the sidebar
// Order: Compose, Connect, Analytics, Follow-Up, Account (5 tabs)
export const SIDEBAR_TABS = {
  COMPOSE: 0,
  CONNECT: 1,
  ANALYTICS: 2,
  FOLLOWUP: 3,
  ACCOUNT: 4,
} as const;

interface SidebarState {
  isOpen: boolean;
  selectedTab: number;
}

interface SidebarActions {
  setIsOpen: (open: boolean) => void;
  setSelectedTab: (tab: number) => void;
  openToTab: (tab: number) => void;
}

type SidebarStore = SidebarState & SidebarActions;

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: false,
  selectedTab: SIDEBAR_TABS.COMPOSE,

  setIsOpen: (isOpen) => set({ isOpen }),
  setSelectedTab: (selectedTab) => set({ selectedTab }),
  openToTab: (tab) => set({ isOpen: true, selectedTab: tab }),
}));

useSidebarStore.subscribe((state, prev) => {
  if (state.isOpen !== prev.isOpen) {
    posthog.capture(`extension:sidebar:v1:toggled`, {
      type: state.isOpen ? "open" : "close",
    });
    if (state.isOpen) {
      posthog.startSessionRecording();
    } else {
      posthog.stopSessionRecording();
    }
  }

  if (state.selectedTab !== prev.selectedTab) {
    posthog.capture("extension:sidebar:v1:tab_changed", {
      selectedTab: state.selectedTab,
    });
  }
});

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  console.info("received message in sidebar store:", message);
  if (message.type === "OPEN_SIDEBAR") {
    useSidebarStore.setState({ isOpen: true });
    sendResponse({ success: true });
  }

  if (message.type === "TOGGLE_SIDEBAR") {
    useSidebarStore.setState((state) => ({ isOpen: !state.isOpen }));
    sendResponse({ success: true });
  }
});
