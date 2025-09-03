import React from "react";
import { PlusIcon, TrashIcon } from "@radix-ui/react-icons";

import { DEFAULT_STYLE_GUIDES_FREE } from "../../../config/default-style-guides-free";
import { DEFAULT_STYLE_GUIDES_PREMIUM } from "../../../config/default-style-guides-premium";
import { FEATURE_CONFIG } from "../../../config/features";
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

interface CustomStyle {
  name: string;
  prompt: string;
}

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
  selectedStyleKey: string;
  customStyles: CustomStyle[];
  isDefaultStyleSelected: boolean;
  onSelectedStyleChange: (value: string) => void;
  onAddCustomStyle: () => void;
  onDeleteCustomStyle: () => void;

  commentProfileName: string;
  onCommentProfileNameChange: (value: string) => void;
  onStyleGuideChange: (value: string) => void;
  onScrollDurationChange: (value: number) => void;
  onCommentDelayChange: (value: number) => void;
  onMaxPostsChange: (value: number) => void;
  onDuplicateWindowChange: (value: number) => void;
  onTimeFilterEnabledChange: (value: boolean) => void;
  onMinPostAgeChange: (value: number) => void;
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
  skipPromotedPostsEnabled: boolean;
  onSkipPromotedPostsEnabledChange: (value: boolean) => void;
  skipFriendsActivitiesEnabled: boolean;
  onSkipFriendsActivitiesEnabledChange: (value: boolean) => void;

  // Target List (free feature)
  targetListEnabled: boolean;
  onTargetListEnabledChange: (value: boolean) => void;
  selectedTargetList: string;
  onSelectedTargetListChange: (value: string) => void;
  targetListOptions: string[];
  onOpenProfileLists: () => void;
  onOpenListFeed: () => void;

  // Finish List Mode (targeted list 1 comment/author)
  finishListModeEnabled: boolean;
  onFinishListModeEnabledChange: (value: boolean) => void;
  // Manual approve (premium)
  manualApproveEnabled: boolean;
  onManualApproveEnabledChange: (value: boolean) => void;
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
  selectedStyleKey,
  customStyles,
  isDefaultStyleSelected,
  onSelectedStyleChange,
  onAddCustomStyle,
  onDeleteCustomStyle,
  commentProfileName,
  onCommentProfileNameChange,
  onStyleGuideChange,
  onScrollDurationChange,
  onCommentDelayChange,
  onMaxPostsChange,
  onDuplicateWindowChange,
  onTimeFilterEnabledChange,
  onMinPostAgeChange,
  commentAsCompanyEnabled,
  onCommentAsCompanyEnabledChange,
  languageAwareEnabled,
  onLanguageAwareEnabledChange,
  skipCompanyPagesEnabled,
  onSkipCompanyPagesEnabledChange,
  skipPromotedPostsEnabled,
  onSkipPromotedPostsEnabledChange,
  skipFriendsActivitiesEnabled,
  onSkipFriendsActivitiesEnabledChange,
  blacklistEnabled,
  blacklistAuthors,
  onBlacklistEnabledChange,
  onBlacklistAuthorsChange,
  targetListEnabled,
  onTargetListEnabledChange,
  selectedTargetList,
  onSelectedTargetListChange,
  targetListOptions,
  onOpenProfileLists,
  onOpenListFeed,
  finishListModeEnabled,
  onFinishListModeEnabledChange,
  manualApproveEnabled,
  onManualApproveEnabledChange,
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
      {/* Comment on Target List (free feature) */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={targetListEnabled}
              onChange={(e) => onTargetListEnabledChange(e.target.checked)}
              disabled={isRunning}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Comment on Target List -
              <a
                className="text-blue-600 hover:underline"
                href="https://youtu.be/UcCB5sPBBzE"
                target="_blank"
              >
                {" "}
                Tutorial
              </a>
            </label>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenProfileLists}
              className="text-xs font-medium text-gray-500 hover:text-blue-600 hover:underline"
            >
              All Lists
            </button>
            <button
              type="button"
              onClick={onOpenListFeed}
              className="text-xs font-medium text-gray-500 hover:text-blue-600 hover:underline"
            >
              List feed
            </button>
          </div>
        </div>
        <select
          value={selectedTargetList}
          onChange={(e) => onSelectedTargetListChange(e.target.value)}
          disabled={isRunning || !targetListEnabled}
          className="mt-2 w-full rounded-md border border-gray-300 py-2 pr-10 pl-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
        >
          {targetListOptions.length > 0 ? (
            <>
              <option value="">Select a list</option>
              {targetListOptions.map((name) => (
                <option key={name} value={name} className="truncate">
                  {name}
                </option>
              ))}
            </>
          ) : (
            <option value="" disabled>
              No lists found
            </option>
          )}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Create target list of people to comment on their latest posts
        </p>
      </div>

      {/* Finish List Mode - gated by target list selection */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={finishListModeEnabled}
            onChange={(e) => onFinishListModeEnabledChange(e.target.checked)}
            disabled={isRunning || !targetListEnabled || !selectedTargetList}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">
            Don't stop until finish everyone in list - 1 comment/1 author
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Can only enable with target list. Timeout is 60s to find posts from
          list
        </p>
      </div>

      {/* Manual Approve (premium) */}
      {isPremiumLoading ? (
        <FeaturePlaceholder />
      ) : (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={manualApproveEnabled}
              onChange={(e) => onManualApproveEnabledChange(e.target.checked)}
              disabled={
                isRunning ||
                isFeatureDisabled(FEATURE_CONFIG.manualApprove.isPremium)
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Enable manual approve
            </label>
            {shouldShowPremiumBadge(FEATURE_CONFIG.manualApprove.isPremium) && (
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow-sm">
                Premium
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Opens comment boxes, prefills "Great post, thanks for sharing", and
            shows a sidebar to review and edit before posting. Works with target
            list mode. No auto-posting.
          </p>
        </div>
      )}

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
            {/* Removed 'Use Default Style' button */}
          </div>

          <div className="mt-2 mb-2 flex items-center gap-2">
            <select
              id="style-select"
              value={selectedStyleKey}
              onChange={(e) => onSelectedStyleChange(e.target.value)}
              disabled={isRunning}
              className="flex-1 truncate rounded-md border border-gray-300 py-2 pr-10 pl-3 text-base whitespace-nowrap focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
            >
              {isPremium
                ? Object.entries(DEFAULT_STYLE_GUIDES_PREMIUM).map(
                    ([key, value]) => (
                      <option key={key} value={key} className="truncate">
                        {value.label}
                      </option>
                    ),
                  )
                : Object.entries(DEFAULT_STYLE_GUIDES_FREE).map(
                    ([key, value]) => (
                      <option key={key} value={key} className="truncate">
                        {value.label}
                      </option>
                    ),
                  )}

              {customStyles.length > 0 && (
                <option disabled>── Custom Styles ──</option>
              )}

              {customStyles.map((cs) => (
                <option
                  key={cs.name}
                  value={cs.name}
                  className="truncate"
                  title={cs.name}
                >
                  {cs.name}
                </option>
              ))}
            </select>

            {/* Trash button */}
            <button
              type="button"
              onClick={onDeleteCustomStyle}
              disabled={isDefaultStyleSelected || isRunning}
              title="Delete custom style"
              className="rounded p-2 text-red-600 hover:bg-red-100 disabled:text-gray-400"
            >
              <TrashIcon className="h-4 w-4" />
            </button>

            {/* Plus button */}
            <button
              type="button"
              onClick={onAddCustomStyle}
              disabled={isRunning}
              title="Add new custom style"
              className="rounded p-2 text-green-600 hover:bg-green-100"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>

          <textarea
            value={styleGuide}
            onChange={(e) => {
              let text = e.target.value;
              // For free users, enforce 100-word cap live (typing & paste)
              if (isPremium === false) {
                const words = text.trim().split(/\s+/).filter(Boolean);
                if (words.length > 100) {
                  text = words.slice(0, 100).join(" ");
                }
                // Enforce 600-character cap (excluding spaces)
                const charLimit = 600;
                const charsNoSpace = text.replace(/\s+/g, "").length;
                if (charsNoSpace > charLimit) {
                  // Build text up to 600 chars (excluding spaces)
                  let accumulated = 0;
                  const truncatedWords: string[] = [];
                  for (const w of text.split(/\s+/)) {
                    if (w === "") continue;
                    if (accumulated + w.length > charLimit) break;
                    truncatedWords.push(w);
                    accumulated += w.length;
                  }
                  text = truncatedWords.join(" ");
                }
              }
              onStyleGuideChange(text);
            }}
            placeholder="Describe your commenting style..."
            className="h-40 w-full rounded-md border border-gray-300 p-3 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:text-gray-400"
            disabled={
              isRunning ||
              isDefaultStyleSelected ||
              isFeatureDisabled(FEATURE_CONFIG.customStyleGuide.isPremium)
            }
          />
          {/* Free plan word count indicator */}
          {isPremium === false &&
            (() => {
              const wordCount = styleGuide
                .trim()
                .split(/\s+/)
                .filter(Boolean).length;
              const charCount = styleGuide.replace(/\s+/g, "").length;
              const overLimit = wordCount > 100 || charCount > 600;
              return (
                <p
                  className={`mt-2 text-xs font-bold ${
                    overLimit ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  Your free plan can have {wordCount}/100 words and {charCount}
                  /600 characters for comment guide. <UpgradeLink /> to have
                  unlimited length guide.
                </p>
              );
            })()}
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

      {/* Skip promoted posts (premium) */}
      {isPremiumLoading ? (
        <FeaturePlaceholder />
      ) : (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={skipPromotedPostsEnabled}
              onChange={(e) =>
                onSkipPromotedPostsEnabledChange(e.target.checked)
              }
              disabled={
                isRunning ||
                isFeatureDisabled(FEATURE_CONFIG.skipPromotedPosts.isPremium)
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Skip promoted posts:
            </label>
            {shouldShowPremiumBadge(
              FEATURE_CONFIG.skipPromotedPosts.isPremium,
            ) && (
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow-sm">
                Premium
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            When enabled, sponsored/promoted posts will be skipped
            automatically.
          </p>
        </div>
      )}

      {/* Skip friends' activities (premium) */}
      {isPremiumLoading ? (
        <FeaturePlaceholder />
      ) : (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={skipFriendsActivitiesEnabled}
              onChange={(e) =>
                onSkipFriendsActivitiesEnabledChange(e.target.checked)
              }
              disabled={
                isRunning ||
                isFeatureDisabled(
                  FEATURE_CONFIG.skipFriendsActivities.isPremium,
                )
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Skip posts from friends' activities:
            </label>
            {shouldShowPremiumBadge(
              FEATURE_CONFIG.skipFriendsActivities.isPremium,
            ) && (
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow-sm">
                Premium
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            When enabled, posts shown because your connections interacted with
            them will be skipped.
          </p>
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
              Skip authors commented on within:
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
    </>
  );
}
