import React from "react";
import { useClerk, UserButton, useUser } from "@clerk/chrome-extension";

import { formatAccessType, useUserData } from "../../../hooks/use-user-data";

interface UserProfileProps {
  user: ReturnType<typeof useUser>["user"];
  isSigningOut: boolean;
  setIsSigningOut: (isSigningOut: boolean) => void;
  setHasEverSignedIn: (hasEverSignedIn: boolean) => void;
  clerk: ReturnType<typeof useClerk>;
}

const UserProfile = ({ user }: UserProfileProps) => {
  const {
    data: userData,
    isLoading,
    error,
    hasCachedData,
    isFetching,
  } = useUserData();

  const renderPlanStatus = () => {
    if (isLoading) {
      return <p className="text-xs text-gray-400">Loading plan...</p>;
    }

    if (error) {
      return (
        <div className="flex items-center gap-1">
          <p className="text-xs text-red-500">Error loading plan</p>
          {hasCachedData && (
            <span className="text-xs text-gray-400">(cached)</span>
          )}
        </div>
      );
    }

    if (userData?.accessType) {
      return (
        <div className="flex items-center gap-1">
          <p className="text-xs font-medium text-blue-600">
            {formatAccessType(userData.accessType)}
          </p>
          {hasCachedData && isFetching && (
            <span
              className="inline-block animate-spin text-xs text-gray-400"
              title="Syncing latest data..."
            >
              ↻
            </span>
          )}
        </div>
      );
    }

    // Only show default if we have no data at all (not even cached)
    return null;
  };

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserButton />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName || "User"} {user?.lastName || ""}
            </p>
            <p className="text-xs text-gray-500">
              {user?.primaryEmailAddress?.emailAddress || "Loading..."}
            </p>
            <div className="mt-1">{renderPlanStatus()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
