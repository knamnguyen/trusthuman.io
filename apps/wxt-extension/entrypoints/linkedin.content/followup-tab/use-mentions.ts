import { useCallback, useEffect, useRef, useState } from "react";
import { useAccountStore } from "../stores";
import { getMentionsStore, waitForHydration } from "./mentions-store";
import { fetchMentionsWithWatermark } from "./linkedin-mentions-fetcher";
import type { LinkedInMention } from "./types";

interface MentionsSnapshot {
  mentions: LinkedInMention[];
  watermark: string | null;
  lastFetchTime: number | null;
  isLoading: boolean;
  error: string | null;
}

const EMPTY_SNAPSHOT: MentionsSnapshot = {
  mentions: [],
  watermark: null,
  lastFetchTime: null,
  isLoading: false,
  error: null,
};

function selectSnapshot(state: MentionsSnapshot): MentionsSnapshot {
  return {
    mentions: state.mentions,
    watermark: state.watermark,
    lastFetchTime: state.lastFetchTime,
    isLoading: state.isLoading,
    error: state.error,
  };
}

interface UseMentionsReturn {
  mentions: LinkedInMention[];
  lastFetchTime: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  removeMention: (entityUrn: string) => void;
}

export function useMentions(): UseMentionsReturn {
  const accountId = useAccountStore((state) => state.currentLinkedIn.profileUrn);
  console.log("[FollowUp] useMentions hook, accountId:", accountId);

  const [snapshot, setSnapshot] = useState<MentionsSnapshot>(EMPTY_SNAPSHOT);
  const accountIdRef = useRef(accountId);
  accountIdRef.current = accountId;

  // Subscribe to store changes via useEffect (avoids conditional hook calls)
  useEffect(() => {
    if (!accountId) {
      console.log("[FollowUp] No accountId, using empty snapshot");
      setSnapshot(EMPTY_SNAPSHOT);
      return;
    }

    const store = getMentionsStore(accountId);
    const initial = selectSnapshot(store.getState());
    console.log("[FollowUp] Store subscribed, initial state:", {
      mentionsCount: initial.mentions.length,
      watermark: initial.watermark,
      lastFetchTime: initial.lastFetchTime,
    });

    // Sync initial state
    setSnapshot(initial);

    // Subscribe to future changes
    const unsub = store.subscribe((state) => {
      setSnapshot(selectSnapshot(state));
    });

    return unsub;
  }, [accountId]);

  const refetch = useCallback(async () => {
    const id = accountIdRef.current;
    if (!id) {
      console.log("[FollowUp] refetch: no accountId, skipping");
      return;
    }

    console.log("[FollowUp] refetch: starting for account", id);
    const store = getMentionsStore(id);
    store.getState().setIsLoading(true);
    store.getState().setError(null);

    try {
      // Wait for persisted state to load from Chrome storage
      await waitForHydration(id);
      const currentWatermark = store.getState().watermark;
      const newMentions = await fetchMentionsWithWatermark(id, currentWatermark);

      if (newMentions.length > 0) {
        store.getState().prependMentions(newMentions);
        store.getState().setWatermark(newMentions[0]!.entityUrn);
        console.log("[FollowUp] refetch: prepended", newMentions.length, "new mentions");
      } else {
        console.log("[FollowUp] refetch: no new mentions");
      }

      store.getState().setLastFetchTime(Date.now());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      store.getState().setError(message);
      console.error("[FollowUp] refetch error:", err);
    } finally {
      store.getState().setIsLoading(false);
    }
  }, []);

  const removeMention = useCallback((entityUrn: string) => {
    const id = accountIdRef.current;
    if (!id) return;
    getMentionsStore(id).getState().removeMention(entityUrn);
  }, []);

  return {
    mentions: snapshot.mentions,
    lastFetchTime: snapshot.lastFetchTime,
    isLoading: snapshot.isLoading,
    error: snapshot.error,
    refetch,
    removeMention,
  };
}
