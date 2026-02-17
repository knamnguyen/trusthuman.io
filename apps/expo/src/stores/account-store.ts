import { create } from "zustand";

interface AccountState {
  accountId: string | null;
  accountSlug: string | null;
}

interface AccountActions {
  setAccount: (accountId: string | null, accountSlug: string | null) => void;
  clearAccount: () => void;
}

type AccountStore = AccountState & AccountActions;

export const useAccountStore = create<AccountStore>((set) => ({
  accountId: null,
  accountSlug: null,

  setAccount: (accountId, accountSlug) => {
    set({ accountId, accountSlug });
  },

  clearAccount: () => {
    set({ accountId: null, accountSlug: null });
  },
}));
