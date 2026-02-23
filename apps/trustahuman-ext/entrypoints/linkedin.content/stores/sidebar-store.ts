import { create } from "zustand";

// Tab constants
export const SIDEBAR_TABS = {
  VERIFY: 0,
  CHECK: 1,
} as const;

export type SidebarTab = (typeof SIDEBAR_TABS)[keyof typeof SIDEBAR_TABS];

interface SidebarStore {
  isOpen: boolean;
  selectedTab: SidebarTab;
  setIsOpen: (isOpen: boolean) => void;
  setSelectedTab: (tab: SidebarTab) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: false,
  selectedTab: SIDEBAR_TABS.VERIFY,
  setIsOpen: (isOpen) => set({ isOpen }),
  setSelectedTab: (tab) => set({ selectedTab: tab }),
}));

/**
 * Initialize sidebar message listener for popup communication.
 * Call this from content script initialization.
 */
export function initSidebarListener() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === "OPEN_SIDEBAR") {
      useSidebarStore.setState({ isOpen: true });
      sendResponse({ success: true });
      return true;
    }
    return false;
  });
}
