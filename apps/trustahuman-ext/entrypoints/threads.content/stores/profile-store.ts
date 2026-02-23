/**
 * Threads Profile Store - Zustand store for current Threads profile
 *
 * Extracts logged-in user from BarcelonaSharedData on page load.
 */

import { create } from "zustand";
import { detectThreadsProfile, type ThreadsProfile } from "../ThreadsProfileDetector";

export interface TrustHumanProfile {
  profileUrl: string;
  profileHandle: string;
  displayName?: string;
  avatarUrl?: string;
}

interface ProfileState {
  // Current Threads profile from page
  currentThreads: ThreadsProfile | null;
  // Converted profile for TrustHuman API
  profile: TrustHumanProfile | null;
  // Loading state
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}

interface ProfileActions {
  /** Fetch current Threads profile from page */
  fetchProfile: () => void;
  /** Clear profile data */
  clear: () => void;
}

type ProfileStore = ProfileState & ProfileActions;

const initialState: ProfileState = {
  currentThreads: null,
  profile: null,
  isLoading: false,
  isLoaded: false,
  error: null,
};

/**
 * Convert ThreadsProfile to TrustHumanProfile
 */
function convertProfile(threadsProfile: ThreadsProfile): TrustHumanProfile {
  return {
    profileUrl: threadsProfile.profileUrl,
    profileHandle: threadsProfile.username,
    displayName: threadsProfile.displayName,
    avatarUrl: threadsProfile.avatarUrl,
  };
}

export const useThreadsProfileStore = create<ProfileStore>((set, get) => ({
  ...initialState,

  fetchProfile: () => {
    // Skip if already loading
    if (get().isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const threadsProfile = detectThreadsProfile();

      if (threadsProfile) {
        const profile = convertProfile(threadsProfile);

        set({
          currentThreads: threadsProfile,
          profile,
          isLoading: false,
          isLoaded: true,
          error: null,
        });

        console.log("Threads ProfileStore: Fetched profile", {
          username: threadsProfile.username,
          hasProfile: !!profile,
        });
      } else {
        set({
          isLoading: false,
          isLoaded: true,
          error: "Could not detect Threads profile",
        });
      }
    } catch (error) {
      console.error("Threads ProfileStore: Error fetching profile", error);
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
export function initThreadsProfileStore() {
  console.log("Threads ProfileStore: Initializing...");
  // Give page time to load BarcelonaSharedData
  setTimeout(() => {
    useThreadsProfileStore.getState().fetchProfile();
  }, 500);
}
