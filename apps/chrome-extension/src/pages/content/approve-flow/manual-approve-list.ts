import wait from "@src/utils/wait";

import type { ApproveContext, ManualApproveCommonParams } from "./types";
import { hasCommentedOnPostHash } from "../check-duplicate-commented-post-hash";
import { hasCommentedOnPostUrn } from "../check-duplicate-commented-post-urns";
import checkFriendsActivity from "../check-friends-activity";
import extractAuthorInfo from "../extract-author-info";
import extractBioAuthor from "../extract-bio-author";
import extractPostContent from "../extract-post-content";
import extractPostTimePromoteState from "../extract-post-time-promote-state";
import extractPostUrns from "../extract-post-urns";
import generateComment from "../generate-comment";
import normalizeAndHashContent from "../normalize-and-hash-content";
import { mapAuthorsToFirstPost } from "../profile-list/map-authors-to-first-post";
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
  } = params;

  const context: ApproveContext = injectApprovePanel();

  const authorToPost = mapAuthorsToFirstPost({
    targetNormalizedAuthors,
  });

  type Target = {
    urns: string[];
    postContainer: HTMLElement;
    authorName: string;
    postContent: string;
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

    targets.push({
      urns,
      postContainer,
      authorName: authorDisplay,
      postContent: content,
    });
  }

  // Generate in parallel
  const results = await Promise.allSettled(
    targets.map((t) =>
      generateComment(`${t.authorName}${t.postContent}`, params.styleGuide),
    ),
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

      const r = results[i]!;
      const aiText =
        r.status === "fulfilled" && r.value ? r.value : context.defaultText;

      setEditorText(editorField, aiText);
      const primaryUrn = t.urns[0]!;
      addApproveRow(context, {
        urn: primaryUrn,
        postContainer: t.postContainer,
        editorField,
        initialText: aiText,
      });
    }
  } finally {
    unlock();
  }
}
