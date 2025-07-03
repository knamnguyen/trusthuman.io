import React from "react";

import { FEATURE_CONFIG } from "../../../config/features";

/**
 * SettingsForm Component
 *
 * PRESENTATIONAL COMPONENT - Pure UI rendering only
 * - Receives settings data and change handlers via props from parent (Popup.tsx)
 * - No state management, no business logic, no side effects
 * - Parent component (Popup.tsx) handles all settings state, storage, and default values
 * - This component only renders the form inputs and calls provided handlers
 */

interface SettingsFormProps {
  styleGuide: string;
  scrollDuration: number;
  commentDelay: number;
  maxPosts: number;
  duplicateWindow: number;
  timeFilterEnabled: boolean;
  minPostAge: number;
  isRunning: boolean;
  isPremium: boolean;
  maxPostsLimit: number;
  onStyleGuideChange: (value: string) => void;
  onScrollDurationChange: (value: number) => void;
  onCommentDelayChange: (value: number) => void;
  onMaxPostsChange: (value: number) => void;
  onDuplicateWindowChange: (value: number) => void;
  onTimeFilterEnabledChange: (value: boolean) => void;
  onMinPostAgeChange: (value: number) => void;
  onSetDefaultStyleGuide: () => void;
}

export default function SettingsForm({
  styleGuide,
  scrollDuration,
  commentDelay,
  maxPosts,
  duplicateWindow,
  timeFilterEnabled,
  minPostAge,
  isRunning,
  isPremium,
  maxPostsLimit,
  onStyleGuideChange,
  onScrollDurationChange,
  onCommentDelayChange,
  onMaxPostsChange,
  onDuplicateWindowChange,
  onTimeFilterEnabledChange,
  onMinPostAgeChange,
  onSetDefaultStyleGuide,
}: SettingsFormProps) {
  return (
    <>
      {/* API Key input removed - using server-side tRPC API now */}

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Comment Style Guide:
        </label>
        <textarea
          value={styleGuide}
          onChange={(e) => onStyleGuideChange(e.target.value)}
          placeholder="Describe your commenting style... e.g., 'Professional but friendly, ask thoughtful questions, share relevant insights, keep responses under 50 words, add value to the conversation'"
          className="h-60 w-full rounded-md border border-gray-300 p-3 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
          disabled={isRunning}
        />
        <div className="mt-2 flex justify-end">
          <button
            onClick={onSetDefaultStyleGuide}
            disabled={isRunning}
            className="rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Use Default Style
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Feed Scroll Duration:
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="5"
            max="30"
            value={scrollDuration}
            onChange={(e) => onScrollDurationChange(parseInt(e.target.value))}
            disabled={isRunning}
            className="flex-1"
          />
          <span className="w-16 text-sm font-medium">{scrollDuration}s</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Time to scroll the feed to load more posts
        </p>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Max Posts to Comment On:
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="5"
            max={maxPostsLimit}
            value={maxPosts}
            onChange={(e) => onMaxPostsChange(parseInt(e.target.value))}
            disabled={isRunning}
            className="flex-1"
          />
          <span className="w-16 text-sm font-medium">{maxPosts}</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Maximum number of posts to comment on in one session
        </p>
        {!isPremium && maxPosts >= maxPostsLimit && (
          <p className="mt-1 text-xs font-bold text-red-600">
            Upgrade to premium for up to{" "}
            {FEATURE_CONFIG.maxPosts.premiumTierLimit} posts per session.
          </p>
        )}
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Seconds Between Each Comment:
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="5"
            max="60"
            value={commentDelay}
            onChange={(e) => onCommentDelayChange(parseInt(e.target.value))}
            disabled={isRunning}
            className="flex-1"
          />
          <span className="w-16 text-sm font-medium">{commentDelay}s</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Delay between processing each post to avoid being flagged
        </p>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-700">
            Duplicate Check Window:
          </label>
          {!isPremium && (
            <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow-sm">
              Premium
            </span>
          )}
        </div>
        <div
          className={
            !isPremium ? "pointer-events-none mt-2 opacity-50" : "mt-2"
          }
        >
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="1"
              max="72"
              value={duplicateWindow}
              onChange={(e) =>
                onDuplicateWindowChange(parseInt(e.target.value))
              }
              disabled={isRunning || !isPremium}
              className="flex-1"
            />
            <span className="w-16 text-sm font-medium">{duplicateWindow}h</span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Skip authors you've commented on within this time window
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-700">
            Post Age Filter:
          </label>
          {!isPremium && (
            <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow-sm">
              Premium
            </span>
          )}
        </div>
        <div
          className={
            !isPremium ? "pointer-events-none mt-2 opacity-50" : "mt-2"
          }
        >
          <div className="mb-2 flex items-center space-x-3">
            <input
              type="checkbox"
              id="timeFilterEnabled"
              checked={timeFilterEnabled}
              onChange={(e) => onTimeFilterEnabledChange(e.target.checked)}
              disabled={isRunning || !isPremium}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="timeFilterEnabled"
              className="text-sm text-gray-700"
            >
              Only comment on posts made within:
            </label>
            <div className="flex flex-1 items-center space-x-2">
              <input
                type="range"
                min="1"
                max="24"
                value={minPostAge}
                onChange={(e) => onMinPostAgeChange(parseInt(e.target.value))}
                disabled={isRunning || !isPremium || !timeFilterEnabled}
                className="flex-1"
              />
              <span className="w-12 text-sm font-medium">{minPostAge}h</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            When enabled, skips posts older than the specified time and promoted
            posts
          </p>
        </div>
      </div>
    </>
  );
}
