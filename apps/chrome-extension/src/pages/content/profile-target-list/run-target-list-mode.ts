import wait from "@src/utils/wait";

import { runManualApproveList } from "../approve-flow/manual-approve-list";
import {
  hasCommentedOnAuthorRecently,
  loadCommentedAuthorsWithTimestamps,
  saveCommentedAuthorWithTimestamp,
} from "../check-duplicate/check-duplicate-author-recency";
import {
  hasCommentedOnPostHash,
  saveCommentedPostHash,
} from "../check-duplicate/check-duplicate-commented-post-hash";
import {
  hasCommentedOnPostUrn,
  saveCommentedPostUrn,
} from "../check-duplicate/check-duplicate-commented-post-urns";
import normalizeAndHashContent from "../check-duplicate/normalize-and-hash-content";
import checkFriendsActivity from "../check-friends-activity";
import extractAuthorInfo from "../extract-author-info";
import extractBioAuthor from "../extract-bio-author";
import loadAndExtractComments from "../extract-post-comments";
import extractPostContent from "../extract-post-content";
import extractPostTimePromoteState from "../extract-post-time-promote-state";
import extractPostUrns from "../extract-post-urns";
import generateComment from "../generate-comment";
import postCommentOnPost from "../post-comment-on-post";
import updateCommentCounts from "../update-comment-counts";
import { ListModeState, SelectedListAuthors } from "./list-mode-types";
import { mapAuthorsToFirstPost } from "./map-authors-to-first-post";
import { preloadAuthorsFeed } from "./preload-authors-feed";

const COMPANY_PRONOUN_RULE =
  "IMPORTANT: You are in company page mode, not individual mode anymore. You're speaking on behalf of a company. ALWAYS use We/we pronouns; NEVER use I/i. This is the rule first and foremost you must follow before looking at any other rules or guide. Again, always use We/we pronouns when referring to yourself instead of I/i";

const LANGUAGE_AWARE_RULE =
  "IMPORTANT: When commenting, detect the language of the original post and comment in the same language. If the post is in English, comment in English; otherwise, switch to that language. Always respect grammar and tone. This rule is mandatory. If the post is in a language other than English, you must try as hard as possible to comment in the same tone and style as the post. If you can't, comment in English.";

const sendListModeUpdate = (note: string, state: ListModeState) => {
  try {
    chrome.runtime.sendMessage({ action: "listModeUpdate", note, ...state });
  } catch {}
};

