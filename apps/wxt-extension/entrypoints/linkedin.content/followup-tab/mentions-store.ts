import { create } from "zustand";
import { persist } from "zustand/middleware";
import { storage } from "wxt/storage";
import type { LinkedInMention } from "./types";

interface MentionsState {
  mentions: LinkedInMention[];
  watermark: string | null; // Most recent entityUrn
  lastFetchTime: number | null;
  isLoading: boolean;
  error: string | null;
}

interface MentionsActions {
  setMentions: (mentions: LinkedInMention[]) => void;
  prependMentions: (newMentions: LinkedInMention[]) => void;
  removeMention: (entityUrn: string) => void;
  setWatermark: (urn: string) => void;
  setLastFetchTime: (timestamp: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearMentions: () => void;
}

type MentionsStore = MentionsState & MentionsActions;

/**
 * Create a mentions store for a specific account
 */
export const createMentionsStore = (accountId: string) => {
  let resolveHydration: () => void;
  const hydrationPromise = new Promise<void>((resolve) => {
    resolveHydration = resolve;
  });

  const store = create<MentionsStore>()(
    persist(
      (set) => ({
        mentions: [],
        watermark: null,
        lastFetchTime: null,
        isLoading: false,
        error: null,

        setMentions: (mentions) => set({ mentions }),
        prependMentions: (newMentions) =>
          set((state) => {
            const existingUrns = new Set(state.mentions.map((m) => m.entityUrn));
            const unique = newMentions.filter((m) => !existingUrns.has(m.entityUrn));
            if (unique.length === 0) return state;
            return { mentions: [...unique, ...state.mentions] };
          }),
        removeMention: (entityUrn) =>
          set((state) => ({
            mentions: state.mentions.filter((m) => m.entityUrn !== entityUrn),
          })),
        setWatermark: (urn) => set({ watermark: urn }),
        setLastFetchTime: (timestamp) => set({ lastFetchTime: timestamp }),
        setIsLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        clearMentions: () =>
          set({
            mentions: [],
            watermark: null,
            lastFetchTime: null,
            error: null,
          }),
      }),
      {
        name: `local:linkedin-mentions-${accountId}`,
        storage: {
          getItem: (name) => storage.getItem(name as `local:${string}`),
          setItem: (name, value) => storage.setItem(name as `local:${string}`, value),
          removeItem: (name) => storage.removeItem(name as `local:${string}`),
        },
        onRehydrateStorage: () => () => {
          resolveHydration();
        },
      }
    )
  );

  return Object.assign(store, { hydrated: hydrationPromise });
};

/**
 * Store instance cache (per account)
 */
const storeCache = new Map<string, ReturnType<typeof createMentionsStore>>();

/**
 * Get or create mentions store for an account
 */
export function getMentionsStore(accountId: string) {
  if (!storeCache.has(accountId)) {
    storeCache.set(accountId, createMentionsStore(accountId));
  }
  return storeCache.get(accountId)!;
}

/**
 * Wait for a store to finish hydrating from Chrome storage
 */
export function waitForHydration(accountId: string): Promise<void> {
  return getMentionsStore(accountId).hydrated;
}
