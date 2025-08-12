type ProfileRecord = Record<
  string,
  {
    profileUrn?: string;
    lists?: string[];
  }
>;

export const getUrnsForSelectedList = async (): Promise<{
  enabled: boolean;
  urns: string[];
}> => {
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
    return { enabled: false, urns: [] };
  }

  const listName = (selectedTargetList ?? "").trim();
  const profiles = profileData ?? {};

  const urnSet = new Set<string>();
  Object.values(profiles).forEach((p) => {
    if (!p) return;
    const lists = Array.isArray(p.lists) ? p.lists : [];
    if (!listName) return; // if no list selected, do not collect any specific URNs
    if (lists.includes(listName)) {
      const urn = typeof p.profileUrn === "string" ? p.profileUrn : undefined;
      if (urn && urn.length > 0) urnSet.add(urn);
    }
  });

  return { enabled: true, urns: Array.from(urnSet) };
};
