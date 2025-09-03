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
  const unlock = lockScrollAtTop();

  const authorToPost = mapAuthorsToFirstPost({
    targetNormalizedAuthors,
  });

  let created = 0;
  const originalScrollY = window.scrollY;
  for (const [, postContainer] of authorToPost) {
    if (created >= maxPosts) break;

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

    const commentButton = postContainer.querySelector(
      'button[aria-label="Comment"]',
    ) as HTMLButtonElement | null;
    if (!commentButton) continue;
    commentButton.click();
    await wait(1200);

    const editorField = postContainer.querySelector(
      '.comments-comment-box-comment__text-editor div[contenteditable="true"]',
    ) as HTMLElement | null;
    if (!editorField) continue;

    setEditorText(editorField, context.defaultText);
    const primaryUrn = urns[0]!;
    addApproveRow(context, {
      urn: primaryUrn,
      postContainer,
      editorField,
      initialText: context.defaultText,
    });
    created++;
  }
  unlock();
}
