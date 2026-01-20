import { create } from "zustand";

// Tab indices for the sidebar
// Order: Compose, Connect, Analytics, Account (4 tabs)
export const SIDEBAR_TABS = {
  COMPOSE: 0,
  CONNECT: 1,
  ANALYTICS: 2,
  ACCOUNT: 3,
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
