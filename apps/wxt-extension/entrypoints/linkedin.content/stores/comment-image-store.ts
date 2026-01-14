import { create } from "zustand";

const STORAGE_KEY = "engagekit-comment-images";

export interface CommentImage {
  id: string;
  url: string; // Display URL (S3 URL or blob URL)
  name: string;
  addedAt: number;
  isLocal: boolean; // Whether this is a local file (blob)
  blob?: Blob; // The actual blob for local files (not persisted)
}

// Serializable version for chrome.storage (no blob)
interface StoredCommentImage {
  id: string;
  url: string;
  name: string;
  addedAt: number;
  isLocal: false; // Only remote URLs are persisted
}

interface CommentImageState {
  images: CommentImage[];
  isLoading: boolean;
  attachImageEnabled: boolean;
}

interface CommentImageActions {
  loadImages: () => Promise<void>;
  addImage: (url: string, name: string) => Promise<void>;
  addLocalImage: (file: File) => void;
  removeImage: (id: string) => Promise<void>;
  setAttachImageEnabled: (enabled: boolean) => void;
  getRandomImage: () => string | Blob | null;
}

type CommentImageStore = CommentImageState & CommentImageActions;

export const useCommentImageStore = create<CommentImageStore>((set, get) => ({
  // Initial state
  images: [],
  isLoading: true,
  attachImageEnabled: false,

  // Load images from chrome.storage.local
  // Preserves existing local (in-memory) images when reloading
  loadImages: async () => {
    try {
      const result = await chrome.storage.local.get([
        STORAGE_KEY,
        `${STORAGE_KEY}-enabled`,
      ]);
      // Stored images are always remote (isLocal: false)
      const storedImages: StoredCommentImage[] = result[STORAGE_KEY] || [];
      const remoteImages: CommentImage[] = storedImages.map((img) => ({
        ...img,
        isLocal: false,
      }));

      // Preserve existing local images (they're only in memory)
      const existingLocalImages = get().images.filter((img) => img.isLocal);

      // Merge: existing local images + loaded remote images
      const images = [...existingLocalImages, ...remoteImages];

      const enabled = result[`${STORAGE_KEY}-enabled`] ?? false;
      set({ images, attachImageEnabled: enabled, isLoading: false });
    } catch (error) {
      console.error("EngageKit: Failed to load comment images", error);
      set({ isLoading: false });
    }
  },

  // Add a remote image URL (persisted to storage)
  addImage: async (url: string, name: string) => {
    const newImage: CommentImage = {
      id: crypto.randomUUID(),
      url,
      name,
      addedAt: Date.now(),
      isLocal: false,
    };

    const images = [...get().images, newImage];
    set({ images });

    // Only persist remote images
    const imagesToStore = images.filter((img) => !img.isLocal);
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: imagesToStore });
    } catch (error) {
      console.error("EngageKit: Failed to save comment image", error);
    }
  },

  // Add a local image file (in-memory only, not persisted)
  addLocalImage: (file: File) => {
    const blobUrl = URL.createObjectURL(file);
    const newImage: CommentImage = {
      id: crypto.randomUUID(),
      url: blobUrl,
      name: file.name,
      addedAt: Date.now(),
      isLocal: true,
      blob: file,
    };

    const images = [...get().images, newImage];
    set({ images });
    // Note: Local images are not persisted to chrome.storage
  },

  // Remove an image
  removeImage: async (id: string) => {
    const imageToRemove = get().images.find((img) => img.id === id);

    // Revoke blob URL for local images to free memory
    if (imageToRemove?.isLocal && imageToRemove.url.startsWith("blob:")) {
      URL.revokeObjectURL(imageToRemove.url);
    }

    const images = get().images.filter((img) => img.id !== id);
    set({ images });

    // Only persist remote images
    const imagesToStore = images.filter((img) => !img.isLocal);
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: imagesToStore });
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

  // Get a random image (for comment submission)
  // Returns blob for local images, URL string for remote images
  // Note: Caller is responsible for checking if image attachment is enabled
  // (via submitSettings.attachPictureEnabled from settings-store)
  getRandomImage: () => {
    const { images } = get();
    if (images.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * images.length);
    const image = images[randomIndex];
    if (!image) return null;

    // Return blob for local images (more efficient, no fetch needed)
    if (image.isLocal && image.blob) {
      return image.blob;
    }
    // Return URL for remote images
    return image.url;
  },
}));
