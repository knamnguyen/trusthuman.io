import React from "react";

/**
 * RunningStatusBanner Component
 *
 * PRESENTATIONAL COMPONENT - Pure UI rendering only
 * - Receives running status data via props from parent (Popup.tsx)
 * - No state management, no business logic, no side effects
 * - Parent component (Popup.tsx) handles all status updates and message listeners
 * - This component only renders the blue status banner when commenting is active
 */

interface RunningStatusBannerProps {
  isRunning: boolean;
  status: string;
  commentCount: number;
  maxPosts: number;
  authorsFound?: string[];
  authorsMissing?: string[];
  authorsPending?: string[];
  authorsCommented?: string[];
}

export default function RunningStatusBanner({
  isRunning,
  status,
  commentCount,
  maxPosts,
  authorsFound = [],
  authorsMissing = [],
  authorsPending = [],
  authorsCommented = [],
}: RunningStatusBannerProps) {
  if (!isRunning) return null;

  return (
    <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-blue-800">
          🚀 LinkedIn commenting running
        </span>
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-blue-600">
            📝 {commentCount}/{maxPosts}
          </span>
        </div>
      </div>
      <div className="mb-2 text-xs text-blue-700">{status}</div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-blue-600">This session: {commentCount}</span>
        <span className="text-blue-600">Target: {maxPosts} posts</span>
      </div>
      {(authorsFound.length > 0 ||
        authorsMissing.length > 0 ||
        authorsPending.length > 0 ||
        authorsCommented.length > 0) && (
        <div className="mt-2 space-y-1 text-xs">
          {authorsFound.length > 0 && (
            <div className="text-blue-700">
              Found: {authorsFound.join(", ")}
            </div>
          )}
          {authorsMissing.length > 0 && (
            <div className="text-blue-700">
              Missing: {authorsMissing.join(", ")}
            </div>
          )}
          {authorsPending.length > 0 && (
            <div className="text-blue-700">
              Pending: {authorsPending.join(", ")}
            </div>
          )}
          {authorsCommented.length > 0 && (
            <div className="text-blue-700">
              Commented: {authorsCommented.join(", ")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
