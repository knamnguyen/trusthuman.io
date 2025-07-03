import React from "react";
import { UserButton } from "@clerk/chrome-extension";
import { useMutation } from "@tanstack/react-query";

import type { AuthUser } from "../../../services/auth-service";
import { formatAccessType, useUserData } from "../../../hooks/use-user-data";
import { useTRPC } from "../../../trpc/react";

interface UserProfileProps {
  user: AuthUser | null;
}

const UserProfile = ({ user }: UserProfileProps) => {
  const {
    data: userData,
    isLoading,
    error,
    hasCachedData,
    isFetching,
  } = useUserData();
  const trpc = useTRPC();
  const { mutateAsync: createCustomerPortal, isPending } = useMutation(
    trpc.stripe.createCustomerPortal.mutationOptions({}),
  );

  // Handler for Manage Subscription
  const handleManageSubscription = async () => {
    try {
      const result = await createCustomerPortal({});
      const url = result?.url;
      if (url) {
        window.open(url, "_blank");
      } else {
        alert("Failed to open customer portal.");
      }
    } catch (err) {
      alert("Error opening customer portal.");
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

  // Add getSyncHostUrl utility (copied from auth.tsx)
  const getSyncHostUrl = () => {
    if (import.meta.env.VITE_NGROK_URL) {
      return import.meta.env.VITE_NGROK_URL;
    }
    if (import.meta.env.VITE_NEXTJS_URL) {
      return import.meta.env.VITE_NEXTJS_URL;
    }
    if (import.meta.env.DEV) {
      return "http://localhost:3000";
    }
    return "https://engagekit.io";
  };

  // New: Render badge/button on the right
  const renderSubscriptionButton = () => {
    if (!userData || isLoading) return null;
    if (userData.accessType === "FREE") {
      return (
        <button
          onClick={(e) => {
            e.preventDefault();
            const url = `${getSyncHostUrl()}/subscription`;
            chrome.tabs.create({ url });
          }}
          className="ml-auto inline-block rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow transition hover:bg-blue-700"
        >
          Upgrade Premium
        </button>
      );
    }
    if (["WEEKLY", "MONTHLY", "YEARLY"].includes(userData.accessType)) {
      return (
        <button
          onClick={handleManageSubscription}
          className="ml-auto inline-block rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow transition hover:bg-green-700"
          disabled={isPending}
        >
          {isPending ? "Loading..." : "Manage Subscription"}
        </button>
      );
    }
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
        {/* Subscription badge/button on the right */}
        {renderSubscriptionButton()}
      </div>
    </div>
  );
};

export default UserProfile;
