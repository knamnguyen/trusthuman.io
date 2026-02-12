import { create } from "zustand";

import { parseSourceUrl } from "../utils/parse-source-url";

const STORAGE_KEY = "xbooster_engage_sources";

export interface EngageSource {
  id: string; // extracted numeric ID
  type: "list" | "community";
  url: string; // original URL
  label: string; // e.g., "List #1234567..." or "Community #9876543..."
  addedAt: number; // Date.now()
}

interface EngageSourcesStore {
  sources: EngageSource[];
  /** IDs of sources selected for fetching. Empty = fetch all. */
  selectedIds: string[];
  addSource: (url: string) => EngageSource | null; // null if invalid/duplicate
  removeSource: (id: string) => void;
  toggleSelected: (id: string) => void;
  selectAll: () => void;
  selectNone: () => void;
  /** Sources to actually fetch from (selected subset, or all if none selected). */
  getActiveSources: () => EngageSource[];
  loadSources: () => Promise<void>;
}

export const useEngageSourcesStore = create<EngageSourcesStore>((set, get) => ({
  sources: [],
  selectedIds: [],

  addSource: (url: string) => {
    const parsed = parseSourceUrl(url);
    if (!parsed) return null;

    // Reject duplicates
    const existing = get().sources;
    if (existing.some((s) => s.id === parsed.id)) return null;

    const label =
      parsed.type === "list"
        ? `List #${parsed.id.slice(0, 8)}...`
        : `Community #${parsed.id.slice(0, 8)}...`;

    const source: EngageSource = {
      id: parsed.id,
      type: parsed.type,
      url: url.trim(),
      label,
      addedAt: Date.now(),
    };

    const updated = [...existing, source];
    set({ sources: updated });
    chrome.storage.local.set({ [STORAGE_KEY]: updated });
    return source;
  },

  removeSource: (id: string) => {
    const updated = get().sources.filter((s) => s.id !== id);
    const selectedIds = get().selectedIds.filter((sid) => sid !== id);
    set({ sources: updated, selectedIds });
    chrome.storage.local.set({ [STORAGE_KEY]: updated });
  },

  toggleSelected: (id: string) => {
    const current = get().selectedIds;
    if (current.includes(id)) {
      set({ selectedIds: current.filter((sid) => sid !== id) });
    } else {
      set({ selectedIds: [...current, id] });
    }
  },

  selectAll: () => {
    set({ selectedIds: get().sources.map((s) => s.id) });
  },

  selectNone: () => {
    set({ selectedIds: [] });
  },

  getActiveSources: () => {
    const { sources, selectedIds } = get();
    if (selectedIds.length === 0) return sources;
    return sources.filter((s) => selectedIds.includes(s.id));
  },

  loadSources: async () => {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const saved: EngageSource[] = result[STORAGE_KEY] ?? [];
    set({ sources: saved });
  },
}));
