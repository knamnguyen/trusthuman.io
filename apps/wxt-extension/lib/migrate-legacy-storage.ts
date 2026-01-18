import { useEffect } from "react";
import { QueryClient, useQueryClient } from "@tanstack/react-query";

import { useAccountStore } from "../entrypoints/linkedin.content/stores/account-store";
import { getTrpcClient, useTRPC } from "../lib/trpc/client";

export async function useMigrateLegacyStorage() {
  const { matchingAccount } = useAccountStore();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  // only start migration if there is a matching account
  useEffect(() => {
    console.warn("Checking for legacy storage migration...", {
      matchingAccount,
    });
    if (matchingAccount === null) return;
    void extractDataAndSaveInBackend(queryClient, trpc);
  }, [matchingAccount]);

  return null;
}

async function extractDataAndSaveInBackend(
  queryClient: QueryClient,
  trpc: ReturnType<typeof useTRPC>,
) {
  const completed = await hasCompletedLegacyMigration();
  if (completed) {
    console.log("Legacy migration already completed. Skipping.");
    return true;
  }

  const data = await extractDataFromLegacyStorage();
  const result = await saveLegacyDataInBackend(data);

  if (result.status === "error") {
    console.error("Error saving legacy data in backend:", result.reason);
    return false;
  }

  await markLegacyMigrationCompleted();

  await Promise.all([
    queryClient.invalidateQueries(
      trpc.persona.commentStyle.list.infiniteQueryOptions({}),
    ),
    queryClient.invalidateQueries(
      trpc.targetList.findLists.infiniteQueryOptions({}),
    ),
  ]);

  return true;
}

const STORAGE_KEYS = {
  LISTS: "engagekit-profile-lists",
  PROFILE_DATA: "engagekit-profile-data",
  PERSONAS: "customStyleGuides",
  COMPLETED_FLAG: "legacy-migration-completed",
} as const;

interface ProfileData {
  profilePhotoUrl?: string;
  profileUrl: string;
  fullName?: string;
  headline?: string;
  profileUrn?: string;
  lists: string[];
}

interface CustomStyle {
  name: string; // unique (case-insensitive)
  prompt: string;
}

async function hasCompletedLegacyMigration() {
  const data = await chrome.storage.local.get([STORAGE_KEYS.COMPLETED_FLAG]);
  return data[STORAGE_KEYS.COMPLETED_FLAG] === true;
}

async function markLegacyMigrationCompleted() {
  await chrome.storage.local.set({
    [STORAGE_KEYS.COMPLETED_FLAG]: true,
  });
}

async function extractDataFromLegacyStorage() {
  const data = await chrome.storage.local.get([
    STORAGE_KEYS.LISTS,
    STORAGE_KEYS.PROFILE_DATA,
    STORAGE_KEYS.PERSONAS,
  ]);
  const lists = data[STORAGE_KEYS.LISTS] as string[] | undefined;
  const profileData = data[STORAGE_KEYS.PROFILE_DATA] as
    | Record<string, ProfileData>
    | undefined;
  const personas = data[STORAGE_KEYS.PERSONAS] as CustomStyle[] | undefined;

  return {
    lists: lists ?? null,
    profileData: profileData ?? null,
    personas: personas ?? null,
  };
}

async function saveLegacyDataInBackend(data: {
  lists: string[] | null;
  profileData: Record<string, ProfileData> | null;
  personas: CustomStyle[] | null;
}) {
  try {
    const trpc = getTrpcClient();
    return await trpc.user.saveDataFromLegacyStorage.mutate(data);
  } catch (err) {
    return {
      status: "error",
      reason: `Failed to save legacy data in backend ${err instanceof Error ? err.message : String(err)}`,
    } as const;
  }
}
