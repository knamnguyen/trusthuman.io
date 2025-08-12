/**
 * Profile Extract Button Injection
 *
 * Adds an "Extract" button next to the profile overflow action button
 * on LinkedIn profile pages. Similar styling to the Engage button.
 */

/**
 * Profile data interface
 */
export interface ProfileData {
  profilePhotoUrl?: string;
  profileUrl: string;
  fullName?: string;
  headline?: string;
  profileUrn?: string;
  lists: string[];
}

/**
 * Storage keys
 */
export const STORAGE_KEYS = {
  LISTS: "engagekit-profile-lists",
  PROFILE_DATA: "engagekit-profile-data",
} as const;

/**
 * Global flag to prevent concurrent button creation
 */
let isAddingButton = false;

// Inject CSS styles for the profile extract button
(() => {
  if (document.getElementById("profile-extract-style")) return;
  const styleTag = document.createElement("style");
  styleTag.id = "profile-extract-style";
  styleTag.textContent = `
    /* Spinner animation */
    @keyframes profileExtractSpin {
      from { transform: rotate(0deg) }
      to { transform: rotate(360deg) }
    }
    .profile-extract-btn--loading {
      animation: profileExtractSpin 1s linear infinite !important;
      opacity: 0.6 !important;
      box-shadow: none !important;
    }

    /* Wiggle animation */
    @keyframes profileExtractWiggle {
      0% { transform: rotate(0deg) }
      25% { transform: rotate(2deg) }
      75% { transform: rotate(-2deg) }
      100% { transform: rotate(0deg) }
    }
    .profile-extract-btn--wiggle {
      animation: profileExtractWiggle 1.5s ease-in-out infinite;
    }

    /* Letter animation */
    @keyframes profileExtractLetterSlide {
      0% { transform: translateX(-1px) }
      100% { transform: translateX(1px) }
    }
    .profile-extract-btn--wiggle .profile-extract-btn-letter {
      display: inline-block;
      animation: profileExtractLetterSlide 2s ease-in-out infinite alternate;
    }

    /* Push-down state */
    .profile-extract-btn--down {
      transform: translate(1px, 1px) !important;
      box-shadow: none !important;
    }

    /* Dropdown styles */
    .profile-extract-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      min-width: 200px;
      max-height: 320px; /* Height for ~10 rows */
      display: none;
      flex-direction: column;
    }

    .profile-extract-dropdown.show {
      display: flex;
    }

    .profile-extract-dropdown-content {
      max-height: 260px; /* Space for 10 rows */
      overflow-y: auto;
      padding: 8px 0;
    }

    .profile-extract-dropdown-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 14px;
      color: #333;
      transition: background-color 0.1s ease;
    }

    .profile-extract-dropdown-item:hover {
      background-color: #f5f5f5;
    }

    .profile-extract-dropdown-checkbox {
      margin-right: 8px;
      cursor: pointer;
    }

    .profile-extract-dropdown-search {
      border-bottom: 1px solid #ddd;
      padding: 8px;
      background: #f9f9f9;
      border-radius: 8px 8px 0 0;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .profile-extract-dropdown-search-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      outline: none;
      background: white;
    }

    .profile-extract-dropdown-search-input:focus {
      border-color: #e6007a;
      box-shadow: 0 0 0 2px rgba(230, 0, 122, 0.1);
    }

    .profile-extract-dropdown-search-input::placeholder {
      color: #999;
    }
  `;
  document.head.appendChild(styleTag);
})();

/**
 * Check if current page is a LinkedIn personal profile page
 */
function isLinkedInProfilePage(): boolean {
  const url = window.location.href;
  return url.includes("linkedin.com/in/") && !url.includes("/edit/");
}

/**
 * Load lists from chrome storage
 */
