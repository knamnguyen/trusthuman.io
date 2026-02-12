import { create } from "zustand";

import type { EngageTweetData } from "../utils/parse-tweets";

interface EngageTweetsStore {
  tweets: EngageTweetData[];
  isLoading: boolean;
  error: string | null;
  setTweets: (tweets: EngageTweetData[]) => void;
  addTweets: (tweets: EngageTweetData[]) => void; // merge, dedupe by tweetId
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useEngageTweetsStore = create<EngageTweetsStore>((set, get) => ({
  tweets: [],
  isLoading: false,
  error: null,

  setTweets: (tweets) => set({ tweets }),

  addTweets: (newTweets) => {
    const existing = get().tweets;
    const existingIds = new Set(existing.map((t) => t.tweetId));
    const unique = newTweets.filter((t) => !existingIds.has(t.tweetId));
    set({ tweets: [...existing, ...unique] });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clear: () => set({ tweets: [], error: null }),
}));
