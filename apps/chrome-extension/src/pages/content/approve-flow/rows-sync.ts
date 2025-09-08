import type { ApproveContext, ApproveRowMapping } from "./types";
import { saveCommentedPostHash } from "../check-duplicate-commented-post-hash";
import { saveCommentedPostUrn } from "../check-duplicate-commented-post-urns";
import extractAuthorInfo from "../extract-author-info";
import extractPostContent from "../extract-post-content";
import extractPostUrns from "../extract-post-urns";
import normalizeAndHashContent from "../normalize-and-hash-content";
import saveCommentedAuthorWithTimestamp from "../save-commented-author-with-timestamp";

export function getEditorPlainText(editorField: HTMLElement): string {
  const parts: string[] = [];
  editorField.childNodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === "P") {
        const text = el.textContent ?? "";
        parts.push(text);
      } else if (el.tagName === "BR") {
        parts.push("");
      } else {
        parts.push(el.textContent ?? "");
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.textContent ?? "");
    }
  });
  return parts.join("\n").trim();
}

export function setEditorText(editorField: HTMLElement, text: string): void {
  editorField.innerHTML = "";
  const lines = text.split("\n");
  lines.forEach((line) => {
    const p = document.createElement("p");
    if (line === "") {
      p.appendChild(document.createElement("br"));
    } else {
      p.textContent = line;
    }
    editorField.appendChild(p);
  });
  const inputEvent = new Event("input", { bubbles: true, cancelable: true });
  editorField.dispatchEvent(inputEvent);
}

export function setRowText(inputEl: HTMLDivElement, text: string): void {
  inputEl.textContent = text;
}

