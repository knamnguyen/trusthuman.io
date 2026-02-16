import type { ApproveContext } from "./types";

const PANEL_ID = "engagekit-approve-panel";

// Deprecated: LinkedIn host detection removed. We always mount to body as an overlay.

export function injectApprovePanel(): ApproveContext {
  // Cleanup any existing panel first
  const prev = document.getElementById(PANEL_ID);
  if (prev) prev.remove();
  const panel = document.createElement("div");
  panel.id = PANEL_ID;
  // Fixed overlay styles (right docked)
  Object.assign(panel.style, {
    position: "fixed",
    top: "0",
    right: "0",
    height: "100vh",
    width: "400px",
    overflowY: "auto",
    background: "#fff",
    borderLeft: "1px solid #e5e7eb",
    boxShadow: "-8px 0 20px rgba(0,0,0,0.08)",
    padding: "0 10px 10px 10px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
    zIndex: "2147483647",
  } as CSSStyleDeclaration);

  // Header (sticky)
  const header = document.createElement("div");
  Object.assign(header.style, {
    position: "sticky",
    top: "0",
    zIndex: "1",
    background: "#fff",
    padding: "10px 0 8px 0",
    borderBottom: "1px solid #e5e7eb",
  } as CSSStyleDeclaration);

  const headerRow = document.createElement("div");
  Object.assign(headerRow.style, {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  } as CSSStyleDeclaration);

  const title = document.createElement("div");
  title.textContent = "EngageKit Composer";
  Object.assign(title.style, {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
  } as CSSStyleDeclaration);

  const rightGroup = document.createElement("div");
  Object.assign(rightGroup.style, {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  } as CSSStyleDeclaration);

  const draftsLabel = document.createElement("span");
  draftsLabel.textContent = "Drafts: ";
  Object.assign(draftsLabel.style, {
    fontSize: "12px",
    color: "#6b7280",
  } as CSSStyleDeclaration);
  const draftCountEl = document.createElement("span");
  draftCountEl.textContent = "0";
  Object.assign(draftCountEl.style, {
    fontSize: "12px",
    fontWeight: "700",
    color: "#111827",
  } as CSSStyleDeclaration);

  const sentLabel = document.createElement("span");
  sentLabel.textContent = "Sent: ";
  Object.assign(sentLabel.style, {
    fontSize: "12px",
    color: "#6b7280",
    marginLeft: "8px",
  } as CSSStyleDeclaration);
  const sentCountEl = document.createElement("span");
  sentCountEl.textContent = "0";
  Object.assign(sentCountEl.style, {
    fontSize: "12px",
    fontWeight: "700",
    color: "#111827",
  } as CSSStyleDeclaration);

  const submitAllBtn = document.createElement("button");
  submitAllBtn.type = "button";
  submitAllBtn.textContent = "Submit All";
  Object.assign(submitAllBtn.style, {
    padding: "6px 10px",
    background: "#111827",
    color: "#fff",
    border: "2px solid #000",
    borderRadius: "4px",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer",
    boxShadow: "2px 2px 0 #000",
  } as CSSStyleDeclaration);
  submitAllBtn.addEventListener("click", () => {
    try {
      const ev = new CustomEvent("engagekit-submit-all");
      document.dispatchEvent(ev);
    } catch (e) {
      console.warn("Submit All dispatch failed", e);
    }
  });

  rightGroup.appendChild(draftsLabel);
  rightGroup.appendChild(draftCountEl);
  rightGroup.appendChild(sentLabel);
  rightGroup.appendChild(sentCountEl);
  rightGroup.appendChild(submitAllBtn);
  headerRow.appendChild(title);
  headerRow.appendChild(rightGroup);
  header.appendChild(headerRow);
  panel.appendChild(header);

  // List container
  const list = document.createElement("div");
  Object.assign(list.style, {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    paddingTop: "0",
  } as CSSStyleDeclaration);
  panel.appendChild(list);

  // Loading skeleton (visible until first row is added)
  const skeleton = document.createElement("div");
  Object.assign(skeleton.style, {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  } as CSSStyleDeclaration);
  for (let i = 0; i < 3; i++) {
    const block = document.createElement("div");
    Object.assign(block.style, {
      height: "64px",
      border: "1px solid #e5e7eb",
      borderRadius: "6px",
      background: "linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 37%,#f3f4f6 63%)",
      backgroundSize: "400% 100%",
      animation: "ek-skeleton 1.4s ease infinite",
    } as CSSStyleDeclaration);
    skeleton.appendChild(block);
  }
  panel.appendChild(skeleton);

  const style = document.createElement("style");
  style.textContent = `@keyframes ek-skeleton {0%{background-position:100% 50%}100%{background-position:0 50%}}`;
  document.head.appendChild(style);

  // Mount overlay to body
  document.body.appendChild(panel);

  return {
    panel,
    list,
    mapByUrn: new Map(),
    isUpdatingFromRow: false,
    isUpdatingFromEditor: false,
    defaultText: "Great post, thanks for sharing",
    activeUrns: new Set<string>(),
    sentUrns: new Set<string>(),
    draftCountEl,
    sentCountEl,
    composerCommentedAuthors: new Set<string>(),
    submitAllBtn,
    skeletonEl: skeleton,
  };
}

export function removeApprovePanel(): void {
  const el = document.getElementById(PANEL_ID);
  if (el) el.remove();
}
