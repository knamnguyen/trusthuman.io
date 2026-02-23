import { create } from "zustand";
import { detectLoggedInProfile, type FacebookUserProfile } from "../ProfileDetector";

interface ProfileStore {
  profile: FacebookUserProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profile: null,
  isLoading: false,
  error: null,
  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const profile = await detectLoggedInProfile();
      set({ profile, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to detect profile",
        isLoading: false,
      });
    }
  },
}));

/**
 * Initialize profile detection on page load.
 * Call this from content script initialization.
 */
export function initProfileStore() {
  // Detect logged-in profile with a slight delay to let page settle
  setTimeout(() => {
    useProfileStore.getState().fetchProfile();
  }, 1000);
}