export async function runListMode(params: {
  commentDelay: number;
  duplicateWindow: number;
  styleGuide: string;
  commentProfileName: string;
  commentAsCompanyEnabled: boolean;
  languageAwareEnabled: boolean;
  timeFilterEnabled: boolean;
  minPostAge: number;
  blacklistEnabled: boolean;
  blacklistList: string[];
  skipCompanyPages: boolean;
  skipPromotedPosts: boolean;
  skipFriendsActivities: boolean;
  isCommentingActiveRef: () => boolean;
  selectedListAuthors: SelectedListAuthors;
  statusPanel?: HTMLDivElement;
  manualApproveEnabled?: boolean;
  authenticityBoostEnabled?: boolean;
}): Promise<void> {
  const {
    commentDelay,
    duplicateWindow,
    styleGuide,
    commentProfileName,
    commentAsCompanyEnabled,
    languageAwareEnabled,
    timeFilterEnabled,
    minPostAge,
    blacklistEnabled,
    blacklistList,
    skipCompanyPages,
    skipPromotedPosts,
    skipFriendsActivities,
    isCommentingActiveRef,
    selectedListAuthors,
    statusPanel,
  } = params;

  const normalizedToOriginal = new Map<string, string>();
  selectedListAuthors.normalizedNames.forEach((n, i) => {
    if (!normalizedToOriginal.has(n)) {
      normalizedToOriginal.set(n, selectedListAuthors.originalNames[i] ?? n);
    }
  });

  let authorsFound: string[] = [];
  let authorsMissing: string[] = [];
  let authorsPending: string[] = [...selectedListAuthors.normalizedNames];
  let authorsCommented: string[] = [];

  const display = (arr: string[]) =>
    arr.map((n) => normalizedToOriginal.get(n) || n);

  // Initial update
  sendListModeUpdate("Preparing list mode...", {
    authorsFound: display(authorsFound),
    authorsMissing: display(authorsMissing),
    authorsPending: display(authorsPending),
    authorsCommented: display(authorsCommented),
  });

  // Preload to find first posts by authors (or timeout)
  const preloadRes = await preloadAuthorsFeed({
    isCommentingActiveRef,
    targetNormalizedAuthors: selectedListAuthors.normalizedNames,
    statusPanel,
  });
  // Remove blue overlay immediately after preload completes so commenting proceeds unobstructed
  try {
    const overlay = document.getElementById("linkedin-start-overlay");
    if (overlay) overlay.remove();
  } catch {}
  authorsFound = preloadRes.found;
  authorsMissing = preloadRes.missing;
  authorsPending = authorsPending.filter((n) => !authorsFound.includes(n));

  sendListModeUpdate(
    `Preload complete. Authors with posts: ${authorsFound.length}/${selectedListAuthors.normalizedNames.length}`,
    {
      authorsFound: display(authorsFound),
      authorsMissing: display(authorsMissing),
      authorsPending: display(authorsPending),
      authorsCommented: display(authorsCommented),
    },
  );

  if (!isCommentingActiveRef()) return;

  // Map authors to first post containers
  const authorToPost = mapAuthorsToFirstPost({
    targetNormalizedAuthors: authorsFound,
  });

  if (params.manualApproveEnabled) {
    await runManualApproveList({
      maxPosts: authorsFound.length,
      timeFilterEnabled,
      minPostAge,
      skipCompanyPages,
      skipPromotedPosts,
      skipFriendsActivities,
      blacklistEnabled,
      blacklistList,
      duplicateWindow,
      styleGuide,
      targetNormalizedAuthors: authorsFound,
    });
    return;
  }

  // Load author recency map once
  let commentedAuthorsWithTimestamps =
    await loadCommentedAuthorsWithTimestamps();

  for (const author of authorsFound) {
    if (!isCommentingActiveRef()) break;
    const postContainer = authorToPost.get(author);
    if (!postContainer) {
      // Could not locate post in DOM now; mark missing
      authorsMissing.push(author);
      authorsPending = authorsPending.filter((n) => n !== author);
      sendListModeUpdate(
        `Post not found for ${normalizedToOriginal.get(author) || author}`,
        {
          authorsFound: display(authorsFound),
          authorsMissing: display(authorsMissing),
          authorsPending: display(authorsPending),
          authorsCommented: display(authorsCommented),
        },
      );
      continue;
    }

    // Scroll to view
    postContainer.scrollIntoView({ behavior: "smooth", block: "center" });
    await wait(500);
    if (!isCommentingActiveRef()) break;

    // Filters: friends activities
    if (skipFriendsActivities && checkFriendsActivity(postContainer)) {
      authorsPending = authorsPending.filter((n) => n !== author);
      sendListModeUpdate(
        `Skipped friend activity for ${normalizedToOriginal.get(author) || author}`,
        {
          authorsFound: display(authorsFound),
          authorsMissing: display(authorsMissing),
          authorsPending: display(authorsPending),
          authorsCommented: display(authorsCommented),
        },
      );
      continue;
    }

    // Company pages
    if (skipCompanyPages) {
      const bioText = (extractBioAuthor(postContainer) ?? "").trim();
      const companyRegex = /^\d[\d\s,.]*followers$/i;
      if (companyRegex.test(bioText)) {
        authorsPending = authorsPending.filter((n) => n !== author);
        sendListModeUpdate(
          `Skipped company page for ${normalizedToOriginal.get(author) || author}`,
          {
            authorsFound: display(authorsFound),
            authorsMissing: display(authorsMissing),
            authorsPending: display(authorsPending),
            authorsCommented: display(authorsCommented),
          },
        );
        continue;
      }
    }

    // Time/promoted filter
    const { ageHours, isPromoted } = extractPostTimePromoteState(postContainer);
    if (skipPromotedPosts && isPromoted) {
      authorsPending = authorsPending.filter((n) => n !== author);
      sendListModeUpdate(
        `Skipped promoted post for ${normalizedToOriginal.get(author) || author}`,
        {
          authorsFound: display(authorsFound),
          authorsMissing: display(authorsMissing),
          authorsPending: display(authorsPending),
          authorsCommented: display(authorsCommented),
        },
      );
      continue;
    }
    if (timeFilterEnabled && (ageHours === null || ageHours > minPostAge)) {
      authorsPending = authorsPending.filter((n) => n !== author);
      sendListModeUpdate(
        `Skipped due to post age for ${normalizedToOriginal.get(author) || author}`,
        {
          authorsFound: display(authorsFound),
          authorsMissing: display(authorsMissing),
          authorsPending: display(authorsPending),
          authorsCommented: display(authorsCommented),
        },
      );
      continue;
    }

    // URN duplicate
    const urns = extractPostUrns(postContainer);
    if (urns.some((u) => hasCommentedOnPostUrn(u))) {
      authorsPending = authorsPending.filter((n) => n !== author);
      sendListModeUpdate(
        `Skipped already-commented post for ${normalizedToOriginal.get(author) || author}`,
        {
          authorsFound: display(authorsFound),
          authorsMissing: display(authorsMissing),
          authorsPending: display(authorsPending),
          authorsCommented: display(authorsCommented),
        },
      );
      continue;
    }

    // Blacklist by author name
    const info = extractAuthorInfo(postContainer);
    const authorDisplay =
      info?.name ?? normalizedToOriginal.get(author) ?? author;
    if (
      blacklistEnabled &&
      blacklistList.some((b) => authorDisplay.toLowerCase().includes(b))
    ) {
      authorsPending = authorsPending.filter((n) => n !== author);
      sendListModeUpdate(`Skipped blacklisted author ${authorDisplay}`, {
        authorsFound: display(authorsFound),
        authorsMissing: display(authorsMissing),
        authorsPending: display(authorsPending),
        authorsCommented: display(authorsCommented),
      });
      continue;
    }

    // Duplicate author recency
    try {
      const fallbackAuthorName =
        "No author name available, please do not refer to author when making comment";
      const authorName = (info?.name || "").trim();
      if (
        authorName &&
        authorName !== fallbackAuthorName &&
        hasCommentedOnAuthorRecently(
          authorName,
          commentedAuthorsWithTimestamps,
          duplicateWindow,
        )
      ) {
        authorsPending = authorsPending.filter((n) => n !== author);
        sendListModeUpdate(`Skipped recent author ${authorDisplay}`, {
          authorsFound: display(authorsFound),
          authorsMissing: display(authorsMissing),
          authorsPending: display(authorsPending),
          authorsCommented: display(authorsCommented),
        });
        continue;
      }
    } catch {}

    // Content duplicate
    const postContent = extractPostContent(postContainer);
    if (!postContent) {
      authorsPending = authorsPending.filter((n) => n !== author);
      sendListModeUpdate(`Skipped (no content) for ${authorDisplay}`, {
        authorsFound: display(authorsFound),
        authorsMissing: display(authorsMissing),
        authorsPending: display(authorsPending),
        authorsCommented: display(authorsCommented),
      });
      continue;
    }
    const hashRes = await normalizeAndHashContent(postContent);
    if (hashRes?.hash && hasCommentedOnPostHash(hashRes.hash)) {
      authorsPending = authorsPending.filter((n) => n !== author);
      sendListModeUpdate(`Skipped duplicate content for ${authorDisplay}`, {
        authorsFound: display(authorsFound),
        authorsMissing: display(authorsMissing),
        authorsPending: display(authorsPending),
        authorsCommented: display(authorsCommented),
      });
      continue;
    }

    if (!isCommentingActiveRef()) break;

    // Generate comment
    let effectiveStyleGuide = styleGuide;
    if (commentAsCompanyEnabled) {
      effectiveStyleGuide = `${COMPANY_PRONOUN_RULE}\n\n${effectiveStyleGuide}\n\n${COMPANY_PRONOUN_RULE}`;
    }
    if (languageAwareEnabled) {
      effectiveStyleGuide = `${LANGUAGE_AWARE_RULE}\n\n${effectiveStyleGuide}`;
    }
    const postAuthorContent = (info?.name || "") + postContent;
    let adjacent: any = "No existing comments";
    if (params.authenticityBoostEnabled) {
      try {
        const extracted = await loadAndExtractComments(postContainer);
        adjacent = extracted
          .slice()
          .sort(
            (a, b) => b.likeCount + b.replyCount - (a.likeCount + a.replyCount),
          )
          .slice(0, 5)
          .map(({ commentContent, likeCount, replyCount }) => ({
            commentContent,
            likeCount,
            replyCount,
          }));
      } catch {}
    }
    const comment = await generateComment(
      postAuthorContent,
      effectiveStyleGuide,
      adjacent,
    );
    if (!comment) {
      authorsPending = authorsPending.filter((n) => n !== author);
      sendListModeUpdate(`Failed to generate comment for ${authorDisplay}`, {
        authorsFound: display(authorsFound),
        authorsMissing: display(authorsMissing),
        authorsPending: display(authorsPending),
        authorsCommented: display(authorsCommented),
      });
      continue;
    }

    // Post comment
    const profileNameToUse = commentAsCompanyEnabled ? commentProfileName : "";
    const success = await postCommentOnPost(
      postContainer,
      comment,
      isCommentingActiveRef(),
      profileNameToUse,
    );
    if (success) {
      // Save recency and duplicates
      authorsPending = authorsPending.filter((n) => n !== author);
      authorsCommented.push(author);
      if (info?.name) {
        await saveCommentedAuthorWithTimestamp(info.name);
        commentedAuthorsWithTimestamps.set(info.name, Date.now());
      }
      for (const urn of urns) await saveCommentedPostUrn(urn);
      if (hashRes?.hash) await saveCommentedPostHash(hashRes.hash);
      await updateCommentCounts();
      sendListModeUpdate(`Commented on ${authorDisplay}`, {
        authorsFound: display(authorsFound),
        authorsMissing: display(authorsMissing),
        authorsPending: display(authorsPending),
        authorsCommented: display(authorsCommented),
      });
    } else {
      authorsPending = authorsPending.filter((n) => n !== author);
      sendListModeUpdate(`Failed to comment on ${authorDisplay}`, {
        authorsFound: display(authorsFound),
        authorsMissing: display(authorsMissing),
        authorsPending: display(authorsPending),
        authorsCommented: display(authorsCommented),
      });
    }

    // Delay between authors
    const chunks = Math.ceil(commentDelay);
    for (let c = 0; c < chunks && isCommentingActiveRef(); c++) {
      await wait(1000);
    }
    if (!isCommentingActiveRef()) break;
  }
}
