import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { useStore } from "@tanstack/react-store";
import { Store } from "@tanstack/store";

interface LinkedInAccountState {
  accountId: string | null;
  assumedUserToken: string | null;
}

export class LinkedInAccountStore extends Store<LinkedInAccountState> {
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
  children,
  store,
}: {
  children: ReactNode;
  store: LinkedInAccountStore;
}) => {
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
