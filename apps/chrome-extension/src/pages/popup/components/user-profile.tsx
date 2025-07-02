import React from "react";
import { useClerk, useUser } from "@clerk/chrome-extension";

interface UserProfileProps {
  user: ReturnType<typeof useUser>["user"];
  isSigningOut: boolean;
  setIsSigningOut: (isSigningOut: boolean) => void;
  setHasEverSignedIn: (hasEverSignedIn: boolean) => void;
  clerk: ReturnType<typeof useClerk>;
}

const UserProfile = ({
  user,
  isSigningOut,
  setIsSigningOut,
  setHasEverSignedIn,
  clerk,
}: UserProfileProps) => {
  const handleSignOut = async () => {
    try {
      // Set signing out state immediately
      setIsSigningOut(true);

      // Clear local auth state immediately (show sign-in UI right away)
      chrome.storage.local.set({ hasEverSignedIn: false });
      setHasEverSignedIn(false);

      // Small delay to ensure local state is processed
      setTimeout(async () => {
        try {
          // Attempt to sign out from Clerk to sync with web app
          await clerk.signOut();
          console.log("Successfully signed out from Clerk");
        } catch (clerkError) {
          // If Clerk sign-out fails, log but don't break the UI
          console.warn(
            "Clerk sign-out failed, but local state cleared:",
            clerkError,
          );
        } finally {
          setIsSigningOut(false);
        }
      }, 150);
    } catch (error) {
      // Fallback: ensure user sees sign-in UI even if everything fails
      console.error("Sign-out process failed:", error);
      chrome.storage.local.set({ hasEverSignedIn: false });
      setHasEverSignedIn(false);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <span className="text-sm font-medium text-blue-600">
              {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName || "User"} {user?.lastName || ""}
            </p>
            <p className="text-xs text-gray-500">
              {user?.primaryEmailAddress?.emailAddress || "Loading..."}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSigningOut ? "Signing Out..." : "Sign Out"}
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
