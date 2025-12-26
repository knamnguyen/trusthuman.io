import { create } from "zustand";

import type { ProfileInfo } from "../save-profile/extract-profile-info";

interface SavedProfileState {
  /** Profile info extracted from DOM */
  selectedProfile: ProfileInfo | null;
}

interface SavedProfileActions {
  setSelectedProfile: (profile: ProfileInfo | null) => void;
  clearAll: () => void;
}

type SavedProfileStore = SavedProfileState & SavedProfileActions;

export const useSavedProfileStore = create<SavedProfileStore>((set) => ({
  selectedProfile: null,

  setSelectedProfile: (profile) => set({ selectedProfile: profile }),
  clearAll: () => set({ selectedProfile: null }),
}));
