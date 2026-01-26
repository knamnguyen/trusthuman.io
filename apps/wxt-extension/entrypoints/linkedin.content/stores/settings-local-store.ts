/**
 * Local Settings Store
 *
 * Stores client-side settings that should NOT be synced to DB.
 * These are per-browser settings stored in browser.storage.local.
 *
 * Includes:
 * - Behavior settings (humanOnlyMode, autoEngageOnCommentClick, etc.)
 * - Comment attachment image (single image, base64 stored)
 *
 * NOTE: `attachImageEnabled` toggle is in DB (submitComment.attachPictureEnabled)
 *       This store only handles the actual image data.
 */

import { create } from "zustand";

// =============================================================================
// STORAGE KEYS
// =============================================================================

const BEHAVIOR_STORAGE_KEY = "engagekit-behavior-settings";
const IMAGE_STORAGE_KEY = "engagekit-comment-image";

// =============================================================================
// TYPES - BEHAVIOR
// =============================================================================

export interface BehaviorSettings {
  humanOnlyMode: boolean;
  autoEngageOnCommentClick: boolean;
  spacebarAutoEngage: boolean;
  postNavigator: boolean;
  autoSubmitAfterGenerate: boolean;
}

const DEFAULT_BEHAVIOR: BehaviorSettings = {
  humanOnlyMode: false,
  autoEngageOnCommentClick: false,
  spacebarAutoEngage: false,
  postNavigator: false,
  autoSubmitAfterGenerate: false,
};

// =============================================================================
// TYPES - IMAGE
// =============================================================================

export interface CommentImage {
  id: string;
  name: string;
  addedAt: number;
  base64Data?: string; // For persistent storage
  blob?: Blob; // For submission (recreated from base64 on load)
  blobUrl?: string; // For display (recreated from blob)
}

// Serializable version for browser.storage (no blob/blobUrl)
interface StoredCommentImage {
  id: string;
  name: string;
  addedAt: number;
  base64Data: string;
}

// =============================================================================
// STORE STATE
// =============================================================================

interface SettingsLocalState {
  // Behavior settings
  behavior: BehaviorSettings;
  behaviorLoaded: boolean;

  // Image (single image only - 1/1 limit)
  image: CommentImage | null;
  imageLoaded: boolean;

  // Combined loaded state
  isLoaded: boolean;
}

interface SettingsLocalActions {
  // Behavior actions
  loadBehavior: () => Promise<void>;
  updateBehavior: <K extends keyof BehaviorSettings>(
    key: K,
    value: BehaviorSettings[K],
  ) => Promise<void>;
  resetBehavior: () => Promise<void>;

  // Image actions
  loadImage: () => Promise<void>;
  setImage: (file: File) => Promise<void>;
  removeImage: () => Promise<void>;
  getImageBlob: () => Blob | null;

  // Combined
  loadAll: () => Promise<void>;
}

type SettingsLocalStore = SettingsLocalState & SettingsLocalActions;

// =============================================================================
// IMAGE UTILITIES
// =============================================================================

/**
 * Convert File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(",")[1];
      resolve(base64 ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 string to Blob
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Detect MIME type from file name
 */
function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      return "image/png"; // Default fallback
  }
}

// =============================================================================
// STORE
// =============================================================================

