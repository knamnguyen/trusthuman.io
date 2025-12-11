"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { LoaderCircleIcon } from "lucide-react";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from "react-hook-form";
import { z } from "zod";

import {
  autoCommentConfigurationDefaults,
  DEFAULT_STYLE_GUIDES_FREE,
  DEFAULT_STYLE_GUIDES_PREMIUM,
  FEATURE_CONFIG,
} from "@sassy/feature-flags";
import { Button } from "@sassy/ui/button";
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
    return process.env.NEXTJS_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`;
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

export function AutoCommentConfigurationForm() {
  const { control, watch, setValue } = useFormContext<FormState>();
  const trpc = useTRPC();
  const { accountId } = useCurrentLinkedInAccountId();
  const { isPremium, isLoading: isPremiumLoading } = usePremiumStatus();

  const maxPostsLimit = getMaxPostsLimit(isPremium);

  const linkedInAccount = useQuery(
    trpc.account.get.queryOptions(
      {
        id: accountId ?? "",
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

  const [customStylePrompt, setCustomStylePrompt] = useState("");

  const [customStyleName, setCustomStyleName] = useState<string>("");

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

  const commentStyleId = watch("commentStyleId");
  const targetListId = watch("targetListId");
  const commentAsCompanyEnabled = watch("commentAsCompanyEnabled");
  const timeFilterEnabled = watch("timeFilterEnabled");

  const isDefaultStyleSelected = isDefaultStyle(commentStyleId ?? "");

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

  const targetListEnabled = watch("targetListEnabled");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className="px-4"
    >
      {/* Comment on Target List (free feature) */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Controller
              control={control}
              name="targetListEnabled"
              render={({ field: { value, onChange, ...rest } }) => (
                <input
                  type="checkbox"
                  id="targetListEnabled"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  {...rest}
                  disabled={isRunning}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
            />

            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="targetListEnabled"
            >
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
        <Controller
          control={control}
          name="targetListId"
          render={({ field: { value, onChange } }) => (
            <Select
              value={value ?? undefined}
              onValueChange={(value) => onChange(value)}
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
          )}
        />

        <p className="mt-1 text-xs text-gray-500">
          Create target list of people to comment on their latest posts
        </p>
      </div>

      {/* Finish List Mode - gated by target list selection */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="finishListModeEnabled"
            render={({ field }) => (
              <input
                id="finishListModeEnabled"
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                disabled={isRunning || !targetListEnabled || !targetListId}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            )}
          />

          <label
            className="text-sm font-medium text-gray-700"
            htmlFor="finishListModeEnabled"
          >
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
            <Controller
              control={control}
              name="manualApproveEnabled"
              render={({ field: { value, onChange, ...rest } }) => (
                <input
                  type="checkbox"
                  id="manualApproveEnabled"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  {...rest}
                  disabled={
                    isRunning ||
                    isFeatureDisabled(FEATURE_CONFIG.manualApprove.isPremium)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
            />
            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="manualApproveEnabled"
            >
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
          <Controller
            name="authenticityBoostEnabled"
            control={control}
            render={({ field: { value, onChange, ...rest } }) => (
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => onChange(e.target.checked)}
                id="authenticityBoostEnabled"
                disabled={isRunning}
                {...rest}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            )}
          />

          <label
            className="text-sm font-medium text-gray-700"
            htmlFor="authenticityBoostEnabled"
          >
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
            <Controller
              control={control}
              name="commentStyleId"
              render={({ field: { value, onChange } }) => (
                <Select
                  value={value ?? undefined}
                  onValueChange={(value) => {
                    if (isDefaultStyle(value) === true) {
                      setValue("defaultCommentStyle", value);
                      onChange(undefined);
                    } else {
                      onChange(value);
                      setValue("defaultCommentStyle", undefined);
                    }
                  }}
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
              )}
            />

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
              setValue("commentStyleId", result.id);
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
            <Controller
              control={control}
              name="blacklistEnabled"
              render={({ field: { value, onChange, ...rest } }) => (
                <input
                  type="checkbox"
                  id="blacklistEnabled"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  {...rest}
                  disabled={
                    isRunning ||
                    isFeatureDisabled(FEATURE_CONFIG.blacklistAuthor.isPremium)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
            />

            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="blacklistEnabled"
            >
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
            <Controller
              control={control}
              name="commentAsCompanyEnabled"
              render={({ field: { value, onChange, ...rest } }) => (
                <input
                  type="checkbox"
                  id="commentAsCompanyEnabled"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  {...rest}
                  disabled={
                    isRunning ||
                    isFeatureDisabled(
                      FEATURE_CONFIG.commentAsCompanyPage.isPremium,
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
            />

            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="commentAsCompanyEnabled"
            >
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
          <Controller
            control={control}
            name="commentProfileName"
            render={({ field: { value, onChange, ...rest } }) => (
              <input
                type="text"
                value={
                  shouldShowPremiumBadge(
                    FEATURE_CONFIG.commentAsCompanyPage.isPremium,
                  )
                    ? ""
                    : value
                }
                onChange={(e) => onChange(e.target.value)}
                // we only provide rest props if should show premium badge
                {...(shouldShowPremiumBadge(
                  FEATURE_CONFIG.commentAsCompanyPage.isPremium,
                )
                  ? { ...rest }
                  : {})}
                disabled={
                  isRunning ||
                  !commentAsCompanyEnabled ||
                  isFeatureDisabled(
                    FEATURE_CONFIG.commentAsCompanyPage.isPremium,
                  )
                }
                placeholder="Page name"
                className="mt-2 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              />
            )}
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
            <Controller
              control={control}
              name="languageAwareEnabled"
              render={({ field: { value, onChange, ...rest } }) => (
                <input
                  type="checkbox"
                  id="languageAwareEnabled"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  {...rest}
                  disabled={
                    isRunning ||
                    isFeatureDisabled(
                      FEATURE_CONFIG.languageAwareComment.isPremium,
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
            />

            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="languageAwareEnabled"
            >
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
            <Controller
              control={control}
              name="skipCompanyPagesEnabled"
              render={({ field: { value, onChange, ...rest } }) => (
                <input
                  type="checkbox"
                  id="skipCompanyPagesEnabled"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  {...rest}
                  disabled={
                    isRunning ||
                    isFeatureDisabled(FEATURE_CONFIG.skipCompanyPages.isPremium)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
            />

            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="skipCompanyPagesEnabled"
            >
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
            <Controller
              control={control}
              name="skipPromotedPostsEnabled"
              render={({ field: { value, onChange, ...rest } }) => (
                <input
                  type="checkbox"
                  id="skipPromotedPostsEnabled"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  {...rest}
                  disabled={
                    isRunning ||
                    isFeatureDisabled(
                      FEATURE_CONFIG.skipPromotedPosts.isPremium,
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
            />

            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="skipPromotedPostsEnabled"
            >
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
            <Controller
              control={control}
              name="skipFriendsActivitiesEnabled"
              render={({ field: { value, onChange, ...rest } }) => (
                <input
                  type="checkbox"
                  id="skipFriendsActivitiesEnabled"
                  checked={value}
                  onChange={(e) => onChange(e.target.checked)}
                  {...rest}
                  disabled={
                    isRunning ||
                    isFeatureDisabled(
                      FEATURE_CONFIG.skipFriendsActivities.isPremium,
                    )
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )}
            />

            <label
              className="text-sm font-medium text-gray-700"
              htmlFor="skipFriendsActivitiesEnabled"
            >
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
              <Controller
                control={control}
                name="timeFilterEnabled"
                render={({ field: { value, onChange, ...rest } }) => (
                  <input
                    type="checkbox"
                    id="timeFilterEnabled"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    {...rest}
                    disabled={
                      isRunning ||
                      isFeatureDisabled(FEATURE_CONFIG.postAgeFilter.isPremium)
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                )}
              />

              <label
                htmlFor="timeFilterEnabled"
                className="text-sm text-gray-700"
              >
                Only comment on posts made within:
              </label>
              <div className="flex flex-1 items-center space-x-2">
                <Controller
                  control={control}
                  name="minPostAge"
                  render={({ field: { value, onChange, ...rest } }) => (
                    <>
                      <input
                        type="range"
                        min="1"
                        max="24"
                        value={value}
                        onChange={(e) => onChange(parseInt(e.target.value))}
                        {...rest}
                        disabled={
                          isRunning ||
                          isFeatureDisabled(
                            FEATURE_CONFIG.postAgeFilter.isPremium,
                          ) ||
                          !timeFilterEnabled
                        }
                        className="flex-1"
                      />

                      <span className="w-12 text-sm font-medium">{value}h</span>
                    </>
                  )}
                />
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
          <Controller
            control={control}
            name="scrollDuration"
            render={({ field: { value, onChange, ...rest } }) => (
              <>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={value}
                  onChange={(e) => onChange(parseInt(e.target.value))}
                  {...rest}
                  disabled={isRunning}
                  className="flex-1"
                />

                <span className="w-16 text-sm font-medium">{value}s</span>
              </>
            )}
          />
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
          <Controller
            control={control}
            name="maxPosts"
            render={({ field: { value, onChange, ...rest } }) => (
              <>
                <input
                  type="range"
                  min="5"
                  max={maxPostsLimit}
                  value={value}
                  onChange={(e) => onChange(parseInt(e.target.value))}
                  {...rest}
                  disabled={isRunning}
                  className="flex-1"
                />

                <span className="w-16 text-sm font-medium">{value}</span>
              </>
            )}
          />
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
          <Controller
            control={control}
            name="commentDelay"
            render={({ field: { value, onChange, ...rest } }) => (
              <>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={value}
                  onChange={(e) => onChange(parseInt(e.target.value))}
                  {...rest}
                  disabled={isRunning}
                  className="flex-1"
                />
                <span className="w-16 text-sm font-medium">{value}s</span>
              </>
            )}
          />
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
              <Controller
                control={control}
                name="duplicateWindow"
                render={({ field: { value, onChange, ...rest } }) => (
                  <>
                    <input
                      type="range"
                      min="1"
                      max="72"
                      value={value}
                      onChange={(e) => onChange(parseInt(e.target.value))}
                      {...rest}
                      disabled={
                        isRunning ||
                        isFeatureDisabled(
                          FEATURE_CONFIG.duplicateAuthorCheck.isPremium,
                        )
                      }
                      className="flex-1"
                    />

                    <span className="w-16 text-sm font-medium">{value}h</span>
                  </>
                )}
              />
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

export function AutoCommentConfigurationFormHeader() {
  const trpc = useTRPC();
  const saveConfig = useMutation(
    trpc.autocomment.configuration.save.mutationOptions(),
  );
  const { getValues } = useFormContext<FormState>();
  const { accountId } = useCurrentLinkedInAccountId();
  return (
    <div className="bg-background sticky top-0 mb-3 flex items-center justify-between px-4 py-2 shadow-sm">
      <div className="text-lg font-semibold">Auto commenting configuration</div>
      <Button
        onClick={() => {
          if (accountId === null) {
            return;
          }
          const values = getValues();
          saveConfig.mutate({ ...values, linkedInAccountId: accountId });
        }}
        disabled={saveConfig.isPending}
      >
        {saveConfig.isPending ? (
          <LoaderCircleIcon className="size-4 animate-spin" />
        ) : (
          "Save"
        )}
      </Button>
    </div>
  );
}

export const formStateSchema = z.object({
  scrollDuration: z.number(),
  commentDelay: z.number(),
  maxPosts: z.number(),
  duplicateWindow: z.number(),
  finishListModeEnabled: z.boolean(),
  commentAsCompanyEnabled: z.boolean(),
  timeFilterEnabled: z.boolean(),
  minPostAge: z.number().optional(),
  manualApproveEnabled: z.boolean(),
  authenticityBoostEnabled: z.boolean(),
  targetListId: z.string().nullish(),
  commentStyleId: z.string().nullish(),
  commentProfileName: z.string().optional().default(""),
  defaultCommentStyle: z.string().nullish(),
  languageAwareEnabled: z.boolean(),
  skipCompanyPagesEnabled: z.boolean(),
  blacklistEnabled: z.boolean(),
  skipPromotedPostsEnabled: z.boolean(),
  skipFriendsActivitiesEnabled: z.boolean(),
  targetListEnabled: z.boolean(),
});

export type FormState = z.infer<typeof formStateSchema>;

export function AutoCommentConfigurationFormProvider({
  children,
  defaultValues,
}: {
  children: ReactNode;
  defaultValues?: Partial<FormState>;
}) {
  const form = useForm<FormState>({
    resolver: zodResolver(formStateSchema),
    defaultValues: {
      ...autoCommentConfigurationDefaults,
      ...defaultValues,
    },
  });

  return <FormProvider {...form}>{children}</FormProvider>;
}
