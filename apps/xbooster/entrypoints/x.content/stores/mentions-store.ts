import { create } from "zustand";

export interface MentionData {
  tweetId: string;
  text: string;
  authorName: string;
  authorHandle: string;
  conversationId: string;
  inReplyToStatusId: string;
  replyCount: number;
  timestamp: string;
}

export interface OriginalTweet {
  tweetId: string;
  text: string;
  authorName: string;
  authorHandle: string;
}

interface MentionsStore {
  mentions: MentionData[];
  originalTweetCache: Record<string, OriginalTweet>;
  isLoading: boolean;
  error: string | null;
  setMentions: (mentions: MentionData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  cacheOriginalTweet: (tweetId: string, tweet: OriginalTweet) => void;
  getCachedTweet: (tweetId: string) => OriginalTweet | undefined;
  clear: () => void;
}

export const useMentionsStore = create<MentionsStore>((set, get) => ({
  mentions: [],
  originalTweetCache: {},
  isLoading: false,
  error: null,
  setMentions: (mentions) => set({ mentions }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  cacheOriginalTweet: (tweetId, tweet) =>
    set((state) => ({
      originalTweetCache: { ...state.originalTweetCache, [tweetId]: tweet },
    })),
  getCachedTweet: (tweetId) => get().originalTweetCache[tweetId],
  clear: () => set({ mentions: [], error: null }),
}));
