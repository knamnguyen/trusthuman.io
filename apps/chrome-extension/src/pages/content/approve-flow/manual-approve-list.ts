import wait from "@src/utils/wait";

import type { ApproveContext, ManualApproveCommonParams } from "./types";
import {
  hasCommentedOnAuthorRecently,
  loadCommentedAuthorsWithTimestamps,
} from "../check-duplicate/check-duplicate-author-recency";
import { hasCommentedOnPostHash } from "../check-duplicate/check-duplicate-commented-post-hash";
import { hasCommentedOnPostUrn } from "../check-duplicate/check-duplicate-commented-post-urns";
import normalizeAndHashContent from "../check-duplicate/normalize-and-hash-content";
import checkFriendsActivity from "../check-friends-activity";
import extractAuthorInfo from "../extract-author-info";
import extractBioAuthor from "../extract-bio-author";
import loadAndExtractComments from "../extract-post-comments";
import extractPostContent from "../extract-post-content";
import extractPostTimePromoteState from "../extract-post-time-promote-state";
import extractPostUrns from "../extract-post-urns";
import generateComment from "../generate-comment";
import { mapAuthorsToFirstPost } from "../profile-target-list/map-authors-to-first-post";
import { MAX_CONCURRENCY, processInBatches } from "./concurrency";
import { injectApprovePanel } from "./inject-sidebar";
import { addApproveRow, setEditorText } from "./rows-sync";
import { lockScrollAtTop } from "./scroll-lock";

export async function runManualApproveList(
  params: ManualApproveCommonParams & {
    targetNormalizedAuthors: string[];
  },
): Promise<void> {
  const {
    maxPosts,
    timeFilterEnabled,
    minPostAge,
    skipCompanyPages,
    skipPromotedPosts,
    skipFriendsActivities,
    blacklistEnabled,
    blacklistList,
    targetNormalizedAuthors,
    duplicateWindow,
  } = params;

  const context: ApproveContext = injectApprovePanel();

  // Load author recency map once
  const commentedAuthorsWithTimestamps =
    await loadCommentedAuthorsWithTimestamps();

  const authorToPost = mapAuthorsToFirstPost({
    targetNormalizedAuthors,
  });

  type Target = {
    urns: string[];
    postContainer: HTMLElement;
    authorName: string;
    authorHeadline: string | null;
    postContent: string;
    authorImageUrl?: string;
  };
  const targets: Target[] = [];

  for (const [, postContainer] of authorToPost) {
    if (targets.length >= maxPosts) break;

    if (skipFriendsActivities && checkFriendsActivity(postContainer)) continue;

    if (skipCompanyPages) {
      const bioText = (extractBioAuthor(postContainer) ?? "").trim();
      const companyRegex = /^\d[\d\s,.]*followers$/i;
      if (companyRegex.test(bioText)) continue;
    }

    const { ageHours, isPromoted } = extractPostTimePromoteState(postContainer);
    if (skipPromotedPosts && isPromoted) continue;
    if (timeFilterEnabled && (ageHours === null || ageHours > minPostAge)) {
      continue;
    }

    const urns = extractPostUrns(postContainer);
    if (urns.length === 0) continue;
    if (urns.some((u) => hasCommentedOnPostUrn(u))) continue;

    const info = extractAuthorInfo(postContainer);
    const authorDisplay = info?.name ?? "";
    // Author recency filter using duplicateWindow
    try {
      if (
        authorDisplay &&
        hasCommentedOnAuthorRecently(
          authorDisplay,
          commentedAuthorsWithTimestamps,
          duplicateWindow,
        )
      )
        continue;
    } catch {}
    if (
      blacklistEnabled &&
      blacklistList.some((b) => authorDisplay.toLowerCase().includes(b))
    ) {
      continue;
    }

    const content = extractPostContent(postContainer);
    if (!content) continue;
    const hashRes = await normalizeAndHashContent(content);
    if (hashRes?.hash && hasCommentedOnPostHash(hashRes.hash)) continue;

    // Try to extract author avatar image URL
    let authorImageUrl: string | undefined = undefined;
    try {
      const img = postContainer.querySelector(
        "img.update-components-actor__avatar-image",
      ) as HTMLImageElement | null;
      if (img) {
        authorImageUrl =
          (
            img.currentSrc ||
            img.src ||
            img.getAttribute("src") ||
            img.getAttribute("data-delayed-url") ||
            img.getAttribute("data-li-src") ||
            ""
          ).trim() || undefined;
      }
    } catch {}

    targets.push({
      urns,
      postContainer,
      authorName: authorDisplay,
      authorHeadline: extractBioAuthor(postContainer),
      postContent: content,
      authorImageUrl,
    });
  }

  // Phase 2A: precompute adjacent comments in batches
  type PreparedAdjacent =
    | { commentContent: string; likeCount: number; replyCount: number }[]
    | "No existing comments";

  const adjacentSummaries: PreparedAdjacent[] = params.authenticityBoostEnabled
    ? await processInBatches(targets, MAX_CONCURRENCY, async (t) => {
        try {
          const extracted = await loadAndExtractComments(t.postContainer);
          return extracted
            .slice()
            .sort(
              (a, b) =>
                b.likeCount + b.replyCount - (a.likeCount + a.replyCount),
            )
            .slice(0, 5)
            .map(({ commentContent, likeCount, replyCount }) => ({
              commentContent,
              likeCount,
              replyCount,
            }));
        } catch {
          return "No existing comments" as const;
        }
      })
    : new Array(targets.length).fill("No existing comments");

  // Phase 2B: generate AI comments in batches
  const aiResults: (string | undefined)[] = await processInBatches(
    targets,
    MAX_CONCURRENCY,
    async (t, i) => {
      try {
        return await generateComment(
          `${t.authorName}${t.postContent}`,
          params.styleGuide,
          adjacentSummaries[i]!,
        );
      } catch {
        return undefined;
      }
    },
  );

  // Insert while scroll-locked
  const unlock = lockScrollAtTop();
  try {
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i]!;

      const commentButton = t.postContainer.querySelector(
        'button[aria-label="Comment"]',
      ) as HTMLButtonElement | null;
      if (!commentButton) continue;
      commentButton.click();
      await wait(1200);

      const editorField = t.postContainer.querySelector(
        '.comments-comment-box-comment__text-editor div[contenteditable="true"]',
      ) as HTMLElement | null;
      if (!editorField) continue;

      const aiText = aiResults[i] ?? context.defaultText;

      setEditorText(editorField, aiText);
      const primaryUrn = t.urns[0]!;
      const words = t.postContent.trim().split(/\s+/);
      const preview =
        words.slice(0, 20).join(" ") + (words.length > 20 ? "..." : "");
      addApproveRow(context, {
        urn: primaryUrn,
        postContainer: t.postContainer,
        editorField,
        initialText: aiText,
        authorName: t.authorName,
        authorHeadline: t.authorHeadline,
        postPreview: preview,
        authorImageUrl: t.authorImageUrl,
      });
    }
  } finally {
    unlock();
    // Ensure audio continues in manual approve; do not stop here
  }
}
