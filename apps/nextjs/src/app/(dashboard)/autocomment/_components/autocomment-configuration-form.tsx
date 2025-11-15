"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { LoaderCircleIcon } from "lucide-react";

import {
  DEFAULT_STYLE_GUIDES_FREE,
  DEFAULT_STYLE_GUIDES_PREMIUM,
  FEATURE_CONFIG,
} from "@sassy/feature-flags";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@sassy/ui/select";

import { env } from "~/env";
import { useCurrentLinkedInAccountId } from "~/hooks/use-current-linkedin-account-id";
import { usePremiumStatus } from "~/hooks/use-premium-status";
import { useTRPC } from "~/trpc/react";

export const getSyncHostUrl = () => {
  if (env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }
  return "https://engagekit.io";
};

const FeaturePlaceholder = () => (
  <div className="mb-4 h-24 w-full animate-pulse rounded-lg bg-gray-200" />
);

const UpgradeLink = () => {
  return (
    <Link
      href="/subscription"
      className="font-bold text-blue-600 underline hover:text-blue-700"
    >
      Upgrade
    </Link>
  );
};

const isDefaultStyle = (key: string): boolean =>
  key in DEFAULT_STYLE_GUIDES_FREE || key in DEFAULT_STYLE_GUIDES_PREMIUM;

const getMaxPostsLimit = (isPremium: boolean | null) =>
  isPremium === null
    ? FEATURE_CONFIG.maxPosts.premiumTierLimit // Default to premium limit during loading
    : isPremium
      ? FEATURE_CONFIG.maxPosts.premiumTierLimit
      : FEATURE_CONFIG.maxPosts.freeTierLimit;

