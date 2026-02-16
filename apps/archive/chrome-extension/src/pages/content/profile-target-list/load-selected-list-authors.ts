import { normalizeAuthorName, SelectedListAuthors } from "./list-mode-types";

type ProfileRecord = Record<
  string,
  {
    fullName?: string;
    profileUrl?: string;
    profileUrn?: string;
    lists?: string[];
  }
>;

export const loadSelectedListAuthors =
  async (): Promise<SelectedListAuthors> => {
    const {
      targetListEnabled,
      selectedTargetList,
      profileData,
    }: {
      targetListEnabled?: boolean;
      selectedTargetList?: string;
      profileData?: ProfileRecord;
    } = await new Promise((resolve) => {
      chrome.storage.local.get(
        [
          "targetListEnabled",
          "selectedTargetList",
          // profile data key used by profile-list module
          "engagekit-profile-data",
        ],
        (r) =>
          resolve({
            targetListEnabled: r.targetListEnabled,
            selectedTargetList: r.selectedTargetList,
            profileData: r["engagekit-profile-data"],
          }),
      );
    });

    if (!targetListEnabled) {
      console.log("[ListMode] Target list not enabled");
      return { originalNames: [], normalizedNames: [] };
    }

    const listName = (selectedTargetList ?? "").trim();
    if (!listName) {
      console.log("[ListMode] No selected list name");
      return { originalNames: [], normalizedNames: [] };
    }

    const profiles = profileData ?? {};
    const seen = new Set<string>();
    const originalNames: string[] = [];
    const normalizedNames: string[] = [];

    Object.values(profiles).forEach((p) => {
      if (!p) return;
      const lists = Array.isArray(p.lists) ? p.lists : [];
      if (!lists.includes(listName)) return;
      const candidate = (p.fullName || "").trim();
      if (!candidate) return;
      const normalized = normalizeAuthorName(candidate);
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        originalNames.push(candidate);
        normalizedNames.push(normalized);
      }
    });

    console.log(
      `[ListMode] Loaded authors for list "${listName}":`,
      originalNames.length,
      originalNames,
    );

    return { originalNames, normalizedNames };
  };
