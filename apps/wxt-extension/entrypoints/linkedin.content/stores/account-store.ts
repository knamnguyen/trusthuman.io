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

import { getTrpcClient } from "../../../lib/trpc/client";
import {
  extractLinkedInProfileFromPage,
  type LinkedInProfile,
} from "../utils/use-linkedin-profile";

// Types inferred from API responses
interface Organization {
  id: string;
  name: string;
  purchasedSlots: number;
  stripeCustomerId: string | null;
  createdAt: Date;
  role: string;
}

interface LinkedInAccount {
  id: string;
  profileUrl: string | null;
  profileSlug: string | null;
  registrationStatus: string | null;
  name: string | null;
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
  refreshCurrentLinkedIn: () => void;

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
}

type AccountStore = AccountState & AccountActions;

const initialLinkedIn: LinkedInProfile = {
  profileUrl: null,
  miniProfileId: null,
  publicIdentifier: null,
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
  if (!currentLinkedIn.publicIdentifier) return "not_detected";
  if (matchingAccount) return "registered";
  return "not_registered";
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  ...initialState,

  fetchAccountData: async () => {
    // Skip if already loading
    if (get().isLoading) return;

    // Skip if recently fetched (within 30 seconds)
    const lastFetched = get().lastFetchedAt;
    if (lastFetched && Date.now() - lastFetched < 30000) {
      console.log("AccountStore: Skipping fetch, recently fetched");
      return;
    }

    set({ isLoading: true, error: null, currentLinkedInStatus: "loading" });

    try {
      const trpc = getTrpcClient();

      // Extract current LinkedIn profile from page
      const currentLinkedIn = extractLinkedInProfileFromPage();

      // Fetch organization first
      const org = await trpc.organization.getCurrent.query();

      if (!org) {
        set({
          organization: null,
          accounts: [],
          currentLinkedIn,
          currentLinkedInStatus: computeStatus(false, true, null, currentLinkedIn, null),
          matchingAccount: null,
          isLoading: false,
          isLoaded: true,
          lastFetchedAt: Date.now(),
        });
        return;
      }

      // Fetch accounts for the organization
      const accounts = await trpc.account.listByOrg.query({
        organizationId: org.id,
      });

      // Find matching account
      const matchingAccount = currentLinkedIn.publicIdentifier
        ? accounts.find((acc) => acc.profileSlug === currentLinkedIn.publicIdentifier) ?? null
        : null;

      const status = computeStatus(false, true, org, currentLinkedIn, matchingAccount);

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
        currentLinkedIn: currentLinkedIn.publicIdentifier,
        status,
      });
    } catch (error) {
      console.error("AccountStore: Error fetching account data", error);

      // Still try to get current LinkedIn even on error
      const currentLinkedIn = extractLinkedInProfileFromPage();

      set({
        currentLinkedIn,
        currentLinkedInStatus: "not_signed_in",
        isLoading: false,
        isLoaded: true,
        error: error instanceof Error ? error.message : "Failed to fetch account data",
      });
    }
  },

  refreshCurrentLinkedIn: () => {
    const currentLinkedIn = extractLinkedInProfileFromPage();
    const { accounts, organization, isLoading } = get();

    const matchingAccount = currentLinkedIn.publicIdentifier
      ? accounts.find((acc) => acc.profileSlug === currentLinkedIn.publicIdentifier) ?? null
      : null;

    // Determine if signed in based on whether we have org data
    const isSignedIn = organization !== null;
    const status = computeStatus(isLoading, isSignedIn, organization, currentLinkedIn, matchingAccount);

    set({
      currentLinkedIn,
      currentLinkedInStatus: status,
      matchingAccount,
    });

    console.log("AccountStore: Refreshed current LinkedIn", {
      publicIdentifier: currentLinkedIn.publicIdentifier,
      status,
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
    return get().accounts.find((acc) => acc.profileSlug === profileSlug) ?? null;
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
