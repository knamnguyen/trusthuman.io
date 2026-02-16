import React from "react";

import { useProfileData } from "../hooks/useProfileData";
import { ProfileCard } from "./ProfileCard";

interface ProfilePanelProps {
  selectedList: string | null;
  className?: string;
}

/**
 * ProfilePanel Component
 *
 * Displays profiles for the selected list in a 80% width panel
 */
export function ProfilePanel({
  selectedList,
  className = "",
}: ProfilePanelProps) {
  const { profiles, isLoading, error } = useProfileData(selectedList);

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000]">
          <h2 className="mb-6 text-lg font-bold text-gray-900">
            {selectedList ? `Profiles in "${selectedList}"` : "All Profiles"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-gray-200"></div>
                    <div className="flex-1">
                      <div className="mb-2 h-4 rounded bg-gray-200"></div>
                      <div className="mb-2 h-3 rounded bg-gray-200"></div>
                      <div className="h-3 w-2/3 rounded bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000]">
          <h2 className="mb-6 text-lg font-bold text-gray-900">
            {selectedList ? `Profiles in "${selectedList}"` : "All Profiles"}
          </h2>
          <div className="py-12 text-center">
            <div className="mb-2 text-red-500">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="font-medium text-red-600">Error loading profiles</p>
            <p className="mt-1 text-sm text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No list selected
  if (!selectedList) {
    return (
      <div className={`${className}`}>
        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000]">
          <h2 className="mb-6 text-lg font-bold text-gray-900">Profiles</h2>
          <div className="py-12 text-center">
            <div className="mb-4 text-gray-400">
              <svg
                className="mx-auto h-16 w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-600">
              Select a list to view profiles
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Choose a list from the left panel to see the profiles it contains
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Selected list has no profiles
  if (profiles.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="rounded-xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000]">
          <h2 className="mb-6 text-lg font-bold text-gray-900">
            Profiles in "{selectedList}"
          </h2>
          <div className="py-12 text-center">
            <div className="mb-4 text-gray-400">
              <svg
                className="mx-auto h-16 w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-600">
              No profiles in this list
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Add profiles to "{selectedList}" by using the profile extraction
              button on LinkedIn
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Display profiles
  return (
    <div className={`${className}`}>
      <div className="rounded-xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000]">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            Profiles in "{selectedList}"
          </h2>
          <span className="inline-flex items-center rounded-full border-2 border-black bg-yellow-100 px-3 py-1 text-sm font-bold text-gray-900">
            {profiles.length} {profiles.length === 1 ? "Profile" : "Profiles"}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <ProfileCard key={profile.profileUrl} profile={profile} />
          ))}
        </div>
      </div>
    </div>
  );
}
