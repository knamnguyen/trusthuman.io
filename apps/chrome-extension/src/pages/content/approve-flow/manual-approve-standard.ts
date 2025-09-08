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

  // Phase 1: collect eligible targets (respect all filters and maxPosts)
  type Target = {
    urns: string[];
    postContainer: HTMLElement;
    authorName: string;
    authorHeadline: string | null;
    postContent: string;
    authorImageUrl?: string;
  };

  const targets: Target[] = [];
  // Prefer data-urn then data-id
  let containers = document.querySelectorAll("div[data-urn]");
  if (containers.length === 0) {
    containers = document.querySelectorAll("div[data-id]");
  }

  for (let i = 0; i < containers.length && targets.length < maxPosts; i++) {
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
      authorName: authorInfo?.name || "",
      authorHeadline: extractBioAuthor(postContainer),
      postContent: content,
      authorImageUrl,
    });
  }

  // Phase 2: generate comments in parallel for collected targets
  const generationPromises = targets.map((t) =>
    generateComment(`${t.authorName}${t.postContent}`, params.styleGuide),
  );

  const results = await Promise.allSettled(generationPromises);

  // Phase 3: open editors, insert AI/fallback text, and add approve rows while scroll-locked
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
      const words = t.postContent.trim().split(/\s+/);
      const preview =
        words.slice(0, 15).join(" ") + (words.length > 15 ? "..." : "");
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
  }
}
