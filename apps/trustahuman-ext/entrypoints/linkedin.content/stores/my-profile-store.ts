/**
 * My Profile Store
 *
 * Fetches and caches the current user's TrustProfile for the sidebar.
 * Mirrors the web profile page data structure.
 */

import { create } from "zustand";
import { trpc } from "@/lib/trpc-client";
import { useAuthStore } from "@/lib/auth-store";

interface PlatformLink {
  id: string;
  platform: string;
  profileHandle: string;
  profileUrl: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface Activity {
  type: "linkedin" | "x" | "facebook" | "threads" | "reddit" | "ph" | "github" | "hn";
  id: string;
  commentText: string;
  verified: boolean;
  activityAt: Date;
  createdAt: Date;
  // Standardized fields
  commentUrl?: string | null;
  parentUrl?: string | null;
  parentAuthorName: string;
  parentAuthorAvatarUrl: string;
  parentTextSnippet: string;
}

export interface MyProfile {
  id: string;
  humanNumber: number;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  totalVerifications: number;
  currentStreak: number;
  longestStreak: number;
  rank: number;
  isPublic: boolean;
  createdAt: Date;
  platformLinks: PlatformLink[];
  recentActivities: Activity[];
}

interface MyProfileStore {
  profile: MyProfile | null;
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  // Actions
  fetchProfile: () => Promise<void>;
  clearProfile: () => void;
}

// Cache duration: 2 minutes (shorter since we refetch after verifications)
const CACHE_DURATION_MS = 2 * 60 * 1000;

export const useMyProfileStore = create<MyProfileStore>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,
  lastFetchedAt: null,

  fetchProfile: async () => {
    const { isSignedIn } = useAuthStore.getState();
    if (!isSignedIn) {
      console.log("TrustHuman: Skipping profile fetch (not signed in)");
      return;
    }

    // Check cache
    const { lastFetchedAt } = get();
    if (lastFetchedAt && Date.now() - lastFetchedAt < CACHE_DURATION_MS) {
      console.log("TrustHuman: Using cached profile");
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const profile = await trpc.trustProfile.getMyProfile.query();

      if (profile) {
        set({
          profile: profile as MyProfile,
          isLoading: false,
          lastFetchedAt: Date.now(),
        });
        console.log("TrustHuman: Profile fetched", profile.username);
      } else {
        // User is signed in but has no TrustProfile yet (no verifications)
        set({
          profile: null,
          isLoading: false,
          lastFetchedAt: Date.now(),
        });
        console.log("TrustHuman: No profile found (user has not verified yet)");
      }
    } catch (err) {
      console.error("TrustHuman: Profile fetch failed", err);
      set({ error: "Failed to load profile", isLoading: false });
    }
  },

  clearProfile: () => set({ profile: null, lastFetchedAt: null }),
}));

/**
 * Initialize my profile store - call from content script.
 * Fetches profile if user is signed in.
 */
export function initMyProfileStore() {
  // Wait for auth to be loaded, then fetch profile
  const unsubscribe = useAuthStore.subscribe((state) => {
    if (state.isLoaded && state.isSignedIn) {
      useMyProfileStore.getState().fetchProfile();
      unsubscribe(); // Only need to fetch once on init
    }
  });

  // Also check current state immediately
  const { isLoaded, isSignedIn } = useAuthStore.getState();
  if (isLoaded && isSignedIn) {
    useMyProfileStore.getState().fetchProfile();
    unsubscribe();
  }

  console.log("TrustHuman: My profile store initialized");
}

/**
 * Refetch profile after a verification
 * Called from verification flow to update sidebar
 */
export function refetchMyProfile() {
  // Clear cache and refetch
  useMyProfileStore.setState({ lastFetchedAt: null });
  useMyProfileStore.getState().fetchProfile();
}
