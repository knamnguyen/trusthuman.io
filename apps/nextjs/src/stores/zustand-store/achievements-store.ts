import { create } from "zustand";

/**
 * Profile metrics including comment counts, percentile, and streaks
 * Matches return type from trpc.achievements.getProfileMetrics
 */
interface ProfileMetrics {
  verifiedCount: number;
  assistedCount: number;
  percentile: number;
  currentStreak: number;
  longestStreak: number;
  profileSlug: string;
  profileImageUrl: string | null;
}

/**
 * Network profile representing an interaction with another LinkedIn user
 * Matches return type from trpc.achievements.getNetworkData
 */
interface NetworkProfile {
  authorProfileUrl: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  interactionCount: number;
}

/**
 * Daily activity bucket for heat map visualization
 * Matches return type from trpc.achievements.getActivityData
 */
interface ActivityBucket {
  date: string; // ISO date (YYYY-MM-DD)
  count: number;
}

interface AchievementsState {
  profileMetrics: ProfileMetrics | null;
  networkData: NetworkProfile[] | null;
  activityData: ActivityBucket[] | null;
  isLoading: boolean;
  error: string | null;
}

interface AchievementsActions {
  /** Update profile metrics from tRPC query */
  setProfileMetrics: (data: ProfileMetrics) => void;
  /** Update network data from tRPC query */
  setNetworkData: (data: NetworkProfile[]) => void;
  /** Update activity data from tRPC query */
  setActivityData: (data: ActivityBucket[]) => void;
  /** Set global loading state */
  setLoading: (loading: boolean) => void;
  /** Set error state */
  setError: (error: string | null) => void;
  /** Reset all state (called when switching accounts) */
  reset: () => void;
}

type AchievementsStore = AchievementsState & AchievementsActions;

const initialState: AchievementsState = {
  profileMetrics: null,
  networkData: null,
  activityData: null,
  isLoading: false,
  error: null,
};

export const useAchievementsStore = create<AchievementsStore>((set) => ({
  ...initialState,

  setProfileMetrics: (data) => set({ profileMetrics: data }),
  setNetworkData: (data) => set({ networkData: data }),
  setActivityData: (data) => set({ activityData: data }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
