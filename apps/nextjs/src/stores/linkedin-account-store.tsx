"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { useStore } from "@tanstack/react-store";
import { Store } from "@tanstack/store";

interface LinkedInAccountState {
  accountId: string | null;
  assumedUserToken: string | null;
}

class LinkedInAccountStore extends Store<LinkedInAccountState> {
  constructor(initialState?: Partial<LinkedInAccountState>) {
    super({
      accountId: initialState?.accountId ?? null,
      assumedUserToken: initialState?.assumedUserToken ?? null,
    });
  }

  setAssumedUserToken(token: string | null) {
    this.setState((prev) => ({ ...prev, assumedUserToken: token }));
  }

  setAccountId(accountId: string | null) {
    this.setState((prev) => ({ ...prev, accountId }));
  }
}

const LinkedInAccountStoreContext = createContext<LinkedInAccountStore | null>(
  null,
);

export const LinkedInAccountProvider = ({
  initialAccountId,
  initialAssumedUserToken,
  children,
}: {
  children: ReactNode;
  initialAccountId?: string | null;
  initialAssumedUserToken?: string | null;
}) => {
  const [store] = useState(
    () =>
      new LinkedInAccountStore({
        accountId: initialAccountId,
        assumedUserToken: initialAssumedUserToken,
      }),
  );

  return (
    <LinkedInAccountStoreContext.Provider value={store}>
      {children}
    </LinkedInAccountStoreContext.Provider>
  );
};

export const useLinkedInAccountStore = () => {
  const store = useContext(LinkedInAccountStoreContext);

  if (store === null) {
    throw new Error(
      "useLinkedInAccountId must be used within a LinkedInAccountProvider",
    );
  }

  return store;
};

export const useCurrentLinkedInAccountId = () => {
  const store = useLinkedInAccountStore();
  return useStore(store, (state) => state.accountId);
};