export async function loadListsFromStorage(): Promise<string[]> {
  console.log("🔄 [Lists] Starting load operation from chrome.storage.local");
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.LISTS]);
    console.log("🔍 [Lists] Raw storage result:", result);
    const stored = result[STORAGE_KEYS.LISTS];
    if (stored && Array.isArray(stored)) {
      console.log(
        "✅ [Lists] Successfully loaded from chrome.storage:",
        stored.length,
        "lists ->",
        stored,
      );
      return stored;
    } else {
      console.log("📋 [Lists] No valid list data found, stored value:", stored);
    }
  } catch (error) {
    console.error("❌ [Lists] Error loading from chrome.storage:", error);
    console.error("❌ [Lists] Error details:", {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
  }
  console.log("📋 [Lists] Returning empty array as fallback");
  return [];
}

/**
 * Save lists to chrome storage
 */
export async function saveListsToStorage(lists: string[]): Promise<void> {
  console.log(
    "🔄 [Lists] Starting save operation to chrome.storage.local with:",
    lists,
  );
  try {
    const dataToSave = { [STORAGE_KEYS.LISTS]: lists };
    console.log("🔍 [Lists] Data being saved:", dataToSave);
    await chrome.storage.local.set(dataToSave);
    console.log(
      "✅ [Lists] Successfully saved to chrome.storage:",
      lists.length,
      "lists",
    );

    // Verification: Read back the data to confirm it was saved correctly
    const verification = await chrome.storage.local.get([STORAGE_KEYS.LISTS]);
    const savedData = verification[STORAGE_KEYS.LISTS];
    if (Array.isArray(savedData) && savedData.length === lists.length) {
      console.log(
        "✅ [Lists] Storage verification successful - data persisted correctly",
      );
    } else {
      console.error(
        "❌ [Lists] Storage verification failed - saved data doesn't match:",
        {
          expected: lists,
          actual: savedData,
        },
      );
    }
  } catch (error) {
    console.error("❌ [Lists] Error saving to chrome.storage:", error);
    console.error("❌ [Lists] Error details:", {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
  }
}

// Note: Old global checkbox state functions removed - now using profile-specific storage

/**
 * Load profile data from chrome storage
 */
export async function loadProfileDataFromStorage(): Promise<
  Record<string, ProfileData>
> {
  console.log(
    "🔄 [Profile Data] Starting load operation from chrome.storage.local",
  );
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.PROFILE_DATA]);
    console.log("🔍 [Profile Data] Raw storage result:", result);
    const stored = result[STORAGE_KEYS.PROFILE_DATA];
    if (stored && typeof stored === "object") {
      console.log(
        "✅ [Profile Data] Successfully loaded from chrome.storage:",
        Object.keys(stored).length,
        "profiles ->",
        Object.keys(stored),
      );
      return stored;
    } else {
      console.log(
        "📊 [Profile Data] No valid profile data found, stored value:",
        stored,
      );
    }
  } catch (error) {
    console.error(
      "❌ [Profile Data] Error loading from chrome.storage:",
      error,
    );
    console.error("❌ [Profile Data] Error details:", {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
  }
  console.log("📊 [Profile Data] Returning empty object as fallback");
  return {};
}

/**
 * Save profile data to chrome storage
 */
export async function saveProfileDataToStorage(
  data: Record<string, ProfileData>,
): Promise<void> {
  console.log(
    "🔄 [Profile Data] Starting save operation to chrome.storage.local with:",
    Object.keys(data).length,
    "profiles",
  );
  console.log("🔍 [Profile Data] Profile URLs being saved:", Object.keys(data));
  try {
    const dataToSave = { [STORAGE_KEYS.PROFILE_DATA]: data };
    console.log("🔍 [Profile Data] Data structure being saved:", dataToSave);
    await chrome.storage.local.set(dataToSave);
    console.log(
      "✅ [Profile Data] Successfully saved to chrome.storage:",
      Object.keys(data).length,
      "profiles",
    );

    // Verification: Read back the data to confirm it was saved correctly
    const verification = await chrome.storage.local.get([
      STORAGE_KEYS.PROFILE_DATA,
    ]);
    const savedData = verification[STORAGE_KEYS.PROFILE_DATA];
    if (
      savedData &&
      typeof savedData === "object" &&
      Object.keys(savedData).length === Object.keys(data).length
    ) {
      console.log(
        "✅ [Profile Data] Storage verification successful - data persisted correctly",
      );
    } else {
      console.error(
        "❌ [Profile Data] Storage verification failed - saved data doesn't match:",
        {
          expectedCount: Object.keys(data).length,
          actualCount: savedData ? Object.keys(savedData).length : 0,
          expectedKeys: Object.keys(data),
          actualKeys: savedData ? Object.keys(savedData) : [],
        },
      );
    }
  } catch (error) {
    console.error("❌ [Profile Data] Error saving to chrome.storage:", error);
    console.error("❌ [Profile Data] Error details:", {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });
  }
}

/**
 * Get current profile URL from the page
 */
function getCurrentProfileUrl(): string | null {
  try {
    const url = window.location.href;
    const match = url.match(/(https:\/\/www\.linkedin\.com\/in\/[^/?#]+)/i);
    const profileUrl = match?.[1] ?? null;
    console.log("🔍 [Profile URL] Current profile:", profileUrl);
    return profileUrl;
  } catch (error) {
    console.error(
      "❌ [Profile URL] Error extracting current profile URL:",
      error,
    );
    return null;
  }
}

/**
 * Extract profile data from current page
 */
function extractCurrentProfileData(): ProfileData | null {
  try {
    console.log("🎯 [Profile Extract] Starting profile data extraction...");

    // Select the main profile section structurally (no dynamic class codes)
    const section = document.querySelector(
      "#profile-content > div > div.scaffold-layout.scaffold-layout--main-aside.scaffold-layout--reflow.pv-profile.pvs-loader-wrapper__shimmer--animate > div > div > main > section.artdeco-card",
    );

    if (!section) {
      console.error("❌ [Profile Extract] Profile section not found");
      return null;
    }

    // Helper functions
    const getText = (el: Element | null | undefined) =>
      el ? el.textContent?.trim() : undefined;
    const getAttr = (el: Element | null | undefined, attr: string) =>
      el ? el.getAttribute(attr) : undefined;

    // Find the .ph5 container within the section (holds the main info)
    const ph5 = section.querySelector("div.ph5");

    // 1. Profile Photo (now uses class contains 'top-card-profile-picture__image--show')
    const profilePhotoUrl = getAttr(
      ph5?.querySelector('img[class*="top-card-profile-picture__image--show"]'),
      "src",
    );

    // 2. Profile URL (canonical, only up to username)
    let profileUrl;
    const profileLinks = section.querySelectorAll('a[href*="/in/"]');
    if (profileLinks && profileLinks.length > 0) {
      // Find the first LinkedIn profile link (not edit, not overlay)
      const firstLink = Array.from(profileLinks)[0] as HTMLAnchorElement;
      let rawUrl = firstLink.href.startsWith("http")
        ? firstLink.href
        : window.location.origin + firstLink.getAttribute("href");
      // Remove anything after /in/username
      const match = rawUrl.match(
        /(https:\/\/www\.linkedin\.com\/in\/[^/?#]+)/i,
      );
      profileUrl = match ? match[1] : rawUrl;
    } else {
      // fallback to page URL
      const rawUrl = window.location.origin + window.location.pathname;
      const match = rawUrl.match(
        /(https:\/\/www\.linkedin\.com\/in\/[^/?#]+)/i,
      );
      profileUrl = match ? match[1] : rawUrl;
    }

    // 3. Full Name
    const fullName = getText(
      ph5?.querySelector('h1[class*="v-align-middle"], h1.t-24'),
    );

    // 4. Headline
    const headline = getText(
      ph5?.querySelector("div.text-body-medium.break-words"),
    );

    // 5. Extract the profileUrn by scanning all <a> tags with encoded fsd_profile URN in href
    let profileUrn;
    const urnLinks = document.querySelectorAll(
      'a[href*="profileUrn=urn%3Ali%3Afsd_profile%3A"]',
    );
    for (const link of urnLinks) {
      const href = link.getAttribute("href");
      if (!href) continue;

      // Use URL and URLSearchParams for robust extraction
      try {
        const urlObj = new URL(href, window.location.origin);
        const urnParam = urlObj.searchParams.get("profileUrn");
        if (urnParam) {
          // urnParam may be encoded, decode it
          const decodedUrn = decodeURIComponent(urnParam);
          // urn:li:fsd_profile:ACoAAEOhwYgB6sRB9NHR9aamvqG5j7N2CiaI0q4
          const parts = decodedUrn.split(":");
          profileUrn = parts[parts.length - 1];
          console.log(
            "🎯 [URN Extract] Found URN from encoded link:",
            profileUrn,
          );
          break; // Only take the first match
        }
      } catch (e) {
        console.log(
          "⚠️ [URN Extract] URL parsing failed, trying regex fallback",
        );
        // Fallback: extract directly using regex (unlikely needed, but safe)
        const match = href.match(
          /profileUrn=urn%3Ali%3Afsd_profile%3A([A-Za-z0-9_-]+)/,
        );
        if (match && match[1]) {
          profileUrn = match[1];
          console.log(
            "🎯 [URN Extract] Found URN from regex fallback:",
            profileUrn,
          );
          break;
        }
      }
    }

    const extractedData: ProfileData = {
      profilePhotoUrl: profilePhotoUrl || undefined,
      profileUrl: profileUrl || getCurrentProfileUrl() || "",
      fullName: fullName || undefined,
      headline: headline || undefined,
      profileUrn: profileUrn || undefined,
      lists: [], // Will be populated when adding to lists
    };

    // Log the extracted data for verification
    console.log("✅ [Profile Extract] Extracted profile data:", {
      profilePhotoUrl: extractedData.profilePhotoUrl ? "✓ Found" : "❌ Missing",
      profileUrl: extractedData.profileUrl || "❌ Missing",
      fullName: extractedData.fullName || "❌ Missing",
      headline: extractedData.headline || "❌ Missing",
      profileUrn: extractedData.profileUrn || "❌ Missing",
      listsCount: extractedData.lists.length,
    });

    console.log("🔍 [Profile Extract] Full extracted data:", extractedData);

    // Special logging for URN extraction debugging
    if (extractedData.profileUrn) {
      console.log(
        "✅ [URN Extract] Successfully extracted profileUrn:",
        extractedData.profileUrn,
      );
    } else {
      console.log(
        "❌ [URN Extract] Failed to extract profileUrn - checking available elements:",
      );
      console.log(
        "  - Encoded URN links found:",
        document.querySelectorAll(
          'a[href*="profileUrn=urn%3Ali%3Afsd_profile%3A"]',
        ).length,
      );
      console.log(
        "  - All links with profileUrn found:",
        document.querySelectorAll('a[href*="profileUrn="]').length,
      );
    }

    return extractedData;
  } catch (error) {
    console.error("❌ [Profile Extract] Error extracting profile data:", error);
    return null;
  }
}

/**
 * Get lists for a specific profile
 */
async function getProfileLists(profileUrl: string): Promise<string[]> {
  const profileData = await loadProfileDataFromStorage();
  const profile = profileData[profileUrl];
  const lists = profile?.lists || [];
  console.log(
    `📋 [Profile Lists] Profile ${profileUrl} is in ${lists.length} lists:`,
    lists,
  );
  return lists;
}

/**
 * Add profile to a list (creates/updates profile data)
 */
async function addProfileToList(
  profileUrl: string,
  listName: string,
): Promise<void> {
  console.log(`🎯 [Data Flow] addProfileToList called with:`, {
    profileUrl,
    listName,
  });
  console.log(`➕ [Profile Lists] Adding ${profileUrl} to list "${listName}"`);

  const profileData = await loadProfileDataFromStorage();
  console.log(
    `🎯 [Data Flow] Loaded ${Object.keys(profileData).length} profiles from storage`,
  );
  let profile = profileData[profileUrl];

  // If profile doesn't exist, extract it from current page
  if (!profile) {
    console.log(
      "🆕 [Profile Lists] Profile not in storage, extracting from page...",
    );
    const extractedData = extractCurrentProfileData();
    if (!extractedData) {
      console.error(
        "❌ [Profile Lists] Failed to extract profile data, cannot add to list",
      );
      return;
    }
    profile = extractedData;
    profileData[profileUrl] = profile;
    console.log("✅ [Profile Lists] New profile created and stored");
  }

  // Add list if not already present
  if (!profile.lists.includes(listName)) {
    profile.lists.push(listName);
    console.log(
      `✅ [Profile Lists] Added "${listName}" to profile. Total lists: ${profile.lists.length}`,
    );
    console.log(`🎯 [Data Flow] Profile lists now:`, profile.lists);
  } else {
    console.log(`ℹ️ [Profile Lists] Profile already in list "${listName}"`);
  }

  // Save updated data
  console.log(
    `🎯 [Data Flow] Saving updated profile data (${Object.keys(profileData).length} profiles)...`,
  );
  await saveProfileDataToStorage(profileData);
  console.log("💾 [Profile Lists] Profile data updated in storage");

  console.log(`✅ [Data Flow] addProfileToList completed successfully`);
}

/**
 * Remove profile from a list
 */
async function removeProfileFromList(
  profileUrl: string,
  listName: string,
): Promise<void> {
  console.log(
    `➖ [Profile Lists] Removing ${profileUrl} from list "${listName}"`,
  );

  const profileData = await loadProfileDataFromStorage();
  const profile = profileData[profileUrl];

  if (!profile) {
    console.log(
      "ℹ️ [Profile Lists] Profile not found in storage, nothing to remove",
    );
    return;
  }

  // Remove list
  const index = profile.lists.indexOf(listName);
  if (index > -1) {
    profile.lists.splice(index, 1);
    console.log(
      `✅ [Profile Lists] Removed "${listName}" from profile. Remaining lists: ${profile.lists.length}`,
    );
  } else {
    console.log(`ℹ️ [Profile Lists] Profile was not in list "${listName}"`);
  }

  // Check if profile should be deleted
  if (profile.lists.length === 0) {
    delete profileData[profileUrl];
    console.log(
      "🗑️ [Profile Lists] Profile removed from storage (no lists remaining)",
    );
  }

  // Save updated data
  await saveProfileDataToStorage(profileData);
  console.log("💾 [Profile Lists] Profile data updated in storage");
}

/**
 * Delete profile if it has no lists
 */
async function deleteProfileIfEmpty(profileUrl: string): Promise<void> {
  const profileData = await loadProfileDataFromStorage();
  const profile = profileData[profileUrl];

  if (profile && profile.lists.length === 0) {
    delete profileData[profileUrl];
    await saveProfileDataToStorage(profileData);
    console.log("🗑️ [Profile Lists] Deleted empty profile:", profileUrl);
  }
}

/**
 * Clean up all profiles when a list is deleted
 */
async function cleanupProfilesForDeletedList(listName: string): Promise<void> {
  console.log(
    `🧹 [Profile Cleanup] Starting cleanup for deleted list: "${listName}"`,
  );

  const profileData = await loadProfileDataFromStorage();
  const profileUrls = Object.keys(profileData);
  let affectedProfiles = 0;
  let deletedProfiles = 0;
  let cleanedProfiles = 0;

  console.log(
    `🔍 [Profile Cleanup] Checking ${profileUrls.length} profiles for list dependencies`,
  );

  profileUrls.forEach((profileUrl) => {
    const profile = profileData[profileUrl];
    if (!profile) return; // Skip if profile doesn't exist

    // Check if this profile has the deleted list
    const listIndex = profile.lists.indexOf(listName);
    if (listIndex > -1) {
      affectedProfiles++;

      // Remove the deleted list from profile
      profile.lists.splice(listIndex, 1);
      console.log(
        `➖ [Profile Cleanup] Removed "${listName}" from ${profileUrl}. Lists remaining: ${profile.lists.length}`,
      );

      // Check if profile should be deleted (no lists remaining)
      if (profile.lists.length === 0) {
        delete profileData[profileUrl];
        deletedProfiles++;
        console.log(
          `🗑️ [Profile Cleanup] Deleted profile ${profileUrl} (no lists remaining)`,
        );
      } else {
        cleanedProfiles++;
        console.log(
          `✅ [Profile Cleanup] Kept profile ${profileUrl} (${profile.lists.length} lists remaining: ${profile.lists.join(", ")})`,
        );
      }
    }
  });

  // Save updated profile data
  if (affectedProfiles > 0) {
    await saveProfileDataToStorage(profileData);
    console.log(`💾 [Profile Cleanup] Updated profile storage after cleanup`);
  }

  // Summary logging
  console.log(`📊 [Profile Cleanup] Cleanup complete for "${listName}":`);
  console.log(`   • Profiles affected: ${affectedProfiles}`);
  console.log(`   • Profiles cleaned: ${cleanedProfiles}`);
  console.log(`   • Profiles deleted: ${deletedProfiles}`);
  console.log(`   • Profiles remaining: ${Object.keys(profileData).length}`);
}

/**
 * Create dropdown menu with search field and list items
 */
async function createDropdownMenu(): Promise<HTMLElement> {
  const dropdown = document.createElement("div");
  dropdown.className = "profile-extract-dropdown";

  // Create search bar at the top
  const searchContainer = document.createElement("div");
  searchContainer.className = "profile-extract-dropdown-search";

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "profile-extract-dropdown-search-input";
  searchInput.placeholder = "Search lists...";

  searchContainer.appendChild(searchInput);

  // Create scrollable content area
  const content = document.createElement("div");
  content.className = "profile-extract-dropdown-content";

  // Load lists from storage
  let listData = await loadListsFromStorage();

  // Note: Checkbox states are now loaded dynamically from profile data

  // Create "Add New List" item (sticky at top)
  function createNewListItem(): HTMLElement {
    const newListItem = document.createElement("div");
    newListItem.className = "profile-extract-dropdown-item";
    newListItem.style.borderBottom = "1px solid #ddd";
    newListItem.style.marginBottom = "8px";
    newListItem.style.background = "#f9f9f9";
    newListItem.style.position = "sticky";
    newListItem.style.top = "0";
    newListItem.style.zIndex = "5";

    const plusIcon = document.createElement("span");
    plusIcon.textContent = "+ ";
    plusIcon.style.color = "#e6007a";
    plusIcon.style.fontWeight = "bold";

    const label = document.createElement("span");
    label.textContent = "New List";
    label.style.cursor = "pointer";
    label.style.color = "#666";

    newListItem.appendChild(plusIcon);
    newListItem.appendChild(label);

    // Click handler to create new list
    newListItem.addEventListener("click", () => {
      createNewListInput(newListItem);
    });

    return newListItem;
  }

  // Create input for new list creation
  function createNewListInput(parentItem: HTMLElement): void {
    parentItem.innerHTML = "";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "profile-extract-dropdown-search-input";
    input.placeholder = "Enter list name...";
    input.style.fontSize = "14px";
    input.style.padding = "6px 8px";

    parentItem.appendChild(input);
    input.focus();

    const saveNewList = async () => {
      const listName = input.value.trim();
      // Check for duplicates case-insensitively to prevent confusion
      const normalizedNewName = listName.toLowerCase();
      const existingNormalizedNames = listData.map((name) =>
        name.toLowerCase(),
      );

      if (
        listName &&
        normalizedNewName !== "all" &&
        !existingNormalizedNames.includes(normalizedNewName)
      ) {
        listData.push(listName);
        await saveListsToStorage(listData);

        // Note: New lists start unchecked for all profiles (no initialization needed)

        // Re-render with updated data (this will show the new list immediately)
        await renderItems(listData);
      }
      // Restore the "+ New List" item
      const newNewListItem = createNewListItem();
      content.removeChild(parentItem);
      content.insertBefore(newNewListItem, content.firstChild);
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveNewList();
      } else if (e.key === "Escape") {
        // Restore the "+ New List" item
        const newNewListItem = createNewListItem();
        content.removeChild(parentItem);
        content.insertBefore(newNewListItem, content.firstChild);
      }
    });

    input.addEventListener("blur", saveNewList);
  }

  async function renderItems(filteredData: string[]) {
    content.innerHTML = "";

    // Always add the "+ New List" item at the top
    content.appendChild(createNewListItem());

    // Get current profile URL and its lists
    const currentProfileUrl = getCurrentProfileUrl();
    const profileLists = currentProfileUrl
      ? await getProfileLists(currentProfileUrl)
      : [];

    filteredData.forEach((listName) => {
      const item = document.createElement("div");
      item.className = "profile-extract-dropdown-item";
      item.dataset.listName = listName.toLowerCase();

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "profile-extract-dropdown-checkbox";
      // Create unique ID using original case and a hash for uniqueness
      const uniqueId = `list-checkbox-${listName.replace(/\s+/g, "-")}-${btoa(listName).replace(/[^a-zA-Z0-9]/g, "")}`;
      checkbox.id = uniqueId;

      // Load checkbox state from profile-specific data
      checkbox.checked = profileLists.includes(listName);

      console.log(
        `📍 [Profile Extract] Rendering ${listName}: checked=${checkbox.checked}, profile lists=${profileLists.length}`,
      );

      const label = document.createElement("label");
      label.htmlFor = uniqueId;
      label.textContent = listName;
      label.style.cursor = "pointer";

      // Add change event listener for profile-specific list management
      checkbox.addEventListener("change", async () => {
        console.log(
          `📍 [Profile Extract] Change event triggered for ${listName}: ${checkbox.checked}`,
        );

        const currentProfileUrl = getCurrentProfileUrl();
        if (!currentProfileUrl) {
          console.error("❌ [Profile Extract] Cannot get current profile URL");
          return;
        }

        if (checkbox.checked) {
          // Add profile to list (extracts profile data if needed)
          await addProfileToList(currentProfileUrl, listName);
        } else {
          // Remove profile from list (deletes profile if no lists remain)
          await removeProfileFromList(currentProfileUrl, listName);
        }
      });

      item.appendChild(checkbox);
      item.appendChild(label);

      // Add trash icon for deletion
      {
        const trashIcon = document.createElement("span");
        trashIcon.innerHTML = "🗑️";
        trashIcon.style.cursor = "pointer";
        trashIcon.style.marginLeft = "auto";
        trashIcon.style.padding = "4px";
        trashIcon.style.fontSize = "14px";
        trashIcon.style.opacity = "0.6";
        trashIcon.style.transition = "opacity 0.2s ease";
        trashIcon.title = `Delete "${listName}" list`;

        // Add hover effects
        trashIcon.addEventListener("mouseenter", () => {
          trashIcon.style.opacity = "1";
        });

        trashIcon.addEventListener("mouseleave", () => {
          trashIcon.style.opacity = "0.6";
        });

        // Add delete functionality
        trashIcon.addEventListener("click", async (e) => {
          e.stopPropagation(); // Prevent triggering item click

          // Confirm deletion
          if (
            confirm(`Are you sure you want to delete the "${listName}" list?`)
          ) {
            // Remove from listData
            const listIndex = listData.indexOf(listName);
            if (listIndex > -1) {
              listData.splice(listIndex, 1);
              await saveListsToStorage(listData);
            }

            // Clean up all profiles that had this list
            await cleanupProfilesForDeletedList(listName);

            // Re-render to update the UI
            await renderItems(listData);

            console.log(`📍 [Profile Extract] Deleted list: ${listName}`);
          }
        });

        // Make the item container flex to position trash icon at the end
        item.style.display = "flex";
        item.style.alignItems = "center";

        item.appendChild(trashIcon);
      }

      // Add click handler for the entire item
      item.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        // Only toggle if clicked on the item itself (not checkbox, label, or trash icon)
        if (
          target !== checkbox &&
          target !== label &&
          target.innerHTML !== "🗑️"
        ) {
          console.log(
            `📍 [Profile Extract] Item clicked for ${listName}, toggling from ${checkbox.checked} to ${!checkbox.checked}`,
          );
          checkbox.checked = !checkbox.checked;
          // Trigger the change event manually
          checkbox.dispatchEvent(new Event("change"));
        }
      });

      content.appendChild(item);
    });
  }

  // Initial render with all items
  await renderItems(listData);

  // Add search functionality
  searchInput.addEventListener("input", async (e) => {
    const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
    const filteredData = listData.filter((item) =>
      item.toLowerCase().includes(searchTerm),
    );
    await renderItems(filteredData);
  });

  dropdown.appendChild(searchContainer);
  dropdown.appendChild(content);

  return dropdown;
}

/**
 * Create and style the profile extract button with dropdown
 */
async function createProfileExtractButton(): Promise<HTMLElement> {
  // Create container for button and dropdown
  const container = document.createElement("div");
  container.style.position = "relative";
  container.style.display = "inline-block";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "profile-extract-btn";

  // Add text content instead of single letter
  const textSpan = document.createElement("span");
  textSpan.className = "profile-extract-btn-letter";
  textSpan.textContent = "List";
  btn.appendChild(textSpan);

  // Style the button to match the pink Engage button style
  Object.assign(btn.style, {
    background: "#e6007a", // Pink like Engage button
    color: "white",
    border: "none",
    borderRadius: "24px", // Rounded pill shape
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "inline", // Block display for positioning
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "4px", // 6px margin as requested
    marginTop: "0px", // Small top margin to create space below target button
    height: "32px",
    minWidth: "auto", // Auto width to fit text
    transition: "all 0.1s ease",
    boxShadow: "2px 2px 0 #000", // Black shadow like Engage button
    zIndex: "1",
  } as CSSStyleDeclaration);

  // Add wiggle animation by default
  btn.classList.add("profile-extract-btn--wiggle");

  // Create dropdown menu
  const dropdown = await createDropdownMenu();
  container.appendChild(btn);
  container.appendChild(dropdown);

  let hoverTimeout: NodeJS.Timeout;

  // Mouse interaction handlers for button and dropdown
  const showDropdown = () => {
    clearTimeout(hoverTimeout);
    dropdown.classList.add("show");
  };

  const hideDropdown = () => {
    hoverTimeout = setTimeout(() => {
      dropdown.classList.remove("show");
    }, 200); // Small delay to allow moving to dropdown
  };

  // Button hover events
  btn.addEventListener("mouseenter", () => {
    if (!btn.classList.contains("profile-extract-btn--loading")) {
      btn.classList.remove("profile-extract-btn--wiggle");
      btn.style.background = "#b8005a"; // Darker pink on hover
    }
    showDropdown();
  });

  btn.addEventListener("mouseleave", () => {
    if (
      !btn.classList.contains("profile-extract-btn--loading") &&
      !btn.classList.contains("profile-extract-btn--down")
    ) {
      btn.classList.add("profile-extract-btn--wiggle");
      btn.style.background = "#e6007a"; // Back to original pink
    }
    hideDropdown();
  });

  // Dropdown hover events
  dropdown.addEventListener("mouseenter", () => {
    clearTimeout(hoverTimeout);
  });

  dropdown.addEventListener("mouseleave", hideDropdown);

  btn.addEventListener("mousedown", () => {
    btn.classList.add("profile-extract-btn--down");
    btn.classList.remove("profile-extract-btn--wiggle");
  });

  btn.addEventListener("mouseup", () => {
    btn.classList.remove("profile-extract-btn--down");
    if (
      !btn.classList.contains("profile-extract-btn--loading") &&
      !btn.matches(":hover")
    ) {
      btn.classList.add("profile-extract-btn--wiggle");
    }
  });

  // Click handler (placeholder for now)
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("🔍 Profile extract button clicked!");
    // TODO: Add extraction logic here
  });

  return container;
}

/**
 * Add profile extract button after the parent of a specific overflow action button
 */
async function addProfileExtractButtonToOverflow(
  overflowButton: Element,
): Promise<void> {
  // Find the parent of the overflow button
  const overflowParent = overflowButton.parentElement;
  if (!overflowParent) {
    console.log("📍 [Profile Extract] Overflow button parent not found");
    return;
  }

  // Find the grandparent element (parent's parent) for insertion
  const grandParent = overflowParent.parentElement;
  if (!grandParent) {
    console.log(
      "📍 [Profile Extract] Grandparent element not found for placement",
    );
    return;
  }

  // Better duplicate detection: Check the entire grandparent container for existing buttons
  const existingButton = grandParent.querySelector(
    ".profile-extract-button-container",
  );
  if (existingButton) {
    console.log(
      "📍 [Profile Extract] Button already exists in container, skipping",
    );
    return;
  }

  // Create our extract button
  const extractButton = await createProfileExtractButton();
  extractButton.classList.add("profile-extract-button-container"); // Add identifier class

  // Insert the button right after the parent element (below the parent in DOM)
  if (overflowParent.nextSibling) {
    grandParent.insertBefore(extractButton, overflowParent.nextSibling);
  } else {
    grandParent.appendChild(extractButton);
  }

  console.log(
    "✅ [Profile Extract] Button added after overflow button's parent!",
  );
}

/**
 * Add profile extract button to the first overflow action button under scaffold-layout__inner
 */
async function addProfileExtractButton(): Promise<void> {
  // Prevent concurrent execution
  if (isAddingButton) {
    console.log(
      "📍 [Profile Extract] Button creation already in progress, skipping",
    );
    return;
  }

  isAddingButton = true;

  try {
    console.log(
      "🔍 [Profile Extract] Looking for overflow action button under scaffold-layout__inner...",
    );

    // Find the single element with class containing "scaffold-layout__inner"
    const scaffoldElement = document.querySelector(
      '[class*="scaffold-layout__inner"]',
    );

    if (!scaffoldElement) {
      console.log(
        "❌ [Profile Extract] No scaffold-layout__inner element found",
      );
      return;
    }

    console.log("📍 [Profile Extract] Found scaffold-layout__inner element");

    // Look for overflow button within the scaffold element
    const overflowButton = scaffoldElement.querySelector(
      '[id*="profile-overflow-action"]',
    );

    if (overflowButton) {
      console.log(
        `📍 [Profile Extract] Found overflow button in scaffold element:`,
        overflowButton,
      );
      await addProfileExtractButtonToOverflow(overflowButton);
    } else {
      console.log(
        "❌ [Profile Extract] No overflow action button found under scaffold-layout__inner",
      );
    }
  } finally {
    isAddingButton = false;
  }
}

/**
 * Initialize profile extract button functionality (internal)
 */
function initializeProfileExtractButtonInternal(): void {
  console.log("🚀 [Profile Extract] Initializing on profile page...");

  // Try to add button immediately
  addProfileExtractButton().catch(console.error);

  // Also retry after short delay in case page is still loading
  setTimeout(() => {
    addProfileExtractButton().catch(console.error);
  }, 1000);

  console.log("✅ [Profile Extract] Button initialization complete");
}

/**
 * Initialize profile extract functionality with URL monitoring
 */
export function initializeProfileExtractButton(): void {
  console.log(
    "🔄 [Profile Extract] Setting up URL monitoring for SPA navigation...",
  );

  let lastUrl = window.location.href;

  // Initialize immediately if on profile page
  if (isLinkedInProfilePage()) {
    initializeProfileExtractButtonInternal();
  }

  // Monitor for URL changes and DOM changes with unified logic
  const handlePageChange = () => {
    const currentUrl = window.location.href;

    // Check if URL changed (SPA navigation)
    if (currentUrl !== lastUrl) {
      console.log("🔄 [Profile Extract] URL changed:", {
        from: lastUrl,
        to: currentUrl,
      });
      lastUrl = currentUrl;
    }

    // Check if we're now on a profile page
    if (isLinkedInProfilePage()) {
      // Add button immediately - our existing protections prevent duplicates
      addProfileExtractButton().catch(console.error);
    }
  };

  // Set up MutationObserver to catch both DOM changes and SPA navigation
  const observer = new MutationObserver(handlePageChange);

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also listen for popstate events (browser back/forward)
  window.addEventListener("popstate", handlePageChange);

  console.log("✅ [Profile Extract] URL monitoring initialized");
}
