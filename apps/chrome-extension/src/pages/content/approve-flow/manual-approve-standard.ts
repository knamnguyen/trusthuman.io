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
import { injectApprovePanel } from "./inject-sidebar";
import { addApproveRow, setEditorText } from "./rows-sync";
import { lockScrollAtTop } from "./scroll-lock";

export async function runManualApproveStandard(
  params: ManualApproveCommonParams,
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
  } = params;

  const context: ApproveContext = injectApprovePanel();
  const unlock = lockScrollAtTop();

  let created = 0;
  // Prefer data-urn then data-id
  let containers = document.querySelectorAll("div[data-urn]");
  if (containers.length === 0) {
    containers = document.querySelectorAll("div[data-id]");
  }

  // Capture original scroll position to avoid moving the viewport while preparing
  const originalScrollY = window.scrollY;

  for (let i = 0; i < containers.length && created < maxPosts; i++) {
    const postContainer = containers[i] as HTMLElement;

    // Filters
    if (skipFriendsActivities && checkFriendsActivity(postContainer)) {
      continue;
    }

    if (skipCompanyPages) {
      const bioText = (extractBioAuthor(postContainer) ?? "").trim();
      const companyRegex = /^\d[\d\s,.]*followers$/i;
      if (companyRegex.test(bioText)) {
        continue;
      }
    }

    const { ageHours, isPromoted } = extractPostTimePromoteState(postContainer);
    if (skipPromotedPosts && isPromoted) continue;
    if (timeFilterEnabled && (ageHours === null || ageHours > minPostAge)) {
      continue;
    }

    const urns = extractPostUrns(postContainer);
    if (urns.length === 0) continue;
    if (urns.some((u) => hasCommentedOnPostUrn(u))) continue;

    const authorInfo = extractAuthorInfo(postContainer);
    if (
      blacklistEnabled &&
      blacklistList.some((b) =>
        (authorInfo?.name || "").toLowerCase().includes(b),
      )
    ) {
      continue;
    }

    const content = extractPostContent(postContainer);
    if (!content) continue;
    const hashRes = await normalizeAndHashContent(content);
    if (hashRes?.hash && hasCommentedOnPostHash(hashRes.hash)) continue;

    // Open editor: click comment button
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

    // Prefill literal text
    setEditorText(editorField, context.defaultText);

    // Use primary URN
    const primaryUrn = urns[0]!;
    addApproveRow(context, {
      urn: primaryUrn,
      postContainer,
      editorField,
      initialText: context.defaultText,
    });
    created++;
  }
  // Unlock scroll after preparation
  unlock();
}
