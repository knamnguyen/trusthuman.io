/**
 * Account Store - Zustand store for organization, LinkedIn accounts, and current profile
 *
 * This store eagerly loads org/account data when auth is confirmed,
 * making it instantly available throughout the extension without
 * waiting for component mount.
 *
 * Also tracks the currently logged-in LinkedIn profile from the page
 * and whether it matches a registered account.
 *
 * Pattern:
 * 1. When auth state changes to signed in, immediately fetch org/accounts
 * 2. Extract current LinkedIn profile from page DOM
 * 3. Compute match status (is current LinkedIn registered?)
 * 4. Components can use this data without triggering their own fetches
 */

import { create } from "zustand";

import type { LinkedInProfile } from "@sassy/linkedin-automation/account/types";
import { createAccountUtilities } from "@sassy/linkedin-automation/account/create-account-utilities";

import { getTrpcClient } from "../../../lib/trpc/client";

// Types inferred from API responses
interface Organization {
  id: string;
  name: string;
  slug: string | null;
  purchasedSlots: number;
  stripeCustomerId: string | null;
  createdAt: Date;
  role: string;
}

interface LinkedInAccount {
  id: string;
  profileUrl: string | null;
  profileSlug: string | null;
  status: string | null;
  createdAt: Date;
}

// Status of the current LinkedIn profile
type CurrentLinkedInStatus =
  | "loading" // Still loading data
  | "not_detected" // Could not extract LinkedIn profile from page
  | "not_signed_in" // User not signed in to EngageKit
  | "no_org" // User has no organization
  | "registered" // Current LinkedIn is registered in org
  | "not_registered"; // Current LinkedIn is NOT registered in org

interface AccountState {
  // Organization & accounts data
  organization: Organization | null;
  accounts: LinkedInAccount[];

  // Current LinkedIn profile (from page DOM)
  currentLinkedIn: LinkedInProfile;
  currentLinkedInStatus: CurrentLinkedInStatus;

  // The matching account (if current LinkedIn is registered)
  matchingAccount: LinkedInAccount | null;

  // Loading states
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  // Last fetch timestamp for cache invalidation
  lastFetchedAt: number | null;
}

interface AccountActions {
  /**
   * Fetch organization, accounts, and current LinkedIn profile
   * Called when auth state confirms user is signed in
   */
  fetchAccountData: () => Promise<void>;

  /**
   * Refresh just the current LinkedIn profile from the page
   * Useful when navigating to different LinkedIn pages
   */
  refreshCurrentLinkedIn: () => Promise<void>;

  /**
   * Clear all account data (on sign out)
   */
  clear: () => void;

  /**
   * Check if a profile slug matches any registered account
   */
  isLinkedInAccountRegistered: (profileSlug: string | null) => boolean;

  /**
   * Get the matching account for a LinkedIn profile slug
   */
  getMatchingAccount: (profileSlug: string | null) => LinkedInAccount | null;

  /**
   * Pre-populate matching account from saved account ID (for auto-resume)
   * This allows API calls to work before the full account store loads
   */
  restoreAccountFromId: (accountId: string) => void;
}

type AccountStore = AccountState & AccountActions;

const initialLinkedIn: LinkedInProfile = {
  profileUrl: null,
  profileUrn: null,
  profileSlug: null,
};

const initialState: AccountState = {
  organization: null,
  accounts: [],
  currentLinkedIn: initialLinkedIn,
  currentLinkedInStatus: "loading",
  matchingAccount: null,
  isLoading: false,
  isLoaded: false,
  error: null,
  lastFetchedAt: null,
};

/**
 * Compute the status based on current state
 */