export function AutoCommentConfigurationForm({
  onSubmit,
}: {
  onSubmit?: (config: {
    scrollDuration: number;
    commentDelay: number;
    maxPosts: number;
    duplicateWindow: number;
    finishListModeEnabled: boolean;
    commentAsCompanyEnabled: boolean;
    timeFilterEnabled: boolean;
    minPostAge?: number;
    manualApproveEnabled: boolean;
    authenticityBoostEnabled: boolean;
    targetListId?: string;
    selectedStyleId?: string;
    commentProfileName?: string;
    customStylePrompt: string;
    languageAwareEnabled: boolean;
    skipCompanyPagesEnabled: boolean;
    blacklistEnabled: boolean;
    skipPromotedPostsEnabled: boolean;
    targetListEnabled: boolean;
  }) => void;
}) {
  const trpc = useTRPC();
  const { accountId } = useCurrentLinkedInAccountId();
  const { isPremium, isLoading: isPremiumLoading } = usePremiumStatus();

  const maxPostsLimit = getMaxPostsLimit(isPremium);

  const linkedInAccount = useQuery(
    trpc.user.getLinkedInAccount.queryOptions(
      {
        accountId: accountId ?? "",
      },
      {
        enabled: accountId !== null,
      },
    ),
  );

  const isRunning =
    linkedInAccount.data !== undefined &&
    linkedInAccount.data !== null &&
    linkedInAccount.data.isRunning === true;

  const targetLists = useInfiniteQuery(
    trpc.targetList.findLists.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.next,
      },
    ),
  );

  const [scrollDuration, setScrollDuration] = useState(0);
  const [commentDelay, setCommentDelay] = useState(0);
  const [maxPosts, setMaxPosts] = useState(0);
  const [customStylePrompt, setCustomStylePrompt] = useState("");
  const [duplicateWindow, setDuplicateWindow] = useState(0);
  const [finishListModeEnabled, setFinishListModeEnabled] = useState(false);
  const [commentAsCompanyEnabled, setCommentAsCompanyEnabled] = useState(false);
  const [timeFilterEnabled, setTimeFilterEnabled] = useState(false);
  const [minPostAge, setMinPostAge] = useState<number | undefined>(undefined);
  const [manualApproveEnabled, setManualApproveEnabled] = useState(false);
  const [authenticityBoostEnabled, setAuthenticityBoostEnabled] =
    useState(false);
  const [targetListId, setTargetListId] = useState<string | undefined>(
    undefined,
  );
  const [selectedStyleId, setSelectedStyleId] = useState<string | undefined>();
  const [commentProfileName, setCommentProfileName] = useState<
    string | undefined
  >(undefined);
  const [customStyleName, setCustomStyleName] = useState<string>("");
  const [languageAwareEnabled, setLanguageAwareEnabled] = useState(false);
  const [skipCompanyPagesEnabled, setSkipCompanyPagesEnabled] = useState(false);
  const [blacklistEnabled, setBlacklistEnabled] = useState(false);
  const [skipPromotedPostsEnabled, setSkipPromotedPostsEnabled] =
    useState(false);
  const [targetListEnabled, setTargetListEnabled] = useState(false);
  const [skipFriendsActivitiesEnabled, setSkipFriendsActivitiesEnabled] =
    useState(false);

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

  const isDefaultStyleSelected = isDefaultStyle(selectedStyleId ?? "");

  // Free-plan custom style guide length enforcement (≤100 words)
  const customStylePromptWordCount = useMemo(() => {
    const wordCount = customStylePrompt
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;

    const charCount = customStylePrompt.replace(/\s+/g, "").length;

    return {
      wordCount,
      charCount,
      isTooLong: isPremium === false && (wordCount > 100 || charCount > 600),
    };
  }, [customStylePrompt, isPremium]);

  const addCommentStyle = useMutation(
    trpc.autocomment.addCommentStyle.mutationOptions(),
  );
  const deleteCommentStyle = useMutation(
    trpc.autocomment.deleteCommentStyle.mutationOptions(),
  );

  const commentStyles = useInfiniteQuery(
    trpc.autocomment.listCommentStyles.infiniteQueryOptions(
      {},
      {
        getNextPageParam: (lastPage) => lastPage.next,
      },
    ),
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.({
          scrollDuration,
          commentDelay,
          maxPosts,
          duplicateWindow,
          finishListModeEnabled,
          commentAsCompanyEnabled,
          timeFilterEnabled,
          minPostAge,
          manualApproveEnabled,
          authenticityBoostEnabled,
          targetListId,
          selectedStyleId,
          commentProfileName,
          customStylePrompt,
          languageAwareEnabled,
          skipCompanyPagesEnabled,
          blacklistEnabled,
          skipPromotedPostsEnabled,
          targetListEnabled,
        });
      }}
    >
      {/* Comment on Target List (free feature) */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={targetListEnabled}
              onChange={(e) => setTargetListEnabled(e.target.checked)}
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
            <Link
              href="/target-list"
              className="text-xs font-medium text-gray-500 hover:text-blue-600 hover:underline"
            >
              View Lists
            </Link>
          </div>
        </div>
        <Select
          value={targetListId}
          onValueChange={(value) => setTargetListId(value)}
          disabled={isRunning || !targetListEnabled}
        >
          <SelectTrigger className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none">
            <SelectValue placeholder="Select a target list" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {targetLists.data !== undefined && (
                <>
                  {targetLists.data.pages.map((page) =>
                    page.data.map((list) => (
                      <SelectItem
                        key={list.name}
                        value={list.id}
                        className="truncate"
                      >
                        {list.name}
                      </SelectItem>
                    )),
                  )}
                </>
              )}
              {!targetLists.data?.pages[0]?.data.length && (
                <SelectItem value="disabled" disabled>
                  No lists found
                </SelectItem>
              )}
              {targetLists.hasNextPage && (
                <SelectItem
                  value="disabled"
                  ref={(el) => {
                    if (el === null) return;
                    if (targetLists.hasNextPage) {
                      void targetLists.fetchNextPage();
                    }
                  }}
                  disabled
                >
                  <LoaderCircleIcon className="size-3 animate-spin text-gray-500" />
                </SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
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
            onChange={(e) => setFinishListModeEnabled(e.target.checked)}
            disabled={isRunning || !targetListEnabled || !targetListId}
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
              onChange={(e) => setManualApproveEnabled(e.target.checked)}
              disabled={
                isRunning ||
                isFeatureDisabled(FEATURE_CONFIG.manualApprove.isPremium)
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Composer manual approve
            </label>
            {shouldShowPremiumBadge(FEATURE_CONFIG.manualApprove.isPremium) && (
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow-sm">
                Premium
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Opens comment boxes, prefills comment in composer, and shows a
            sidebar to review and edit before posting. Works with target list
            mode. No auto-posting.
          </p>
        </div>
      )}

      {/* Authenticity Boost (free) */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={authenticityBoostEnabled}
            onChange={(e) => setAuthenticityBoostEnabled(e.target.checked)}
            disabled={isRunning}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">
            Authenticity Boost
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          the intern will look at surrounding context to make sure the comment
          is authentic to the highest level - will take 2s/cmt longer to run
        </p>
      </div>

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
            <Select
              value={selectedStyleId}
              onValueChange={(value) => setSelectedStyleId(value)}
              disabled={isRunning}
            >
              <SelectTrigger className="flex-1 truncate rounded-md border border-gray-300 px-3 py-2 text-base whitespace-nowrap focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm">
                <SelectValue placeholder="Select a comment style guide" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Default styles</SelectLabel>
                  {isPremium
                    ? Object.entries(DEFAULT_STYLE_GUIDES_PREMIUM).map(
                        ([key, value]) => (
                          <SelectItem
                            key={key}
                            value={key}
                            className="truncate"
                          >
                            {value.label}
                          </SelectItem>
                        ),
                      )
                    : Object.entries(DEFAULT_STYLE_GUIDES_FREE).map(
                        ([key, value]) => (
                          <SelectItem
                            key={key}
                            value={key}
                            className="truncate"
                          >
                            {value.label}
                          </SelectItem>
                        ),
                      )}
                </SelectGroup>

                <SelectGroup>
                  {commentStyles.data?.pages[0] !== undefined &&
                    commentStyles.data.pages[0].data.length > 0 && (
                      <SelectLabel>Custom Styles</SelectLabel>
                    )}

                  {commentStyles.data?.pages.map((page) =>
                    page.data.map((style) => (
                      <SelectItem
                        key={style.id}
                        value={style.id}
                        className="truncate"
                        title={style.name}
                      >
                        {style.name}
                      </SelectItem>
                    )),
                  )}
                  {commentStyles.hasNextPage && (
                    <SelectItem
                      value="disabled"
                      ref={(el) => {
                        if (el === null) return;
                        if (commentStyles.hasNextPage) {
                          void commentStyles.fetchNextPage();
                        }
                      }}
                      disabled
                    >
                      <LoaderCircleIcon className="size-3 animate-spin text-gray-500" />
                    </SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Trash button */}
            {/* TODO: delete custom style */}
            {/* <button */}
            {/*   type="button" */}
            {/*   onClick={() => } */}
            {/*   disabled={isDefaultStyleSelected || isRunning} */}
            {/*   title="Delete custom style" */}
            {/*   className="rounded p-2 text-red-600 hover:bg-red-100 disabled:text-gray-400" */}
            {/* > */}
            {/*   <TrashIcon className="h-4 w-4" /> */}
            {/* </button> */}
          </div>

          <input
            value={customStyleName}
            onChange={(e) => setCustomStyleName(e.target.value.slice(0, 100))}
            placeholder="Custom style name (max 100 characters)"
            className="mt-2 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
          />

          <textarea
            value={customStylePrompt}
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
              setCustomStylePrompt(text);
            }}
            placeholder="Describe your commenting style..."
            className="mt-2 h-40 w-full rounded-md border border-gray-300 p-3 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 disabled:text-gray-400"
            disabled={
              isRunning ||
              isDefaultStyleSelected ||
              isFeatureDisabled(FEATURE_CONFIG.customStyleGuide.isPremium)
            }
          />
          {/* Free plan word count indicator */}
          {isPremium === false && (
            <p
              className={`mt-0 text-xs font-bold ${
                customStylePromptWordCount.isTooLong
                  ? "text-red-600"
                  : "text-gray-600"
              }`}
            >
              Your free plan can have {customStylePromptWordCount.wordCount}/100
              words and {customStylePromptWordCount.charCount}
              /600 characters for comment guide. <UpgradeLink /> to have
              unlimited length guide.
            </p>
          )}

          <button
            onClick={async () => {
              const result = await addCommentStyle.mutateAsync({
                name: customStyleName,
                prompt: customStylePrompt,
              });
              setSelectedStyleId(result.id);
            }}
            className="mt-2 w-full cursor-pointer rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-200 disabled:cursor-not-allowed disabled:bg-gray-400"
            disabled={
              !customStyleName.trim() ||
              !customStylePrompt.trim() ||
              customStylePromptWordCount.isTooLong
            }
          >
            Add custom style
          </button>
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
              onChange={(e) => setBlacklistEnabled(e.target.checked)}
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
          {/* TODO: add blacklist author here */}
          {/* <input */}
          {/*   type="text" */}
          {/*   value={blacklistAuthors} */}
          {/*   onChange={(e) => onBlacklistAuthorsChange(e.target.value)} */}
          {/*   placeholder="e.g., Alice Smith, Bob Jones" */}
          {/*   disabled={ */}
          {/*     !blacklistEnabled || */}
          {/*     isRunning || */}
          {/*     isFeatureDisabled(FEATURE_CONFIG.blacklistAuthor.isPremium) */}
          {/*   } */}
          {/*   className="mt-2 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500" */}
          {/* /> */}
          {/* <p className="mt-1 text-xs text-gray-500"> */}
          {/*   Type in the profile names of accounts you never want to comment on, */}
          {/*   separated by commas. */}
          {/* </p> */}
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
              onChange={(e) => setCommentAsCompanyEnabled(e.target.checked)}
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
            onChange={(e) => setCommentProfileName(e.target.value)}
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
              onChange={(e) => setLanguageAwareEnabled(e.target.checked)}
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
              onChange={(e) => setSkipCompanyPagesEnabled(e.target.checked)}
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
              onChange={(e) => setSkipPromotedPostsEnabled(e.target.checked)}
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
                setSkipFriendsActivitiesEnabled(e.target.checked)
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
                onChange={(e) => setTimeFilterEnabled(e.target.checked)}
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
                  onChange={(e) => setMinPostAge(parseInt(e.target.value))}
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
            onChange={(e) => setScrollDuration(parseInt(e.target.value))}
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
            onChange={(e) => setMaxPosts(parseInt(e.target.value))}
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
            onChange={(e) => setCommentDelay(parseInt(e.target.value))}
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
                onChange={(e) => setDuplicateWindow(parseInt(e.target.value))}
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
    </form>
  );
}
