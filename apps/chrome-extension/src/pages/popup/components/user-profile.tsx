import React from "react";
import { useClerk, UserButton, useUser } from "@clerk/chrome-extension";

interface UserProfileProps {
  user: ReturnType<typeof useUser>["user"];
  isSigningOut: boolean;
  setIsSigningOut: (isSigningOut: boolean) => void;
  setHasEverSignedIn: (hasEverSignedIn: boolean) => void;
  clerk: ReturnType<typeof useClerk>;
}

const UserProfile = ({ user }: UserProfileProps) => {
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