export function addApproveRow(
  context: ApproveContext,
  params: {
    urn: string;
    postContainer: HTMLElement;
    editorField: HTMLElement;
    initialText: string;
    authorName?: string;
    authorHeadline?: string | null;
    postPreview?: string;
    authorImageUrl?: string;
  },
): ApproveRowMapping {
  const {
    urn,
    postContainer,
    editorField,
    initialText,
    authorName,
    authorHeadline,
    postPreview,
    authorImageUrl,
  } = params;

  const rowEl = document.createElement("div");
  Object.assign(rowEl.style, {
    display: "flex",
    alignItems: "stretch",
    flexDirection: "column",
    gap: "8px",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    padding: "6px",
    background: "#fafafa",
  } as CSSStyleDeclaration);
  // Tag row with URN for lookup/order when submitting all
  (rowEl as HTMLDivElement).dataset.urn = urn;

  // Helper to truncate by words
  const truncateWords = (text: string, maxWords: number): string => {
    const words = (text || "").trim().split(/\s+/);
    if (words.length <= maxWords) return words.join(" ");
    return words.slice(0, maxWords).join(" ") + "...";
  };

  const appendEllipsis = (text: string): string => {
    const t = (text || "").trim();
    return t.endsWith("...") ? t : `${t} ...`;
  };

  // Meta row (full width): Author + Post preview
  const metaRow = document.createElement("div");
  Object.assign(metaRow.style, {
    fontSize: "11px",
    color: "#6b7280",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  } as CSSStyleDeclaration);

  if (authorName || authorHeadline || postPreview) {
    // Author line
    const authorRow = document.createElement("div");
    Object.assign(authorRow.style, {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    } as CSSStyleDeclaration);

    if (authorImageUrl) {
      const avatar = document.createElement("img");
      avatar.src = authorImageUrl;
      Object.assign(avatar, {
        width: 24,
        height: 24,
      } as Partial<HTMLImageElement>);
      Object.assign(avatar.style, {
        borderRadius: "9999px",
        flexShrink: "0",
        objectFit: "cover",
      } as CSSStyleDeclaration);
      authorRow.appendChild(avatar);
    }

    const authorLine = document.createElement("div");
    const authorLabel = document.createElement("span");
    authorLabel.textContent = "Author: ";
    Object.assign(authorLabel.style, {
      fontWeight: "700",
      color: "#374151",
    } as CSSStyleDeclaration);
    const authorContent = document.createElement("span");
    const combined = `${authorName ?? ""}${authorHeadline ? " — " + authorHeadline : ""}`;
    authorContent.textContent = appendEllipsis(truncateWords(combined, 7));
    authorLine.appendChild(authorLabel);
    authorLine.appendChild(authorContent);
    authorRow.appendChild(authorLine);

    // Post line
    const postLine = document.createElement("div");
    const postLabel = document.createElement("span");
    postLabel.textContent = "Post: ";
    Object.assign(postLabel.style, {
      fontWeight: "700",
      color: "#374151",
    } as CSSStyleDeclaration);
    const postContentSpan = document.createElement("span");
    if (postPreview) postContentSpan.textContent = appendEllipsis(postPreview);
    postLine.appendChild(postLabel);
    postLine.appendChild(postContentSpan);

    metaRow.appendChild(authorRow);
    metaRow.appendChild(postLine);
  }

  const inputEl = document.createElement("div");
  inputEl.contentEditable = "true";
  inputEl.spellcheck = true;
  Object.assign(inputEl.style, {
    flex: "1",
    minHeight: "32px",
    outline: "none",
    padding: "6px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    border: "1px solid #e5e7eb",
    background: "#fff",
    whiteSpace: "pre-wrap",
  } as CSSStyleDeclaration);
  inputEl.textContent = initialText;

  const scrollBtn = document.createElement("button");
  scrollBtn.type = "button";
  scrollBtn.textContent = "Focus";
  Object.assign(scrollBtn.style, {
    padding: "6px 10px",
    background: "#ec4899",
    color: "#fff",
    border: "2px solid #000",
    borderRadius: "4px",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
    boxShadow: "2px 2px 0 #000",
  } as CSSStyleDeclaration);

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "Remove";
  Object.assign(removeBtn.style, {
    padding: "6px 10px",
    background: "#f3f4f6",
    color: "#111827",
    border: "2px solid #000",
    borderRadius: "4px",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
    boxShadow: "2px 2px 0 #000",
  } as CSSStyleDeclaration);

  // Status chip (Draft/Sent)
  const statusEl = document.createElement("span");
  statusEl.textContent = "Draft";
  Object.assign(statusEl.style, {
    fontSize: "11px",
    color: "#374151",
    background: "#e5e7eb",
    border: "1px solid #d1d5db",
    borderRadius: "9999px",
    padding: "2px 8px",
    alignSelf: "center",
  } as CSSStyleDeclaration);

  // Action row: editor (left) and buttons (right)
  const actionRow = document.createElement("div");
  Object.assign(actionRow.style, {
    display: "flex",
    alignItems: "stretch",
    gap: "8px",
  } as CSSStyleDeclaration);

  // Right buttons column stacked vertically
  const buttonsCol = document.createElement("div");
  Object.assign(buttonsCol.style, {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    alignSelf: "center",
  } as CSSStyleDeclaration);
  buttonsCol.appendChild(scrollBtn);
  buttonsCol.appendChild(removeBtn);
  buttonsCol.appendChild(statusEl);

  Object.assign(inputEl.style, { flex: "1" } as CSSStyleDeclaration);
  actionRow.appendChild(inputEl);
  actionRow.appendChild(buttonsCol);

  rowEl.appendChild(metaRow);
  rowEl.appendChild(actionRow);
  context.list.appendChild(rowEl);

  // Initialize header counts on row creation
  if (context.draftCountEl)
    context.draftCountEl.textContent = String(context.activeUrns.size);
  if (context.sentCountEl)
    context.sentCountEl.textContent = String(context.sentUrns.size);

  // Bi-directional sync with guards to prevent loops
  const onRowInput = () => {
    if (context.isUpdatingFromEditor) return;
    context.isUpdatingFromRow = true;
    setEditorText(editorField, inputEl.textContent ?? "");
    context.isUpdatingFromRow = false;
    if (context.draftCountEl)
      context.draftCountEl.textContent = String(context.activeUrns.size);
  };

  const onEditorInput = () => {
    if (context.isUpdatingFromRow) return;
    context.isUpdatingFromEditor = true;
    setRowText(inputEl, getEditorPlainText(editorField));
    context.isUpdatingFromEditor = false;
    if (context.draftCountEl)
      context.draftCountEl.textContent = String(context.activeUrns.size);
  };

  inputEl.addEventListener("input", onRowInput);
  editorField.addEventListener("input", onEditorInput);

  scrollBtn.addEventListener("click", () => {
    postContainer.scrollIntoView({ behavior: "smooth", block: "center" });
    try {
      const prevOutline = postContainer.style.outline;
      postContainer.style.outline = "2px solid #ec4899";
      setTimeout(() => {
        postContainer.style.outline = prevOutline;
      }, 1200);
    } catch {}
  });

  removeBtn.addEventListener("click", () => {
    try {
      setEditorText(editorField, "");
    } catch {}
    try {
      context.activeUrns.delete(urn);
      context.mapByUrn.delete(urn);
    } catch {}
    try {
      rowEl.remove();
    } catch {}
    if (context.draftCountEl)
      context.draftCountEl.textContent = String(context.activeUrns.size);
  });

  // Helper to mark a row as sent (UI + counters)
  const markAsSent = () => {
    context.activeUrns.delete(urn);
    context.sentUrns.add(urn);
    statusEl.textContent = "Sent";
    statusEl.style.background = "#d1fae5";
    statusEl.style.borderColor = "#10b981";
    statusEl.style.color = "#065f46";
    if (context.draftCountEl)
      context.draftCountEl.textContent = String(context.activeUrns.size);
    if (context.sentCountEl)
      context.sentCountEl.textContent = String(context.sentUrns.size);
    try {
      if (authorName) {
        context.composerCommentedAuthors?.add(authorName);
        chrome.runtime.sendMessage({
          action: "listModeUpdate",
          note: `Composer: commented on ${authorName}`,
          authorsFound: [],
          authorsMissing: [],
          authorsPending: [],
          authorsCommented: Array.from(context.composerCommentedAuthors || []),
        });
      }
    } catch {}
    if (context.activeUrns.size === 0) {
      try {
        chrome.runtime.sendMessage({ action: "commentingCompleted" });
      } catch {}
    }
  };

  // Attempt to detect manual submit clicks on native button
  try {
    const nativeSubmit = postContainer.querySelector(
      ".comments-comment-box__submit-button--cr",
    ) as HTMLButtonElement | null;
    if (nativeSubmit) {
      nativeSubmit.addEventListener(
        "click",
        () => {
          // Defer UI update a tick; assume click implies successful submit
          setTimeout(() => markAsSent(), 300);
        },
        { capture: true },
      );
    }
  } catch {}

  const mapping: ApproveRowMapping = {
    urn,
    postContainer,
    editorField,
    rowEl,
    inputEl,
    scrollBtn,
    removeBtn,
    statusEl: statusEl,
    authorName,
  };

  context.mapByUrn.set(urn, mapping);

  // Initialize active set based on initial text
  if ((initialText || "").trim().length > 0) {
    context.activeUrns.add(urn);
  }

  // Maintain active set membership based on content changes
  const updateActiveSetFromRow = () => {
    const txt = (inputEl.textContent || "").trim();
    if (txt.length > 0) context.activeUrns.add(urn);
    else context.activeUrns.delete(urn);
    if (context.draftCountEl)
      context.draftCountEl.textContent = String(context.activeUrns.size);
  };
  const updateActiveSetFromEditor = () => {
    const txt = getEditorPlainText(editorField).trim();
    if (txt.length > 0) context.activeUrns.add(urn);
    else context.activeUrns.delete(urn);
    if (context.draftCountEl)
      context.draftCountEl.textContent = String(context.activeUrns.size);
  };

  inputEl.addEventListener("input", updateActiveSetFromRow);
  editorField.addEventListener("input", updateActiveSetFromEditor);

  // One coordinator to submit all with delay, bound only once
  if (!(document as any)._engagekitSubmitCoordinatorBound) {
    (document as any)._engagekitSubmitCoordinatorBound = true;
    document.addEventListener("engagekit-submit-all", async () => {
      try {
        // read settings from storage
        const { delaySeconds } = await new Promise<{
          delaySeconds: number;
        }>((resolve) => {
          chrome.storage.local.get(["commentDelay"], (r) => {
            resolve({
              delaySeconds: (r.commentDelay as number) ?? 5,
            });
          });
        });
        const children = Array.from(context.list.children) as HTMLDivElement[];
        for (const row of children) {
          const rowUrn = row.dataset.urn || "";
          const mapping = context.mapByUrn.get(rowUrn);
          if (!mapping) continue;
          if (!context.activeUrns.has(rowUrn)) continue;
          const txt = getEditorPlainText(mapping.editorField).trim();
          if (!txt) continue;

          // Extract using the same helpers as index.tsx (submission should not re-apply time filters)
          const urns: string[] = extractPostUrns(mapping.postContainer);
          const authorInfo = extractAuthorInfo(mapping.postContainer);
          const authorNameFinal = (
            authorInfo?.name ||
            mapping.authorName ||
            ""
          ).trim();
          const content: string = extractPostContent(mapping.postContainer);
          const submitButton = mapping.postContainer.querySelector(
            ".comments-comment-box__submit-button--cr",
          ) as HTMLButtonElement | null;
          if (submitButton && !submitButton.disabled) {
            submitButton.click();
            // Persist URNs and content hash and author recency
            try {
              // save URNs
              for (const u of urns) await saveCommentedPostUrn(u);
              // hash
              const hashRes = await normalizeAndHashContent(content);
              if (hashRes?.hash) {
                await saveCommentedPostHash(hashRes.hash);
              }
              // author recency
              if (authorNameFinal) {
                await saveCommentedAuthorWithTimestamp(authorNameFinal);
              }
              // mark sent
              const mm = context.mapByUrn.get(rowUrn);
              if (mm) {
                mm.statusEl.textContent = "Sent";
                mm.statusEl.style.background = "#d1fae5";
                mm.statusEl.style.borderColor = "#10b981";
                mm.statusEl.style.color = "#065f46";
              }
              context.activeUrns.delete(rowUrn);
              context.sentUrns.add(rowUrn);
              if (context.draftCountEl)
                context.draftCountEl.textContent = String(
                  context.activeUrns.size,
                );
              if (context.sentCountEl)
                context.sentCountEl.textContent = String(context.sentUrns.size);
              try {
                if (mm?.authorName) {
                  context.composerCommentedAuthors?.add(mm.authorName);
                  chrome.runtime.sendMessage({
                    action: "listModeUpdate",
                    note: `Composer: commented on ${mm.authorName}`,
                    authorsFound: [],
                    authorsMissing: [],
                    authorsPending: [],
                    authorsCommented: Array.from(
                      context.composerCommentedAuthors || [],
                    ),
                  });
                }
              } catch {}
            } catch (e) {
              console.warn("Persist after submit failed", e);
            }
            // delay between posts
            const chunks = Math.max(1, Math.ceil(delaySeconds));
            for (let c = 0; c < chunks; c++)
              await new Promise((r) => setTimeout(r, 1000));
          }
        }
        if (context.activeUrns.size === 0) {
          try {
            chrome.runtime.sendMessage({ action: "commentingCompleted" });
          } catch {}
        }
      } catch (e) {
        console.warn("Submit All coordinator error", e);
      }
    });
  }
  return mapping;
}

export function cleanupApproveContext(context: ApproveContext): void {
  try {
    context.panel.remove();
  } catch {}
  context.mapByUrn.clear();
}
