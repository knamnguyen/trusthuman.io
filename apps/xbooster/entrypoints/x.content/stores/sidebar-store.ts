import { create } from "zustand";

export const SIDEBAR_TABS = { MENTIONS: 0, ENGAGE: 1 } as const;

interface SidebarStore {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedTab: number;
  setSelectedTab: (tab: number) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),
  selectedTab: SIDEBAR_TABS.MENTIONS,
  setSelectedTab: (tab) => set({ selectedTab: tab }),
}));
