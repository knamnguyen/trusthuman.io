/**
 * X Profile Store - Zustand store for current X/Twitter profile
 *
 * Extracts logged-in user from window.__INITIAL_STATE__ on page load.
 */

import { create } from "zustand";
import { detectXProfile, type XProfile } from "../XProfileDetector";

export interface TrustHumanProfile {
  profileUrl: string;
  profileHandle: string;
  displayName?: string;
  avatarUrl?: string;
}

interface ProfileState {
  // Current X profile from page
  currentX: XProfile | null;
  // Converted profile for TrustHuman API
  profile: TrustHumanProfile | null;
  // Loading state
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}

interface ProfileActions {
  /** Fetch current X profile from page */
  fetchProfile: () => void;
  /** Clear profile data */
  clear: () => void;
}

type ProfileStore = ProfileState & ProfileActions;

const initialState: ProfileState = {
  currentX: null,
  profile: null,
  isLoading: false,
  isLoaded: false,
  error: null,
};

/**
 * Convert XProfile to TrustHumanProfile
 */
function convertProfile(xProfile: XProfile): TrustHumanProfile {
  return {
    profileUrl: xProfile.profileUrl,
    profileHandle: xProfile.screenName,
    displayName: xProfile.displayName,
    avatarUrl: xProfile.avatarUrl,
  };
}

export const useXProfileStore = create<ProfileStore>((set, get) => ({
  ...initialState,

  fetchProfile: () => {
    // Skip if already loading
    if (get().isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const xProfile = detectXProfile();

      if (xProfile) {
        const profile = convertProfile(xProfile);

        set({
          currentX: xProfile,
          profile,
          isLoading: false,
          isLoaded: true,
          error: null,
        });

        console.log("X ProfileStore: Fetched profile", {
          screenName: xProfile.screenName,
          hasProfile: !!profile,
        });
      } else {
        set({
          isLoading: false,
          isLoaded: true,
          error: "Could not detect X profile",
        });
      }
    } catch (error) {
      console.error("X ProfileStore: Error fetching profile", error);
      set({
        isLoading: false,
        isLoaded: true,
        error: error instanceof Error ? error.message : "Failed to fetch profile",
      });
    }
  },

  clear: () => {
    set(initialState);
  },
}));

/**
 * Initialize profile fetching on page load
 */
export function initXProfileStore() {
  console.log("X ProfileStore: Initializing...");
  // Give page time to load __INITIAL_STATE__
  setTimeout(() => {
    useXProfileStore.getState().fetchProfile();
  }, 500);
}
