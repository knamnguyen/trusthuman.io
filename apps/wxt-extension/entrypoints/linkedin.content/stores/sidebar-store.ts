import { create } from "zustand";

// Tab indices for the sidebar
export const SIDEBAR_TABS = {
  MESSAGES: 0,
  MAIL: 1,
  EXPLORE: 2,
  SHARE: 3,
  WRITE: 4,
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
  selectedTab: SIDEBAR_TABS.MESSAGES,

  setIsOpen: (isOpen) => set({ isOpen }),
  setSelectedTab: (selectedTab) => set({ selectedTab }),
  openToTab: (tab) => set({ isOpen: true, selectedTab: tab }),
}));