function computeStatus(
  isLoading: boolean,
  isSignedIn: boolean,
  organization: Organization | null,
  currentLinkedIn: LinkedInProfile,
  matchingAccount: LinkedInAccount | null,
): CurrentLinkedInStatus {
  if (isLoading) return "loading";
  if (!isSignedIn) return "not_signed_in";
  if (!organization) return "no_org";
  if (!currentLinkedIn.profileSlug) return "not_detected";
  if (matchingAccount) return "registered";
  return "not_registered";
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  ...initialState,

  fetchAccountData: async () => {
    // Skip if already loading
    if (get().isLoading) return;

    // // Skip if recently fetched (within 30 seconds)
    // const lastFetched = get().lastFetchedAt;
    // if (lastFetched && Date.now() - lastFetched < 30000) {
    //   console.log("AccountStore: Skipping fetch, recently fetched");
    //   return;
    // }

    set({ isLoading: true, error: null, currentLinkedInStatus: "loading" });

    try {
      const trpc = getTrpcClient();

      // Fetch organization from API (has correct purchasedSlots from DB)
      // Extract current LinkedIn profile and fetch accounts in parallel
      const [apiOrg, currentLinkedIn, accounts] = await Promise.all([
        trpc.organization.getCurrent.query(),
        createAccountUtilities().extractCurrentProfileAsync(),
        trpc.account.listByOrg.query(),
      ]);

      console.log("AccountStore: Fetched data", {
        apiOrg: apiOrg?.name,
        currentLinkedIn,
        accountCount: accounts.length,
      });

      if (!apiOrg) {
        set({
          organization: null,
          accounts: [],
          currentLinkedIn,
          currentLinkedInStatus: computeStatus(
            false,
            true,
            null,
            currentLinkedIn,
            null,
          ),
          matchingAccount: null,
          isLoading: false,
          isLoaded: true,
          lastFetchedAt: Date.now(),
        });
        return;
      }

      // Map API org to account store org format
      const org: Organization = {
        id: apiOrg.id,
        name: apiOrg.name,
        slug: apiOrg.orgSlug,
        purchasedSlots: apiOrg.purchasedSlots,
        stripeCustomerId: apiOrg.stripeCustomerId,
        createdAt: apiOrg.createdAt,
        role: apiOrg.role,
      };

      // Find matching account
      const matchingAccount = currentLinkedIn.profileSlug
        ? (accounts.find(
            (acc) => acc.profileSlug === currentLinkedIn.profileSlug,
          ) ?? null)
        : null;

      const status = computeStatus(
        false,
        true,
        org,
        currentLinkedIn,
        matchingAccount,
      );

      set({
        organization: org,
        accounts,
        currentLinkedIn,
        currentLinkedInStatus: status,
        matchingAccount,
        isLoading: false,
        isLoaded: true,
        error: null,
        lastFetchedAt: Date.now(),
      });

      console.log("AccountStore: Fetched account data", {
        org: org.name,
        accountCount: accounts.length,
        currentLinkedIn: currentLinkedIn.profileSlug,
        status,
      });
    } catch (error) {
      console.error("AccountStore: Error fetching account data", error);

      // Still try to get current LinkedIn even on error (async for v2 DOM)
      const currentLinkedIn =
        await createAccountUtilities().extractCurrentProfileAsync();

      set({
        currentLinkedIn,
        currentLinkedInStatus: "not_signed_in",
        isLoading: false,
        isLoaded: true,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch account data",
      });
    }
  },

  refreshCurrentLinkedIn: async () => {
    const currentLinkedIn =
      await createAccountUtilities().extractCurrentProfileAsync();
    const {
      accounts,
      organization,
      isLoading,
      matchingAccount: currentMatchingAccount,
    } = get();

    const matchingAccount = currentLinkedIn.profileSlug
      ? (accounts.find(
          (acc) => acc.profileSlug === currentLinkedIn.profileSlug,
        ) ?? null)
      : null;

    // CRITICAL: If we have a temporary account from restoreAccountFromId (has no profileSlug)
    // and accounts array is empty (full fetch hasn't completed), preserve the temporary account.
    // This prevents auto-resume API calls from failing due to race condition.
    const finalMatchingAccount =
      !matchingAccount &&
      currentMatchingAccount &&
      !currentMatchingAccount.profileSlug &&
      accounts.length === 0
        ? currentMatchingAccount // Preserve temporary account
        : matchingAccount; // Use newly computed account

    // Determine if signed in based on whether we have org data
    const isSignedIn = organization !== null;
    const status = computeStatus(
      isLoading,
      isSignedIn,
      organization,
      currentLinkedIn,
      finalMatchingAccount,
    );

    set({
      currentLinkedIn,
      currentLinkedInStatus: status,
      matchingAccount: finalMatchingAccount,
    });

    console.log("AccountStore: Refreshed current LinkedIn", {
      profileSlug: currentLinkedIn.profileSlug,
      status,
      preservedTemporaryAccount: finalMatchingAccount !== matchingAccount,
    });
  },

  clear: () => {
    set({
      ...initialState,
      currentLinkedInStatus: "not_signed_in",
    });
  },

  isLinkedInAccountRegistered: (profileSlug) => {
    if (!profileSlug) return false;
    return get().accounts.some((acc) => acc.profileSlug === profileSlug);
  },

  getMatchingAccount: (profileSlug) => {
    if (!profileSlug) return null;
    return (
      get().accounts.find((acc) => acc.profileSlug === profileSlug) ?? null
    );
  },

  restoreAccountFromId: (accountId) => {
    console.log("[AccountStore] Restoring account from saved ID:", accountId);

    // Create minimal account object with just the ID
    // This allows tRPC client to add x-account-id header
    const temporaryAccount: LinkedInAccount = {
      id: accountId,
      profileUrl: null,
      profileSlug: null,
      status: null,
      createdAt: new Date(),
    };

    set({
      matchingAccount: temporaryAccount,
    });

    console.log(
      "[AccountStore] Temporary account set - API calls will work until full store loads",
    );
  },
}));

/**
 * Initialize account data fetching when auth state changes
 * Call this from the content script initialization
 */
export function initAccountStoreListener() {
  // Listen for auth state changes from background
  const listener = (message: { action: string; isSignedIn?: boolean }) => {
    if (message.action === "authStateChanged") {
      if (message.isSignedIn) {
        console.log("AccountStore: Auth confirmed, fetching account data");
        useAccountStore.getState().fetchAccountData();
      } else {
        console.log("AccountStore: User signed out, clearing account data");
        useAccountStore.getState().clear();
      }
    }
  };

  chrome.runtime.onMessage.addListener(listener);

  return () => {
    chrome.runtime.onMessage.removeListener(listener);
  };
}
