import { useEffect, useState } from "react";

import { loadListsWithErrorHandling } from "../utils/storage";

interface UseProfileListsReturn {
  lists: string[];
  isLoading: boolean;
  error: string | null;
  refreshLists: () => void;
}

/**
 * Custom hook for managing profile lists data
 *
 * @returns Object containing lists data, loading state, error state, and refresh function
 */
export function useProfileLists(): UseProfileListsReturn {
  const [lists, setLists] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLists = async () => {
    console.log("🎯 [Options Data Flow] useProfileLists.loadLists starting...");
    setIsLoading(true);
    setError(null);

    const result = await loadListsWithErrorHandling();
    console.log(
      "🎯 [Options Data Flow] loadListsWithErrorHandling result:",
      result,
    );
    setLists(result.lists);
    setError(result.error);
    setIsLoading(false);
    console.log(
      "🎯 [Options Data Flow] useProfileLists.loadLists completed, lists count:",
      result.lists.length,
    );
  };

  const refreshLists = () => {
    loadLists();
  };

  useEffect(() => {
    loadLists();
  }, []);

  return {
    lists,
    isLoading,
    error,
    refreshLists,
  };
}
