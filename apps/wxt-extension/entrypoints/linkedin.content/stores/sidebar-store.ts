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
