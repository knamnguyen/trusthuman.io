import type { ProfileData } from "../../content/profile-list/profile-extract-button";
import {
  loadListsFromStorage,
  loadProfileDataFromStorage,
  saveListsToStorage,
  saveProfileDataToStorage,
  STORAGE_KEYS,
} from "../../content/profile-list/profile-extract-button";

/**
 * Storage Utilities for Options Page
 *
 * Re-exports storage functions from profile-extract-button.ts for use in Options page
 */

export {
  type ProfileData,
  STORAGE_KEYS,
  loadListsFromStorage,
  saveListsToStorage,
  loadProfileDataFromStorage,
  saveProfileDataToStorage,
};

/**
 * Get profiles that belong to a specific list
 */
export function getProfilesForList(
  listName: string,
  allProfiles: Record<string, ProfileData>,
): ProfileData[] {
  return Object.values(allProfiles).filter((profile) =>
    profile.lists.includes(listName),
  );
}

/**
 * Get all unique lists from profile data
 */
export function getAllListsFromProfiles(
  profiles: Record<string, ProfileData>,
): string[] {
  const lists = new Set<string>();
  Object.values(profiles).forEach((profile) => {
    profile.lists.forEach((list) => lists.add(list));
  });
  return Array.from(lists).sort();
}

/**
 * Load lists with error handling for Options page
 */
export async function loadListsWithErrorHandling(): Promise<{
  lists: string[];
  error: string | null;
}> {
  console.log("🔄 [Options Storage] Starting loadListsWithErrorHandling");
  try {
    // Check chrome.storage availability
    if (!chrome?.storage?.local) {
      console.error(
        "❌ [Options Storage] chrome.storage.local is not available",
      );
      return { lists: [], error: "Chrome storage API not available" };
    }

    console.log("✅ [Options Storage] chrome.storage.local is available");
    const lists = await loadListsFromStorage();
    console.log("✅ [Options Storage] Successfully loaded lists:", lists);
    return { lists, error: null };
  } catch (error) {
    console.error("❌ [Options Storage] Error loading lists:", error);
    console.error("❌ [Options Storage] Error details:", {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    return { lists: [], error: "Failed to load lists" };
  }
}

/**
 * Load profile data with error handling for Options page
 */
export async function loadProfileDataWithErrorHandling(): Promise<{
  profiles: Record<string, ProfileData>;
  error: string | null;
}> {
  console.log("🔄 [Options Storage] Starting loadProfileDataWithErrorHandling");
  try {
    // Check chrome.storage availability
    if (!chrome?.storage?.local) {
      console.error(
        "❌ [Options Storage] chrome.storage.local is not available",
      );
      return { profiles: {}, error: "Chrome storage API not available" };
    }

    console.log("✅ [Options Storage] chrome.storage.local is available");
    const profiles = await loadProfileDataFromStorage();
    console.log(
      "✅ [Options Storage] Successfully loaded profile data:",
      Object.keys(profiles).length,
      "profiles",
    );
    return { profiles, error: null };
  } catch (error) {
    console.error("❌ [Options Storage] Error loading profile data:", error);
    console.error("❌ [Options Storage] Error details:", {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
    return { profiles: {}, error: "Failed to load profiles" };
  }
}
