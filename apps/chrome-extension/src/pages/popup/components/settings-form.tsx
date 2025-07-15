import React from "react";

import { DEFAULT_STYLE_GUIDES, FEATURE_CONFIG } from "../../../config/features";
import { UpgradeLink } from "./comment-limit-status";

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
  isPremium: boolean | null;
  isPremiumLoading: boolean;
  maxPostsLimit: number;
  selectedDefaultStyle: keyof typeof DEFAULT_STYLE_GUIDES;
  commentProfileName: string;
  onCommentProfileNameChange: (value: string) => void;
  onStyleGuideChange: (value: string) => void;
  onScrollDurationChange: (value: number) => void;
  onCommentDelayChange: (value: number) => void;
  onMaxPostsChange: (value: number) => void;
  onDuplicateWindowChange: (value: number) => void;
  onTimeFilterEnabledChange: (value: boolean) => void;
  onMinPostAgeChange: (value: number) => void;
  onSetDefaultStyleGuide: () => void;
  onSelectedDefaultStyleChange: (
    value: keyof typeof DEFAULT_STYLE_GUIDES,
  ) => void;
  blacklistEnabled: boolean;
  blacklistAuthors: string;
  onBlacklistEnabledChange: (value: boolean) => void;
  onBlacklistAuthorsChange: (value: string) => void;
  commentAsCompanyEnabled: boolean;
  onCommentAsCompanyEnabledChange: (value: boolean) => void;
  languageAwareEnabled: boolean;
  onLanguageAwareEnabledChange: (value: boolean) => void;
  skipCompanyPagesEnabled: boolean;
  onSkipCompanyPagesEnabledChange: (value: boolean) => void;
}

