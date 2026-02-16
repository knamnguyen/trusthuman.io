import { create } from "zustand";

interface ShadowRootStore {
  shadowRoot: HTMLElement | null;
  setShadowRoot: (el: HTMLElement | null) => void;
}

export const useShadowRootStore = create<ShadowRootStore>((set) => ({
  shadowRoot: null,
  setShadowRoot: (shadowRoot) => set({ shadowRoot }),
}));
