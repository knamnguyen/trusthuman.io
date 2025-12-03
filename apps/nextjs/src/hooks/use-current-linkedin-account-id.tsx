"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

const LinkedInAccountContext = createContext<{
  accountId: string | null;
  setAccountId: (accountId: string | null) => void;
} | null>(null);

export const LinkedInAccountProvider = ({
  initialAccountId,
  children,
}: {
  children: ReactNode;
  initialAccountId?: string | null;
}) => {
  const [accountId, setAccountId] = useState<string | null>(
    initialAccountId ?? null,
  );
  return (
    <LinkedInAccountContext.Provider
      value={{
        accountId,
        setAccountId,
      }}
    >
      {children}
    </LinkedInAccountContext.Provider>
  );
};

export const useCurrentLinkedInAccountId = () => {
  const ctx = useContext(LinkedInAccountContext);

  if (ctx === null) {
    throw new Error(
      "useLinkedInAccountId must be used within a LinkedInAccountProvider",
    );
  }

  return {
    accountId: ctx.accountId,
    setAccountId: ctx.setAccountId,
  };
};