export const useSettingsLocalStore = create<SettingsLocalStore>((set, get) => ({
  // Initial state
  behavior: { ...DEFAULT_BEHAVIOR },
  behaviorLoaded: false,
  image: null,
  imageLoaded: false,
  isLoaded: false,

  // ==========================================================================
  // BEHAVIOR ACTIONS
  // ==========================================================================

  loadBehavior: async () => {
    try {
      const result = await browser.storage.local.get(BEHAVIOR_STORAGE_KEY);
      const stored = result[BEHAVIOR_STORAGE_KEY] as
        | Partial<BehaviorSettings>
        | undefined;

      if (stored) {
        console.log("SettingsLocalStore: Loaded behavior from storage", stored);
        set({
          behavior: { ...DEFAULT_BEHAVIOR, ...stored },
          behaviorLoaded: true,
        });
      } else {
        console.log(
          "SettingsLocalStore: No stored behavior, using defaults",
        );
        set({ behaviorLoaded: true });
      }
    } catch (error) {
      console.error("SettingsLocalStore: Error loading behavior", error);
      set({ behaviorLoaded: true });
    }

    // Update combined loaded state
    const { imageLoaded } = get();
    if (imageLoaded) {
      set({ isLoaded: true });
    }
  },

  updateBehavior: async (key, value) => {
    const currentBehavior = get().behavior;
    const newBehavior = { ...currentBehavior, [key]: value };

    // Update in-memory
    set({ behavior: newBehavior });

    // Save to storage
    try {
      await browser.storage.local.set({
        [BEHAVIOR_STORAGE_KEY]: newBehavior,
      });
      console.log(`SettingsLocalStore: Updated behavior.${key} to`, value);
    } catch (error) {
      console.error(`SettingsLocalStore: Error saving behavior.${key}`, error);
    }
  },

  resetBehavior: async () => {
    set({ behavior: { ...DEFAULT_BEHAVIOR } });

    try {
      await browser.storage.local.remove(BEHAVIOR_STORAGE_KEY);
      console.log("SettingsLocalStore: Reset behavior to defaults");
    } catch (error) {
      console.error("SettingsLocalStore: Error clearing behavior", error);
    }
  },

  // ==========================================================================
  // IMAGE ACTIONS
  // ==========================================================================

  loadImage: async () => {
    try {
      const result = await browser.storage.local.get(IMAGE_STORAGE_KEY);
      const stored = result[IMAGE_STORAGE_KEY] as StoredCommentImage | undefined;

      if (!stored) {
        console.log("SettingsLocalStore: No stored image");
        set({ image: null, imageLoaded: true });
      } else {
        // Recreate blob from base64
        const mimeType = getMimeType(stored.name);
        const blob = base64ToBlob(stored.base64Data, mimeType);
        const blobUrl = URL.createObjectURL(blob);

        const image: CommentImage = {
          id: stored.id,
          name: stored.name,
          addedAt: stored.addedAt,
          base64Data: stored.base64Data,
          blob,
          blobUrl,
        };

        set({ image, imageLoaded: true });
        console.log("SettingsLocalStore: Loaded image from storage", stored.name);
      }
    } catch (error) {
      console.error("SettingsLocalStore: Error loading image", error);
      set({ image: null, imageLoaded: true });
    }

    // Update combined loaded state
    const { behaviorLoaded } = get();
    if (behaviorLoaded) {
      set({ isLoaded: true });
    }
  },

  setImage: async (file: File) => {
    // Revoke previous blob URL if exists
    const currentImage = get().image;
    if (currentImage?.blobUrl) {
      URL.revokeObjectURL(currentImage.blobUrl);
    }

    try {
      // Convert to base64
      const base64Data = await fileToBase64(file);

      // Create blob and blob URL
      const blob = file;
      const blobUrl = URL.createObjectURL(blob);

      const image: CommentImage = {
        id: crypto.randomUUID(),
        name: file.name,
        addedAt: Date.now(),
        base64Data,
        blob,
        blobUrl,
      };

      set({ image });

      // Save to storage (only base64, not blob)
      const storedImage: StoredCommentImage = {
        id: image.id,
        name: image.name,
        addedAt: image.addedAt,
        base64Data,
      };

      await browser.storage.local.set({ [IMAGE_STORAGE_KEY]: storedImage });

      console.log("SettingsLocalStore: Saved image", file.name);
    } catch (error) {
      console.error("SettingsLocalStore: Error saving image", error);
      throw error;
    }
  },

  removeImage: async () => {
    const currentImage = get().image;

    // Revoke blob URL to free memory
    if (currentImage?.blobUrl) {
      URL.revokeObjectURL(currentImage.blobUrl);
    }

    set({ image: null });

    // Remove from storage
    try {
      await browser.storage.local.remove(IMAGE_STORAGE_KEY);
      console.log("SettingsLocalStore: Removed image");
    } catch (error) {
      console.error("SettingsLocalStore: Error removing image", error);
    }
  },

  getImageBlob: () => {
    const { image } = get();
    return image?.blob ?? null;
  },

  // ==========================================================================
  // COMBINED ACTIONS
  // ==========================================================================

  loadAll: async () => {
    await Promise.all([get().loadBehavior(), get().loadImage()]);
    set({ isLoaded: true });
  },
}));

// =============================================================================
// AUTO-LOAD ON INITIALIZATION
// =============================================================================

// Load all settings from storage when the store is first imported
useSettingsLocalStore.getState().loadAll();

// =============================================================================
// EXPORTS
// =============================================================================

export { DEFAULT_BEHAVIOR };
