import { create } from "zustand";

interface ShadowRootState {
  /** Shadow root element for Radix portals (popover, dialog, etc.) */
  shadowRoot: HTMLElement | null;
}

interface ShadowRootActions {
  setShadowRoot: (root: HTMLElement | null) => void;
}

type ShadowRootStore = ShadowRootState & ShadowRootActions;

export const useShadowRootStore = create<ShadowRootStore>((set) => ({
  shadowRoot: null,
  setShadowRoot: (root) => set({ shadowRoot: root }),
}));
