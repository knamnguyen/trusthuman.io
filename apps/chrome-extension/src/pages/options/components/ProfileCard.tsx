import React, { useEffect, useState } from "react";

import type { ProfileData } from "../utils/storage";
import { ProfileListButton } from "./profile-list-button";

interface ProfileCardProps {
  profile: ProfileData;
}

/**
 * ProfileCard Component
 *
 * Displays a LinkedIn-style profile card with Gumroad aesthetics
 */
export function ProfileCard({ profile }: ProfileCardProps) {
  const handleProfileClick = () => {
    if (profile.profileUrl) {
      window.open(profile.profileUrl, "_blank");
    }
  };
  const [localLists, setLocalLists] = useState<string[]>(profile.lists);
  useEffect(() => {
    setLocalLists(profile.lists);
  }, [profile.lists.join(",")]);

  return (
    <div className="rounded-xl border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000] transition-all hover:bg-gray-50 hover:shadow-[8px_8px_0px_#000]">
      <div className="flex items-start gap-4">
        {/* Profile Photo and List Button */}
        <div className="flex flex-shrink-0 flex-col items-center gap-2">
          {profile.profilePhotoUrl ? (
            <img
              src={profile.profilePhotoUrl}
              alt={`${profile.fullName || "Profile"} photo`}
              className="h-16 w-16 rounded-full border-2 border-black object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-black bg-gray-200 text-2xl font-bold text-gray-600">
              {profile.fullName?.charAt(0) || "?"}
            </div>
          )}
          <ProfileListButton
            profileUrl={profile.profileUrl}
            listsForProfile={localLists}
            onListsChange={setLocalLists}
          />
        </div>

        {/* Profile Info */}
        <div className="min-w-0 flex-1">
          {/* Name */}
          <h3 className="truncate text-lg font-bold text-gray-900">
            {profile.fullName || "Unknown Name"}
          </h3>

          {/* Headline */}
          {profile.headline && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
              {profile.headline}
            </p>
          )}

          {/* Profile URL */}
          {profile.profileUrl && (
            <button
              onClick={handleProfileClick}
              className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              View LinkedIn Profile
              <svg
                className="ml-1 h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </button>
          )}

          {/* Profile URN */}
          {profile.profileUrn && (
            <div className="mt-2">
              <span className="text-xs font-medium text-gray-500">URN:</span>
              <span className="ml-1 font-mono text-xs break-all text-gray-700">
                {profile.profileUrn}
              </span>
            </div>
          )}

          {/* Lists */}
          <div className="mt-3">
            <span className="text-xs font-medium text-gray-500">Lists:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {localLists.map((list) => (
                <span
                  key={list}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
                >
                  {list}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
