import { create } from "zustand";

interface AccountState {
  accountId: string | null;
  accountSlug: string | null;
}

interface AccountActions {
  /** Set current account from URL params */
  setAccount: (accountId: string | null, accountSlug: string | null) => void;
  /** Clear account (on navigation to org-level page) */
  clearAccount: () => void;
}

type AccountStore = AccountState & AccountActions;

export const useAccountStore = create<AccountStore>((set) => ({
  accountId: null,
  accountSlug: null,

  setAccount: (accountId, accountSlug) => set({ accountId, accountSlug }),
  clearAccount: () => set({ accountId: null, accountSlug: null }),
}));
