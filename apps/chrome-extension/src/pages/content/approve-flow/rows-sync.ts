import type { ApproveContext, ApproveRowMapping } from "./types";

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

  Object.assign(inputEl.style, { flex: "1" } as CSSStyleDeclaration);
  actionRow.appendChild(inputEl);
  actionRow.appendChild(buttonsCol);

  rowEl.appendChild(metaRow);
  rowEl.appendChild(actionRow);
  context.list.appendChild(rowEl);

  // Bi-directional sync with guards to prevent loops
  const onRowInput = () => {
    if (context.isUpdatingFromEditor) return;
    context.isUpdatingFromRow = true;
    setEditorText(editorField, inputEl.textContent ?? "");
    context.isUpdatingFromRow = false;
  };

  const onEditorInput = () => {
    if (context.isUpdatingFromRow) return;
    context.isUpdatingFromEditor = true;
    setRowText(inputEl, getEditorPlainText(editorField));
    context.isUpdatingFromEditor = false;
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
  });

  const mapping: ApproveRowMapping = {
    urn,
    postContainer,
    editorField,
    rowEl,
    inputEl,
    scrollBtn,
    removeBtn,
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
  };
  const updateActiveSetFromEditor = () => {
    const txt = getEditorPlainText(editorField).trim();
    if (txt.length > 0) context.activeUrns.add(urn);
    else context.activeUrns.delete(urn);
  };

  inputEl.addEventListener("input", updateActiveSetFromRow);
  editorField.addEventListener("input", updateActiveSetFromEditor);
  return mapping;
}

export function cleanupApproveContext(context: ApproveContext): void {
  try {
    context.panel.remove();
  } catch {}
  context.mapByUrn.clear();
}
