/**
 * Profile Store - Zustand store for current LinkedIn profile
 *
 * Eagerly loads the current LinkedIn profile when the page loads,
 * making it instantly available for verification without delays.
 *
 * Pattern:
 * 1. On content script init, fetch current LinkedIn profile
 * 2. Store in Zustand for instant access during verification
 * 3. Refresh on navigation/auth changes
 */

import { create } from "zustand";
import { createAccountUtilities } from "@sassy/linkedin-automation/account/create-account-utilities";
import type { LinkedInProfile } from "@sassy/linkedin-automation/account/types";

export interface TrustHumanProfile {
  profileUrl: string;
  profileHandle: string;
  displayName?: string;
  avatarUrl?: string;
}

interface ProfileState {
  // Current LinkedIn profile from page DOM
  currentLinkedIn: LinkedInProfile;
  // Converted profile for TrustHuman API
  profile: TrustHumanProfile | null;
  // Loading state
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
}

interface ProfileActions {
  /** Fetch current LinkedIn profile from page DOM */
  fetchProfile: () => Promise<void>;
  /** Clear profile data */
  clear: () => void;
}

type ProfileStore = ProfileState & ProfileActions;

const initialLinkedIn: LinkedInProfile = {
  profileUrl: null,
  profileUrn: null,
  profileSlug: null,
};

const initialState: ProfileState = {
  currentLinkedIn: initialLinkedIn,
  profile: null,
  isLoading: false,
  isLoaded: false,
  error: null,
};

/**
 * Convert LinkedInProfile to TrustHumanProfile
 */
function convertProfile(linkedIn: LinkedInProfile): TrustHumanProfile | null {
  if (!linkedIn.profileSlug) {
    return null;
  }

  return {
    profileUrl: `linkedin.com/in/${linkedIn.profileSlug}`,
    profileHandle: linkedIn.profileSlug,
  };
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  ...initialState,

  fetchProfile: async () => {
    // Skip if already loading
    if (get().isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const accountUtils = createAccountUtilities();
      const currentLinkedIn = await accountUtils.extractCurrentProfileAsync(5000);

      const profile = convertProfile(currentLinkedIn);

      set({
        currentLinkedIn,
        profile,
        isLoading: false,
        isLoaded: true,
        error: null,
      });

      console.log("ProfileStore: Fetched profile", {
        profileSlug: currentLinkedIn.profileSlug,
        hasProfile: !!profile,
      });
    } catch (error) {
      console.error("ProfileStore: Error fetching profile", error);
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
 * Call this from content script initialization
 */
export function initProfileStore() {
  console.log("ProfileStore: Initializing...");
  // Fetch immediately on page load
  useProfileStore.getState().fetchProfile();
}
