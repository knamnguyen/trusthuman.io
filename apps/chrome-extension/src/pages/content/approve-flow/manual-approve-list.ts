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
    duplicateWindow,
  } = params;

  const context: ApproveContext = injectApprovePanel();

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
      const storageKey = "commented_authors_timestamps";
      const store = await new Promise<Map<string, number>>((resolve) => {
        chrome.storage.local.get([storageKey], (result) => {
          const map = new Map<string, number>();
          const obj = result[storageKey] || {};
          Object.entries(obj).forEach(([k, v]) => map.set(k, Number(v)));
          resolve(map);
        });
      });
      const ts = store.get(authorDisplay);
      const within = ts
        ? Date.now() - ts < duplicateWindow * 60 * 60 * 1000
        : false;
      if (authorDisplay && within) continue;
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
