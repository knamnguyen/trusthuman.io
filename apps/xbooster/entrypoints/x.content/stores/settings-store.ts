import { create } from "zustand";

const STORAGE_KEY = "xbooster_settings";

export interface XBoosterSettings {
  /** Fetch interval range in minutes */
  fetchIntervalMin: number;
  fetchIntervalMax: number;
  /** Send delay range in minutes between replies (supports decimals, e.g. 0.5 = 30s) */
  sendDelayMin: number;
  sendDelayMax: number;
  /** Custom system prompt (empty = use default) */
  customPrompt: string;
  /** Reply length range in words */
  maxWordsMin: number;
  maxWordsMax: number;
  /** How many notifications to fetch per API call */
  fetchCount: number;
  /** Max replies to send per auto-run cycle */
  maxSendsPerCycle: number;
  /** Auto-prune already-replied entries older than N days */
  repliedRetentionDays: number;
  /** Only reply to mentions newer than N minutes */
  maxMentionAgeMinutes: number;
  /** Minutes to pause after 3 consecutive send failures */
  failPauseMinutes: number;
}

const DEFAULT_SETTINGS: XBoosterSettings = {
  fetchIntervalMin: 60,
  fetchIntervalMax: 90,
  sendDelayMin: 1,
  sendDelayMax: 2,
  customPrompt: "",
  maxWordsMin: 5,
  maxWordsMax: 15,
  fetchCount: 40,
  maxSendsPerCycle: 10,
  repliedRetentionDays: 30,
  maxMentionAgeMinutes: 1440,
  failPauseMinutes: 60,
};

interface SettingsStore {
  settings: XBoosterSettings;
  isLoaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<XBoosterSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: async () => {
    const result = await chrome.storage.local.get([STORAGE_KEY]);
    const saved: Partial<XBoosterSettings> = result[STORAGE_KEY] ?? {};
    set({ settings: { ...DEFAULT_SETTINGS, ...saved }, isLoaded: true });
  },

  updateSettings: async (partial) => {
    const updated = { ...get().settings, ...partial };
    await chrome.storage.local.set({ [STORAGE_KEY]: updated });
    set({ settings: updated });
  },

  resetSettings: async () => {
    await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_SETTINGS });
    set({ settings: DEFAULT_SETTINGS });
  },
}));

export { DEFAULT_SETTINGS };
