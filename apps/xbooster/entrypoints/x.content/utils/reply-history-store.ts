import { create } from "zustand";

export interface ReplyHistoryEntry {
  tweetId: string;
  repliedAt: number;
  authorHandle: string;
  authorName: string;
  theirText: string;
  ourReply: string;
  parentTweetText?: string;
  mode: "MENTION" | "ENGAGE";
}

interface ReplyHistoryStore {
  entries: ReplyHistoryEntry[];
  isLoaded: boolean;
  load: () => Promise<void>;
  addEntry: (entry: ReplyHistoryEntry) => Promise<void>;
  getByAuthor: (authorHandle: string, limit?: number) => ReplyHistoryEntry[];
  prune: (retentionDays: number) => Promise<void>;
}

const STORAGE_KEY = "xbooster_reply_history";

export const useReplyHistoryStore = create<ReplyHistoryStore>((set, get) => ({
  entries: [],
  isLoaded: false,

  load: async () => {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const raw: ReplyHistoryEntry[] = result[STORAGE_KEY] ?? [];
    set({ entries: raw, isLoaded: true });
    console.log(`xBooster: Reply history loaded - ${raw.length} entries`);
  },

  addEntry: async (entry) => {
    const current = get().entries;
    // Skip if already recorded for this tweetId
    if (current.some((e) => e.tweetId === entry.tweetId)) return;
    const updated = [...current, entry];
    await chrome.storage.local.set({ [STORAGE_KEY]: updated });
    set({ entries: updated });
    console.log(
      `xBooster: History saved - @${entry.authorHandle} [${entry.mode}] them: "${entry.theirText.substring(0, 50)}..." → us: "${entry.ourReply.substring(0, 50)}..."`,
    );
  },

  getByAuthor: (authorHandle, limit = 5) => {
    const handle = authorHandle.toLowerCase();
    const results = get()
      .entries.filter((e) => e.authorHandle.toLowerCase() === handle)
      .sort((a, b) => b.repliedAt - a.repliedAt)
      .slice(0, limit);
    if (results.length > 0) {
      console.log(
        `xBooster: Found ${results.length} past interaction(s) with @${authorHandle}`,
      );
    }
    return results;
  },

  prune: async (retentionDays) => {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const current = get().entries;
    const pruned = current.filter((e) => e.repliedAt > cutoff);
    if (pruned.length !== current.length) {
      await chrome.storage.local.set({ [STORAGE_KEY]: pruned });
      set({ entries: pruned });
      console.log(
        `xBooster: Pruned ${current.length - pruned.length} old history entries (>${retentionDays}d)`,
      );
    }
  },
}));
