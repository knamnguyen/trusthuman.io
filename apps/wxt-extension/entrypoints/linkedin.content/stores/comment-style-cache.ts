/**
 * Comment Style Cache - Simple cache for selected CommentStyle
 *
 * Fetches and caches the selected CommentStyle from settings.
 * Used by comment generation to get styleGuide, maxWords, and creativity.
 */

import { getTrpcClient } from "../../../lib/trpc/client";
import { useSettingsDBStore } from "./settings-db-store";
import { DEFAULT_STYLE_GUIDE } from "../utils/constants";

// =============================================================================
// TYPES
// =============================================================================

export interface CommentStyleConfig {
  /** ID of the style (null if using default) */
  styleId: string | null;
  /** Style guide / content - instructions for AI */
  styleGuide: string;
  /** Maximum words (1-300), default 100 */
  maxWords: number;
  /** Creativity / temperature (0-2), default 1.0 */
  creativity: number;
  /** Name of the style for logging */
  styleName: string | null;
}

// =============================================================================
// CACHE
// =============================================================================

let cachedStyleId: string | null = null;
let cachedConfig: CommentStyleConfig | null = null;

// Default config when no style is selected
const DEFAULT_CONFIG: CommentStyleConfig = {
  styleId: null,
  styleGuide: DEFAULT_STYLE_GUIDE,
  maxWords: 100,
  creativity: 1.0,
  styleName: null,
};

// =============================================================================
// FUNCTIONS
// =============================================================================

/**
 * Get the comment style config for AI generation.
 * Uses cached value if available and style ID hasn't changed.
 * Falls back to defaults if no style is selected.
 */
export async function getCommentStyleConfig(): Promise<CommentStyleConfig> {
  const settingsStore = useSettingsDBStore.getState();
  const selectedStyleId = settingsStore.commentGenerate?.commentStyleId ?? null;

  // If no style selected, return defaults
  if (!selectedStyleId) {
    console.log("[CommentStyleCache] No style selected, using defaults");
    cachedStyleId = null;
    cachedConfig = null;
    return DEFAULT_CONFIG;
  }

  // If cached and same style ID, return cached
  if (cachedConfig && cachedStyleId === selectedStyleId) {
    console.log("[CommentStyleCache] Using cached config for:", cachedConfig.styleName);
    return cachedConfig;
  }

  // Fetch the style from API
  try {
    console.log("[CommentStyleCache] Fetching style:", selectedStyleId);
    const trpc = getTrpcClient();
    const style = await trpc.persona.commentStyle.findById.query({ id: selectedStyleId });

    if (!style) {
      console.warn("[CommentStyleCache] Style not found, using defaults");
      cachedStyleId = null;
      cachedConfig = null;
      return DEFAULT_CONFIG;
    }

    // Cache the config
    cachedStyleId = selectedStyleId;
    cachedConfig = {
      styleId: selectedStyleId,
      styleGuide: style.content,
      maxWords: style.maxWords ?? 100,
      creativity: style.creativity ?? 1.0,
      styleName: style.name,
    };

    console.log("[CommentStyleCache] Cached style config:", {
      styleName: cachedConfig.styleName,
      maxWords: cachedConfig.maxWords,
      creativity: cachedConfig.creativity,
      styleGuideLength: cachedConfig.styleGuide.length,
    });

    return cachedConfig;
  } catch (error) {
    console.error("[CommentStyleCache] Error fetching style:", error);
    return DEFAULT_CONFIG;
  }
}

/**
 * Clear the cache (call when settings change)
 */
export function clearCommentStyleCache(): void {
  console.log("[CommentStyleCache] Cache cleared");
  cachedStyleId = null;
  cachedConfig = null;
}

/**
 * Pre-fetch the comment style (call after settings load)
 */
export async function prefetchCommentStyle(): Promise<void> {
  const settingsStore = useSettingsDBStore.getState();
  const selectedStyleId = settingsStore.commentGenerate?.commentStyleId ?? null;

  if (selectedStyleId) {
    console.log("[CommentStyleCache] Pre-fetching comment style...");
    await getCommentStyleConfig();
  }
}
