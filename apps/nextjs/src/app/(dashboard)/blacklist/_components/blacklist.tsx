"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";

export function BlacklistedProfileList() {
  const trpc = useTRPC();

  const blacklistedProfiles = useInfiniteQuery(
    trpc.blacklist.findBlacklistedProfiles.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.next,
      },
    ),
  );

  if (blacklistedProfiles.data === undefined) {
    return <div>Loading blacklisted profiles...</div>;
  }

  if (blacklistedProfiles.data.pages[0]?.data.length === 0) {
    return <div>No blacklisted profiles found.</div>;
  }

  return (
    <div>
      <div>Blacklist Profiles:</div>
      <ul>
        {blacklistedProfiles.data.pages.map((page) =>
          page.data.map((list) => <li key={list.id}>{list.profileUrn}</li>),
        )}
      </ul>
    </div>
  );
}