const FeaturePlaceholder = () => (
  <div className="mb-4 h-24 w-full animate-pulse rounded-lg bg-gray-200" />
);

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
  isPremiumLoading,
  maxPostsLimit,
  selectedDefaultStyle,
  commentProfileName,
  onCommentProfileNameChange,
  onStyleGuideChange,
  onScrollDurationChange,
  onCommentDelayChange,
  onMaxPostsChange,
  onDuplicateWindowChange,
  onTimeFilterEnabledChange,
  onMinPostAgeChange,
  onSetDefaultStyleGuide,
  onSelectedDefaultStyleChange,
  commentAsCompanyEnabled,
  onCommentAsCompanyEnabledChange,
  languageAwareEnabled,
  onLanguageAwareEnabledChange,
  skipCompanyPagesEnabled,
  onSkipCompanyPagesEnabledChange,
  blacklistEnabled,
  blacklistAuthors,
  onBlacklistEnabledChange,
  onBlacklistAuthorsChange,
}: SettingsFormProps) {
  // Helper function to determine if features should be disabled
  const isFeatureDisabled = (featureIsPremium: boolean) => {
    if (isPremiumLoading) return true; // Disabled during loading
    if (isPremium === null) return true; // Disabled when status unknown
    return featureIsPremium && !isPremium; // Disabled if it's premium feature and user is not premium
  };

  // Helper function to determine if premium badge should be shown
  const shouldShowPremiumBadge = (featureIsPremium: boolean) => {
    if (isPremiumLoading || isPremium === null) return false; // Don't show during loading
    return featureIsPremium && !isPremium; // Show if it's premium feature and user is not premium
  };

  return (
    <>
      {/* API Key input removed - using server-side tRPC API now */}

      {isPremiumLoading ? (
        <FeaturePlaceholder />
      ) : (
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Comment Style Guide:
              </label>
              {shouldShowPremiumBadge(
                FEATURE_CONFIG.customStyleGuide.isPremium,
              ) && (
                <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow-sm">
                  Premium
                </span>
              )}
            </div>
            {isPremium && (
              <button
                onClick={onSetDefaultStyleGuide}
                disabled={isRunning}
                className="rounded-md bg-gray-100 px-3 py-1 text-xs text-gray-700 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Use Default Style
              </button>
            )}
          </div>

          {!isPremium && isPremium !== null && (
            <div className="mt-2 mb-2">
              <select
                id="default-style-select"
                value={selectedDefaultStyle}
                onChange={(e) =>
                  onSelectedDefaultStyleChange(
                    e.target.value as keyof typeof DEFAULT_STYLE_GUIDES,
                  )
                }
                disabled={isRunning}
                className="w-full rounded-md border border-gray-300 py-2 pr-10 pl-3 text-base focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
              >
                {Object.entries(DEFAULT_STYLE_GUIDES).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <textarea
            value={styleGuide}
            onChange={(e) => onStyleGuideChange(e.target.value)}
            placeholder="Describe your commenting style..."
            className="h-40 w-full rounded-md border border-gray-300 p-3 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:text-gray-400"
            disabled={
              isRunning ||
              isFeatureDisabled(FEATURE_CONFIG.customStyleGuide.isPremium)
            }
          />
          {shouldShowPremiumBadge(
            FEATURE_CONFIG.customStyleGuide.isPremium,
          ) && (
            <p className="mt-2 text-xs font-bold text-red-600">
              On a free plan, you can choose a style in the dropdown.{" "}
              <UpgradeLink /> now to write your own custom style guide.
            </p>
          )}
        </div>
      )}

      {/* Blacklist author */}
      {isPremiumLoading ? (
        <FeaturePlaceholder />
      ) : (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={blacklistEnabled}
              onChange={(e) => onBlacklistEnabledChange(e.target.checked)}
              disabled={
                isRunning ||
                isFeatureDisabled(FEATURE_CONFIG.blacklistAuthor.isPremium)
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Blacklist author – never comment on
            </label>
            {shouldShowPremiumBadge(
              FEATURE_CONFIG.blacklistAuthor.isPremium,
            ) && (
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow-sm">
                Premium
              </span>
            )}
          </div>
          <input
            type="text"
            value={blacklistAuthors}
            onChange={(e) => onBlacklistAuthorsChange(e.target.value)}
            placeholder="e.g., Alice Smith, Bob Jones"
            disabled={
              !blacklistEnabled ||
              isRunning ||
              isFeatureDisabled(FEATURE_CONFIG.blacklistAuthor.isPremium)
            }
            className="mt-2 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Type in the profile names of accounts you never want to comment on,
            separated by commas.
          </p>
        </div>
      )}

      {/* Comment as company page (premium) */}
      {isPremiumLoading ? (
        <FeaturePlaceholder />
      ) : (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={commentAsCompanyEnabled}
              onChange={(e) =>
                onCommentAsCompanyEnabledChange(e.target.checked)
              }
              disabled={
                isRunning ||
                isFeatureDisabled(FEATURE_CONFIG.commentAsCompanyPage.isPremium)
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Comment as company page:
            </label>
            {shouldShowPremiumBadge(
              FEATURE_CONFIG.commentAsCompanyPage.isPremium,
            ) && (
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow-sm">
                Premium
              </span>
            )}
          </div>
          <input
            type="text"
            value={
              shouldShowPremiumBadge(
                FEATURE_CONFIG.commentAsCompanyPage.isPremium,
              )
                ? ""
                : commentProfileName
            }
            onChange={(e) => onCommentProfileNameChange(e.target.value)}
            disabled={
              isRunning ||
              !commentAsCompanyEnabled ||
              isFeatureDisabled(FEATURE_CONFIG.commentAsCompanyPage.isPremium)
            }
            placeholder="Page name"
            className="mt-2 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Please type the page name exactly and make sure it exists, otherwise
            the comment flow will break.
          </p>
        </div>
      )}

      {/* Language aware comment (premium) */}
      {isPremiumLoading ? (
        <FeaturePlaceholder />
      ) : (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={languageAwareEnabled}
              onChange={(e) => onLanguageAwareEnabledChange(e.target.checked)}
              disabled={
                isRunning ||
                isFeatureDisabled(FEATURE_CONFIG.languageAwareComment.isPremium)
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Language aware comment:
            </label>
            {shouldShowPremiumBadge(
              FEATURE_CONFIG.languageAwareComment.isPremium,
            ) && (
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow-sm">
                Premium
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Automatically comment in the same language detected in the post when
            it is not English.
          </p>
        </div>
      )}

      {/* Skip company pages (premium) */}
      {isPremiumLoading ? (
        <FeaturePlaceholder />
      ) : (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={skipCompanyPagesEnabled}
              onChange={(e) =>
                onSkipCompanyPagesEnabledChange(e.target.checked)
              }
              disabled={
                isRunning ||
                isFeatureDisabled(FEATURE_CONFIG.skipCompanyPages.isPremium)
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Skip company pages:
            </label>
            {shouldShowPremiumBadge(
              FEATURE_CONFIG.skipCompanyPages.isPremium,
            ) && (
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow-sm">
                Premium
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Skip commenting on company pages to avoid duplicate comments.
          </p>
        </div>
      )}

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Feed Scroll Duration:
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="5"
            max="60"
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
        {isPremium === false && (
          <p className="mt-1 text-xs font-bold text-red-600">
            <UpgradeLink /> to premium for up to{" "}
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

      {isPremiumLoading ? (
        <FeaturePlaceholder />
      ) : (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-gray-700">
              Duplicate Check Window:
            </label>
            {shouldShowPremiumBadge(
              FEATURE_CONFIG.duplicateAuthorCheck.isPremium,
            ) && (
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow-sm">
                Premium
              </span>
            )}
          </div>
          <div
            className={
              isFeatureDisabled(FEATURE_CONFIG.duplicateAuthorCheck.isPremium)
                ? "pointer-events-none mt-2 opacity-50"
                : "mt-2"
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
                disabled={
                  isRunning ||
                  isFeatureDisabled(
                    FEATURE_CONFIG.duplicateAuthorCheck.isPremium,
                  )
                }
                className="flex-1"
              />
              <span className="w-16 text-sm font-medium">
                {duplicateWindow}h
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Skip authors you've commented on within this time window
            </p>
          </div>
        </div>
      )}

      {isPremiumLoading ? (
        <FeaturePlaceholder />
      ) : (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <label className="block text-sm font-medium text-gray-700">
              Post Age Filter:
            </label>
            {shouldShowPremiumBadge(FEATURE_CONFIG.postAgeFilter.isPremium) && (
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow-sm">
                Premium
              </span>
            )}
          </div>
          <div
            className={
              isFeatureDisabled(FEATURE_CONFIG.postAgeFilter.isPremium)
                ? "pointer-events-none mt-2 opacity-50"
                : "mt-2"
            }
          >
            <div className="mb-2 flex items-center space-x-3">
              <input
                type="checkbox"
                id="timeFilterEnabled"
                checked={timeFilterEnabled}
                onChange={(e) => onTimeFilterEnabledChange(e.target.checked)}
                disabled={
                  isRunning ||
                  isFeatureDisabled(FEATURE_CONFIG.postAgeFilter.isPremium)
                }
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
                  disabled={
                    isRunning ||
                    isFeatureDisabled(FEATURE_CONFIG.postAgeFilter.isPremium) ||
                    !timeFilterEnabled
                  }
                  className="flex-1"
                />
                <span className="w-12 text-sm font-medium">{minPostAge}h</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              When enabled, skips posts older than the specified time and
              promoted posts
            </p>
          </div>
        </div>
      )}
    </>
  );
}
