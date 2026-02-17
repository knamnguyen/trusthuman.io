import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

interface AccountState {
  accountId: string | null;
  accountSlug: string | null;
}

interface AccountActions {
  setAccount: (accountId: string | null, accountSlug: string | null) => void;
  clearAccount: () => void;
}

type AccountStore = AccountState & AccountActions;

/**
 * expo-secure-store adapter for Zustand persist middleware.
 *
 * Unlike the NextJS app which uses route-based layouts to automatically
 * set/clear the account context (e.g. /[orgSlug]/[accountSlug]/layout.tsx
 * calls setAccount on mount, /[orgSlug]/layout.tsx calls clearAccount),
 * the mobile app has a flat tab navigation where the user manually picks
 * an account from a bottom sheet (OrgAccountSwitcher).
 *
 * We persist the selected account to SecureStore so it survives app restarts.
 * Without this, every app launch would start with no account selected, and
 * any accountProcedure tRPC call would fail with "No active account selected"
 * until the user manually re-selects one.
 */
const secureStoreAdapter: StateStorage = {
  getItem: (key: string) => {
    return SecureStore.getItem(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItem(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

export const useAccountStore = create<AccountStore>()(
  persist(
    (set) => ({
      accountId: null,
      accountSlug: null,

      setAccount: (accountId, accountSlug) => {
        set({ accountId, accountSlug });
      },

      /**
       * Called when switching orgs (see OrgAccountSwitcher.handleOrgSwitch).
       * Clears the persisted account so the user must pick a new one
       * under the new org — prevents sending a stale x-account-id header
       * for an account that doesn't belong to the newly selected org.
       */
      clearAccount: () => {
        set({ accountId: null, accountSlug: null });
      },
    }),
    {
      name: "account-store",
      storage: createJSONStorage(() => secureStoreAdapter),
      /**
       * Only persist the data fields, not the action functions.
       * On rehydration these values are merged back into the store,
       * and the tRPC provider (trpc-provider.tsx) reads accountId
       * via useAccountStore.getState().accountId to set the
       * x-account-id header on every request.
       */
      partialize: (state) => ({
        accountId: state.accountId,
        accountSlug: state.accountSlug,
      }),
    },
  ),
);
