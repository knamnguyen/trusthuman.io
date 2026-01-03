import { create } from "zustand";

const STORAGE_KEY = "engagekit-comment-images";

export interface CommentImage {
  id: string;
  s3Url: string;
  name: string;
  addedAt: number;
}

interface CommentImageState {
  images: CommentImage[];
  isLoading: boolean;
  attachImageEnabled: boolean;
}

interface CommentImageActions {
  loadImages: () => Promise<void>;
  addImage: (s3Url: string, name: string) => Promise<void>;
  removeImage: (id: string) => Promise<void>;
  setAttachImageEnabled: (enabled: boolean) => void;
  getRandomImage: () => string | null;
}

type CommentImageStore = CommentImageState & CommentImageActions;

export const useCommentImageStore = create<CommentImageStore>((set, get) => ({
  // Initial state
  images: [],
  isLoading: true,
  attachImageEnabled: false,

  // Load images from chrome.storage.local
  loadImages: async () => {
    try {
      const result = await chrome.storage.local.get([
        STORAGE_KEY,
        `${STORAGE_KEY}-enabled`,
      ]);
      const images = result[STORAGE_KEY] || [];
      const enabled = result[`${STORAGE_KEY}-enabled`] ?? false;
      set({ images, attachImageEnabled: enabled, isLoading: false });
    } catch (error) {
      console.error("EngageKit: Failed to load comment images", error);
      set({ isLoading: false });
    }
  },

  // Add a new image
  addImage: async (s3Url: string, name: string) => {
    const newImage: CommentImage = {
      id: crypto.randomUUID(),
      s3Url,
      name,
      addedAt: Date.now(),
    };

    const images = [...get().images, newImage];
    set({ images });

    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: images });
    } catch (error) {
      console.error("EngageKit: Failed to save comment image", error);
    }
  },

  // Remove an image
  removeImage: async (id: string) => {
    const images = get().images.filter((img) => img.id !== id);
    set({ images });

    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: images });
    } catch (error) {
      console.error("EngageKit: Failed to remove comment image", error);
    }
  },

  // Toggle attach image feature
  setAttachImageEnabled: async (enabled: boolean) => {
    set({ attachImageEnabled: enabled });

    try {
      await chrome.storage.local.set({ [`${STORAGE_KEY}-enabled`]: enabled });
    } catch (error) {
      console.error("EngageKit: Failed to save attach image setting", error);
    }
  },

  // Get a random image URL (for comment submission)
  getRandomImage: () => {
    const { images, attachImageEnabled } = get();
    if (!attachImageEnabled || images.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex]?.s3Url ?? null;
  },
}));
