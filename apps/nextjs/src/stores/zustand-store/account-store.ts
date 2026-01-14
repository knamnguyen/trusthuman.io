import { z } from "zod";
import { create } from "zustand";

import { getCookies, saveCookie } from "~/lib/cookie";

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

const accountStateCookiesSchema = z
  .object({
    account_id: z.string().nullable().default(null),
    account_slug: z.string().nullable().default(null),
  })
  .catch(() => ({
    account_id: null,
    account_slug: null,
  }));

const cookies = accountStateCookiesSchema.parse(getCookies());

export const useAccountStore = create<AccountStore>((set) => ({
  accountId: cookies.account_id,
  accountSlug: cookies.account_slug,

  setAccount: (accountId, accountSlug) => {
    set({ accountId, accountSlug });
    saveCookie("account_id", accountId ?? "", {
      // set max age to -1 to delete cookie if accountId is null
      maxAge: accountId ? undefined : -1,
    });
    saveCookie("account_slug", accountSlug ?? "", {
      // set max age to -1 to delete cookie if accountSlug is null
      maxAge: accountSlug ? undefined : -1,
    });
  },
  clearAccount: () => set({ accountId: null, accountSlug: null }),
}));
