import { create } from "zustand";

const STORAGE_KEY = "xbooster_engage_settings";

export interface EngageSettings {
  /** Cycle interval range in minutes (wait between full source rotations) */
  fetchIntervalMin: number;
  fetchIntervalMax: number;
  /** Delay range in minutes between processing each source */
  sourceDelayMin: number;
  sourceDelayMax: number;
  /** Send delay range in seconds between replies within a source */
  sendDelayMin: number;
  sendDelayMax: number;
  /** Custom system prompt (empty = use default) */
  customPrompt: string;
  /** Reply length range in words */
  maxWordsMin: number;
  maxWordsMax: number;
  /** How many tweets to fetch per source per API call */
  fetchCount: number;
  /** Max replies to send per source */
  maxSendsPerSource: number;
  /** Auto-prune already-replied entries older than N days */
  repliedRetentionDays: number;
  /** Only engage with tweets newer than N minutes */
  maxTweetAgeMinutes: number;
}

const DEFAULT_ENGAGE_SETTINGS: EngageSettings = {
  fetchIntervalMin: 30,
  fetchIntervalMax: 60,
  sourceDelayMin: 1,
  sourceDelayMax: 10,
  sendDelayMin: 30,
  sendDelayMax: 60,
  customPrompt: "",
  maxWordsMin: 5,
  maxWordsMax: 20,
  fetchCount: 100,
  maxSendsPerSource: 3,
  repliedRetentionDays: 30,
  maxTweetAgeMinutes: 1440,
};

interface EngageSettingsStore {
  settings: EngageSettings;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<EngageSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export const useEngageSettingsStore = create<EngageSettingsStore>(
  (set, get) => ({
    settings: DEFAULT_ENGAGE_SETTINGS,
    isLoaded: false,

    loadSettings: async () => {
      const result = await chrome.storage.local.get([STORAGE_KEY]);
      const saved: Partial<EngageSettings> = result[STORAGE_KEY] ?? {};
      set({
        settings: { ...DEFAULT_ENGAGE_SETTINGS, ...saved },
        isLoaded: true,
      });
    },

    updateSettings: async (partial) => {
      const updated = { ...get().settings, ...partial };
      await chrome.storage.local.set({ [STORAGE_KEY]: updated });
      set({ settings: updated });
    },

    resetSettings: async () => {
      await chrome.storage.local.set({
        [STORAGE_KEY]: DEFAULT_ENGAGE_SETTINGS,
      });
      set({ settings: DEFAULT_ENGAGE_SETTINGS });
    },
  }),
);

export { DEFAULT_ENGAGE_SETTINGS };
