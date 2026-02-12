import { create } from "zustand";

export type ReplyStatus =
  | "pending"
  | "generating"
  | "ready"
  | "sending"
  | "sent"
  | "error";

export interface ReplyState {
  tweetId: string;
  text: string;
  status: ReplyStatus;
  error?: string;
}

interface RepliedEntry {
  tweetId: string;
  repliedAt: number; // Date.now() timestamp
}

interface EngageRepliesStore {
  replies: Record<string, ReplyState>;
  alreadyReplied: RepliedEntry[];
  setReply: (tweetId: string, reply: Partial<ReplyState>) => void;
  updateReplyText: (tweetId: string, text: string) => void;
  markSent: (tweetId: string) => void;
  isAlreadyReplied: (tweetId: string) => boolean;
  loadAlreadyReplied: () => Promise<void>;
  addToAlreadyReplied: (tweetId: string) => Promise<void>;
  pruneAlreadyReplied: (retentionDays: number) => Promise<void>;
  clear: () => void;
}

const STORAGE_KEY = "xbooster_engage_replied";

export const useEngageRepliesStore = create<EngageRepliesStore>((set, get) => ({
  replies: {},
  alreadyReplied: [],

  setReply: (tweetId, partial) =>
    set((state) => ({
      replies: {
        ...state.replies,
        [tweetId]: {
          ...state.replies[tweetId],
          tweetId,
          text: state.replies[tweetId]?.text ?? "",
          status: state.replies[tweetId]?.status ?? "pending",
          ...partial,
        },
      },
    })),

  updateReplyText: (tweetId, text) =>
    set((state) => ({
      replies: {
        ...state.replies,
        [tweetId]: { ...state.replies[tweetId]!, text },
      },
    })),

  markSent: (tweetId) => {
    set((state) => ({
      replies: {
        ...state.replies,
        [tweetId]: { ...state.replies[tweetId]!, status: "sent" },
      },
    }));
    get().addToAlreadyReplied(tweetId);
  },

  isAlreadyReplied: (tweetId) =>
    get().alreadyReplied.some((e) => e.tweetId === tweetId),

  loadAlreadyReplied: async () => {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const raw = result[STORAGE_KEY];

    // Migrate from old string[] format to new {tweetId, repliedAt}[] format
    if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
      const migrated: RepliedEntry[] = (raw as string[]).map((tweetId) => ({
        tweetId,
        repliedAt: Date.now(),
      }));
      await chrome.storage.local.set({ [STORAGE_KEY]: migrated });
      set({ alreadyReplied: migrated });
      return;
    }

    const entries: RepliedEntry[] = raw ?? [];
    set({ alreadyReplied: entries });
  },

  addToAlreadyReplied: async (tweetId) => {
    const current = get().alreadyReplied;
    if (current.some((e) => e.tweetId === tweetId)) return;
    const updated = [...current, { tweetId, repliedAt: Date.now() }];
    await chrome.storage.local.set({ [STORAGE_KEY]: updated });
    set({ alreadyReplied: updated });
  },

  pruneAlreadyReplied: async (retentionDays) => {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    const current = get().alreadyReplied;
    const pruned = current.filter((e) => e.repliedAt > cutoff);
    if (pruned.length !== current.length) {
      await chrome.storage.local.set({ [STORAGE_KEY]: pruned });
      set({ alreadyReplied: pruned });
      console.log(
        `xBooster: Pruned ${current.length - pruned.length} old engage replied entries (>${retentionDays}d)`,
      );
    }
  },

  clear: () => set({ replies: {} }),
}));
