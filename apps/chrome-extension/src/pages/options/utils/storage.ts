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

/**
 * Ensure a list exists in the global lists store. Creates it if missing.
 */
export async function ensureListExists(listName: string): Promise<void> {
  const lists = await loadListsFromStorage();
  if (!lists.includes(listName)) {
    lists.push(listName);
    await saveListsToStorage(lists);
  }
}

/**
 * Add a list to a specific profile. Creates the list if missing.
 * If the profile entry doesn't exist in storage, no-op (options page only operates on existing profiles).
 */
export async function addListToProfile(
  profileUrl: string,
  listName: string,
): Promise<void> {
  await ensureListExists(listName);
  const profiles = await loadProfileDataFromStorage();
  const profile = profiles[profileUrl];
  if (!profile) return;
  if (!profile.lists.includes(listName)) {
    profile.lists.push(listName);
    await saveProfileDataToStorage(profiles);
  }
}

/**
 * Remove a list from a specific profile. If profile has no lists afterward, delete the profile entry.
 */
export async function removeListFromProfile(
  profileUrl: string,
  listName: string,
): Promise<void> {
  const profiles = await loadProfileDataFromStorage();
  const profile = profiles[profileUrl];
  if (!profile) return;
  const idx = profile.lists.indexOf(listName);
  if (idx > -1) profile.lists.splice(idx, 1);
  if (profile.lists.length === 0) {
    delete profiles[profileUrl];
  }
  await saveProfileDataToStorage(profiles);
}

/**
 * Delete a list from the global store and remove it from all profiles.
 * Delete any profile that ends up with zero lists.
 */
export async function deleteListEverywhere(listName: string): Promise<void> {
  // Remove list from global lists
  const lists = await loadListsFromStorage();
  const newLists = lists.filter((l) => l !== listName);
  await saveListsToStorage(newLists);

  // Cleanup all profiles
  const profiles = await loadProfileDataFromStorage();
  let mutated = false;
  Object.keys(profiles).forEach((url) => {
    const p = profiles[url];
    if (!p) return;
    const before = Array.isArray(p.lists) ? p.lists.length : 0;
    p.lists = (Array.isArray(p.lists) ? p.lists : []).filter(
      (l) => l !== listName,
    );
    if (p.lists.length === 0) {
      delete profiles[url];
      mutated = true;
    } else if (p.lists.length !== before) {
      mutated = true;
    }
  });
  if (mutated) {
    await saveProfileDataToStorage(profiles);
  }
}
