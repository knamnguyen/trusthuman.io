import { useEffect, useState } from "react";

import type { ProfileData } from "../utils/storage";
import {
  getProfilesForList,
  loadProfileDataWithErrorHandling,
} from "../utils/storage";

interface UseProfileDataReturn {
  profiles: ProfileData[];
  isLoading: boolean;
  error: string | null;
  refreshProfiles: () => void;
}

/**
 * Custom hook for managing profile data for a specific list
 *
 * @param selectedList - The list name to filter profiles by
 * @returns Object containing profiles data, loading state, error state, and refresh function
 */
export function useProfileData(
  selectedList: string | null,
): UseProfileDataReturn {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = async () => {
    console.log(
      "🎯 [Options Data Flow] useProfileData.loadProfiles starting for list:",
      selectedList,
    );
    setIsLoading(true);
    setError(null);

    const result = await loadProfileDataWithErrorHandling();
    console.log(
      "🎯 [Options Data Flow] loadProfileDataWithErrorHandling result:",
      {
        profileCount: Object.keys(result.profiles).length,
        error: result.error,
        profileKeys: Object.keys(result.profiles),
      },
    );

    if (result.error) {
      setError(result.error);
      setProfiles([]);
      console.log(
        "🎯 [Options Data Flow] Error loading profiles:",
        result.error,
      );
    } else if (selectedList) {
      const filteredProfiles = getProfilesForList(
        selectedList,
        result.profiles,
      );
      console.log(
        "🎯 [Options Data Flow] Filtered profiles for list",
        selectedList,
        ":",
        filteredProfiles.length,
      );
      setProfiles(filteredProfiles);
    } else {
      console.log(
        "🎯 [Options Data Flow] No list selected, setting empty profiles",
      );
      setProfiles([]);
    }

    setIsLoading(false);
    console.log("🎯 [Options Data Flow] useProfileData.loadProfiles completed");
  };

  const refreshProfiles = () => {
    loadProfiles();
  };

  useEffect(() => {
    loadProfiles();
  }, [selectedList]);

  return {
    profiles,
    isLoading,
    error,
    refreshProfiles,
  };
}
