import React from "react";
import { UserButton } from "@clerk/chrome-extension";

import type { AuthUser } from "../../../services/auth-service";
import { formatAccessType, useUserData } from "../../../hooks/use-user-data";

interface UserProfileProps {
  user: AuthUser | null;
  isSigningOut: boolean;
  onSignOut: () => Promise<boolean>;
  setHasEverSignedIn: (hasEverSignedIn: boolean) => void;
}

const UserProfile = ({
  user,
  isSigningOut,
  onSignOut,
  setHasEverSignedIn,
}: UserProfileProps) => {
  const {
    data: userData,
    isLoading,
    error,
    hasCachedData,
    isFetching,
  } = useUserData();

  const handleSignOut = async () => {
    try {
      const success = await onSignOut();
      if (success) {
        setHasEverSignedIn(false);
        // Clear cached user data when signing out
        // clearCachedUserData(); // Will be called by clearCachedUserData from useUserData
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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
          {/* Custom user avatar/button */}
          <UserButton />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName || "User"} {user?.lastName || ""}
            </p>
            <div className="mt-1">{renderPlanStatus()}</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-50"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
