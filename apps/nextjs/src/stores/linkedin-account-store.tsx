"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-store";
import { Store } from "@tanstack/store";

import { useTRPC } from "~/trpc/react";

interface LinkedInAccountState {
  accountId: string | null;
}

class LinkedInAccountStore extends Store<LinkedInAccountState> {
  constructor(initialState?: Partial<LinkedInAccountState>) {
    super({
      accountId: initialState?.accountId ?? null,
    });
  }

  setAccountId(accountId: string | null) {
    this.setState((prev) => ({ ...prev, accountId }));
  }
}

const LinkedInAccountStoreContext = createContext<LinkedInAccountStore | null>(
  null,
);

export const LinkedInAccountProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [store] = useState(() => new LinkedInAccountStore());

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
