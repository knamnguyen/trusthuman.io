import React from "react";

/**
 * StatisticsDashboard Component
 *
 * PRESENTATIONAL COMPONENT - Pure UI rendering only
 * - Receives statistics data via props from parent (Popup.tsx)
 * - No state management, no business logic, no side effects
 * - Parent component (Popup.tsx) handles all data updates, storage, and message listeners
 * - This component only renders the 7-card statistics grid layout
 */

interface StatisticsDashboardProps {
  totalAllTimeComments: number;
  totalTodayComments: number;
  postsSkippedDuplicate: number;
  recentAuthorsDetected: number;
  postsSkippedAlreadyCommented: number;
  duplicatePostsDetected: number;
  postsSkippedTimeFilter: number;
}

export default function StatisticsDashboard({
  totalAllTimeComments,
  totalTodayComments,
  postsSkippedDuplicate,
  recentAuthorsDetected,
  postsSkippedAlreadyCommented,
  duplicatePostsDetected,
  postsSkippedTimeFilter,
}: StatisticsDashboardProps) {
  // Handler: Open the current user's LinkedIn comment history in a new tab
  const handleOpenCommentsHistory = () => {
    chrome.storage.local.get(["usernameUrl"], (data) => {
      const usernameUrl = data.usernameUrl as string | undefined;
      if (!usernameUrl) return; // Not available yet
      const url = `https://www.linkedin.com${usernameUrl}recent-activity/comments/`;
      window.open(url, "_blank");
    });
  };

  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      {/* Total all-time comments */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
        <div className="text-lg font-bold text-green-700">
          {totalAllTimeComments}
        </div>
        <div className="text-xs leading-tight text-green-600">
          🎉 Total comments all-time
        </div>
      </div>
      {/* Comments posted today */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
        <div className="text-lg font-bold text-blue-700">
          {totalTodayComments}
        </div>
        <div className="text-xs leading-tight text-blue-600">
          📅 Comments posted today
        </div>
      </div>
      {/* Button to open past comments */}
      <button
        type="button"
        onClick={handleOpenCommentsHistory}
        className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center hover:bg-gray-100"
      >
        <div className="text-lg font-bold text-gray-700">↗️</div>
        <div className="text-xs leading-tight text-gray-600">
          View past comments
        </div>
      </button>

      {/* The following statistic cards are commented out as per new UI requirements */}
      {/*
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-center">
        <div className="text-lg font-bold text-orange-700">
          {postsSkippedDuplicate}
        </div>
        <div className="text-xs leading-tight text-orange-600">
          ⏭️ Posts skipped (author filter)
        </div>
      </div>
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-center">
        <div className="text-lg font-bold text-purple-700">
          {recentAuthorsDetected}
        </div>
        <div className="text-xs leading-tight text-purple-600">
          👥 Recent authors detected
        </div>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center">
        <div className="text-lg font-bold text-emerald-700">
          {postsSkippedAlreadyCommented}
        </div>
        <div className="text-xs leading-tight text-emerald-600">
          🔒 Posts skipped (already commented)
        </div>
      </div>
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-center">
        <div className="text-lg font-bold text-yellow-700">
          {duplicatePostsDetected}
        </div>
        <div className="text-xs leading-tight text-yellow-600">
          🔍 Duplicate posts detected
        </div>
      </div>
      <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
        <div className="text-lg font-bold text-red-700">
          {postsSkippedTimeFilter}
        </div>
        <div className="text-xs leading-tight text-red-600">
          ⏰ Posts skipped (time filter)
        </div>
      </div>
      */}
    </div>
  );
}
